import { Outlet } from 'react-router-dom';

/**
 * Enveloppe racine, commune à toutes les routes.
 *
 * Ne porte que le lien d'évitement, qui doit être le premier élément
 * focalisable du document, avant toute barre de navigation. Le placer plus bas
 * obligerait à traverser le menu au clavier pour atteindre le contenu.
 *
 * Les repères de page (`<main>`, en-tête, pied de page) appartiennent aux mises
 * en page filles : le site public et le futur espace client n'ont pas la même
 * structure.
 */
export function RootLayout() {
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>

      <Outlet />
    </>
  );
}
