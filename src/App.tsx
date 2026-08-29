import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { router } from '@/routes/router';

/**
 * Racine applicative.
 *
 * Volontairement mince (§38) : elle assemble les fournisseurs de contexte et
 * délègue tout le reste. Le routage vit dans `@/routes/router`.
 *
 * L'ordre d'imbrication compte. `AuthProvider` appelle `useQueryClient` pour
 * vider le cache à la déconnexion : il doit donc se trouver à l'intérieur de
 * `QueryClientProvider`. `RouterProvider` vient en dernier, les gardes de route
 * consommant la session.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
