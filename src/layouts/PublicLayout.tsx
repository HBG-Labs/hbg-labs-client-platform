import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/marketing/PublicNavbar';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { LoadingState } from '@/components/ui/States';

/**
 * Mise en page du site public : navigation, contenu, pied de page.
 *
 * Le repère `<main>` et son ancre `#contenu-principal` sont ici, cible du lien
 * d'évitement porté par `RootLayout`.
 */
export function PublicLayout() {
  const { pathname } = useLocation();

  // Remonter en haut à chaque navigation. Une application monopage conserve la
  // position de défilement, ce qui fait arriver au milieu de la page suivante.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />

      <main id="contenu-principal" className="flex-1">
        {/* Les pages sont chargées à la demande : le visiteur de l'accueil ne
            télécharge pas le code des pages légales. */}
        <Suspense fallback={<LoadingState fullPage label="Chargement de la page…" />}>
          <Outlet />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
