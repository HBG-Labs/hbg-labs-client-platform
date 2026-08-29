/**
 * Contenu éditorial du site public (§6).
 *
 * Séparé des composants pour deux raisons : relire ou corriger un texte ne doit
 * pas demander d'ouvrir du JSX, et la même donnée alimente parfois plusieurs
 * pages (un service apparaît sur l'accueil et sur sa page dédiée).
 *
 * Ce fichier ne contient aucun chiffre invérifiable, aucun avis client, aucune
 * statistique inventée. Les tarifs viennent de la base, jamais d'ici.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Code2,
  Server,
  Wrench,
  Search,
  Smartphone,
  ShieldCheck,
  Gauge,
  MessageSquare,
  RefreshCcw,
  Globe,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Problème et solution (§6, sections 2 et 3)
// -----------------------------------------------------------------------------

export interface PainPoint {
  readonly title: string;
  readonly description: string;
}

export const painPoints: readonly PainPoint[] = [
  {
    title: 'Un site livré, puis abandonné',
    description:
      'Le prestataire disparaît une fois la facture réglée. Les mises à jour s’accumulent, le certificat expire, et personne ne répond quand le site tombe.',
  },
  {
    title: 'Une facturation éclatée',
    description:
      'Hébergement chez l’un, domaine chez l’autre, maintenance nulle part. Vous payez trois prestataires et arbitrez vous-même quand quelque chose casse.',
  },
  {
    title: 'Des modifications qui traînent',
    description:
      'Changer un horaire ou remplacer une photo devient un projet. Vous renoncez, et le site affiche des informations périmées.',
  },
];

export interface Pillar {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly to: string;
}

/** Les trois métiers de HBG Labs (§4). */
export const pillars: readonly Pillar[] = [
  {
    icon: Code2,
    title: 'Création de site web',
    description:
      'Un site conçu pour votre activité, rapide sur mobile et lisible par les moteurs de recherche. Vous validez les maquettes avant le développement.',
    to: '/creation-site-web',
  },
  {
    icon: Server,
    title: 'Hébergement infogéré',
    description:
      'Hébergement sur Vercel, certificat SSL renouvelé automatiquement, configuration DNS prise en charge. Vous n’avez aucun serveur à administrer.',
    to: '/hebergement',
  },
  {
    icon: Wrench,
    title: 'Maintenance continue',
    description:
      'Mises à jour techniques, sauvegardes et corrections. Vous demandez une modification depuis votre espace, nous l’appliquons.',
    to: '/maintenance',
  },
];

// -----------------------------------------------------------------------------
// Fonctionnement (§6, section 5)
// -----------------------------------------------------------------------------

export interface Step {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

export const howItWorks: readonly Step[] = [
  {
    number: '01',
    title: 'Vous décrivez votre projet',
    description:
      'Par le formulaire de devis ou par téléphone. Nous cadrons le périmètre, le calendrier et le budget avant tout engagement.',
  },
  {
    number: '02',
    title: 'Nous concevons et développons',
    description:
      'Maquettes soumises à votre validation, puis développement. Vous suivez l’avancement et intervenez à chaque étape clé.',
  },
  {
    number: '03',
    title: 'Nous mettons en ligne',
    description:
      'Domaine raccordé, certificat installé, référencement de base en place. Le site part en production une fois votre recette validée.',
  },
  {
    number: '04',
    title: 'Nous restons responsables',
    description:
      'Hébergement, supervision et modifications de contenu selon votre offre. Une seule facture mensuelle, un seul interlocuteur.',
  },
];

/** Processus de création détaillé (§6, section 8). */
export const creationProcess: readonly Step[] = [
  {
    number: '01',
    title: 'Cadrage',
    description:
      'Nous identifions vos objectifs, votre clientèle et les pages nécessaires. Le devis découle de ce périmètre, il n’est pas forfaitaire à l’aveugle.',
  },
  {
    number: '02',
    title: 'Maquettes',
    description:
      'Vous recevez les maquettes des pages principales, sur mobile et sur ordinateur. Rien n’est développé avant votre accord.',
  },
  {
    number: '03',
    title: 'Développement',
    description:
      'Intégration des maquettes, mise en place des contenus et des formulaires, optimisation des images et du chargement.',
  },
  {
    number: '04',
    title: 'Recette',
    description:
      'Vous testez le site sur une adresse de préproduction. Nous corrigeons jusqu’à validation complète.',
  },
  {
    number: '05',
    title: 'Mise en production',
    description:
      'Raccordement du domaine, certificat SSL, sitemap et robots.txt. Le site devient accessible à vos visiteurs.',
  },
  {
    number: '06',
    title: 'Suivi',
    description:
      'L’abonnement prend le relais : hébergement, supervision et demandes de modification depuis votre espace client.',
  },
];

// -----------------------------------------------------------------------------
// Avantages (§6, section 7)
// -----------------------------------------------------------------------------

export interface Benefit {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

export const benefits: readonly Benefit[] = [
  {
    icon: MessageSquare,
    title: 'Un interlocuteur unique',
    description:
      'Création, hébergement, domaine et maintenance au même endroit. Plus d’arbitrage entre prestataires quand un problème survient.',
  },
  {
    icon: Smartphone,
    title: 'Pensé pour le mobile',
    description:
      'La majorité de vos visiteurs consultent votre site sur téléphone. L’affichage mobile est traité en premier, pas adapté après coup.',
  },
  {
    icon: Gauge,
    title: 'Rapide par construction',
    description:
      'Images optimisées, chargement différé, diffusion par réseau de distribution. Un site lent fait fuir avant même d’être lu.',
  },
  {
    icon: Search,
    title: 'Référencement de base inclus',
    description:
      'Titres, descriptions, sitemap et données structurées configurés dès la mise en ligne. Votre site est lisible par les moteurs de recherche.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité tenue à jour',
    description:
      'Certificat SSL renouvelé automatiquement, dépendances mises à jour, sauvegardes régulières.',
  },
  {
    icon: RefreshCcw,
    title: 'Modifications prises en charge',
    description:
      'Vous demandez un changement de texte ou de photo depuis votre espace. Nous l’appliquons, selon votre offre.',
  },
];

// -----------------------------------------------------------------------------
// Hébergement et maintenance (§6, sections 9 et 10)
// -----------------------------------------------------------------------------

export interface DetailItem {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

export const hostingDetails: readonly DetailItem[] = [
  {
    icon: Server,
    title: 'Infrastructure Vercel',
    description:
      'Vos pages sont servies depuis un réseau de distribution mondial. Aucune machine à administrer, aucune mise à jour système à votre charge.',
  },
  {
    icon: ShieldCheck,
    title: 'Certificat SSL automatique',
    description:
      'Le certificat est émis et renouvelé sans intervention. Vos visiteurs accèdent au site en HTTPS, sans avertissement de navigateur.',
  },
  {
    icon: Globe,
    title: 'Domaine et DNS pris en charge',
    description:
      'Nous configurons les enregistrements DNS et raccordons votre domaine. Vous en restez propriétaire.',
  },
  {
    icon: Gauge,
    title: 'Supervision',
    description:
      'L’état de votre site est suivi et affiché dans votre espace client. Aucun voyant ne passe au vert sans vérification réelle.',
  },
];

export const maintenanceDetails: readonly DetailItem[] = [
  {
    icon: RefreshCcw,
    title: 'Mises à jour techniques',
    description:
      'Dépendances et correctifs de sécurité appliqués régulièrement, sans interruption visible pour vos visiteurs.',
  },
  {
    icon: MessageSquare,
    title: 'Demandes de modification',
    description:
      'Changement de texte, remplacement d’une photo, ajout d’une section : vous décrivez la demande depuis votre espace, nous la traitons.',
  },
  {
    icon: ShieldCheck,
    title: 'Sauvegardes',
    description:
      'Le contenu et la configuration de votre site sont sauvegardés. Une erreur de manipulation reste réversible.',
  },
  {
    icon: Gauge,
    title: 'Suivi des performances',
    description:
      'Temps de chargement et disponibilité surveillés. Une dégradation est traitée avant qu’elle ne devienne visible.',
  },
];

// -----------------------------------------------------------------------------
// Questions fréquentes (§6, section 12)
// -----------------------------------------------------------------------------

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export const faq: readonly FaqItem[] = [
  {
    question: 'Combien de temps faut-il pour créer mon site ?',
    answer:
      'Comptez deux à quatre semaines pour un site vitrine, selon la rapidité des allers-retours sur les maquettes et la disponibilité de vos contenus. Un projet sur mesure demande davantage, le calendrier est établi au devis.',
  },
  {
    question: 'Suis-je propriétaire de mon nom de domaine ?',
    answer:
      'Oui. Le domaine est enregistré à votre nom, nous en assurons la configuration technique. Si vous quittez HBG Labs, vous le conservez.',
  },
  {
    question: 'Que se passe-t-il si j’arrête l’abonnement ?',
    answer:
      'L’hébergement prend fin à l’échéance de la période payée et le site cesse d’être accessible. Le code source et vos contenus vous sont remis sur demande. Le domaine reste le vôtre.',
  },
  {
    question: 'Puis-je modifier moi-même le contenu ?',
    answer:
      'Les demandes de modification passent par votre espace client, nous les appliquons. Cette formule évite les erreurs de manipulation et les régressions d’affichage. Une interface d’édition autonome peut être ajoutée sur un projet sur mesure.',
  },
  {
    question: 'Le prix de création est-il ferme ?',
    answer:
      'Les tarifs affichés sont des points de départ. Le montant définitif dépend du nombre de pages et des fonctionnalités, il est établi au devis avant tout engagement.',
  },
  {
    question: 'Travaillez-vous uniquement en Martinique ?',
    answer:
      'Nous sommes implantés en Martinique et intervenons à distance partout en France. Les échanges se font par visioconférence, téléphone et espace client.',
  },
  {
    question: 'Reprenez-vous un site existant ?',
    answer:
      'Oui, après audit technique. Selon l’état du site, nous proposons une reprise en maintenance ou une refonte. L’audit détermine laquelle des deux est réaliste.',
  },
];
