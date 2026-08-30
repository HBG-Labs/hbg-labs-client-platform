import type Stripe from 'npm:stripe@^18.0.0';
import { centsOrNull, idOf, stripeDate } from '../_shared/stripe.ts';
import { IgnoredEvent, isStale, type MirrorContext } from './context.ts';
import { linkCustomerIfMissing, resolveOrganizationId } from './organizations.ts';

/**
 * Miroir local d'un abonnement Stripe (§18, §22).
 *
 * La table `subscriptions` ne décide de rien : elle recopie ce que Stripe a
 * établi. Le statut, le montant, la période, la date de résiliation — tout
 * vient de l'objet reçu, rien n'est déduit ici.
 *
 *
 * LA PÉRIODE A DÉMÉNAGÉ
 *
 * Les versions récentes de l'API Stripe portent `current_period_start` et
 * `current_period_end` sur les LIGNES de l'abonnement (`items.data[]`), non
 * plus sur l'abonnement lui-même. Les deux emplacements sont lus, la ligne
 * d'abord : un miroir qui ne lirait que l'ancien emplacement afficherait
 * « prochaine échéance : — » sur toute la plateforme, sans erreur nulle part.
 */

/** Champs déplacés ou dépréciés selon la version d'API : lus sans typage strict. */
interface PeriodFields {
  current_period_start?: number | null;
  current_period_end?: number | null;
}

export async function mirrorSubscription(
  context: MirrorContext,
  subscription: Stripe.Subscription,
): Promise<string> {
  const { admin, eventAt } = context;

  const customerId = idOf(subscription.customer);

  if (!customerId) {
    // `subscriptions.stripe_customer_id` est NOT NULL. Un abonnement sans
    // Customer n'existe pas chez Stripe ; si le cas se présentait, l'insertion
    // échouerait sur la contrainte plutôt qu'ici, sans expliquer pourquoi.
    throw new IgnoredEvent("L'abonnement ne porte aucun Customer Stripe.");
  }

  const organizationId = await resolveOrganizationId(admin, {
    metadataOrganizationId: subscription.metadata?.organization_id,
    customerId,
  });

  await linkCustomerIfMissing(admin, organizationId, customerId);

  // ---- Garde d'ordre -------------------------------------------------------
  const { data: existing, error: readError } = await admin
    .from('subscriptions')
    .select('id, stripe_event_at')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (readError) throw readError;

  const stored = existing as { id: string; stripe_event_at: string | null } | null;

  if (isStale(stored?.stripe_event_at ?? null, eventAt)) {
    throw new IgnoredEvent(
      `Événement antérieur à l'état enregistré (${stored?.stripe_event_at}).`,
    );
  }

  // ---- Ligne de l'abonnement ----------------------------------------------
  const item = subscription.items.data[0];
  const price = item?.price;
  const interval = price?.recurring?.interval ?? null;

  const period = {
    start:
      stripeDate((item as unknown as PeriodFields | undefined)?.current_period_start) ??
      stripeDate((subscription as unknown as PeriodFields).current_period_start),
    end:
      stripeDate((item as unknown as PeriodFields | undefined)?.current_period_end) ??
      stripeDate((subscription as unknown as PeriodFields).current_period_end),
  };

  const planId = price?.id ? await resolvePlanId(context, price.id) : null;

  const row = {
    organization_id: organizationId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_price_id: price?.id ?? null,
    status: subscription.status,
    quantity: item?.quantity ?? 1,

    // La contrainte `subscriptions_interval_present` exige une périodicité dès
    // qu'un montant est enregistré. Sans périodicité, le montant seul ne veut
    // rien dire — 49 € par mois ou par an, ce n'est pas le même contrat.
    unit_amount_cents: interval ? centsOrNull(price?.unit_amount) : null,
    recurring_interval: interval,
    currency: (price?.currency ?? 'eur').toUpperCase(),

    // `subscriptions_period_complete` impose les deux bornes ou aucune.
    current_period_start: period.start && period.end ? period.start : null,
    current_period_end: period.start && period.end ? period.end : null,

    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    cancel_at: stripeDate(subscription.cancel_at),
    canceled_at: stripeDate(subscription.canceled_at),
    ended_at: stripeDate(subscription.ended_at),
    trial_start: stripeDate(subscription.trial_start),
    trial_end: stripeDate(subscription.trial_end),
    started_at: stripeDate(subscription.start_date),

    stripe_event_at: eventAt,
    synced_at: new Date().toISOString(),
  };

  // `stripe_subscription_id` porte un index unique complet : l'inférence
  // ON CONFLICT fonctionne, et une relivraison met à jour la ligne au lieu
  // d'en créer une seconde.
  const { error } = await admin
    .from('subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' });

  if (error) throw error;

  return organizationId;
}

/**
 * Retrouve l'offre du catalogue correspondant au prix Stripe facturé.
 *
 * NULL est une réponse acceptable : `subscriptions.plan_id` est nullable, et un
 * abonnement créé à la main dans Stripe sur un prix hors catalogue reste un
 * abonnement réel qu'il faut refléter. L'interface affiche alors le montant
 * sans nom d'offre, ce qui est exact — inventer un plan le serait moins.
 */
async function resolvePlanId(
  context: MirrorContext,
  stripePriceId: string,
): Promise<string | null> {
  const { data, error } = await context.admin
    .from('plan_prices')
    .select('plan_id')
    .eq('stripe_price_id', stripePriceId)
    .maybeSingle();

  if (error) throw error;
  return (data as { plan_id: string } | null)?.plan_id ?? null;
}
