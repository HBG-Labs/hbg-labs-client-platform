/**
 * Clés de cache du domaine identité.
 *
 * `authKeys.all` invalide profil et rattachements d'un seul appel, ce que fait
 * `AuthProvider` au changement de compte.
 */
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  organizations: () => [...authKeys.all, 'organizations'] as const,
};
