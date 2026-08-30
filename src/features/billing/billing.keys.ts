/**
 * Clés de cache de la facturation.
 *
 * Abonnement, factures et paiements sont trois clés distinctes : le retour du
 * Checkout ne rafraîchit que l'abonnement, alors qu'un `invoice.paid` touche
 * les trois. Les séparer évite de retélécharger l'historique complet à chaque
 * changement d'état.
 */
export const billingKeys = {
  all: ['billing'] as const,
  subscriptions: () => [...billingKeys.all, 'subscriptions'] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  payments: () => [...billingKeys.all, 'payments'] as const,
  /** Vue plateforme (§30). Distincte : elle ne porte pas le même périmètre. */
  allSubscriptions: () => [...billingKeys.all, 'all-subscriptions'] as const,
};
