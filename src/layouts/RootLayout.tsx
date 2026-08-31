import { Outlet } from 'react-router-dom';
import { CookieBanner } from '@/components/marketing/CookieBanner';
import { CookiePreferencesModal } from '@/components/marketing/CookiePreferencesModal';

/**
 * Enveloppe racine, commune à toutes les routes.
 *
 * Porte le lien d'évitement d'accessibilité ainsi que le gestionnaire de consentement
 * des cookies et traceurs.
 */
export function RootLayout() {
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>

      <Outlet />

      {/* Bandeau de consentement CNIL et modale de préférences */}
      <CookieBanner />
      <CookiePreferencesModal />
    </>
  );
}
