import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { RequireAuth, RequireGuest } from './guards';

/**
 * Gardes de route (§9).
 *
 * Le cas qui compte le plus est le troisième : tant que la session n'est pas
 * résolue, aucune redirection ne doit avoir lieu. Une garde qui traite
 * « en cours de chargement » comme « non connecté » éjecte l'utilisateur vers
 * l'écran de connexion à chaque rechargement de page, avant même que la
 * session stockée n'ait été relue.
 *
 * Rappel de portée : ces gardes règlent l'affichage. L'accès aux données est
 * protégé par les policies RLS, vérifiées par tests/rls/.
 */

const authState: { current: AuthContextValue } = {
  current: {
    session: null,
    user: null,
    isLoading: false,
    signOut: async () => undefined,
  },
};

vi.mock('@/features/auth/auth-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/auth-context')>();
  return { ...actual, useAuth: () => authState.current };
});

/**
 * Monte une garde avec sa cible de redirection EN DEHORS d'elle.
 *
 * Placer la cible à l'intérieur de la garde produit une boucle infinie : la
 * redirection atteint une route que la même garde protège, qui redirige à
 * nouveau. Le routeur réel ne présente pas ce défaut, `RequireAuth` et
 * `RequireGuest` renvoyant chacune vers une route couverte par l'autre.
 */
function renderGuard(guard: 'auth' | 'guest', route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        {guard === 'auth' ? (
          <>
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<p>Contenu protégé</p>} />
            </Route>
            <Route path="/connexion" element={<p>Formulaire de connexion</p>} />
          </>
        ) : (
          <>
            <Route element={<RequireGuest />}>
              <Route path="/connexion" element={<p>Formulaire de connexion</p>} />
            </Route>
            <Route path="/dashboard" element={<p>Contenu protégé</p>} />
          </>
        )}
      </Routes>
    </MemoryRouter>,
  );
}

/** Utilisateur minimal, suffisant pour les gardes qui testent sa présence. */
const fakeUser = { id: 'user-1', email: 'marie@exemple.fr' } as AuthContextValue['user'];

beforeEach(() => {
  authState.current = {
    session: null,
    user: null,
    isLoading: false,
    signOut: async () => undefined,
  };
});

describe('RequireAuth', () => {
  it('laisse passer un utilisateur connecté', () => {
    authState.current = { ...authState.current, user: fakeUser };
    renderGuard('auth', '/dashboard');

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirige vers la connexion sans session', () => {
    renderGuard('auth', '/dashboard');

    expect(screen.getByText('Formulaire de connexion')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('attend la résolution de la session avant toute redirection', () => {
    authState.current = { ...authState.current, isLoading: true };
    renderGuard('auth', '/dashboard');

    // Ni le contenu, ni la redirection : un état d'attente explicite.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Formulaire de connexion')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });
});

describe('RequireGuest', () => {
  it('laisse passer un visiteur non connecté', () => {
    renderGuard('guest', '/connexion');

    expect(screen.getByText('Formulaire de connexion')).toBeInTheDocument();
  });

  it('renvoie un utilisateur déjà connecté vers son espace', () => {
    authState.current = { ...authState.current, user: fakeUser };
    renderGuard('guest', '/connexion');

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('attend également la résolution de la session', () => {
    authState.current = { ...authState.current, isLoading: true };
    renderGuard('guest', '/connexion');

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
