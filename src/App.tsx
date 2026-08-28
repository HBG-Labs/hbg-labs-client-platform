import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { router } from '@/routes/router';

/**
 * Racine applicative.
 *
 * Volontairement mince (§38) : elle assemble les fournisseurs de contexte et
 * délègue tout le reste. Les fournisseurs à venir — session Supabase,
 * notifications, thème — s'ajouteront ici, et nulle part ailleurs.
 *
 * Le routage vit dans `@/routes/router`, pas dans ce fichier : c'est ce qui
 * évite l'App.tsx tentaculaire que §38 met en garde.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
