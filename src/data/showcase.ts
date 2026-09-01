/**
 * Données des 4 concepts de maquettes interactives pour le Showcase HBG Labs.
 */

export type ShowcaseSector = 'ALL' | 'BEAUTY' | 'BTP' | 'RESTAURANT' | 'REAL_ESTATE';

export interface ShowcaseProject {
  id: string;
  slug: string;
  name: string;
  sectorLabel: string;
  category: ShowcaseSector;
  tagline: string;
  description: string;
  shortPitch: string;
  accentColor: string;
  palette: string[];
  metrics: { label: string; value: string }[];
  features: string[];
  mockupImage: string;
}

export const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  {
    id: 'soie-et-terre',
    slug: 'soie-et-terre',
    name: 'SOIE & TERRE',
    sectorLabel: 'Soin & Beauté',
    category: 'BEAUTY',
    tagline: 'La beauté à l’état naturel.',
    description: 'Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat.',
    shortPitch: 'Une expérience digitale élégante et sensorielle pour une marque de beauté inspirée de la nature.',
    accentColor: '#8C684F',
    palette: ['#F9F6F0', '#EAE3D9', '#8C684F', '#4A5B4E', '#C27D56'],
    metrics: [
      { label: 'Score Performance', value: '100/100' },
      { label: 'Conversion RDV', value: '+42 %' },
      { label: 'Temps de chargement', value: '0.3s' },
    ],
    features: [
      'Réservation de rituels en ligne',
      'Catalogue de cosmétiques botaniques',
      'Navigation sensorielle & mobile-first',
      'Design épuré Studio Éditorial',
    ],
    mockupImage: '/images/showcase/luxury-studio.jpg',
  },
  {
    id: 'kayo-construction',
    slug: 'kayo-construction',
    name: 'KAYO CONSTRUCTION',
    sectorLabel: 'Artisan & BTP',
    category: 'BTP',
    tagline: 'Construire avec force. Bâtir avec précision.',
    description: 'Des équipes expérimentées et des moyens adaptés pour donner vie à vos projets.',
    shortPitch: 'Une expérience digitale puissante mettant en avant les réalisations, les équipes et les moyens techniques.',
    accentColor: '#E65100',
    palette: ['#121316', '#22252A', '#DCDFE4', '#E65100', '#F4F5F7'],
    metrics: [
      { label: 'Engins en parc propre', value: '45' },
      { label: 'Chantiers livrés', value: '340+' },
      { label: 'Demandes de devis', value: 'x3.2' },
    ],
    features: [
      'Vitrine opérationnelle du parc matériel',
      'Galerie de chantiers avec filtres métiers',
      'Formulaire de devis express géolocalisé',
      'Architecture technique parasismique & VRD',
    ],
    mockupImage: '/images/showcase/artisan-craft.jpg',
  },
  {
    id: 'racines-et-braise',
    slug: 'racines-et-braise',
    name: 'RACINES & BRAISE',
    sectorLabel: 'Restauration',
    category: 'RESTAURANT',
    tagline: 'Les racines ont du caractère.',
    description: 'Une cuisine caribéenne façonnée par le feu, le territoire et la transmission.',
    shortPitch: 'Une expérience immersive construite autour de la gastronomie, du feu et des racines caribéennes.',
    accentColor: '#D97736',
    palette: ['#0E0D0C', '#1A1816', '#D97736', '#8A4A28', '#F5EFEB'],
    metrics: [
      { label: 'Réservations en direct', value: '78 %' },
      { label: 'Zéro commission plateforme', value: '100 %' },
      { label: 'Expérience immersive', value: '4K UI' },
    ],
    features: [
      'Système de réservation de table en direct',
      'Carte interactive & accords mets-rhums',
      'Galerie gastronomique plein écran',
      'Mise en valeur du terroir et de la braise',
    ],
    mockupImage: '/images/showcase/gourmet-dining.jpg',
  },
  {
    id: 'horizons-prestige',
    slug: 'horizons-prestige',
    name: 'HORIZONS PRESTIGE',
    sectorLabel: 'Immobilier',
    category: 'REAL_ESTATE',
    tagline: 'Votre horizon commence ici.',
    description: 'Découvrez des propriétés d’exception dans les plus beaux environnements des Antilles.',
    shortPitch: 'Une expérience premium conçue pour valoriser des propriétés d’exception.',
    accentColor: '#0E7490',
    palette: ['#0B131F', '#1E293B', '#0E7490', '#CBD5E1', '#FFFFFF'],
    metrics: [
      { label: 'Volume sous mandat', value: '120M €' },
      { label: 'Mandats exclusifs', value: '98 %' },
      { label: 'Délai moyen de vente', value: '45j' },
    ],
    features: [
      'Moteur de recherche multicritères',
      'Fiches de propriétés avec visite privée',
      'Gestion des favoris en temps réel',
      'Téléchargement de dossiers confidentiels',
    ],
    mockupImage: '/images/showcase/ecommerce-store.jpg',
  },
];
