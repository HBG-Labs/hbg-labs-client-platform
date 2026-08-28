import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * §47 — Tests de sécurité multi-tenant.
 *
 *   Utilisateur A → Organisation A = OK
 *   Utilisateur A → Organisation B = REFUSÉ
 *   Utilisateur B → Organisation A = REFUSÉ
 *   Administrateur → selon permissions
 *
 *
 * CE QU'UN REFUS RESSEMBLE EN RLS
 *
 * Une policy SELECT ne provoque pas d'erreur : elle rend la ligne INVISIBLE.
 * Une lecture interdite renvoie donc un tableau vide, avec un statut 200.
 *
 * C'est le comportement voulu — une erreur « accès refusé » confirmerait
 * l'existence de la ligne, ce qui est déjà une fuite : « l'organisation
 * <uuid> existe, mais elle n'est pas à vous ».
 *
 * Les assertions portent donc sur le NOMBRE DE LIGNES, et non sur la présence
 * d'une erreur. Un test qui attendrait une erreur passerait au vert sur une
 * base sans aucune donnée : on vérifie systématiquement, en regard, que le
 * propriétaire légitime voit bien sa ligne.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

/** Tables portant directement un organization_id, avec la ligne attendue de chaque côté. */
function tenantTables() {
  return [
    { table: 'organizations', idColumn: 'id', rowA: () => f.orgA, rowB: () => f.orgB },
    { table: 'websites', idColumn: 'id', rowA: () => f.websiteA, rowB: () => f.websiteB },
    { table: 'domains', idColumn: 'id', rowA: () => f.domainA, rowB: () => f.domainB },
    { table: 'subscriptions', idColumn: 'id', rowA: () => f.subscriptionA, rowB: () => f.subscriptionB },
    { table: 'support_tickets', idColumn: 'id', rowA: () => f.ticketA, rowB: () => f.ticketB },
  ] as const;
}

describe('Isolation entre tenants — lecture', () => {
  describe.each(tenantTables())('$table', ({ table, idColumn, rowA, rowB }) => {
    it('Utilisateur A voit la ligne de son organisation', async () => {
      const { data, error } = await f.userA.db.from(table).select(idColumn).eq(idColumn, rowA());

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('Utilisateur A ne voit PAS la ligne de l organisation B', async () => {
      const { data, error } = await f.userA.db.from(table).select(idColumn).eq(idColumn, rowB());

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('Utilisateur B ne voit PAS la ligne de l organisation A', async () => {
      const { data, error } = await f.userB.db.from(table).select(idColumn).eq(idColumn, rowA());

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('Une lecture non filtrée ne ramène jamais de ligne de l autre tenant', async () => {
      // Le cas le plus proche d'une attaque réelle : on ne demande rien de
      // précis, on prend tout ce que la base veut bien rendre.
      const { data, error } = await f.userA.db.from(table).select(idColumn);

      expect(error).toBeNull();
      const ids = (data ?? []).map((row) => (row as Record<string, string>)[idColumn]);
      expect(ids).toContain(rowA());
      expect(ids).not.toContain(rowB());
    });

    it('Administrateur plateforme voit les deux organisations', async () => {
      const { data, error } = await f.platformAdmin.db
        .from(table)
        .select(idColumn)
        .in(idColumn, [rowA(), rowB()]);

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('Visiteur anonyme ne voit rien', async () => {
      const { data } = await f.anon.from(table).select(idColumn).in(idColumn, [rowA(), rowB()]);

      expect(data ?? []).toHaveLength(0);
    });
  });
});

describe('Isolation entre tenants — écriture', () => {
  it('Utilisateur A ne peut pas modifier l organisation B', async () => {
    const { data, error } = await f.userB.db
      .from('organizations')
      .update({ name: 'DÉTOURNÉ PAR A' })
      .eq('id', f.orgA)
      .select('id');

    // Aucune ligne visible ⇒ aucune ligne modifiée. Pas d'erreur, mais surtout
    // pas d'effet : c'est ce dernier point qui compte.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);

    const check = await f.admin.from('organizations').select('name').eq('id', f.orgA).single();
    expect(check.data?.name).not.toBe('DÉTOURNÉ PAR A');
  });

  it('Utilisateur A ne peut pas créer de site dans l organisation B', async () => {
    const { error } = await f.userA.db.from('websites').insert({
      organization_id: f.orgB,
      name: 'Site injecté',
      slug: 'site-injecte',
    });

    // Une policy INSERT refusée produit, elle, une véritable erreur : aucune
    // ligne n'est masquée, l'écriture est simplement interdite.
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Utilisateur A ne peut pas ouvrir de ticket dans l organisation B', async () => {
    const { error } = await f.userA.db.from('support_tickets').insert({
      organization_id: f.orgB,
      created_by: f.userA.userId,
      subject: 'Ticket injecté',
      description: 'Tentative de création dans un tenant qui n est pas le mien.',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Utilisateur A ne peut pas supprimer un site de l organisation B', async () => {
    await f.userA.db.from('websites').delete().eq('id', f.websiteB);

    const check = await f.admin.from('websites').select('id').eq('id', f.websiteB);
    expect(check.data).toHaveLength(1);
  });
});

describe('Isolation à l intérieur d un tenant', () => {
  it('Le OWNER de A lit les factures de son organisation', async () => {
    const { data, error } = await f.userA.db.from('invoices').select('id').eq('id', f.invoiceA);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('Un MEMBER de A ne lit PAS les factures de son organisation', async () => {
    // §13 : MEMBER n'a pas accès à la facturation. Un collaborateur invité
    // pour suivre l avancement du site n a pas à connaître le montant engagé.
    const { data, error } = await f.userA2.db.from('invoices').select('id').eq('id', f.invoiceA);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('Un MEMBER de A ne lit PAS les paiements de son organisation', async () => {
    const { data } = await f.userA2.db.from('payments').select('id').eq('id', f.paymentA);

    expect(data ?? []).toHaveLength(0);
  });

  it('Un MEMBER de A lit bien l abonnement de son organisation', async () => {
    // L offre et la prochaine échéance figurent sur le tableau de bord (§14) :
    // c est une information d équipe, pas une pièce comptable.
    const { data, error } = await f.userA2.db
      .from('subscriptions')
      .select('id')
      .eq('id', f.subscriptionA);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('Le OWNER de B ne lit pas les factures de A', async () => {
    const { data } = await f.userB.db.from('invoices').select('id').eq('id', f.invoiceA);
    expect(data ?? []).toHaveLength(0);
  });
});

describe('Isolation des profils', () => {
  it('Deux collègues de la même organisation se voient', async () => {
    const { data, error } = await f.userA.db.from('profiles').select('id').eq('id', f.userA2.userId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('Un utilisateur d un autre tenant est invisible', async () => {
    const { data } = await f.userA.db.from('profiles').select('id').eq('id', f.userB.userId);
    expect(data ?? []).toHaveLength(0);
  });

  it('Les adhésions d une autre organisation sont invisibles', async () => {
    const { data } = await f.userA.db
      .from('organization_members')
      .select('id')
      .eq('organization_id', f.orgB);

    expect(data ?? []).toHaveLength(0);
  });
});

describe('Isolation des notifications', () => {
  it('Chacun ne voit que les siennes', async () => {
    const own = await f.userA.db.from('notifications').select('id').eq('id', f.notificationA);
    expect(own.data).toHaveLength(1);

    const other = await f.userA2.db.from('notifications').select('id').eq('id', f.notificationA);
    expect(other.data ?? []).toHaveLength(0);
  });

  it('Le personnel plateforme ne lit pas les notifications d un client', async () => {
    // Aucune policy « staff » sur cette table : une notification est adressée
    // à une personne, pas à une organisation.
    const { data } = await f.platformAdmin.db
      .from('notifications')
      .select('id')
      .eq('id', f.notificationA);

    expect(data ?? []).toHaveLength(0);
  });
});
