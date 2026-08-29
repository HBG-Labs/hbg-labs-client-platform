/**
 * Clés de cache du domaine tarifaire.
 *
 * Regroupées et hiérarchisées : `pricing.all` invalide tout le domaine d'un
 * seul appel. Des clés éparpillées dans les composants deviennent
 * impossibles à invalider correctement le jour où une mutation touche
 * plusieurs vues.
 */
export const pricingKeys = {
  all: ['pricing'] as const,
  publicPlans: () => [...pricingKeys.all, 'public-plans'] as const,
};
