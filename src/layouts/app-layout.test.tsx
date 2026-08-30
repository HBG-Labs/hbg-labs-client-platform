import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import type { AuthContextValue } from '@/features/auth/auth-context';

/**
 * Entrée vers l'administration depuis l'espace client.
 *
 * Un membre du personnel qui se connecte arrive sur `/dashboard`. Sans ce lien,
 * il devait taper `/admin` à la main.
 *
 * Ce lien MONTRE une entrée, il n'autorise rien : `RequirePlatformStaff` filtre
 * la route, et les policies RLS protègent les données. Un client qui forcerait
 * l'URL obtiendrait une redirection, puis des tableaux vides s'il allait plus
 * loin. Le test vérifie donc l'affichage, pas la sécurité, qui est couverte par
 * `guards.test.tsx` et `tests/rls/`.
 */

const authState: { current: AuthContextValue } = {
  current: {
    session: null,
    user: { id: 'user-1', email: 'marie@exemple.fr' } as AuthContextValue['user'],
    isLoading: false,
    signOut: async () => undefined,
  },
};

vi.mock('@/features/auth/auth-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/auth-context')>();
  return { ...actual, useAuth: () => authState.current };
});

const profileState: { platformRole: string | null } = { platformRole: null };

vi.mock('@/features/auth/useProfile', () => ({
  useProfile: () => ({
    data: {
      id: 'user-1',
      email: 'marie@exemple.fr',
      full_name: 'Marie Dupont',
      platform_role: profileState.platformRole,
    },
    isPending: false,
  }),
  useIsPlatformStaff: () => profileState.platformRole !== null,
  useMyOrganizations: () => ({ data: [], isPending: false, isSuccess: true }),
}));

beforeEach(() => {
  profileState.platformRole = null;
});

describe('Espace client, entrée vers l’administration', () => {
  it('reste invisible pour un client', async () => {
    const { AppLayout } = await import('./AppLayout');
    renderWithProviders(<AppLayout />, { route: '/dashboard' });

    expect(
      screen.queryByRole('link', { name: /Administration/i }),
    ).not.toBeInTheDocument();
  });

  it('apparaît pour un membre du personnel', async () => {
    profileState.platformRole = 'OWNER';

    const { AppLayout } = await import('./AppLayout');
    renderWithProviders(<AppLayout />, { route: '/dashboard' });

    const link = screen.getByRole('link', { name: /Administration/i });
    expect(link).toHaveAttribute('href', '/admin');
  });

  it('affiche la navigation de l’espace client dans les deux cas', async () => {
    // Contre-épreuve : l'ajout du lien ne doit pas perturber le reste de
    // l'en-tête.
    const { AppLayout } = await import('./AppLayout');
    renderWithProviders(<AppLayout />, { route: '/dashboard' });

    expect(screen.getByRole('link', { name: /Mon site/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Domaine/i })).toBeInTheDocument();
  });
});
