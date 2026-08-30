import { supabase } from '@/lib/supabase';
import type {
  BillingInterval,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@/types/domain';

/**
 * Abonnement, factures et paiements (§18, §23, §30).
 *
 *
 * CES TABLES SONT EN LECTURE SEULE — POUR TOUT LE MONDE
 *
 * Aucune fonction d'écriture n'existe dans ce service, et ce n'est pas un
 * oubli : `subscriptions`, `invoices` et `payments` n'ont AUCUNE policy
 * d'écriture, pas même pour un OWNER plateforme. Seul le webhook Stripe, avec
 * `service_role`, y écrit.
 *
 * Une tentative de mise à jour depuis ici ne provoquerait pas un bug visible :
 * elle renverrait zéro ligne modifiée, sans erreur. C'est précisément pour
 * cela qu'il ne faut pas l'écrire.
 *
 *
 * AUCUN FILTRE SUR L'ORGANISATION
 *
 * Comme partout ailleurs, la RLS décide. `invoices_select_org_owner` réserve
 * les factures au dirigeant de l'entreprise : un MEMBER qui appelle
 * `fetchMyInvoices` reçoit une liste vide, sans que ce fichier n'ait à le
 * savoir. Dupliquer le filtre ici laisserait croire que la confidentialité en
 * dépend (§51).
 */

// -----------------------------------------------------------------------------
// Lectures
// -----------------------------------------------------------------------------

export interface ClientSubscription {
  id: string;
  organization_id: string;
  status: SubscriptionStatus;
  quantity: number;
  unit_amount_cents: number | null;
  currency: string;
  recurring_interval: BillingInterval | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancel_at: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  trial_end: string | null;
  started_at: string | null;
  mrr_cents: number;
  /** NULL si le prix facturé ne correspond à aucune offre du catalogue. */
  plan: { id: string; code: string; name: string } | null;
  organization: { id: string; name: string } | null;
}

const SUBSCRIPTION_FIELDS = `
  id, organization_id, status, quantity, unit_amount_cents, currency,
  recurring_interval, current_period_start, current_period_end,
  cancel_at_period_end, cancel_at, canceled_at, ended_at, trial_end,
  started_at, mrr_cents,
  plan:plans ( id, code, name ),
  organization:organizations ( id, name )
`;

export async function fetchMySubscriptions(): Promise<ClientSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_FIELDS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return flattenAll<ClientSubscription>(data, ['plan', 'organization']);
}

export interface ClientInvoice {
  id: string;
  organization_id: string;
  number: string | null;
  status: InvoiceStatus;
  total_cents: number | null;
  amount_due_cents: number;
  amount_paid_cents: number;
  currency: string;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  stripe_created_at: string | null;
  created_at: string;
}

export async function fetchMyInvoices(): Promise<ClientInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `id, organization_id, number, status, total_cents, amount_due_cents,
       amount_paid_cents, currency, hosted_invoice_url, invoice_pdf_url,
       period_start, period_end, due_date, paid_at, stripe_created_at, created_at`,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ClientInvoice[];
}

export interface ClientPayment {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  refunded_amount_cents: number;
  card_brand: string | null;
  card_last4: string | null;
  failure_message: string | null;
  paid_at: string | null;
  created_at: string;
}

export async function fetchMyPayments(): Promise<ClientPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `id, organization_id, invoice_id, amount_cents, currency, status,
       refunded_amount_cents, card_brand, card_last4, failure_message,
       paid_at, created_at`,
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as unknown as ClientPayment[];
}

/**
 * Tous les abonnements, pour l'administration (§30).
 *
 * La même requête que `fetchMySubscriptions`, sans le tri par organisation :
 * c'est `subscriptions_select_staff` qui élargit le périmètre, pas ce code. Un
 * client qui appellerait cette fonction obtiendrait exactement ses propres
 * lignes.
 */
export async function fetchAllSubscriptions(): Promise<ClientSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_FIELDS)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return flattenAll<ClientSubscription>(data, ['plan', 'organization']);
}

// -----------------------------------------------------------------------------
// Actions — déléguées aux fonctions Edge
// -----------------------------------------------------------------------------

/**
 * Ouvre une session Stripe Checkout et renvoie l'URL de paiement.
 *
 * Le montant n'est pas transmis : seul l'identifiant du prix l'est. La fonction
 * Edge relit le tarif en base et construit la session à partir de lui. Envoyer
 * un montant depuis le navigateur reviendrait à laisser le client fixer le prix.
 */
export async function startCheckout(input: {
  organizationId: string;
  planPriceId: string;
}): Promise<string> {
  return await invokeForUrl('stripe-checkout', {
    organization_id: input.organizationId,
    plan_price_id: input.planPriceId,
  });
}

/** Ouvre le portail de facturation Stripe et renvoie son URL. */
export async function openBillingPortal(organizationId: string): Promise<string> {
  return await invokeForUrl('stripe-portal', { organization_id: organizationId });
}

/**
 * Appelle une fonction Edge et en extrait l'URL de redirection.
 *
 * `supabase.functions.invoke` ne remonte pas le corps des réponses en erreur :
 * `error.message` vaut « Edge Function returned a non-2xx status code », ce qui
 * n'apprend rien au client. Le message métier — « un abonnement est déjà en
 * cours », « seul le dirigeant peut… » — se trouve dans la réponse HTTP, qu'il
 * faut relire explicitement.
 */
async function invokeForUrl(
  functionName: string,
  body: Record<string, string>,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url?: string }>(
    functionName,
    { body },
  );

  if (error) {
    throw new Error(await extractMessage(error));
  }

  if (!data?.url) {
    throw new Error("La page de paiement n'a pas pu être ouverte.");
  }

  return data.url;
}

async function extractMessage(error: unknown): Promise<string> {
  const context = (error as { context?: { json?: () => Promise<unknown> } }).context;

  if (context?.json) {
    try {
      const body = (await context.json()) as { error?: unknown };
      if (typeof body.error === 'string' && body.error) return body.error;
    } catch {
      // Corps illisible : on retombe sur le message générique ci-dessous.
    }
  }

  return error instanceof Error && error.message
    ? error.message
    : "L'opération a échoué. Réessayez dans un instant.";
}

/**
 * Aplatit les relations « vers un » renvoyées tantôt en objet, tantôt en
 * tableau d'un élément selon l'inférence de PostgREST.
 */
function flattenAll<T>(data: unknown, keys: string[]): T[] {
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const flattened: Record<string, unknown> = { ...row };

    for (const key of keys) {
      const value = row[key];
      flattened[key] = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    }

    return flattened as T;
  });
}
