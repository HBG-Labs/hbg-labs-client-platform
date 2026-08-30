import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { anonClient, serviceClient, TEST_PREFIX } from './fixtures';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verrou d'accès à l'espace d'administration (migration 17).
 *
 * Une adresse ne peut détenir un rôle plateforme que si elle figure dans
 * `platform_access` avec exactement ce rôle. La table est inaccessible depuis
 * l'application : ni `anon` ni `authenticated` n'y ont de privilège, et aucune
 * policy ne la couvre.
 *
 * Ces tests couvrent le chemin qui restait ouvert avant cette migration : un
 * OWNER, ou une session OWNER compromise, pouvait promouvoir n'importe quelle
 * adresse. Ils vérifient aussi que le RETRAIT d'un rôle reste possible, ce qui
 * compte autant : un verrou qui empêche de révoquer un accès se retourne contre
 * son propriétaire le jour où il faut agir vite.
 *
 * LIMITE CONNUE, et volontairement non testée : qui détient `service_role` peut
 * modifier la liste ou supprimer le trigger. Aucune protection en base ne s'en
 * prémunit. Ce qui est vérifié ici est qu'aucune promotion ne passe SANS
 * toucher à la liste.
 */

const TEST_PASSWORD = 'RlsTest-2026-Xy';

interface Actor {
  id: string;
  email: string;
  db: SupabaseClient;
}

let admin: SupabaseClient;
let runId: string;

/** Adresse autorisée pour ce cycle de tests, retirée au démontage. */
let allowedActor: Actor;
/** Adresse absente de la liste. */
let outsider: Actor;

async function createActor(email: string): Promise<Actor> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Création de ${email} impossible : ${error?.message}`);
  }

  const db = anonClient();
  const { error: signInError } = await db.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw new Error(`Connexion de ${email} impossible : ${signInError.message}`);

  return { id: data.user.id, email, db };
}

beforeAll(async () => {
  admin = serviceClient();
  runId = randomUUID().slice(0, 8);

  // Adresse inscrite dans la liste AVANT la création du compte : c'est le cas
  // réel, la liste précédant l'inscription.
  const allowedEmail = `${TEST_PREFIX}-allowed-${runId}@hbg-labs.test`;
  const { error } = await admin.from('platform_access').insert({
    email: allowedEmail,
    role: 'ADMIN',
    note: 'Suite de tests RLS',
  });
  if (error) throw new Error(`Ajout à la liste impossible : ${error.message}`);

  allowedActor = await createActor(allowedEmail);
  outsider = await createActor(`${TEST_PREFIX}-outsider-${runId}@hbg-labs.test`);
}, 120_000);

afterAll(async () => {
  if (!admin) return;

  for (const actor of [allowedActor, outsider]) {
    if (!actor) continue;
    await actor.db.auth.signOut();
    await admin.auth.admin.deleteUser(actor.id);
  }

  await admin.from('platform_access').delete().like('email', `${TEST_PREFIX}-%`);
}, 120_000);

describe('Attribution automatique à l’inscription', () => {
  it('une adresse listée reçoit son rôle à la création du profil', async () => {
    const { data } = await admin
      .from('profiles')
      .select('platform_role')
      .eq('id', allowedActor.id)
      .single();

    expect(data?.platform_role).toBe('ADMIN');
  });

  it('une adresse absente de la liste reste cliente', async () => {
    const { data } = await admin
      .from('profiles')
      .select('platform_role')
      .eq('id', outsider.id)
      .single();

    expect(data?.platform_role).toBeNull();
  });
});

describe('Attribution hors liste', () => {
  it('service_role ne peut pas promouvoir une adresse non listée', async () => {
    // Le point central : la liste s'impose même au backend. Accorder un accès
    // demande d'abord d'inscrire l'adresse, ce qui ne se fait pas depuis
    // l'application.
    const { error } = await admin
      .from('profiles')
      .update({ platform_role: 'ADMIN' })
      .eq('id', outsider.id);

    expect(error?.code).toBe('42501');
  });

  it('un membre du personnel ne peut pas promouvoir une adresse non listée', async () => {
    const { error } = await allowedActor.db
      .from('profiles')
      .update({ platform_role: 'SUPPORT' })
      .eq('id', outsider.id);

    expect(error).not.toBeNull();
  });

  it('un rôle supérieur à celui autorisé est refusé', async () => {
    // La liste dit qui, et jusqu'où : une adresse inscrite pour ADMIN ne peut
    // pas devenir OWNER.
    const { error } = await admin
      .from('profiles')
      .update({ platform_role: 'OWNER' })
      .eq('id', allowedActor.id);

    expect(error?.code).toBe('42501');
  });
});

describe('La liste est hors de portée de l’application', () => {
  it('un membre du personnel ne la lit pas', async () => {
    const { data, error } = await allowedActor.db.from('platform_access').select('email');
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it('un visiteur anonyme ne la lit pas', async () => {
    const { data, error } = await anonClient().from('platform_access').select('email');
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it('un membre du personnel ne peut pas s’y ajouter de complice', async () => {
    const { error } = await allowedActor.db
      .from('platform_access')
      .insert({ email: 'complice@exemple.test', role: 'OWNER' });

    expect(error).not.toBeNull();
  });
});

describe('Révocation', () => {
  it('le retrait d’un rôle reste possible', async () => {
    // Un verrou qui empêche de révoquer se retourne contre son propriétaire le
    // jour où il faut agir vite.
    const { error } = await admin
      .from('profiles')
      .update({ platform_role: null })
      .eq('id', allowedActor.id);

    expect(error).toBeNull();

    // Rétabli pour les tests suivants : l'adresse figure toujours dans la liste.
    await admin
      .from('profiles')
      .update({ platform_role: 'ADMIN' })
      .eq('id', allowedActor.id);
  });
});

describe('Immuabilité de l’adresse du profil', () => {
  it('un client ne peut pas réécrire son adresse pour viser la liste', async () => {
    // La liste raisonne sur `profiles.email`. Si cette copie restait
    // modifiable par son porteur, elle deviendrait le maillon faible du
    // dispositif.
    const { error } = await outsider.db
      .from('profiles')
      .update({ email: allowedActor.email })
      .eq('id', outsider.id);

    expect(error?.code).toBe('42501');
  });

  it('les autres champs du profil restent modifiables', async () => {
    // Contre-épreuve : la garde ne doit pas verrouiller l'usage normal.
    const { error } = await outsider.db
      .from('profiles')
      .update({ full_name: 'Nom modifié légitimement' })
      .eq('id', outsider.id);

    expect(error).toBeNull();
  });
});
