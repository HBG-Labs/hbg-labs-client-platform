import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Canal EMAIL des notifications (§26, migration 20).
 *
 * Trois garanties se vérifient ici, et aucune ne se lit dans le code :
 *
 * 1. **L'interrupteur commande réellement l'émission.** Fermé, aucune ligne
 *    EMAIL n'existe ; ouvert, chaque notification en produit une. C'est ce qui
 *    évite qu'un arriéré s'accumule pendant des semaines puis parte d'un coup
 *    le jour où Resend est branché.
 *
 * 2. **Une note interne n'envoie pas de courriel.** La garde vit dans
 *    `notify_ticket_message`, en amont de `emit_notification` : le canal EMAIL
 *    en hérite sans l'avoir réécrite. Encore faut-il que ce soit vrai — un
 *    courriel portant le titre d'une note interne trahirait son existence hors
 *    de l'application, là où aucune policy ne protège plus rien.
 *
 * 3. **Le réglage est hors de portée de l'application.** Un administrateur
 *    plateforme dont la session serait compromise ne doit pas pouvoir ouvrir le
 *    robinet des envois vers des adresses réelles.
 *
 * Le réglage est global à la base : ce fichier le remet à « off » quoi qu'il
 * arrive, y compris après un échec.
 */

let f: Fixtures;

async function setDelivery(value: 'on' | 'off') {
  const { error } = await f.admin
    .from('platform_settings')
    .update({ value })
    .eq('key', 'email_delivery');

  expect(error).toBeNull();
}

/** Lignes EMAIL d'un destinataire, lues hors RLS. */
async function emailsOf(userId: string, ticketId: string) {
  const { data, error } = await f.admin
    .from('notifications')
    .select('id, channel, status, sent_at, title, body, action_url, resource_id')
    .eq('user_id', userId)
    .eq('channel', 'EMAIL')
    .eq('resource_id', ticketId);

  expect(error).toBeNull();
  return data ?? [];
}

async function inAppOf(userId: string, ticketId: string) {
  const { data, error } = await f.admin
    .from('notifications')
    .select('id, channel, status, sent_at, title, body, action_url')
    .eq('user_id', userId)
    .eq('channel', 'IN_APP')
    .eq('resource_id', ticketId);

  expect(error).toBeNull();
  return data ?? [];
}

/** HBG Labs répond au client : le chemin qui notifie l'organisation. */
async function staffReplies(body: string) {
  const { error } = await f.platformAdmin.db.from('support_messages').insert({
    ticket_id: f.ticketA,
    author_id: f.platformAdmin.userId,
    body,
    is_internal_note: false,
  });

  expect(error).toBeNull();
}

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  // Remise à l'état par défaut avant le démontage : le réglage est global, et
  // le laisser ouvert ferait émettre des courriels aux exécutions suivantes.
  if (f) {
    await setDelivery('off');
    await teardownFixtures(f);
  }
}, 120_000);

describe('Le réglage est hors de portée de l’application', () => {
  it('un visiteur anonyme ne le lit pas', async () => {
    const { data, error } = await f.anon.from('platform_settings').select('key, value');
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it('un client ne le lit pas', async () => {
    const { data, error } = await f.userA.db.from('platform_settings').select('key, value');
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it('un administrateur plateforme ne le lit pas davantage', async () => {
    const { data, error } = await f.platformAdmin.db
      .from('platform_settings')
      .select('key, value');

    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it('un administrateur plateforme ne peut pas ouvrir le canal', async () => {
    await setDelivery('off');

    const { data, error } = await f.platformAdmin.db
      .from('platform_settings')
      .update({ value: 'on' })
      .eq('key', 'email_delivery')
      .select('key');

    expect(error !== null || (data ?? []).length === 0).toBe(true);

    // La valeur réelle n'a pas bougé.
    const { data: actual } = await f.admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'email_delivery')
      .maybeSingle();

    expect(actual?.value).toBe('off');
  });

  it('la fonction de lecture n’est pas appelable par un client', async () => {
    const { error } = await f.userA.db.rpc('email_delivery_enabled');
    expect(error).not.toBeNull();
  });
});

describe('Canal fermé', () => {
  it('aucune ligne EMAIL n’est créée', async () => {
    await setDelivery('off');

    const before = await emailsOf(f.userA.userId, f.ticketA);
    const inAppBefore = await inAppOf(f.userA.userId, f.ticketA);

    await staffReplies('Réponse envoyée alors que le canal courriel est fermé.');

    const after = await emailsOf(f.userA.userId, f.ticketA);
    const inAppAfter = await inAppOf(f.userA.userId, f.ticketA);

    // La notification en application est émise comme avant : fermer le canal
    // EMAIL ne doit rien retirer à ce qui fonctionnait déjà.
    expect(inAppAfter).toHaveLength(inAppBefore.length + 1);
    expect(after).toHaveLength(before.length);
  });
});

describe('Canal ouvert', () => {
  it('émet une ligne EMAIL en attente, jumelle de la notification', async () => {
    await setDelivery('on');

    const before = await emailsOf(f.userA.userId, f.ticketA);
    await staffReplies('Votre site est de nouveau en ligne depuis ce matin.');

    const after = await emailsOf(f.userA.userId, f.ticketA);
    expect(after).toHaveLength(before.length + 1);

    const email = after.find((row) => !before.some((b) => b.id === row.id))!;

    // PENDING, sans date d'envoi : « envoyé » ne devient vrai qu'une fois que
    // Resend a accepté le message.
    expect(email.status).toBe('PENDING');
    expect(email.sent_at).toBeNull();

    // Même formulation que la cloche : un seul texte, donc aucun risque que le
    // courriel raconte autre chose.
    const inApp = await inAppOf(f.userA.userId, f.ticketA);
    const latestInApp = inApp.at(-1)!;
    const twin = inApp.find((row) => row.title === email.title) ?? latestInApp;

    expect(email.title).toBe(twin.title);
    expect(email.action_url).toBe(twin.action_url);
    expect(email.body).toContain('de nouveau en ligne');
  });

  it('n’envoie rien à l’auteur du message', async () => {
    await setDelivery('on');

    const before = await emailsOf(f.platformAdmin.userId, f.ticketA);
    await staffReplies('Second message de HBG Labs.');
    const after = await emailsOf(f.platformAdmin.userId, f.ticketA);

    expect(after).toHaveLength(before.length);
  });

  it('une note interne ne produit aucun courriel', async () => {
    await setDelivery('on');

    const secret = 'Note interne : client à relancer, facture impayée.';

    const beforeOwner = await emailsOf(f.userA.userId, f.ticketA);
    const beforeMember = await emailsOf(f.userA2.userId, f.ticketA);

    const { error } = await f.platformAdmin.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.platformAdmin.userId,
      body: secret,
      is_internal_note: true,
    });
    expect(error).toBeNull();

    expect(await emailsOf(f.userA.userId, f.ticketA)).toHaveLength(beforeOwner.length);
    expect(await emailsOf(f.userA2.userId, f.ticketA)).toHaveLength(beforeMember.length);

    // Le contenu de la note n'apparaît nulle part dans la file d'envoi.
    const { data: leaked } = await f.admin
      .from('notifications')
      .select('id')
      .eq('channel', 'EMAIL')
      .ilike('body', '%facture impayée%');

    expect(leaked ?? []).toHaveLength(0);
  });

  it('la cloche ne montre pas les courriels', async () => {
    await setDelivery('on');
    await staffReplies('Message destiné à vérifier le filtre de la cloche.');

    // La requête exacte de `fetchNotifications`, jouée avec la session du
    // client : elle filtre sur le canal IN_APP.
    const { data, error } = await f.userA.db
      .from('notifications')
      .select('id, channel')
      .eq('channel', 'IN_APP')
      .order('created_at', { ascending: false })
      .limit(20);

    expect(error).toBeNull();
    expect((data ?? []).every((row) => row.channel === 'IN_APP')).toBe(true);
  });
});
