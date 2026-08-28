import { Outlet } from 'react-router-dom';

/**
 * Mise en page racine, commune à toutes les routes.
 *
 * L'en-tête et le pied de page publics (§6) arriveront avec la landing page ;
 * l'espace client aura sa propre mise en page imbriquée, avec barre latérale
 * transformée en tiroir sur mobile (§40).
 *
 * Le lien d'évitement est déjà là : il doit être le premier élément
 * focalisable du document, et le placer après coup demande de reprendre
 * l'arborescence entière (§43).
 */
export function RootLayout() {
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>

      <div className="flex min-h-screen flex-col">
        <main id="contenu-principal" className="flex-1">
          <Outlet />
        </main>
      </div>
    </>
  );
}
