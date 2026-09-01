import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from './RouteErrorPage';
import { RequireAuth, RequireGuest, RequirePlatformStaff } from './guards';

/**
 * Table de routage.
 *
 * L'accueil est chargé avec le bundle initial : c'est la porte d'entrée du
 * site, l'afficher après un aller-retour réseau supplémentaire dégraderait la
 * première impression et les mesures de performance.
 *
 * Les autres pages sont chargées à la demande (§42). Un visiteur qui lit la
 * page tarifs ne télécharge ni les conditions générales, ni l'espace client.
 *
 * Les gardes `RequireAuth` et `RequireGuest` règlent l'AFFICHAGE. L'accès aux
 * données est protégé par les policies RLS, que le navigateur ne peut pas
 * contourner (voir `guards.tsx`).
 */

/**
 * Raccourci de déclaration d'une route chargée à la demande.
 *
 * Le module est typé `Record<string, unknown>` plutôt que
 * `Record<string, ComponentType>` : plusieurs modules exportent aussi des
 * composants à props obligatoires (`AuthCard`) ou des types, qu'une signature
 * plus stricte refuserait. La conversion est faite sur la seule valeur
 * réellement utilisée.
 */
function lazyRoute(loader: () => Promise<Record<string, unknown>>, name: string) {
  return async () => {
    const module = await loader();
    const Component = module[name] as React.ComponentType;

    if (!Component) {
      throw new Error(`Le module ne fournit pas d'export nommé « ${name} ».`);
    }

    return { Component };
  };
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    // Distingue l'adresse inconnue de l'échec réel — le plus souvent un
    // morceau de code introuvable après un déploiement. Les deux affichaient
    // « page introuvable », ce qui envoyait à l'opposé du geste utile.
    errorElement: <RouteErrorPage />,
    children: [
      // ---- Site public ----
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'services',
            lazy: lazyRoute(() => import('@/pages/public/ServicesPage'), 'ServicesPage'),
          },
          {
            path: 'creation-site-web',
            lazy: lazyRoute(
              () => import('@/pages/public/CreationSiteWebPage'),
              'CreationSiteWebPage',
            ),
          },
          {
            path: 'hebergement',
            lazy: lazyRoute(
              () => import('@/pages/public/HebergementPage'),
              'HebergementPage',
            ),
          },
          {
            path: 'maintenance',
            lazy: lazyRoute(
              () => import('@/pages/public/MaintenancePage'),
              'MaintenancePage',
            ),
          },
          {
            path: 'tarifs',
            lazy: lazyRoute(() => import('@/pages/public/TarifsPage'), 'TarifsPage'),
          },
          {
            path: 'contact',
            lazy: lazyRoute(() => import('@/pages/public/ContactPage'), 'ContactPage'),
          },
          {
            path: 'showcase',
            lazy: lazyRoute(() => import('@/pages/public/ShowcasePage'), 'ShowcasePage'),
          },
          {
            path: 'showcase/:projectId',
            lazy: lazyRoute(() => import('@/pages/public/ShowcasePage'), 'ShowcasePage'),
          },
          {
            path: 'devis',
            lazy: lazyRoute(() => import('@/pages/public/DevisPage'), 'DevisPage'),
          },
          {
            path: 'mentions-legales',
            lazy: lazyRoute(
              () => import('@/pages/public/MentionsLegalesPage'),
              'MentionsLegalesPage',
            ),
          },
          {
            path: 'politique-confidentialite',
            lazy: lazyRoute(
              () => import('@/pages/public/PolitiqueConfidentialitePage'),
              'PolitiqueConfidentialitePage',
            ),
          },
          {
            path: 'cgu',
            lazy: lazyRoute(() => import('@/pages/public/CguPage'), 'CguPage'),
          },
          {
            path: 'cgv',
            lazy: lazyRoute(() => import('@/pages/public/CgvPage'), 'CgvPage'),
          },
          {
            path: 'cookies',
            lazy: lazyRoute(() => import('@/pages/public/CookiesPage'), 'CookiesPage'),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },

      // ---- Authentification, réservée aux visiteurs non connectés ----
      {
        element: <RequireGuest />,
        children: [
          {
            lazy: lazyRoute(() => import('@/layouts/AuthLayout'), 'AuthLayout'),
            children: [
              {
                path: 'connexion',
                lazy: lazyRoute(() => import('@/pages/auth/ConnexionPage'), 'ConnexionPage'),
              },
              {
                path: 'inscription',
                lazy: lazyRoute(
                  () => import('@/pages/auth/InscriptionPage'),
                  'InscriptionPage',
                ),
              },
              {
                path: 'mot-de-passe-oublie',
                lazy: lazyRoute(
                  () => import('@/pages/auth/MotDePasseOubliePage'),
                  'MotDePasseOubliePage',
                ),
              },
            ],
          },
        ],
      },

      // ---- Retours de courriel : accessibles connecté ou non ----
      // `RequireGuest` les bloquerait au moment précis où la session vient
      // d'être établie par le lien, c'est-à-dire toujours.
      {
        lazy: lazyRoute(() => import('@/layouts/AuthLayout'), 'AuthLayout'),
        children: [
          {
            path: 'auth/callback',
            lazy: lazyRoute(
              () => import('@/pages/auth/AuthCallbackPage'),
              'AuthCallbackPage',
            ),
          },
          {
            path: 'verifier-email',
            lazy: lazyRoute(
              () => import('@/pages/auth/VerifierEmailPage'),
              'VerifierEmailPage',
            ),
          },
          {
            path: 'reinitialiser-mot-de-passe',
            lazy: lazyRoute(
              () => import('@/pages/auth/ReinitialiserMotDePassePage'),
              'ReinitialiserMotDePassePage',
            ),
          },
        ],
      },

      // ---- Espace d'administration, reserve au personnel HBG Labs ----
      // La garde masque l'interface ; les policies RLS protegent les donnees.
      {
        element: <RequirePlatformStaff />,
        children: [
          {
            lazy: lazyRoute(() => import('@/layouts/AdminLayout'), 'AdminLayout'),
            children: [
              {
                path: 'admin',
                lazy: lazyRoute(
                  () => import('@/pages/admin/AdminDashboardPage'),
                  'AdminDashboardPage',
                ),
              },
              {
                path: 'admin/clients',
                lazy: lazyRoute(() => import('@/pages/admin/ClientsPage'), 'ClientsPage'),
              },
              {
                path: 'admin/clients/:id',
                lazy: lazyRoute(
                  () => import('@/pages/admin/ClientDetailPage'),
                  'ClientDetailPage',
                ),
              },
              {
                path: 'admin/sites',
                lazy: lazyRoute(() => import('@/pages/admin/WebsitesPage'), 'WebsitesPage'),
              },
              {
                path: 'admin/domaines',
                lazy: lazyRoute(() => import('@/pages/admin/DomainsPage'), 'DomainsPage'),
              },
              {
                path: 'admin/abonnements',
                lazy: lazyRoute(
                  () => import('@/pages/admin/SubscriptionsPage'),
                  'SubscriptionsPage',
                ),
              },
              {
                path: 'admin/demandes',
                lazy: lazyRoute(() => import('@/pages/admin/LeadsPage'), 'LeadsPage'),
              },
              {
                path: 'admin/tickets',
                lazy: lazyRoute(() => import('@/pages/admin/TicketsPage'), 'TicketsPage'),
              },
              {
                path: 'admin/tickets/:id',
                lazy: lazyRoute(
                  () => import('@/pages/admin/TicketDetailPage'),
                  'TicketDetailPage',
                ),
              },
              {
                path: 'admin/journal',
                lazy: lazyRoute(() => import('@/pages/admin/JournalPage'), 'JournalPage'),
              },
            ],
          },
        ],
      },

      // ---- Espace client, réservé aux utilisateurs connectés ----
      {
        element: <RequireAuth />,
        children: [
          {
            lazy: lazyRoute(() => import('@/layouts/AppLayout'), 'AppLayout'),
            children: [
              {
                path: 'dashboard',
                lazy: lazyRoute(() => import('@/pages/app/DashboardPage'), 'DashboardPage'),
              },
              {
                path: 'dashboard/site',
                lazy: lazyRoute(() => import('@/pages/app/MonSitePage'), 'MonSitePage'),
              },
              {
                path: 'dashboard/domaine',
                lazy: lazyRoute(
                  () => import('@/pages/app/MonDomainePage'),
                  'MonDomainePage',
                ),
              },
              {
                path: 'dashboard/facturation',
                lazy: lazyRoute(
                  () => import('@/pages/app/FacturationPage'),
                  'FacturationPage',
                ),
              },
              {
                path: 'dashboard/demandes',
                lazy: lazyRoute(() => import('@/pages/app/DemandesPage'), 'DemandesPage'),
              },
              {
                path: 'dashboard/demandes/:id',
                lazy: lazyRoute(
                  () => import('@/pages/app/DemandeDetailPage'),
                  'DemandeDetailPage',
                ),
              },
              {
                path: 'parametres',
                lazy: lazyRoute(
                  () => import('@/pages/app/ParametresPage'),
                  'ParametresPage',
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
