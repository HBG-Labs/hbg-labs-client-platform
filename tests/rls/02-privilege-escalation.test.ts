import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupFixtures, teardownFixtures, type Fixtures } from './fixtures';

/**
 * Escalade de privilèges.
 *
 * Les tests de 01 vérifient que la RLS cloisonne les LIGNES. Ceux-ci
 * vérifient les gardes qui protègent les COLONNES et les CLÉS DE
 * RATTACHEMENT — ce que la RLS, par construction, ne sait pas faire.
 *
 * Chaque scénario ci-dessous porte sur une ligne que l'utilisateur a
 * parfaitement le droit de modifier. C'est ce qui les rend dangereux : la
 * policy est satisfaite, et sans trigger l'écriture passerait.
 */

let f: Fixtures;

beforeAll(async () => {
  f = await setupFixtures();
}, 120_000);

afterAll(async () => {
  if (f) await teardownFixtures(f);
}, 120_000);

describe('profiles.platform_role', () => {
  it('Un client ne peut pas se promouvoir administrateur plateforme', async () => {
    // LA faille à empêcher. La ligne appartient à l'utilisateur, la policy
    // `profiles_update_self` l'autorise à la modifier. Seul le trigger
    // `guard_platform_role` s'y oppose.
    const { error } = await f.userA.db
      .from('profiles')
      .update({ platform_role: 'OWNER' })
      .eq('id', f.userA.userId);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    const check = await f.admin
      .from('profiles')
      .select('platform_role')
      .eq('id', f.userA.userId)
      .single();
    expect(check.data?.platform_role).toBeNull();
  });

  it('Un client ne peut pas promouvoir un autre utilisateur', async () => {
    const { error } = await f.userA.db
      .from('profiles')
      .update({ platform_role: 'ADMIN' })
      .eq('id', f.userA2.userId);

    // Bloqué en amont par la policy — la ligne n'est pas modifiable par A —
    // ou par le trigger. Dans les deux cas, aucun effet.
    const check = await f.admin
      .from('profiles')
      .select('platform_role')
      .eq('id', f.userA2.userId)
      .single();
    expect(check.data?.platform_role).toBeNull();
    expect(error === null || error.code === '42501').toBe(true);
  });

  it('Un ADMIN plateforme ne peut pas se hisser au rang de OWNER', async () => {
    // La distinction ADMIN/OWNER ne signifierait rien si un ADMIN pouvait
    // franchir le pas lui-même. Seul un OWNER attribue les rôles.
    const { error } = await f.platformAdmin.db
      .from('profiles')
      .update({ platform_role: 'OWNER' })
      .eq('id', f.platformAdmin.userId);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    const check = await f.admin
      .from('profiles')
      .select('platform_role')
      .eq('id', f.platformAdmin.userId)
      .single();
    expect(check.data?.platform_role).toBe('ADMIN');
  });

  it('Une modification de profil sans changement de rôle reste possible', async () => {
    // Contre-épreuve : le trigger doit laisser passer l'usage normal.
    // `is not distinct from` y pourvoit — avec `=`, la comparaison de deux
    // NULL aurait donné NULL et bloqué toute modification de profil.
    const { error } = await f.userA.db
      .from('profiles')
      .update({ full_name: 'Nom modifié légitimement' })
      .eq('id', f.userA.userId);

    expect(error).toBeNull();

    const check = await f.admin
      .from('profiles')
      .select('full_name')
      .eq('id', f.userA.userId)
      .single();
    expect(check.data?.full_name).toBe('Nom modifié légitimement');
  });
});

describe('Inscription — métadonnées contrôlées par le client', () => {
  it('Un rôle passé dans les métadonnées d inscription est ignoré', async () => {
    // `raw_user_meta_data` est entièrement rempli par le client. Si
    // `handle_new_user` y lisait un rôle, il suffirait de s'inscrire avec
    // `{ platform_role: 'OWNER' }` pour devenir administrateur.
    const email = `rlstest-meta-${Date.now()}@hbg-labs.test`;
    const { data, error } = await f.anon.auth.signUp({
      email,
      password: 'RlsTest-2026-Xy',
      options: { data: { full_name: 'Injection', platform_role: 'OWNER' } },
    });

    expect(error).toBeNull();
    const userId = data.user?.id;
    expect(userId).toBeTruthy();

    const profile = await f.admin
      .from('profiles')
      .select('platform_role, full_name')
      .eq('id', userId!)
      .single();

    expect(profile.data?.platform_role).toBeNull();
    // Le nom, lui, est bien repris : la fonction lit ce champ et lui seul.
    expect(profile.data?.full_name).toBe('Injection');

    await f.admin.auth.admin.deleteUser(userId!);
  });
});

describe('organization_members — détournement de rattachement', () => {
  it('Un OWNER ne peut pas déplacer son adhésion vers un autre tenant', async () => {
    // Scénario d'accès inter-tenant le plus direct : réécrire
    // `organization_id` sur sa propre ligne d'adhésion.
    const membership = await f.admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', f.orgA)
      .eq('user_id', f.userA.userId)
      .single();

    const { error } = await f.userA.db
      .from('organization_members')
      .update({ organization_id: f.orgB })
      .eq('id', membership.data!.id);

    expect(error).not.toBeNull();

    const check = await f.admin
      .from('organization_members')
      .select('organization_id')
      .eq('id', membership.data!.id)
      .single();
    expect(check.data?.organization_id).toBe(f.orgA);
  });

  it('Un MEMBER ne peut pas se promouvoir OWNER de son organisation', async () => {
    const membership = await f.admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', f.orgA)
      .eq('user_id', f.userA2.userId)
      .single();

    const { error } = await f.userA2.db
      .from('organization_members')
      .update({ role: 'OWNER' })
      .eq('id', membership.data!.id)
      .select('id');

    const check = await f.admin
      .from('organization_members')
      .select('role')
      .eq('id', membership.data!.id)
      .single();

    expect(check.data?.role).toBe('MEMBER');
    expect(error === null || error.code === '42501').toBe(true);
  });

  it('Un MEMBER ne peut pas s inscrire dans une autre organisation', async () => {
    const { error } = await f.userA2.db.from('organization_members').insert({
      organization_id: f.orgB,
      user_id: f.userA2.userId,
      role: 'OWNER',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('organizations.stripe_customer_id', () => {
  it('Un OWNER d organisation ne peut pas réassigner le Customer Stripe', async () => {
    // Réassigner ce champ rattacherait les factures d'un client à un autre.
    const { error } = await f.userA.db
      .from('organizations')
      .update({ stripe_customer_id: 'cus_detourne123' })
      .eq('id', f.orgA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Un ADMIN plateforme ne le peut pas davantage', async () => {
    const { error } = await f.platformAdmin.db
      .from('organizations')
      .update({ stripe_customer_id: 'cus_detourne456' })
      .eq('id', f.orgA);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('Le OWNER met à jour les informations légitimes de son organisation', async () => {
    // Contre-épreuve : le trigger ne doit pas bloquer l'usage normal.
    const { error } = await f.userA.db
      .from('organizations')
      .update({ city: 'Fort-de-France', postal_code: '97200' })
      .eq('id', f.orgA);

    expect(error).toBeNull();
  });
});

describe('Dernier OWNER d une organisation', () => {
  it('Le dernier OWNER actif ne peut pas être rétrogradé', async () => {
    // Une organisation sans OWNER devient ingérable : plus personne ne peut
    // inviter de membre ni gérer l'abonnement.
    const membership = await f.admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', f.orgB)
      .eq('user_id', f.userB.userId)
      .single();

    const { error } = await f.admin
      .from('organization_members')
      .update({ role: 'MEMBER' })
      .eq('id', membership.data!.id);

    // Même service_role est arrêté : il s'agit d'une contrainte d'intégrité,
    // pas d'une règle d'autorisation.
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });

  it('Le dernier OWNER actif ne peut pas être supprimé', async () => {
    const membership = await f.admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', f.orgB)
      .eq('user_id', f.userB.userId)
      .single();

    const { error } = await f.admin
      .from('organization_members')
      .delete()
      .eq('id', membership.data!.id);

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });
});

describe('Rattachements inter-tenants sur clés étrangères multiples', () => {
  it('Un domaine ne peut pas pointer vers le site d une autre organisation', async () => {
    // Les deux clés étrangères sont valides prises séparément ; c'est leur
    // combinaison qui franchit la frontière de tenant.
    const { error } = await f.admin.from('domains').insert({
      organization_id: f.orgA,
      website_id: f.websiteB,
      domain: 'croise-tenant.test',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });

  it('Un ticket ne peut pas viser le site d une autre organisation', async () => {
    const { error } = await f.admin.from('support_tickets').insert({
      organization_id: f.orgA,
      website_id: f.websiteB,
      subject: 'Ticket croisé',
      description: 'Tentative de rattachement à un site d un autre tenant.',
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('23514');
  });
});
