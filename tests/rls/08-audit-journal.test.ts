import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Alimentation du journal d'audit (§44, migration 19).
 *
 * Le contrat de la table — append-only, lecture réservée au personnel, auteur
 * imposé par `log_audit_event` — est vérifié par `05-public-surface`. Ce
 * fichier-ci vérifie autre chose : que le journal SE REMPLIT.
 *
 * La distinction compte. Pendant six lots, `audit_logs` a été correctement
 * protégée, correctement documentée, et vide. Un journal parfaitement
 * inviolable qui n'enregistre rien donne exactement les mêmes garanties que
 * pas de journal du tout, en donnant l'impression du contraire.
 */

let f: Fixtures;

async function journalOf(resourceId: string, action?: string) {
  const { data, error } = await f.admin
    .from('audit_logs')
    .select('id, action, actor_user_id, actor_email, organization_id, resource_type, resource_id, metadata')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true });

  expect(error).toBeNull();
  return (data ?? []).filter((row) => !action || row.action === action);
}

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('Ce que le montage a déjà journalisé', () => {
  it('l ouverture d une demande laisse une trace', async () => {
    const entries = await journalOf(f.ticketA, 'TICKET_CREATED');

    expect(entries).toHaveLength(1);
    expect(entries[0].resource_type).toBe('support_ticket');
    expect(entries[0].organization_id).toBe(f.orgA);
    // La référence lisible est consignée : sans elle, une demande supprimée
    // ne serait plus identifiable dans le journal.
    expect(entries[0].metadata).toHaveProperty('reference');
  });

  it('la création d un site laisse une trace', async () => {
    const entries = await journalOf(f.websiteA, 'WEBSITE_CREATED');

    expect(entries).toHaveLength(1);
    expect(entries[0].organization_id).toBe(f.orgA);
  });

  it('l inscription d une adresse à la liste d accès laisse une trace', async () => {
    // Le geste le plus sensible du système : il ouvre l'accès aux données de
    // tous les clients.
    const entries = await journalOf(f.platformAdmin.email, 'PLATFORM_ACCESS_GRANTED');

    expect(entries).toHaveLength(1);
    expect(entries[0].metadata).toMatchObject({ role: 'ADMIN' });
  });

  it('l attribution d un rôle plateforme laisse une trace', async () => {
    const entries = await journalOf(f.platformAdmin.userId, 'PLATFORM_ROLE_CHANGED');

    expect(entries).toHaveLength(1);
    expect(entries[0].metadata).toMatchObject({
      platform_role: { avant: null, apres: 'ADMIN' },
    });
  });

  it('la connexion d un utilisateur laisse une trace', async () => {
    // `auth.users.last_sign_in_at` ne retient que la dernière. Le journal, lui,
    // conserve l'historique — c'est ce qui permet de répondre à « depuis quand
    // cet accès est-il utilisé ? ».
    const entries = await journalOf(f.userA.userId, 'USER_SIGNED_IN');

    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].resource_type).toBe('user');
  });
});

describe('Auteur et rattachement', () => {
  it('l action d un client lui est imputée, dans son organisation', async () => {
    const { data: ticket, error } = await f.userA.db
      .from('support_tickets')
      .insert({
        organization_id: f.orgA,
        created_by: f.userA.userId,
        subject: 'Demande journalisée',
        description: 'Vérification de la trace laissée par une création.',
        category: 'SITE',
      })
      .select('id')
      .single();
    expect(error).toBeNull();

    const entries = await journalOf(ticket!.id, 'TICKET_CREATED');
    expect(entries).toHaveLength(1);
    expect(entries[0].actor_user_id).toBe(f.userA.userId);
    // L'adresse est figée dans la ligne : `actor_user_id` passera à NULL le
    // jour où le compte sera supprimé, la trace doit rester attribuable.
    expect(entries[0].actor_email).toBe(f.userA.email);
    expect(entries[0].organization_id).toBe(f.orgA);
  });

  it('l action du personnel lui est imputée, dans l organisation visée', async () => {
    const { error } = await f.platformAdmin.db
      .from('support_tickets')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', f.ticketA);
    expect(error).toBeNull();

    const entries = await journalOf(f.ticketA, 'TICKET_STATUS_CHANGED');
    expect(entries.length).toBeGreaterThanOrEqual(1);

    const last = entries[entries.length - 1];
    expect(last.actor_user_id).toBe(f.platformAdmin.userId);
    expect(last.organization_id).toBe(f.orgA);
    // La valeur d'avant autant que celle d'après : « le ticket est en cours »
    // ne dit pas d'où il vient.
    expect(last.metadata).toMatchObject({
      status: { avant: 'OPEN', apres: 'IN_PROGRESS' },
    });
  });
});

describe('Ce que le journal ne consigne pas', () => {
  it('une écriture qui ne change rien ne produit aucune ligne', async () => {
    const before = await journalOf(f.websiteA, 'WEBSITE_UPDATED');

    // `after update of name` se déclenche dès que la colonne est MENTIONNÉE,
    // même réécrite à l'identique. Sans la comparaison de valeurs, le journal
    // se remplirait de changements qui n'en sont pas.
    const { data: current } = await f.admin
      .from('websites')
      .select('name')
      .eq('id', f.websiteA)
      .single();

    const { error } = await f.platformAdmin.db
      .from('websites')
      .update({ name: current!.name })
      .eq('id', f.websiteA);
    expect(error).toBeNull();

    expect(await journalOf(f.websiteA, 'WEBSITE_UPDATED')).toHaveLength(before.length);
  });

  it('ne consigne que les colonnes déclarées par le trigger', async () => {
    const { error } = await f.platformAdmin.db
      .from('websites')
      .update({ production_url: 'https://exemple-journal.fr' })
      .eq('id', f.websiteA);
    expect(error).toBeNull();

    const entries = await journalOf(f.websiteA, 'WEBSITE_UPDATED');
    const last = entries[entries.length - 1];

    expect(last.metadata).toMatchObject({
      production_url: { avant: null, apres: 'https://exemple-journal.fr' },
    });
    // Rien n'est repris par défaut : une colonne ajoutée demain ne se
    // retrouvera pas journalisée sans qu'on l'ait voulu.
    expect(Object.keys(last.metadata as object)).toEqual(['production_url']);
  });

  it('ne recopie pas le contenu des messages', async () => {
    const secret = 'NOTE INTERNE — ne doit pas atterrir dans le journal.';

    await f.platformAdmin.db.from('support_messages').insert({
      ticket_id: f.ticketA,
      author_id: f.platformAdmin.userId,
      body: secret,
      is_internal_note: true,
    });

    // Une note interne recopiée dans `audit_logs` échapperait à la policy qui
    // la protège : le personnel la lirait, mais par un chemin non prévu, et un
    // journal d'audit client la rendrait un jour visible.
    const { data } = await f.admin
      .from('audit_logs')
      .select('id')
      .ilike('metadata::text', `%${secret.slice(0, 30)}%`);

    expect(data ?? []).toHaveLength(0);
  });
});

describe('Ce que l écran d administration interroge', () => {
  it('la requête exacte du service répond au personnel', async () => {
    // `audit.service.ts` joint l'organisation pour nommer le client concerné.
    // Une jointure imbriquée est soumise à la RLS de la table jointe : si la
    // policy `organizations` ne couvrait pas le personnel, la requête
    // échouerait ou renverrait un nom vide, ce qu'aucun test d'écriture ne
    // révélerait.
    const { data, error } = await f.platformAdmin.db
      .from('audit_logs')
      .select(
        'id, action, actor_user_id, actor_email, actor_platform_role, organization_id, resource_type, resource_id, metadata, ip_address, created_at, organization:organizations ( id, name )',
      )
      .order('created_at', { ascending: false })
      .limit(100);

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);

    const withOrg = (data ?? []).find(
      (row) => (row as { organization_id: string | null }).organization_id !== null,
    ) as { organization: { name: string } | null } | undefined;

    expect(withOrg?.organization?.name).toBeTruthy();
  });

  it('la même requête ne rend rien à un client', async () => {
    const { data, error } = await f.userA.db
      .from('audit_logs')
      .select('id, action, organization:organizations ( id, name )')
      .limit(100);

    // Pas une erreur : une liste vide. La policy filtre les lignes, elle
    // n'interdit pas la requête.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});

describe('Surface d écriture', () => {
  it('write_audit_log n est appelable par personne', async () => {
    // Cette fonction accepte un auteur explicite. Accessible, elle permettrait
    // d'attribuer une action à un collègue — exactement ce que
    // `log_audit_event` interdit.
    const asClient = await f.userA.db.rpc('write_audit_log' as never, {
      p_actor_id: f.userB.userId,
      p_organization_id: f.orgB,
      p_action: 'ADMIN_ACTION',
      p_resource_type: 'website',
      p_resource_id: f.websiteB,
      p_metadata: {},
    } as never);
    expect(asClient.error).not.toBeNull();

    const asStaff = await f.platformAdmin.db.rpc('write_audit_log' as never, {
      p_actor_id: f.userB.userId,
      p_organization_id: f.orgB,
      p_action: 'ADMIN_ACTION',
      p_resource_type: 'website',
      p_resource_id: f.websiteB,
      p_metadata: {},
    } as never);
    expect(asStaff.error).not.toBeNull();

    // Même `service_role` en est privé : le webhook Stripe n'a pas à écrire
    // dans le journal autrement que par les triggers.
    const asService = await f.admin.rpc('write_audit_log' as never, {
      p_actor_id: f.userB.userId,
      p_organization_id: f.orgB,
      p_action: 'ADMIN_ACTION',
      p_resource_type: 'website',
      p_resource_id: f.websiteB,
      p_metadata: {},
    } as never);
    expect(asService.error).not.toBeNull();
  });

  it('journal_change n est appelable par personne', async () => {
    const { error } = await f.userA.db.rpc('journal_change' as never, {} as never);
    expect(error).not.toBeNull();
  });

  it('un client ne fait pas journaliser une action dans un autre tenant', async () => {
    // Garantie inchangée depuis la migration 13, revérifiée après le
    // remaniement de `log_audit_event`.
    const { error } = await f.userA.db.rpc('log_audit_event', {
      p_action: 'ADMIN_ACTION',
      p_organization_id: f.orgB,
    });

    expect(error).not.toBeNull();
  });
});
