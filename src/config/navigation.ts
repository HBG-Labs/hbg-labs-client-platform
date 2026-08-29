/**
 * Structure de navigation du site public (§5).
 *
 * Déclarée une fois, consommée par la barre de navigation, le menu mobile, le
 * pied de page et le plan du site. Une route ajoutée ici sans page
 * correspondante produirait un lien mort : le routeur et ce fichier évoluent
 * ensemble.
 *
 * Les routes d'authentification (/connexion, /inscription) n'y figurent pas
 * encore : les écrans arrivent au lot 3. Un lien vers une page inexistante
 * donnerait l'impression d'une fonctionnalité livrée.
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
  { label: 'Tarifs', to: '/tarifs' },
  { label: 'Contact', to: '/contact' },
];

/** Colonnes du pied de page. */
export const footerNav: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: 'Services',
    links: [
      { label: 'Création de site web', to: '/creation-site-web' },
      { label: 'Hébergement', to: '/hebergement' },
      { label: 'Maintenance', to: '/maintenance' },
      { label: 'Tous nos services', to: '/services' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
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
      { label: 'Conditions générales de vente', to: '/cgv' },
    ],
  },
];
