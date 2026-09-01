/**
 * Données des concepts de maquettes interactives pour le Showcase HBG Labs.
 */

export type ShowcaseSector = 'BEAUTY' | 'BTP' | 'RESTAURANT' | 'REAL_ESTATE';

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
    mockupImage: '/images/showcase/soie-et-terre.jpg',
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
    mockupImage: '/images/showcase/kayo-construction.jpg',
  },
];
