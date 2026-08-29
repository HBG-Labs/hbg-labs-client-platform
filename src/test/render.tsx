import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Rend un composant avec les fournisseurs de l'application.
 *
 * Chaque test reçoit un `QueryClient` neuf : un client partagé conserverait le
 * cache d'un test à l'autre, et un test verrait passer les données récupérées
 * par le précédent.
 *
 * `retry: false` fait remonter les erreurs immédiatement au lieu de les
 * réessayer pendant plusieurs secondes.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
