import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

/**
 * Écran d'erreur du routeur (§17).
 *
 * Le point vérifié ici est une distinction, pas un affichage : une adresse
 * inconnue et un échec de chargement ne se ressemblent pas et n'appellent pas
 * le même geste. Les confondre — ce que faisait `errorElement:
 * <NotFoundPage />` — annonce « cette page n'existe pas » à quelqu'un dont la
 * page existe et qu'un rechargement suffirait à ramener.
 *
 * Second point : une adresse inconnue ne doit RIEN remonter à la supervision.
 * Un robot qui balaie des URL produirait sinon un flot d'incidents qui
 * noierait les vraies pannes.
 */

const state: { error: unknown } = { error: null };
const reportError = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useRouteError: () => state.error,
}));

vi.mock('@/lib/monitoring', () => ({
  reportError: (...args: unknown[]) => reportError(...args),
  isMonitoringConfigured: false,
}));

/** Réponse d'erreur telle que React Router la produit pour un 404. */
function routeErrorResponse(status: number, statusText: string) {
  return { status, statusText, internal: false, data: null };
}

beforeEach(() => {
  state.error = null;
  reportError.mockClear();
});

describe('Adresse inconnue', () => {
  it('affiche « page introuvable »', async () => {
    state.error = routeErrorResponse(404, 'Not Found');

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(screen.getByText('Cette page s’est perdue.')).toBeInTheDocument();
  });

  it('ne remonte rien à la supervision', async () => {
    state.error = routeErrorResponse(404, 'Not Found');

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(reportError).not.toHaveBeenCalled();
  });
});

describe('Échec de chargement', () => {
  it('propose de recharger plutôt que d’annoncer une page inexistante', async () => {
    state.error = new Error("Failed to fetch dynamically imported module: /assets/Page-a1b2.js");

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(screen.getByText('Cette page n’a pas pu se charger')).toBeInTheDocument();
    expect(screen.queryByText('Page introuvable')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recharger la page' }),
    ).toBeInTheDocument();
  });

  it('affiche le message réel, sans le remplacer par un texte rassurant', async () => {
    state.error = new Error('Le module ne fournit pas d’export nommé « TarifsPage ».');

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(screen.getByText(/export nommé/)).toBeInTheDocument();
  });

  it('remonte l’erreur à la supervision', async () => {
    const error = new Error('Chunk 42 introuvable.');
    state.error = error;

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(reportError).toHaveBeenCalledWith(error, { origine: 'routeur' });
  });

  it('reste lisible quand l’erreur n’est pas une exception', async () => {
    // React Router peut propager n'importe quelle valeur levée, y compris une
    // chaîne ou un objet sans `message`.
    state.error = { quelque: 'chose' };

    const { RouteErrorPage } = await import('./RouteErrorPage');
    renderWithProviders(<RouteErrorPage />);

    expect(screen.getByText('Cause inconnue.')).toBeInTheDocument();
  });
});
