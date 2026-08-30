import type Stripe from 'npm:stripe@^18.0.0';
import { centsOrNull, idOf, stripeDate } from '../_shared/stripe.ts';
import { IgnoredEvent, isStale, type MirrorContext } from './context.ts';
import { resolveOrganizationId } from './organizations.ts';

/**
 * Miroir local d'une facture Stripe (§23).
 *
 *
 * LES MONTANTS SONT RECOPIÉS, JAMAIS RECALCULÉS
 *
 * Le HT, la TVA et le TTC arrivent tels que Stripe les a établis. Recalculer
 * l'un à partir des autres introduirait des écarts d'arrondi entre la facture
 * affichée dans l'espace client et la facture réellement émise — un écart d'un
 * centime sur une pièce comptable est une anomalie, pas un détail.
 *
 *
 * LE PDF N'EST PAS COPIÉ
 *
 * Seules les URL sont conservées. Stripe reste l'émetteur de référence : si la
 * présentation ou les mentions légales de la facture changent, le document
 * servi au client change avec, sans qu'aucune copie ne diverge (migration 08).
 */

/** Champs dont l'emplacement dépend de la version d'API. */
interface InvoiceCompat {
  subscription?: string | { id: string } | null;
  tax?: number | null;
  total_taxes?: Array<{ amount?: number | null }> | null;
  parent?: {
    subscription_details?: { subscription?: string | { id: string } | null } | null;
  } | null;
}

export async function mirrorInvoice(
  context: MirrorContext,
  invoice: Stripe.Invoice,
): Promise<string> {
  const { admin, eventAt } = context;

  if (!invoice.id) {
    throw new IgnoredEvent('Facture sans identifiant Stripe.');
  }

  const customerId = idOf(invoice.customer);
  const organizationId = await resolveOrganizationId(admin, {
    metadataOrganizationId: invoice.metadata?.organization_id,
    customerId,
  });

  // ---- Garde d'ordre -------------------------------------------------------
  const { data: existing, error: readError } = await admin
    .from('invoices')
    .select('id, stripe_event_at')
    .eq('stripe_invoice_id', invoice.id)
    .maybeSingle();

  if (readError) throw readError;

  const stored = existing as { id: string; stripe_event_at: string | null } | null;

  if (isStale(stored?.stripe_event_at ?? null, eventAt)) {
    throw new IgnoredEvent(
      `Événement antérieur à l'état enregistré (${stored?.stripe_event_at}).`,
    );
  }

  const compat = invoice as unknown as InvoiceCompat;
  const status = invoice.status ?? 'draft';

  // ---- Montants ------------------------------------------------------------
  const amounts = {
    subtotal: centsOrNull(invoice.subtotal),
    tax: taxAmount(compat),
    total: centsOrNull(invoice.total),
    due: invoice.amount_due ?? 0,
    paid: invoice.amount_paid ?? 0,
    remaining: centsOrNull(invoice.amount_remaining),
  };

  // Le schéma impose des montants positifs (migration 08). Une note de crédit
  // ou une facture à total négatif existe pourtant chez Stripe. Plutôt que de
  // la tronquer à zéro — ce qui inventerait un montant — l'événement est
  // acquitté et la raison consignée : la pièce reste consultable dans Stripe,
  // et l'anomalie est dénombrable en base.
  if (Object.values(amounts).some((value) => typeof value === 'number' && value < 0)) {
    throw new IgnoredEvent(
      'Facture à montant négatif (avoir) : non représentable par le schéma actuel.',
    );
  }

  // ---- Date de paiement ----------------------------------------------------
  // `invoices_paid_has_date` refuse une facture « payée » sans date. Stripe la
  // fournit dans `status_transitions` ; en son absence, l'horodatage de
  // l'événement qui annonce le paiement est la meilleure date disponible, et
  // elle est exacte à la seconde près.
  const paidAt = stripeDate(invoice.status_transitions?.paid_at);

  const row = {
    organization_id: organizationId,
    subscription_id: await resolveSubscriptionId(context, compat),
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    number: invoice.number ?? null,
    status,

    subtotal_cents: amounts.subtotal,
    tax_cents: amounts.tax,
    total_cents: amounts.total,
    amount_due_cents: amounts.due,
    amount_paid_cents: amounts.paid,
    amount_remaining_cents: amounts.remaining,
    currency: (invoice.currency ?? 'eur').toUpperCase(),

    hosted_invoice_url: httpsOrNull(invoice.hosted_invoice_url),
    invoice_pdf_url: httpsOrNull(invoice.invoice_pdf),

    period_start: stripeDate(invoice.period_start),
    period_end: stripeDate(invoice.period_end),
    due_date: stripeDate(invoice.due_date),
    paid_at: status === 'paid' ? (paidAt ?? eventAt) : paidAt,

    stripe_created_at: stripeDate(invoice.created),
    stripe_event_at: eventAt,
    synced_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from('invoices')
    .upsert(row, { onConflict: 'stripe_invoice_id' });

  if (error) throw error;

  return organizationId;
}

/**
 * Montant de TVA, quelle que soit la version d'API.
 *
 * L'ancien champ `tax` a été remplacé par la ventilation `total_taxes`. Lire
 * les deux évite qu'une montée de version transforme silencieusement la TVA
 * affichée en « — ».
 */
function taxAmount(invoice: InvoiceCompat): number | null {
  if (typeof invoice.tax === 'number') return invoice.tax;

  if (Array.isArray(invoice.total_taxes)) {
    return invoice.total_taxes.reduce((total, line) => total + (line.amount ?? 0), 0);
  }

  return null;
}

/** Abonnement local rattaché à la facture, s'il est déjà connu. */
async function resolveSubscriptionId(
  context: MirrorContext,
  invoice: InvoiceCompat,
): Promise<string | null> {
  const stripeSubscriptionId =
    idOf(invoice.subscription) ??
    idOf(invoice.parent?.subscription_details?.subscription);

  if (!stripeSubscriptionId) return null;

  const { data, error } = await context.admin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) throw error;

  // NULL est normal : `invoice.paid` peut précéder `customer.subscription.created`.
  // La facture reste rattachée à son organisation, ce qui suffit à l'afficher ;
  // le lien vers l'abonnement se rétablit à la mise à jour suivante.
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Le schéma exige des URL en HTTPS. Une valeur non conforme est écartée plutôt
 * que de faire échouer tout le miroir de la facture pour un lien.
 */
function httpsOrNull(url: string | null | undefined): string | null {
  return url && url.startsWith('https://') ? url : null;
}
