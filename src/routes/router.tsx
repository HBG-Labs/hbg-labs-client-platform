import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { FoundationsPage } from '@/pages/FoundationsPage';

/**
 * Table de routage.
 *
 * Les routes publiques de §5 (/services, /tarifs, /contact, /devis…), les
 * routes d'authentification de §9 et les espaces client et administrateur de
 * §14 et §27 seront ajoutés ici au fil des lots. Ce lot pose les fondations :
 * la mise en page racine, la page 404 et le point d'entrée.
 *
 * Aucune route n'est déclarée avant que l'écran correspondant n'existe
 * réellement : une route menant à un composant vide donne l'illusion d'une
 * fonctionnalité livrée (§57).
 *
 * Les écrans à venir seront chargés paresseusement (`lazy`) pour que le bundle
 * de la landing page n'embarque pas le code du tableau de bord (§42).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <FoundationsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
