import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database } from '../../src/types/database.types';

/**
 * Clients typés sur le schéma réel, régénéré par `npm run db:types`.
 * Les tests bénéficient ainsi de la même vérification de colonnes que
 * l'application : une colonne renommée dans une migration casse la
 * compilation des tests, au lieu d'échouer à l'exécution des mois plus tard.
 */
type Db = SupabaseClient<Database>;

/**
 * Jeu de données du scénario §47.
 *
 *   Organisation A  ←  Utilisateur A (OWNER)
 *                   ←  Utilisateur A2 (MEMBER)  — vérifie le cloisonnement
 *                                                  DANS un tenant
 *   Organisation B  ←  Utilisateur B (OWNER)
 *   Administrateur plateforme (platform_role = 'ADMIN')
 *   Visiteur anonyme (clé anon, sans session)
 *
 * A2 existe parce que l'isolation ne s'arrête pas à la frontière entre
 * clients : un MEMBER ne doit pas lire les factures de sa propre entreprise
 * (réservées au OWNER), et cela ne se vérifie qu'avec deux membres de rôles
 * différents dans une même organisation.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/** Préfixe commun à toutes les données de test, pour un nettoyage sûr. */
export const TEST_PREFIX = 'rlstest';

/** Mot de passe conforme à la politique de config.toml (10 car., 3 classes). */
const TEST_PASSWORD = 'RlsTest-2026-Xy';

export interface TestActor {
  readonly label: string;
  readonly userId: string;
  readonly email: string;
  /** Client porteur de la session de cet utilisateur. */
  readonly db: Db;
}

export interface Fixtures {
  /** Contourne la RLS. Sert à préparer et à vérifier, jamais à tester. */
  readonly admin: Db;
  /** Sans session : le visiteur du site public. */
  readonly anon: Db;

  readonly userA: TestActor;
  readonly userA2: TestActor;
  readonly userB: TestActor;
  readonly platformAdmin: TestActor;

  readonly orgA: string;
  readonly orgB: string;

  /** Données appartenant à chaque organisation, créées via service_role. */
  readonly websiteA: string;
  readonly websiteB: string;
  readonly domainA: string;
  readonly domainB: string;
  readonly subscriptionA: string;
  readonly subscriptionB: string;
  readonly invoiceA: string;
  readonly invoiceB: string;
  readonly paymentA: string;
  readonly ticketA: string;
  readonly ticketB: string;
  /** Note interne sur le ticket A : ne doit JAMAIS être lue par un client. */
  readonly internalNoteA: string;
  readonly publicMessageA: string;
  readonly notificationA: string;

  readonly planId: string;
}

export function serviceClient(): Db {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): Db {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Crée un utilisateur confirmé et ouvre une session à son nom. */
async function createActor(
  admin: Db,
  label: string,
  runId: string,
): Promise<TestActor> {
  const email = `${TEST_PREFIX}-${label}-${runId}@hbg-labs.test`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    // Confirmé d'office : les tests portent sur la RLS, pas sur le parcours
    // de vérification d'email.
    email_confirm: true,
    user_metadata: { full_name: `Test ${label}` },
  });

  if (createError || !created.user) {
    throw new Error(`Création de l'utilisateur ${label} impossible : ${createError?.message}`);
  }

  const db = anonClient();
  const { error: signInError } = await db.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    throw new Error(`Connexion de ${label} impossible : ${signInError.message}`);
  }

  return { label, userId: created.user.id, email, db };
}

/**
 * Interrompt le test avec le message d'erreur Postgres, plus parlant qu'un
 * throw nu.
 *
 * Le paramètre est `data: T` et non `data: T | null`. La réponse de
 * supabase-js est une union discriminée — `{ data: X; error: null }` ou
 * `{ data: null; error: PostgrestError }` — et `T | null` force TypeScript à
 * inférer T sur les deux branches à la fois, ce qui donne `never`. En
 * écrivant `data: T`, T s'infère en `X | null`, que `NonNullable` réduit
 * ensuite à X.
 */
function must<T>(
  result: { data: T; error: { message: string } | null },
  what: string,
): NonNullable<T> {
  if (result.error || result.data === null) {
    throw new Error(`${what} : ${result.error?.message ?? 'aucune donnée retournée'}`);
  }
  return result.data as NonNullable<T>;
}

export async function setupFixtures(): Promise<Fixtures> {
  const admin = serviceClient();
  const runId = randomUUID().slice(0, 8);

  try {
    return await buildFixtures(admin, runId);
  } catch (cause) {
    // Un montage qui échoue à mi-parcours laisse derrière lui les comptes déjà
    // créés. Le démontage étant conditionné à la réussite du montage, ils ne
    // seraient jamais supprimés et s'accumuleraient à chaque exécution.
    //
    // Ce nettoyage de secours a été ajouté après avoir constaté vingt comptes
    // orphelins issus de cinq exécutions échouées.
    await sweepRunArtifacts(admin, runId);
    throw cause;
  }
}

/** Supprime tout ce qu'une exécution identifiée par `runId` a pu créer. */
async function sweepRunArtifacts(admin: Db, runId: string): Promise<void> {
  const pattern = `${TEST_PREFIX}-%-${runId}@%`;

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email')
    .like('email', pattern);

  for (const profile of profiles ?? []) {
    await admin.auth.admin.deleteUser(profile.id);
  }

  await admin.from('platform_access').delete().like('email', pattern);
  await admin.from('organizations').delete().like('slug', `${TEST_PREFIX}-%-${runId}`);
}

async function buildFixtures(admin: Db, runId: string): Promise<Fixtures> {
  // --- Acteurs -------------------------------------------------------------
  const [userA, userA2, userB, platformAdmin] = await Promise.all([
    createActor(admin, 'a-owner', runId),
    createActor(admin, 'a-member', runId),
    createActor(admin, 'b-owner', runId),
    createActor(admin, 'platform-admin', runId),
  ]);

  // Promotion au rang de personnel plateforme.
  //
  // Depuis la migration 17, un rôle ne s'attribue qu'à une adresse inscrite
  // dans `platform_access`, et cette règle s'impose même à service_role. Le
  // jeu de test doit donc suivre le même chemin qu'une promotion réelle :
  // inscrire l'adresse, puis appliquer le rôle.
  const allow = await admin.from('platform_access').insert({
    email: platformAdmin.email,
    role: 'ADMIN',
    note: 'Suite de tests RLS',
  });
  if (allow.error) {
    throw new Error(`Ajout à la liste d'accès impossible : ${allow.error.message}`);
  }

  const promote = await admin
    .from('profiles')
    .update({ platform_role: 'ADMIN' })
    .eq('id', platformAdmin.userId);
  if (promote.error) {
    throw new Error(`Promotion de l'administrateur impossible : ${promote.error.message}`);
  }

  // --- Organisations -------------------------------------------------------
  const orgs = must(
    await admin
      .from('organizations')
      .insert([
        { name: `${TEST_PREFIX} Org A ${runId}`, slug: `${TEST_PREFIX}-a-${runId}` },
        { name: `${TEST_PREFIX} Org B ${runId}`, slug: `${TEST_PREFIX}-b-${runId}` },
      ])
      .select('id, slug'),
    'Création des organisations',
  );

  const orgA = orgs.find((o) => o.slug.includes('-a-'))!.id as string;
  const orgB = orgs.find((o) => o.slug.includes('-b-'))!.id as string;

  must(
    await admin
      .from('organization_members')
      .insert([
        { organization_id: orgA, user_id: userA.userId, role: 'OWNER', status: 'ACTIVE' },
        { organization_id: orgA, user_id: userA2.userId, role: 'MEMBER', status: 'ACTIVE' },
        { organization_id: orgB, user_id: userB.userId, role: 'OWNER', status: 'ACTIVE' },
      ])
      .select('id'),
    'Création des adhésions',
  );

  // --- Offre de référence --------------------------------------------------
  const plan = must(
    await admin.from('plans').select('id').eq('code', 'PRO').single(),
    'Lecture du plan PRO (le seed a-t-il été appliqué ?)',
  );
  const planId = plan.id;

  // --- Données métier ------------------------------------------------------
  const websites = must(
    await admin
      .from('websites')
      .insert([
        { organization_id: orgA, name: `${TEST_PREFIX} Site A`, slug: `${TEST_PREFIX}-site-a` },
        { organization_id: orgB, name: `${TEST_PREFIX} Site B`, slug: `${TEST_PREFIX}-site-b` },
      ])
      .select('id, organization_id'),
    'Création des sites',
  );
  const websiteA = websites.find((w) => w.organization_id === orgA)!.id as string;
  const websiteB = websites.find((w) => w.organization_id === orgB)!.id as string;

  const domains = must(
    await admin
      .from('domains')
      .insert([
        { organization_id: orgA, website_id: websiteA, domain: `${TEST_PREFIX}-a-${runId}.test` },
        { organization_id: orgB, website_id: websiteB, domain: `${TEST_PREFIX}-b-${runId}.test` },
      ])
      .select('id, organization_id'),
    'Création des domaines',
  );
  const domainA = domains.find((d) => d.organization_id === orgA)!.id as string;
  const domainB = domains.find((d) => d.organization_id === orgB)!.id as string;

  // Identifiants Stripe synthétiques : ces tests ne contactent jamais Stripe,
  // ils vérifient l'isolation des lignes. Les formats respectent les
  // contraintes CHECK du schéma.
  const stripeSuffix = runId.replace(/-/g, '');
  const subscriptions = must(
    await admin
      .from('subscriptions')
      .insert([
        {
          organization_id: orgA,
          plan_id: planId,
          stripe_subscription_id: `sub_${TEST_PREFIX}A${stripeSuffix}`,
          stripe_customer_id: `cus_${TEST_PREFIX}A${stripeSuffix}`,
          status: 'active',
          unit_amount_cents: 4900,
          recurring_interval: 'month',
        },
        {
          organization_id: orgB,
          plan_id: planId,
          stripe_subscription_id: `sub_${TEST_PREFIX}B${stripeSuffix}`,
          stripe_customer_id: `cus_${TEST_PREFIX}B${stripeSuffix}`,
          status: 'active',
          unit_amount_cents: 1900,
          recurring_interval: 'month',
        },
      ])
      .select('id, organization_id'),
    'Création des abonnements',
  );
  const subscriptionA = subscriptions.find((s) => s.organization_id === orgA)!.id as string;
  const subscriptionB = subscriptions.find((s) => s.organization_id === orgB)!.id as string;

  const invoices = must(
    await admin
      .from('invoices')
      .insert([
        {
          organization_id: orgA,
          subscription_id: subscriptionA,
          stripe_invoice_id: `in_${TEST_PREFIX}A${stripeSuffix}`,
          status: 'paid',
          amount_due_cents: 4900,
          amount_paid_cents: 4900,
          paid_at: new Date().toISOString(),
        },
        {
          organization_id: orgB,
          subscription_id: subscriptionB,
          stripe_invoice_id: `in_${TEST_PREFIX}B${stripeSuffix}`,
          status: 'paid',
          amount_due_cents: 1900,
          amount_paid_cents: 1900,
          paid_at: new Date().toISOString(),
        },
      ])
      .select('id, organization_id'),
    'Création des factures',
  );
  const invoiceA = invoices.find((i) => i.organization_id === orgA)!.id as string;
  const invoiceB = invoices.find((i) => i.organization_id === orgB)!.id as string;

  const payment = must(
    await admin
      .from('payments')
      .insert({
        organization_id: orgA,
        invoice_id: invoiceA,
        stripe_payment_intent_id: `pi_${TEST_PREFIX}A${stripeSuffix}`,
        amount_cents: 4900,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        card_brand: 'visa',
        card_last4: '4242',
      })
      .select('id')
      .single(),
    'Création du paiement',
  );
  const paymentA = payment.id;

  const tickets = must(
    await admin
      .from('support_tickets')
      .insert([
        {
          organization_id: orgA,
          website_id: websiteA,
          created_by: userA.userId,
          subject: `${TEST_PREFIX} demande A`,
          description: 'Description de la demande de test pour l organisation A.',
          category: 'SITE',
        },
        {
          organization_id: orgB,
          website_id: websiteB,
          created_by: userB.userId,
          subject: `${TEST_PREFIX} demande B`,
          description: 'Description de la demande de test pour l organisation B.',
          category: 'SITE',
        },
      ])
      .select('id, organization_id'),
    'Création des tickets',
  );
  const ticketA = tickets.find((t) => t.organization_id === orgA)!.id as string;
  const ticketB = tickets.find((t) => t.organization_id === orgB)!.id as string;

  // Deux messages sur le ticket A : l'un visible du client, l'autre non.
  // C'est le cœur du test de confidentialité des notes internes.
  const messages = must(
    await admin
      .from('support_messages')
      .insert([
        {
          ticket_id: ticketA,
          author_id: platformAdmin.userId,
          body: 'Réponse visible par le client.',
          is_internal_note: false,
        },
        {
          ticket_id: ticketA,
          author_id: platformAdmin.userId,
          body: 'NOTE INTERNE — ne doit jamais apparaître côté client.',
          is_internal_note: true,
        },
      ])
      .select('id, is_internal_note'),
    'Création des messages',
  );
  const publicMessageA = messages.find((m) => m.is_internal_note === false)!.id as string;
  const internalNoteA = messages.find((m) => m.is_internal_note === true)!.id as string;

  const notification = must(
    await admin
      .from('notifications')
      .insert({
        user_id: userA.userId,
        organization_id: orgA,
        type: 'INVOICE_AVAILABLE',
        channel: 'IN_APP',
        status: 'SENT',
        sent_at: new Date().toISOString(),
        title: `${TEST_PREFIX} notification A`,
      })
      .select('id')
      .single(),
    'Création de la notification',
  );
  const notificationA = notification.id;

  return {
    admin,
    anon: anonClient(),
    userA,
    userA2,
    userB,
    platformAdmin,
    orgA,
    orgB,
    websiteA,
    websiteB,
    domainA,
    domainB,
    subscriptionA,
    subscriptionB,
    invoiceA,
    invoiceB,
    paymentA,
    ticketA,
    ticketB,
    internalNoteA,
    publicMessageA,
    notificationA,
    planId,
  };
}

/**
 * Démontage.
 *
 * L'ordre importe : `invoices` et `payments` référencent `organizations` en
 * ON DELETE RESTRICT — une contrainte volontaire (conservation légale des
 * pièces comptables, migration 08). Supprimer l'organisation en premier
 * échouerait, et le test suivant hériterait de données résiduelles.
 */
export async function teardownFixtures(f: Fixtures): Promise<void> {
  const { admin } = f;
  const orgs = [f.orgA, f.orgB];
  const actors = [
    f.userA.userId,
    f.userA2.userId,
    f.userB.userId,
    f.platformAdmin.userId,
  ];

  await admin.from('payments').delete().in('organization_id', orgs);
  await admin.from('invoices').delete().in('organization_id', orgs);
  await admin.from('subscriptions').delete().in('organization_id', orgs);
  await admin.from('notifications').delete().in('organization_id', orgs);
  // support_messages, ticket_attachments, domains et websites partent en
  // cascade avec les tickets puis l'organisation.
  await admin.from('support_tickets').delete().in('organization_id', orgs);

  // Journal d'audit, PREMIÈRE passe — impérativement avant la suppression des
  // organisations.
  //
  // `audit_logs.organization_id` est en ON DELETE SET NULL : la trace d'une
  // action survit à l'organisation qu'elle visait, et c'est voulu. Mais elle
  // devient alors introuvable par ce critère. Nettoyer après aurait laissé
  // derrière soi tout ce que le montage a journalisé — quatre-vingt-dix-sept
  // lignes lors de la première tentative.
  await admin.from('audit_logs').delete().in('organization_id', orgs);

  await admin.from('organizations').delete().in('id', orgs);

  // La suppression ci-dessus a fait tomber les adhésions, donc écrit de
  // nouvelles lignes MEMBER_REMOVED. Leur rattachement a migré dans `metadata`,
  // la colonne ne pouvant plus référencer une organisation disparue.
  await admin.from('audit_logs').delete().in('metadata->>organization_id', orgs);

  // L'adresse retirée de la liste d'accès : sans cela, elle s'y accumulerait
  // à chaque exécution de la suite.
  await admin.from('platform_access').delete().eq('email', f.platformAdmin.email);

  for (const actor of [f.userA, f.userA2, f.userB, f.platformAdmin]) {
    await actor.db.auth.signOut();
    await admin.auth.admin.deleteUser(actor.userId);
  }

  // Journal d'audit, SECONDE passe : ce qui n'a jamais eu d'organisation.
  // Connexions, rôles plateforme, liste d'accès — y compris les lignes que le
  // démontage vient lui-même de produire.
  await admin.from('audit_logs').delete().in('actor_user_id', actors);
  await admin.from('audit_logs').delete().in('resource_id', actors);
  await admin.from('audit_logs').delete().eq('resource_id', f.platformAdmin.email);
  await admin.from('audit_logs').delete().like('actor_email', `${TEST_PREFIX}-%`);

  // Dernier filet : une adhésion retirée est identifiée par son propre
  // identifiant, non par celui de son titulaire. Si elle échappe aux passes
  // ci-dessus — l'ordre exact des cascades n'est pas garanti — c'est le seul
  // critère qui la rattrape encore.
  await admin.from('audit_logs').delete().in('metadata->>user_id', actors);
}
