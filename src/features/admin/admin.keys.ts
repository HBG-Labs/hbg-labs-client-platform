/**
 * Clés de cache de l'espace d'administration.
 *
 * Hiérarchisées : créer un site invalide `adminKeys.websites()` et
 * `adminKeys.metrics()`, sans toucher au reste. Une invalidation trop large
 * relancerait toutes les requêtes de l'écran à chaque écriture.
 */
export const adminKeys = {
  all: ['admin'] as const,

  metrics: () => [...adminKeys.all, 'metrics'] as const,

  organizations: () => [...adminKeys.all, 'organizations'] as const,
  organization: (id: string) => [...adminKeys.organizations(), id] as const,
  organizationMembers: (id: string) =>
    [...adminKeys.organization(id), 'members'] as const,

  websites: () => [...adminKeys.all, 'websites'] as const,
  domains: () => [...adminKeys.all, 'domains'] as const,
  tickets: () => [...adminKeys.all, 'tickets'] as const,

  quoteRequests: () => [...adminKeys.all, 'quote-requests'] as const,
  contactMessages: () => [...adminKeys.all, 'contact-messages'] as const,
};
