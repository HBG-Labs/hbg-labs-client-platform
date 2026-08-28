import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

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
  readonly db: SupabaseClient;
}

export interface Fixtures {
  /** Contourne la RLS. Sert à préparer et à vérifier, jamais à tester. */
  readonly admin: SupabaseClient;
  /** Sans session : le visiteur du site public. */
  readonly anon: SupabaseClient;

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

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Crée un utilisateur confirmé et ouvre une session à son nom. */
async function createActor(
  admin: SupabaseClient,
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

/** Interrompt le test avec le message d'erreur Postgres, plus parlant qu'un throw nu. */
function must<T>(
  result: { data: T | null; error: { message: string } | null },
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

  // --- Acteurs -------------------------------------------------------------
  const [userA, userA2, userB, platformAdmin] = await Promise.all([
    createActor(admin, 'a-owner', runId),
    createActor(admin, 'a-member', runId),
    createActor(admin, 'b-owner', runId),
    createActor(admin, 'platform-admin', runId),
  ]);

  // Promotion au rang de personnel plateforme. Passe par service_role : le
  // trigger `guard_platform_role` refuserait cette écriture à tout autre
  // appelant — ce que vérifie précisément 02-privilege-escalation.
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
  // Paramètre de type explicite : `database.types.ts` est encore un
  // placeholder, l'inférence de supabase-js sur `.single()` retombe donc sur
  // `never`. Il disparaîtra une fois les types générés (`npm run db:types`).
  const plan = must<{ id: string }>(
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

  const payment = must<{ id: string }>(
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
  const paymentA = payment.id as string;

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

  const notification = must<{ id: string }>(
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
  const notificationA = notification.id as string;

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

  await admin.from('payments').delete().in('organization_id', orgs);
  await admin.from('invoices').delete().in('organization_id', orgs);
  await admin.from('subscriptions').delete().in('organization_id', orgs);
  await admin.from('notifications').delete().in('organization_id', orgs);
  // support_messages, ticket_attachments, domains et websites partent en
  // cascade avec les tickets puis l'organisation.
  await admin.from('support_tickets').delete().in('organization_id', orgs);
  await admin.from('organizations').delete().in('id', orgs);

  // Les journaux d'audit référencent l'organisation en ON DELETE SET NULL :
  // ils survivent, à dessein. On retire ceux produits par ces tests.
  await admin.from('audit_logs').delete().in('actor_user_id', [
    f.userA.userId,
    f.userA2.userId,
    f.userB.userId,
    f.platformAdmin.userId,
  ]);

  for (const actor of [f.userA, f.userA2, f.userB, f.platformAdmin]) {
    await actor.db.auth.signOut();
    await admin.auth.admin.deleteUser(actor.userId);
  }
}
