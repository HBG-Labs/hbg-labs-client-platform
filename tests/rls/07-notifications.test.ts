import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Émission des notifications (§26, migration 18).
 *
 * Ces tests ne portent pas sur l'affichage mais sur QUI reçoit QUOI. Trois
 * raisons de les tenir contre une vraie base plutôt que par relecture :
 *
 * 1. Les triggers émettent depuis `emit_notification`, SECURITY DEFINER. Son
 *    propriétaire `postgres` porte BYPASSRLS, ce qui lui permet d'écrire
 *    malgré `force row level security` et une policy d'insertion réservée aux
 *    administrateurs plateforme. Cette combinaison — attribut de rôle,
 *    propriétaire de fonction, FORCE RLS — ne se lit dans aucun fichier du
 *    dépôt. Si elle changeait, l'écriture d'un message échouerait entièrement,
 *    et pas seulement la notification.
 *
 * 2. Une NOTE INTERNE ne doit notifier personne. Le titre d'une notification
 *    apparaîtrait dans la cloche du client et trahirait l'existence d'une note
 *    que la policy `support_messages_select_member` lui cache. La
 *    confidentialité se perdrait par un canal détourné, sans qu'aucune policy
 *    soit violée.
 *
 * 3. Un émetteur ne doit jamais se notifier lui-même : une cloche qui sonne à
 *    chaque geste de son propriétaire cesse d'être lue.
 */

let f: Fixtures;

/** Notifications reçues par un utilisateur, lues hors RLS. */
async function notificationsOf(userId: string, ticketId?: string) {
  const { data, error } = await f.admin
    .from('notifications')
    .select('id, type, title, body, action_url, resource_id, channel, status')
    .eq('user_id', userId);

  expect(error).toBeNull();
  return (data ?? []).filter((n) => !ticketId || n.resource_id === ticketId);
}

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('Ouverture d une demande', () => {
  it('notifie le personnel plateforme, jamais son auteur', async () => {
    const { data: ticket, error } = await f.userA.db
      .from('support_tickets')
      .insert({
        organization_id: f.orgA,
        created_by: f.userA.userId,
        subject: 'Demande de notification',
        description: 'Le formulaire de contact ne renvoie plus les messages.',
        category: 'SITE',
      })
      .select('id, reference')
      .single();

    expect(error).toBeNull();
    const ticketId = ticket!.id;

    const staff = await notificationsOf(f.platformAdmin.userId, ticketId);
    expect(staff).toHaveLength(1);
    expect(staff[0].type).toBe('TICKET_CREATED');
    // Le lien mène à l'espace d'administration : le personnel n'a rien à faire
    // dans l'espace client.
    expect(staff[0].action_url).toBe(`/admin/tickets/${ticketId}`);
    expect(staff[0].title).toContain(ticket!.reference);
    // IN_APP naît directement au statut SENT : aucun traitement d'envoi
    // n'existe, une notification PENDING resterait invisible pour toujours.
    expect(staff[0].channel).toBe('IN_APP');
    expect(staff[0].status).toBe('SENT');

    expect(await notificationsOf(f.userA.userId, ticketId)).toHaveLength(0);
    expect(await notificationsOf(f.userB.userId, ticketId)).toHaveLength(0);
  });
});

describe('Messages sur une demande', () => {
  it('une réponse du personnel atteint tous les membres actifs du client', async () => {
    // Comptage en écart, jamais en absolu : le message public monté par les
    // fixtures a lui-même déjà notifié l'organisation. C'est d'ailleurs une
    // confirmation de plus que le trigger émet.
    const ownerBefore = await notificationsOf(f.userA.userId, f.ticketA);
    const memberBefore = await notificationsOf(f.userA2.userId, f.ticketA);

    const { error } = await f.platformAdmin.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.platformAdmin.userId,
      body: 'Nous avons identifié la cause, correction en ligne demain.',
      is_internal_note: false,
    });
    expect(error).toBeNull();

    const owner = await notificationsOf(f.userA.userId, f.ticketA);
    const member = await notificationsOf(f.userA2.userId, f.ticketA);

    expect(owner).toHaveLength(ownerBefore.length + 1);
    const latest = owner.find((n) => !ownerBefore.some((b) => b.id === n.id))!;
    expect(latest.type).toBe('TICKET_REPLIED');
    expect(latest.action_url).toBe(`/dashboard/demandes/${f.ticketA}`);

    // A2 est MEMBER, pas l'auteur de la demande. Il travaille sur le même site
    // et doit être au courant.
    expect(member).toHaveLength(memberBefore.length + 1);

    expect(await notificationsOf(f.userB.userId, f.ticketA)).toHaveLength(0);
  });

  it('une NOTE INTERNE ne notifie absolument personne', async () => {
    const secret = 'NOTE INTERNE — vérifier le règlement avant intervention.';

    const before = await Promise.all([
      notificationsOf(f.userA.userId, f.ticketA),
      notificationsOf(f.userA2.userId, f.ticketA),
      notificationsOf(f.platformAdmin.userId, f.ticketA),
    ]);

    const { error } = await f.platformAdmin.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.platformAdmin.userId,
      body: secret,
      is_internal_note: true,
    });
    expect(error).toBeNull();

    const after = await Promise.all([
      notificationsOf(f.userA.userId, f.ticketA),
      notificationsOf(f.userA2.userId, f.ticketA),
      notificationsOf(f.platformAdmin.userId, f.ticketA),
    ]);

    expect(after[0]).toHaveLength(before[0].length);
    expect(after[1]).toHaveLength(before[1].length);
    expect(after[2]).toHaveLength(before[2].length);

    // Et le texte lui-même n'a atterri dans aucune notification, quelle qu'en
    // soit la destination.
    const { data: leak } = await f.admin
      .from('notifications')
      .select('id')
      .ilike('body', `%${secret.slice(0, 30)}%`);
    expect(leak ?? []).toHaveLength(0);
  });

  it('une réponse du client atteint le personnel, pas le client lui-même', async () => {
    const staffBefore = await notificationsOf(f.platformAdmin.userId, f.ticketA);
    const ownerBefore = await notificationsOf(f.userA.userId, f.ticketA);

    const { error } = await f.userA.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.userA.userId,
      body: 'Merci, nous attendons la correction.',
      is_internal_note: false,
    });
    expect(error).toBeNull();

    expect(await notificationsOf(f.platformAdmin.userId, f.ticketA)).toHaveLength(
      staffBefore.length + 1,
    );
    expect(await notificationsOf(f.userA.userId, f.ticketA)).toHaveLength(
      ownerBefore.length,
    );
  });
});

describe('Changement de statut', () => {
  it('notifie le client quand le personnel fait avancer la demande', async () => {
    const before = await notificationsOf(f.userA.userId, f.ticketA);

    const { error } = await f.platformAdmin.db
      .from('support_tickets')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', f.ticketA);
    expect(error).toBeNull();

    const after = await notificationsOf(f.userA.userId, f.ticketA);
    expect(after).toHaveLength(before.length + 1);

    const notice = after.find((n) => n.type === 'TICKET_STATUS_CHANGED');
    // Le libellé dit l'état atteint, pas un code : la notification doit se
    // suffire à elle-même dans la cloche.
    expect(notice?.title).toContain('en cours de traitement');
  });

  it('ne notifie personne quand le client clôt sa propre demande', async () => {
    const ownerBefore = await notificationsOf(f.userA.userId, f.ticketA);
    const staffBefore = await notificationsOf(f.platformAdmin.userId, f.ticketA);

    const { error } = await f.userA.db
      .from('support_tickets')
      .update({ status: 'CLOSED' })
      .eq('id', f.ticketA);
    expect(error).toBeNull();

    expect(await notificationsOf(f.userA.userId, f.ticketA)).toHaveLength(
      ownerBefore.length,
    );
    expect(await notificationsOf(f.platformAdmin.userId, f.ticketA)).toHaveLength(
      staffBefore.length,
    );
  });
});

describe('Surface d écriture depuis l application', () => {
  it('un client ne peut pas appeler emit_notification', async () => {
    // EXECUTE est révoqué. Sans cela, la fonction serait un moyen d'écrire
    // dans la cloche de n'importe qui, en contournant toutes les policies.
    const { error } = await f.userA.db.rpc('emit_notification' as never, {
      p_user_id: f.userB.userId,
      p_organization_id: f.orgB,
      p_type: 'TICKET_REPLIED',
      p_title: 'Appel direct',
      p_body: null,
      p_action_url: null,
      p_resource_type: null,
      p_resource_id: null,
    } as never);

    expect(error).not.toBeNull();
  });

  it('un client ne peut pas fabriquer une notification pour autrui', async () => {
    const { error } = await f.userA.db.from('notifications').insert({
      user_id: f.userB.userId,
      organization_id: f.orgB,
      type: 'TICKET_REPLIED',
      channel: 'IN_APP',
      status: 'SENT',
      title: 'Notification forgée',
    });

    expect(error).not.toBeNull();
  });

  it('un client marque ses notifications comme lues, et rien d autre', async () => {
    const mine = await notificationsOf(f.userA.userId);
    expect(mine.length).toBeGreaterThan(0);
    const target = mine[0].id;

    const read = await f.userA.db
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', target);
    expect(read.error).toBeNull();

    const { data: stored } = await f.admin
      .from('notifications')
      .select('read_at')
      .eq('id', target)
      .single();
    expect(stored?.read_at).not.toBeNull();

    // `guard_notification_update` borne l'écriture à `read_at` : la policy, qui
    // autorise la ligne entière, ne suffirait pas.
    const tamper = await f.userA.db
      .from('notifications')
      .update({ title: 'Titre falsifié' })
      .eq('id', target);
    expect(tamper.error).not.toBeNull();
  });

  it('un client ne marque pas lue la notification d un autre', async () => {
    const mine = await notificationsOf(f.userA.userId);
    const target = mine[0].id;

    const { data } = await f.userB.db
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', target)
      .select('id');

    expect(data ?? []).toHaveLength(0);
  });
});
