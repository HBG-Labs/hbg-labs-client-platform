/**
 * Structure de navigation du site public.
 *
 * Déclarée une fois, consommée par la barre de navigation, le menu mobile, le
 * pied de page et le plan du site.
 */

export interface NavLink {
  readonly label: string;
  readonly to: string;
  /** Sous-entrées affichées dans un menu déroulant. */
  readonly children?: readonly NavLink[];
}

/** Navigation principale. */
export const mainNav: readonly NavLink[] = [
  {
    label: 'Services',
    to: '/services',
    children: [
      { label: 'Création de site web', to: '/creation-site-web' },
      { label: 'Hébergement', to: '/hebergement' },
      { label: 'Maintenance', to: '/maintenance' },
    ],
  },
  { label: 'Réalisations', to: '/showcase' },
  { label: 'Tarifs', to: '/tarifs' },
  { label: 'Contact', to: '/contact' },
];

/** Colonnes du pied de page. */
export const footerNav: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: 'Services & Réalisations',
    links: [
      { label: 'Showcase Réalisations', to: '/showcase' },
      { label: 'Création de site web', to: '/creation-site-web' },
      { label: 'Hébergement', to: '/hebergement' },
      { label: 'Maintenance', to: '/maintenance' },
      { label: 'Tous nos services', to: '/services' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'Nos réalisations', to: '/showcase' },
      { label: 'Tarifs', to: '/tarifs' },
      { label: 'Demander un devis', to: '/devis' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Informations légales',
    links: [
      { label: 'Mentions légales', to: '/mentions-legales' },
      { label: 'Politique de confidentialité', to: '/politique-confidentialite' },
      { label: 'Conditions générales d’utilisation', to: '/cgu' },
      { label: 'Conditions générales de vente', to: '/cgv' },
      { label: 'Politique des cookies', to: '/cookies' },
    ],
  },
];
