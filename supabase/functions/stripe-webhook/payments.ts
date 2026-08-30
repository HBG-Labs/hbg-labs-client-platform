import type Stripe from 'npm:stripe@^18.0.0';
import { idOf, stripeDate } from '../_shared/stripe.ts';
import { IgnoredEvent, isStale, type MirrorContext } from './context.ts';
import { resolveOrganizationId } from './organizations.ts';

/**
 * Miroir local des encaissements et des échecs (§23).
 *
 *
 * AUCUNE DONNÉE BANCAIRE
 *
 * Marque et quatre derniers chiffres, rien d'autre. La contrainte de format sur
 * `card_last4` interdit d'y écrire un numéro complet, et aucune autre colonne
 * n'accueille de moyen de paiement. C'est la limite du §23, et c'est aussi ce
 * qui maintient la plateforme hors du périmètre PCI-DSS.
 *
 *
 * `failed` N'EXISTE PAS CHEZ STRIPE
 *
 * Un PaymentIntent en échec porte le statut `requires_payment_method` : Stripe
 * décrit ce qu'il attend ensuite, pas ce qui vient de se passer. Enregistrer
 * cette valeur telle quelle rendrait les échecs invisibles — la colonne dirait
 * « en attente d'un moyen de paiement » là où le client a vu sa carte refusée.
 *
 * L'énumération `payment_status` porte donc `failed`, appliqué à la réception
 * de `payment_intent.payment_failed`, seul événement qui l'affirme.
 */

/** Statuts Stripe transposables tels quels. */
const DIRECT_STATUSES: Record<string, string> = {
  succeeded: 'succeeded',
  processing: 'processing',
  canceled: 'canceled',
  requires_payment_method: 'requires_payment_method',
  requires_action: 'requires_action',
};

interface PaymentRow {
  organization_id: string;
  invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  refunded_amount_cents: number;
  payment_method_type: string | null;
  card_brand: string | null;
  card_last4: string | null;
  failure_code: string | null;
  failure_message: string | null;
  paid_at: string | null;
  stripe_created_at: string | null;
  stripe_event_at: string;
  synced_at: string;
}

// -----------------------------------------------------------------------------
// PaymentIntent
// -----------------------------------------------------------------------------

export async function mirrorPaymentIntent(
  context: MirrorContext,
  intent: Stripe.PaymentIntent,
): Promise<string> {
  const { admin, eventAt, event } = context;

  const customerId = idOf(intent.customer);
  const organizationId = await resolveOrganizationId(admin, {
    metadataOrganizationId: intent.metadata?.organization_id,
    customerId,
  });

  const chargeId = idOf(intent.latest_charge);
  const existing = await findPayment(admin, intent.id, chargeId);

  if (isStale(existing?.stripe_event_at ?? null, eventAt)) {
    throw new IgnoredEvent(
      `Événement antérieur à l'état enregistré (${existing?.stripe_event_at}).`,
    );
  }

  const failed = event.type === 'payment_intent.payment_failed';
  const status = failed ? 'failed' : mappedStatus(intent.status);

  const charge = chargeId ? await retrieveCharge(context, chargeId) : null;
  const card = charge?.payment_method_details?.card ?? null;

  const row: PaymentRow = {
    organization_id: organizationId,
    invoice_id: await resolveInvoiceId(context, idOf(chargeInvoice(charge, intent))),
    stripe_payment_intent_id: intent.id,
    stripe_charge_id: chargeId,
    amount_cents: intent.amount ?? 0,
    currency: (intent.currency ?? 'eur').toUpperCase(),
    status,
    refunded_amount_cents: 0,
    payment_method_type: bounded(charge?.payment_method_details?.type, 40),
    card_brand: bounded(card?.brand, 30),
    card_last4: last4(card?.last4),

    // `payments_failed_has_reason` exige un code : Stripe n'en fournit pas
    // toujours (un refus réseau n'en porte pas). `payment_failed` est alors la
    // seule affirmation exacte disponible.
    failure_code: failed
      ? (bounded(intent.last_payment_error?.decline_code, 80) ??
        bounded(intent.last_payment_error?.code, 80) ??
        'payment_failed')
      : null,
    failure_message: failed ? bounded(intent.last_payment_error?.message, 500) : null,

    // `payments_succeeded_has_date` exige une date d'encaissement.
    paid_at:
      status === 'succeeded' ? (stripeDate(charge?.created ?? intent.created) ?? eventAt) : null,

    stripe_created_at: stripeDate(intent.created),
    stripe_event_at: eventAt,
    synced_at: new Date().toISOString(),
  };

  await writePayment(context, existing?.id ?? null, row);
  return organizationId;
}

// -----------------------------------------------------------------------------
// Remboursement
// -----------------------------------------------------------------------------

/**
 * `charge.refunded` porte la Charge, pas le PaymentIntent : c'est elle qui
 * connaît le montant remboursé. La ligne visée est la même que celle du
 * paiement d'origine, retrouvée par l'un ou l'autre des deux identifiants.
 */
export async function mirrorRefund(
  context: MirrorContext,
  charge: Stripe.Charge,
): Promise<string> {
  const { admin, eventAt } = context;

  const customerId = idOf(charge.customer);
  const organizationId = await resolveOrganizationId(admin, {
    metadataOrganizationId: charge.metadata?.organization_id,
    customerId,
  });

  const intentId = idOf(charge.payment_intent);
  const existing = await findPayment(admin, intentId, charge.id);

  if (isStale(existing?.stripe_event_at ?? null, eventAt)) {
    throw new IgnoredEvent(
      `Événement antérieur à l'état enregistré (${existing?.stripe_event_at}).`,
    );
  }

  const amount = charge.amount ?? 0;
  const refunded = charge.amount_refunded ?? 0;

  // `payments_refund_status_matches` lie le statut au montant remboursé : un
  // remboursement partiel de la totalité, ou total d'une partie, est refusé
  // par la base. Le statut se déduit donc du montant, jamais l'inverse.
  if (refunded <= 0) {
    throw new IgnoredEvent('Remboursement annoncé sans montant remboursé.');
  }

  const card = charge.payment_method_details?.card ?? null;

  const row: PaymentRow = {
    organization_id: organizationId,
    invoice_id: await resolveInvoiceId(context, idOf(chargeInvoice(charge, null))),
    stripe_payment_intent_id: intentId,
    stripe_charge_id: charge.id,
    amount_cents: amount,
    currency: (charge.currency ?? 'eur').toUpperCase(),
    status: refunded >= amount ? 'refunded' : 'partially_refunded',
    refunded_amount_cents: Math.min(refunded, amount),
    payment_method_type: bounded(charge.payment_method_details?.type, 40),
    card_brand: bounded(card?.brand, 30),
    card_last4: last4(card?.last4),
    failure_code: null,
    failure_message: null,
    paid_at: stripeDate(charge.created),
    stripe_created_at: stripeDate(charge.created),
    stripe_event_at: eventAt,
    synced_at: new Date().toISOString(),
  };

  await writePayment(context, existing?.id ?? null, row);
  return organizationId;
}

// -----------------------------------------------------------------------------
// Écriture
// -----------------------------------------------------------------------------

/**
 * Insertion ou mise à jour, décidée par une lecture préalable.
 *
 * `upsert` serait plus court mais ne fonctionne pas ici : les deux index
 * uniques de `payments` sont PARTIELS (`where … is not null`), et PostgreSQL
 * n'infère pas la cible d'un ON CONFLICT sur un index partiel sans en répéter
 * le prédicat — ce que PostgREST ne permet pas d'exprimer.
 *
 * L'unicité reste garantie par ces index : en cas de course entre deux
 * livraisons du même paiement, la seconde insertion échoue au lieu de créer un
 * doublon, et l'événement est rejoué.
 */
async function writePayment(
  context: MirrorContext,
  existingId: string | null,
  row: PaymentRow,
): Promise<void> {
  const query = existingId
    ? context.admin.from('payments').update(row).eq('id', existingId)
    : context.admin.from('payments').insert(row);

  const { error } = await query;
  if (error) throw error;
}

async function findPayment(
  admin: MirrorContext['admin'],
  intentId: string | null,
  chargeId: string | null,
): Promise<{ id: string; stripe_event_at: string | null } | null> {
  for (const [column, value] of [
    ['stripe_payment_intent_id', intentId],
    ['stripe_charge_id', chargeId],
  ] as const) {
    if (!value) continue;

    const { data, error } = await admin
      .from('payments')
      .select('id, stripe_event_at')
      .eq(column, value)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as { id: string; stripe_event_at: string | null };
  }

  return null;
}

/** Facture locale rattachée au paiement, si elle est déjà connue. */
async function resolveInvoiceId(
  context: MirrorContext,
  stripeInvoiceId: string | null,
): Promise<string | null> {
  if (!stripeInvoiceId) return null;

  const { data, error } = await context.admin
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * La Charge complète, pour la marque et les quatre derniers chiffres.
 *
 * L'événement ne porte que l'identifiant de la charge (`latest_charge`), non
 * l'objet. Un appel supplémentaire est donc nécessaire ; son échec ne doit pas
 * faire échouer le miroir du paiement, dont le montant et le statut — les
 * seules informations qui comptent pour le client — sont déjà connus.
 */
async function retrieveCharge(
  context: MirrorContext,
  chargeId: string,
): Promise<Stripe.Charge | null> {
  try {
    return await context.stripe.charges.retrieve(chargeId);
  } catch (error) {
    console.warn(`Charge ${chargeId} illisible ; carte non renseignée.`, error);
    return null;
  }
}

function chargeInvoice(
  charge: Stripe.Charge | null,
  intent: Stripe.PaymentIntent | null,
): string | { id: string } | null {
  return (charge?.invoice ?? intent?.invoice ?? null) as string | { id: string } | null;
}

function mappedStatus(status: string): string {
  const mapped = DIRECT_STATUSES[status];

  if (!mapped) {
    // `requires_confirmation` et `requires_capture` n'ont pas d'équivalent :
    // ce sont des étapes d'un flux que la plateforme n'utilise pas. Les
    // rapprocher d'un statut voisin déformerait l'information.
    throw new IgnoredEvent(`Statut Stripe sans équivalent en base : ${status}.`);
  }

  return mapped;
}

function bounded(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function last4(value: string | null | undefined): string | null {
  return value && /^[0-9]{4}$/.test(value) ? value : null;
}
