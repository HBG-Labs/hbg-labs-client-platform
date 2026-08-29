import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Table de routage.
 *
 * L'accueil est chargé avec le bundle initial : c'est la porte d'entrée du
 * site, l'afficher après un aller-retour réseau supplémentaire dégraderait la
 * première impression et les mesures de performance.
 *
 * Les autres pages sont chargées à la demande (§42). Un visiteur qui lit la
 * page tarifs ne télécharge pas les conditions générales.
 *
 * Les routes `/connexion` et `/inscription` de §5 n'y figurent pas encore : les
 * écrans d'authentification arrivent au lot 3. Déclarer la route avant la page
 * produirait un lien mort dans la navigation.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },

          {
            path: 'services',
            lazy: async () => ({
              Component: (await import('@/pages/public/ServicesPage')).ServicesPage,
            }),
          },
          {
            path: 'creation-site-web',
            lazy: async () => ({
              Component: (await import('@/pages/public/CreationSiteWebPage'))
                .CreationSiteWebPage,
            }),
          },
          {
            path: 'hebergement',
            lazy: async () => ({
              Component: (await import('@/pages/public/HebergementPage')).HebergementPage,
            }),
          },
          {
            path: 'maintenance',
            lazy: async () => ({
              Component: (await import('@/pages/public/MaintenancePage')).MaintenancePage,
            }),
          },
          {
            path: 'tarifs',
            lazy: async () => ({
              Component: (await import('@/pages/public/TarifsPage')).TarifsPage,
            }),
          },
          {
            path: 'contact',
            lazy: async () => ({
              Component: (await import('@/pages/public/ContactPage')).ContactPage,
            }),
          },
          {
            path: 'devis',
            lazy: async () => ({
              Component: (await import('@/pages/public/DevisPage')).DevisPage,
            }),
          },

          {
            path: 'mentions-legales',
            lazy: async () => ({
              Component: (await import('@/pages/public/MentionsLegalesPage'))
                .MentionsLegalesPage,
            }),
          },
          {
            path: 'politique-confidentialite',
            lazy: async () => ({
              Component: (await import('@/pages/public/PolitiqueConfidentialitePage'))
                .PolitiqueConfidentialitePage,
            }),
          },
          {
            path: 'cgv',
            lazy: async () => ({
              Component: (await import('@/pages/public/CgvPage')).CgvPage,
            }),
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
