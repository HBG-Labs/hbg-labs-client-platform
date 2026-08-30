import type Stripe from 'npm:stripe@^18.0.0';
import { cryptoProvider, requireEnv, stripeClient, stripeDate } from '../_shared/stripe.ts';
import { adminClient } from '../_shared/supabase.ts';
import { IgnoredEvent, type MirrorContext } from './context.ts';
import { linkCustomerIfMissing, resolveOrganizationId } from './organizations.ts';
import { mirrorSubscription } from './subscriptions.ts';
import { mirrorInvoice } from './invoices.ts';
import { mirrorPaymentIntent, mirrorRefund } from './payments.ts';

/**
 * Webhook Stripe (§21) — seul chemin d'écriture des tables financières.
 *
 *
 * SÉQUENCE
 *
 *   1. Vérifier la signature. Sans signature valide : 400, et RIEN n'est écrit.
 *      N'importe qui peut atteindre cette URL ; seule la signature distingue
 *      Stripe d'un tiers qui s'annoncerait « facture payée ».
 *   2. Enregistrer l'événement AVANT de le traiter. Si le traitement fait
 *      tomber la fonction, l'événement reste visible avec `processed = false`.
 *      Un enregistrement après coup ne laisserait aucune trace des événements
 *      qui échouent — les seuls qui méritent d'être examinés.
 *   3. Traiter, puis acquitter.
 *   4. En cas d'échec : consigner l'erreur, incrémenter `attempts`, répondre
 *      500 pour que Stripe rejoue.
 *
 *
 * IDEMPOTENCE : LE CONFLIT NE SUFFIT PAS À CONCLURE
 *
 * Stripe livre AU MOINS une fois. `event_id` est clé primaire, la seconde
 * insertion échoue donc — mais en déduire « déjà traité » serait faux : le
 * premier traitement peut avoir échoué, et c'est précisément pour cela que
 * Stripe rejoue. Répondre 200 au motif du conflit condamnerait tout événement
 * dont le premier passage a échoué à ne jamais aboutir.
 *
 * Le conflit conduit donc à relire la ligne : acquittée, on répond 200 sans
 * rien refaire ; en échec, on retente et on incrémente `attempts`.
 *
 *
 * VERIFY_JWT = FALSE
 *
 * Stripe n'a pas de session Supabase. L'authentification de l'appelant repose
 * entièrement sur la signature HMAC, vérifiée avant toute lecture de la charge
 * utile. Voir `supabase/config.toml`.
 */

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée.', { status: 405 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Signature absente.', { status: 400 });
  }

  // Le corps est lu en TEXTE BRUT : la signature porte sur les octets reçus.
  // Le parcours par `request.json()` réordonnerait les clés et invaliderait la
  // vérification, sans que rien n'explique pourquoi.
  const body = await request.text();
  const stripe = stripeClient();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      requireEnv('STRIPE_WEBHOOK_SECRET'),
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error('Signature Stripe invalide :', error);
    return new Response('Signature invalide.', { status: 400 });
  }

  const admin = adminClient();
  const context: MirrorContext = {
    admin,
    stripe,
    event,
    eventAt: stripeDate(event.created) ?? new Date().toISOString(),
  };

  // ---- 2. Enregistrement préalable ----------------------------------------
  const { error: insertError } = await admin.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    api_version: event.api_version ?? null,
    livemode: event.livemode ?? false,
    payload: event as unknown as Record<string, unknown>,
    stripe_object_id: objectId(event),
    stripe_created_at: stripeDate(event.created),
    attempts: 1,
  });

  if (insertError) {
    // 23505 — clé primaire violée : l'événement a déjà été reçu.
    if (insertError.code !== '23505') {
      console.error("Enregistrement de l'événement impossible :", insertError);
      return new Response('Enregistrement impossible.', { status: 500 });
    }

    const alreadyDone = await isAlreadyProcessed(admin, event.id);

    if (alreadyDone) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await bumpAttempts(admin, event.id);
  }

  // ---- 3. Traitement -------------------------------------------------------
  try {
    const organizationId = await dispatch(context);
    await acknowledge(admin, event.id, { organizationId, ignored: null });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof IgnoredEvent) {
      // Acquitté : rejouer ne changerait rien. La raison reste consignée.
      console.warn(`Événement ${event.type} ignoré : ${error.message}`);
      await acknowledge(admin, event.id, {
        organizationId: null,
        ignored: error.message,
      });

      return new Response(JSON.stringify({ received: true, ignored: error.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ---- 4. Échec réel : Stripe doit rejouer -------------------------------
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Traitement de ${event.type} en échec :`, error);
    await recordFailure(admin, event.id, message);

    return new Response('Traitement en échec.', { status: 500 });
  }
});

/**
 * Aiguillage des événements (§21).
 *
 * Renvoie l'organisation touchée, qui sera inscrite sur la ligne du registre :
 * « quels événements ont concerné ce client ? » devient alors une question à
 * laquelle la base répond.
 */
async function dispatch(context: MirrorContext): Promise<string> {
  const { event } = context;
  const object = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      return await onCheckoutCompleted(context, object as Stripe.Checkout.Session);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
      return await mirrorSubscription(context, object as Stripe.Subscription);

    case 'invoice.created':
    case 'invoice.finalized':
    case 'invoice.updated':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.marked_uncollectible':
    case 'invoice.voided':
      return await mirrorInvoice(context, object as Stripe.Invoice);

    case 'payment_intent.succeeded':
    case 'payment_intent.processing':
    case 'payment_intent.canceled':
    case 'payment_intent.payment_failed':
      return await mirrorPaymentIntent(context, object as Stripe.PaymentIntent);

    case 'charge.refunded':
      return await mirrorRefund(context, object as Stripe.Charge);

    default:
      // Stripe envoie tout ce qui est coché dans le tableau de bord. Un type
      // non traité est acquitté et consigné : le registre montre alors ce qui
      // arrive sans être exploité, plutôt que de l'effacer.
      throw new IgnoredEvent(`Type d'événement non traité : ${event.type}.`);
  }
}

/**
 * Fin du parcours de paiement.
 *
 * L'abonnement est relu chez Stripe et reflété immédiatement, sans attendre
 * `customer.subscription.created` : les deux événements partent ensemble, mais
 * leur ordre d'arrivée n'est pas garanti. Le client qui revient de la page de
 * paiement voit ainsi son abonnement dès le premier rafraîchissement.
 *
 * La garde d'ordre de `mirrorSubscription` empêche ce raccourci d'écraser un
 * état plus récent.
 */
async function onCheckoutCompleted(
  context: MirrorContext,
  session: Stripe.Checkout.Session,
): Promise<string> {
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : (session.customer?.id ?? null);

  const organizationId = await resolveOrganizationId(context.admin, {
    metadataOrganizationId:
      session.client_reference_id ?? session.metadata?.organization_id,
    customerId,
  });

  await linkCustomerIfMissing(context.admin, organizationId, customerId);

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription?.id ?? null);

  if (!subscriptionId) {
    // Paiement unique sans abonnement : la facture et le paiement arrivent par
    // leurs propres événements. Rien à refléter ici.
    return organizationId;
  }

  const subscription = await context.stripe.subscriptions.retrieve(subscriptionId);
  return await mirrorSubscription(context, subscription);
}

function objectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown };
  return typeof object.id === 'string' ? object.id : null;
}

async function isAlreadyProcessed(
  admin: ReturnType<typeof adminClient>,
  eventId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from('stripe_webhook_events')
    .select('processed')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) {
    console.error("Relecture de l'événement impossible :", error);
    // Dans le doute, on retraite : rejouer un miroir idempotent est sans
    // conséquence, alors qu'un acquittement à tort perd l'événement.
    return false;
  }

  return (data as { processed: boolean } | null)?.processed === true;
}

async function bumpAttempts(
  admin: ReturnType<typeof adminClient>,
  eventId: string,
): Promise<void> {
  const { data } = await admin
    .from('stripe_webhook_events')
    .select('attempts')
    .eq('event_id', eventId)
    .maybeSingle();

  const attempts = ((data as { attempts: number } | null)?.attempts ?? 0) + 1;

  await admin
    .from('stripe_webhook_events')
    .update({ attempts })
    .eq('event_id', eventId);
}

async function acknowledge(
  admin: ReturnType<typeof adminClient>,
  eventId: string,
  outcome: { organizationId: string | null; ignored: string | null },
): Promise<void> {
  const { error } = await admin
    .from('stripe_webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      organization_id: outcome.organizationId,
      // `error` porte ici la RAISON DE NON-TRAITEMENT, pas une panne. Les deux
      // se lisent dans le texte ; ce qui compte est qu'un événement écarté
      // laisse une trace interrogeable plutôt qu'une ligne muette.
      error: outcome.ignored?.slice(0, 4000) ?? null,
    })
    .eq('event_id', eventId);

  if (error) {
    // L'acquittement a échoué mais le miroir est écrit. Stripe rejouera ;
    // les écritures étant idempotentes, la relivraison est sans danger.
    console.error("Acquittement de l'événement impossible :", error);
  }
}

async function recordFailure(
  admin: ReturnType<typeof adminClient>,
  eventId: string,
  message: string,
): Promise<void> {
  const { error } = await admin
    .from('stripe_webhook_events')
    .update({ processed: false, error: message.slice(0, 4000) })
    .eq('event_id', eventId);

  if (error) {
    console.error("Consignation de l'échec impossible :", error);
  }
}
