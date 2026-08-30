import type {
  BillingInterval,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@/types/domain';
import type { BadgeTone } from '@/components/ui/StatusBadge';

/**
 * Correspondances d'affichage de la facturation.
 *
 * Dans un module à part : l'espace client et l'administration montrent les
 * mêmes statuts, et deux tables de couleurs finiraient par diverger — un
 * abonnement « en retard de paiement » en orange d'un côté, en rouge de
 * l'autre, ne se lit plus comme la même information.
 */

export const SUBSCRIPTION_STATUS_TONES: Record<SubscriptionStatus, BadgeTone> = {
  trialing: 'info',
  active: 'success',
  // Le contrat court encore, le recouvrement est en cours : on avertit sans
  // annoncer une rupture qui n'a pas eu lieu.
  past_due: 'warning',
  canceled: 'neutral',
  unpaid: 'danger',
  // L'abonnement attend la fin d'un paiement : rien n'est acquis, rien n'est
  // perdu. Un ton neutre le dit mieux qu'un vert ou un rouge.
  incomplete: 'warning',
  incomplete_expired: 'neutral',
  paused: 'neutral',
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, BadgeTone> = {
  draft: 'neutral',
  open: 'warning',
  paid: 'success',
  uncollectible: 'danger',
  void: 'neutral',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  requires_payment_method: 'warning',
  requires_action: 'warning',
  processing: 'info',
  succeeded: 'success',
  failed: 'danger',
  canceled: 'neutral',
  refunded: 'neutral',
  partially_refunded: 'neutral',
};

/**
 * Statuts d'un abonnement qui donne accès au service.
 *
 * `past_due` en fait partie : le contrat court, l'échec de prélèvement est en
 * cours de traitement, et couper l'accès au premier incident de paiement
 * pénaliserait un client dont la carte vient simplement d'expirer. C'est le
 * même périmètre que le MRR de la migration 07, à ceci près que celui-ci
 * exclut `trialing`, faute d'encaissement.
 */
export function isLiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

/** Un abonnement définitivement terminé, qui n'appelle plus aucune action. */
export function isEndedSubscription(status: SubscriptionStatus): boolean {
  return (
    status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid'
  );
}

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  day: 'par jour',
  week: 'par semaine',
  month: 'par mois',
  year: 'par an',
};

/**
 * Périodicité en toutes lettres.
 *
 * Renvoie une chaîne vide quand la périodicité est inconnue plutôt que « par
 * mois » par défaut : un montant annuel présenté comme mensuel afficherait un
 * tarif douze fois trop bas.
 */
export function intervalLabel(interval: BillingInterval | null): string {
  return interval ? INTERVAL_LABELS[interval] : '';
}

/**
 * Que faut-il dire de la prochaine échéance ?
 *
 * Trois situations, trois phrases différentes. Les confondre donnerait au
 * client une date de renouvellement là où son abonnement s'arrête.
 */
export function renewalNotice(subscription: {
  status: SubscriptionStatus;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  ended_at: string | null;
}): { kind: 'renewal' | 'ends' | 'ended' | 'none'; date: string | null } {
  if (subscription.ended_at) {
    return { kind: 'ended', date: subscription.ended_at };
  }

  if (!subscription.current_period_end) {
    return { kind: 'none', date: null };
  }

  if (subscription.cancel_at_period_end) {
    return { kind: 'ends', date: subscription.current_period_end };
  }

  return { kind: 'renewal', date: subscription.current_period_end };
}
