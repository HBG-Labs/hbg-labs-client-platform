import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration TanStack Query.
 *
 * Les valeurs par défaut de la bibliothèque conviennent mal à une application
 * de gestion : elles supposent des données très volatiles et rejouent
 * volontiers les requêtes en échec.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une minute. Les données affichées ici — abonnement, factures, tickets —
      // changent à l'échelle de l'heure, pas de la seconde. Un `staleTime` nul
      // relancerait une requête à chaque montage de composant.
      staleTime: 60_000,
      gcTime: 5 * 60_000,

      // Pas de rechargement au retour d'onglet : sur un tableau de bord, cela
      // produit un scintillement à chaque va-et-vient, sans bénéfice.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,

      retry: (failureCount, error) => {
        // Ne jamais réessayer sur un refus : une requête bloquée par la RLS le
        // restera. Réessayer masquerait l'erreur derrière trois secondes
        // d'attente, et la rendrait plus difficile à diagnostiquer.
        const code = (error as { code?: string } | null)?.code;
        if (code === '42501' || code === 'PGRST301' || code === 'PGRST116') {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      // Aucune reprise automatique sur les écritures : rejouer une mutation
      // dont on ignore si elle a abouti peut créer un doublon — un second
      // ticket, un second message.
      retry: false,
    },
  },
});
