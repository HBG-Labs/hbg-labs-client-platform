import { handleRequest, jsonResponse } from '../_shared/http.ts';
import { requireEnv } from '../_shared/env.ts';
import { adminClient, requireServiceRole } from '../_shared/supabase.ts';
import { renderNotificationEmail } from '../_shared/email.ts';

/**
 * Envoi des courriels transactionnels en attente (§26).
 *
 *
 * UNE FILE, PAS UN ENVOI DIRECT
 *
 * Les triggers de la migration 18 créent une ligne `EMAIL` au statut `PENDING`
 * dans la même transaction que l'événement. Cette fonction la consomme.
 *
 * Envoyer depuis le trigger lui-même — par `pg_net`, par exemple — coûterait
 * moins de code et perdrait deux choses : la reprise après échec, et la trace.
 * Un appel HTTP qui échoue dans un trigger ne laisse rien derrière lui ; une
 * ligne `FAILED` avec son motif se compte, se relit et se relance.
 *
 *
 * PASSER À `SENT` EST UNE AFFIRMATION
 *
 * Le statut ne bascule qu'après acceptation par Resend. Le marquer avant
 * l'appel simplifierait la boucle et rendrait le journal faux : « envoyé »
 * désignerait alors « tenté ».
 *
 *
 * CE QUI NE PART PLUS
 *
 * Une notification en attente depuis plus de vingt-quatre heures n'est pas
 * envoyée. Elle passe à `FAILED` avec son motif. Une panne de plusieurs jours
 * suivie d'une reprise expédierait sinon un arriéré entier : « vous avez un
 * nouveau message » pour des demandes déjà closes. Le courriel serait exact
 * dans son contenu, faux dans son propos.
 */

/** Taille de lot. Bornée par le temps d'exécution alloué à la fonction. */
const BATCH_SIZE = 20;

/** Au-delà, un courriel de notification n'a plus d'objet. */
const MAX_AGE_HOURS = 24;

/**
 * Resend limite les envois à deux par seconde sur les formules d'entrée.
 * Dépasser cette cadence fait échouer des messages qui n'ont rien d'invalide.
 */
const SEND_INTERVAL_MS = 550;

interface PendingNotification {
  id: string;
  title: string;
  body: string | null;
  action_url: string | null;
  created_at: string;
  recipient: { email: string; full_name: string | null } | null;
}

Deno.serve((request) =>
  handleRequest(request, async (req) => {
    requireServiceRole(req);

    const admin = adminClient();
    const apiKey = requireEnv('RESEND_API_KEY');
    const from = requireEnv('EMAIL_FROM');
    const appUrl = requireEnv('APP_URL');

    const { data, error } = await admin
      .from('notifications')
      .select(
        `id, title, body, action_url, created_at,
         recipient:profiles ( email, full_name )`,
      )
      .eq('channel', 'EMAIL')
      .eq('status', 'PENDING')
      // Les plus anciennes d'abord : une file traitée dans le désordre livre
      // la réponse avant la question.
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error('Lecture de la file impossible :', error);
      throw error;
    }

    const pending = (data ?? []).map(flattenRecipient);
    const outcome = { sent: 0, failed: 0, expired: 0 };
    const expiryLimit = Date.now() - MAX_AGE_HOURS * 3_600_000;

    for (const [index, notification] of pending.entries()) {
      if (new Date(notification.created_at).getTime() < expiryLimit) {
        await markFailed(
          admin,
          notification.id,
          `Non envoyé dans les ${MAX_AGE_HOURS} h : le message n'a plus d'objet.`,
        );
        outcome.expired += 1;
        continue;
      }

      const address = notification.recipient?.email;

      if (!address) {
        // Le profil a été supprimé entre la création de la notification et son
        // envoi. La ligne subsiste par `on delete cascade` seulement si le
        // profil existe encore : ce cas signale une incohérence à examiner.
        await markFailed(admin, notification.id, 'Destinataire sans adresse connue.');
        outcome.failed += 1;
        continue;
      }

      // Cadence respectée entre deux envois, jamais avant le premier.
      if (index > 0) await pause(SEND_INTERVAL_MS);

      const failure = await send(apiKey, from, address, notification, appUrl);

      if (failure) {
        console.error(`Envoi de ${notification.id} refusé : ${failure}`);
        await markFailed(admin, notification.id, failure);
        outcome.failed += 1;
      } else {
        await markSent(admin, notification.id);
        outcome.sent += 1;
      }
    }

    return jsonResponse(req, { ...outcome, examined: pending.length });
  }),
);

/**
 * Envoie un message. Renvoie `null` en cas de succès, le motif sinon.
 *
 * L'échec d'un message ne doit pas interrompre le lot : une adresse invalide
 * bloquerait toute la file derrière elle.
 */
async function send(
  apiKey: string,
  from: string,
  to: string,
  notification: PendingNotification,
  appUrl: string,
): Promise<string | null> {
  const content = renderNotificationEmail({
    title: notification.title,
    body: notification.body,
    actionUrl: notification.action_url,
    appUrl,
  });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // L'identifiant de la notification sert de clé d'idempotence : si la
        // fonction tombe après l'envoi et avant le marquage, la relance ne
        // produit pas un second courriel.
        'Idempotency-Key': notification.id,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });

    if (response.ok) return null;

    const body = (await response.json().catch(() => null)) as
      | { message?: string; name?: string }
      | null;

    return (body?.message ?? `Resend a répondu ${response.status}.`).slice(0, 500);
  } catch (cause) {
    return (cause instanceof Error ? cause.message : String(cause)).slice(0, 500);
  }
}

async function markSent(
  admin: ReturnType<typeof adminClient>,
  id: string,
): Promise<void> {
  const { error } = await admin
    .from('notifications')
    .update({ status: 'SENT', sent_at: new Date().toISOString(), failure_reason: null })
    .eq('id', id);

  if (error) console.error(`Marquage SENT de ${id} impossible :`, error);
}

async function markFailed(
  admin: ReturnType<typeof adminClient>,
  id: string,
  reason: string,
): Promise<void> {
  // `notifications_failed_has_reason` refuse un échec sans motif : un statut
  // FAILED muet n'apprendrait rien à qui viendrait chercher pourquoi le
  // courriel n'est pas parti.
  const { error } = await admin
    .from('notifications')
    .update({ status: 'FAILED', failure_reason: reason.slice(0, 500) })
    .eq('id', id);

  if (error) console.error(`Marquage FAILED de ${id} impossible :`, error);
}

/**
 * PostgREST rend la relation « vers un » tantôt en objet, tantôt en tableau
 * d'un élément selon la cardinalité qu'il infère.
 */
function flattenRecipient(row: unknown): PendingNotification {
  const record = row as PendingNotification & { recipient: unknown };
  const recipient = Array.isArray(record.recipient)
    ? (record.recipient[0] ?? null)
    : (record.recipient ?? null);

  return { ...record, recipient } as PendingNotification;
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
