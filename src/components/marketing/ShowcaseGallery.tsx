import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  ShoppingBag,
  Utensils,
  Home,
  Hammer,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ProjectShowcase {
  id: string;
  category: string;
  badge: string;
  title: string;
  subtitle: string;
  url: string;
  icon: typeof Utensils;
  stats: {
    speed: string;
    seo: string;
    loadTime: string;
    highlight: string;
  };
  features: string[];
  ctaLabel: string;
  // UI Mockup Data
  theme: {
    bg: string;
    accent: string;
    text: string;
  };
  mockup: {
    brandName: string;
    navLinks: string[];
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    badgeText: string;
    secondaryImage: string;
    actionText: string;
    cards: Array<{
      title: string;
      price: string;
      desc: string;
      tag?: string;
    }>;
  };
}

const projects: ProjectShowcase[] = [
  {
    id: 'coiffure',
    category: 'Coiffure & Soins Beauté',
    badge: 'Salon Privé & Institut',
    title: 'L’Atelier Botanique',
    subtitle: 'Maison de coiffure, colorations végétales & rituels de soin',
    url: 'latelier-botanique.fr',
    icon: Scissors,
    stats: {
      speed: '100 / 100',
      seo: '100 %',
      loadTime: '0.2 s',
      highlight: 'Remplissage du planning 7j/7 en automatique',
    },
    features: [
      'Prise de rendez-vous en ligne 24h/24 (Planity / Calendly)',
      'Tarifs & forfaits détaillés (Coupe, Balayage, Soins)',
      'Galerie Instagram & réalisations avant/après',
      'Rappels automatiques par SMS & avis Google 4.9★',
    ],
    ctaLabel: 'Créer un site de salon de coiffure',
    theme: {
      bg: 'bg-[#141214]',
      accent: 'text-[#E8A598]',
      text: 'text-rose-50',
    },
    mockup: {
      brandName: 'L’ATELIER BOTANIQUE',
      navLinks: ['Prestations', 'Prendre RDV', 'Soins Végétaux', 'L’Équipe', 'Tarifs'],
      heroTag: 'SALON PRIVÉ & MAISON DE BEAUTÉ • LYON 6E',
      heroTitle: 'L’art de la coupe sur mesure et du soin végétal profond',
      heroSubtitle: 'Une parenthèse de sérénité dédiée à la beauté de vos cheveux. Diagnostic personnalisé et rituels aux actifs naturels.',
      heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Note 4.9 ★ sur plus de 320 avis clients',
      secondaryImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      actionText: 'Prendre rendez-vous',
      cards: [
        {
          title: 'Forfait Signature : Coupe & Rituel Botanique',
          price: '78 €',
          desc: 'Diagnostic cuir chevelu, massage crânien relaxant, soin profond aux huiles bio et brushing structuré.',
          tag: 'Le plus demandé',
        },
        {
          title: 'Balayage Minéral & Gloss Lumière',
          price: '135 €',
          desc: 'Éclaircissement délicat sans ammoniaque, patine sur mesure et soin scellant brillance.',
        },
      ],
    },
  },
  {
    id: 'gastronomie',
    category: 'Gastronomie & Vins',
    badge: 'Restaurant & Terroir',
    title: 'Maison Sévérac',
    subtitle: 'Haute cuisine française & cave d’exception',
    url: 'maison-severac.fr',
    icon: Utensils,
    stats: {
      speed: '99 / 100',
      seo: '100 %',
      loadTime: '0.3 s',
      highlight: '+68 % de réservations en ligne',
    },
    features: [
      'Système de réservation de table en direct',
      'Menu immersif & carte des vins interactive',
      'Bouton WhatsApp & géolocalisation Maps',
      'Avis Google & Guide Michelin intégrés',
    ],
    ctaLabel: 'Créer un site de restaurant',
    theme: {
      bg: 'bg-[#121110]',
      accent: 'text-[#D4AF37]',
      text: 'text-stone-100',
    },
    mockup: {
      brandName: 'MAISON SÉVÉRAC',
      navLinks: ['La Carte', 'Réservation', 'La Cave', 'Le Chef', 'Contact'],
      heroTag: 'RESTAURANT GASTRONOMIQUE • PARIS 1ER',
      heroTitle: 'L’émotion du terroir, sublimée par l’audace culinaire',
      heroSubtitle: 'Une table intimiste au cœur de la capitale où chaque assiette raconte une histoire d’artisan et de passion.',
      heroImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Table récompensée au Guide 2026',
      secondaryImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      actionText: 'Réserver une table',
      cards: [
        {
          title: 'Menu Dégustation en 6 temps',
          price: '95 €',
          desc: 'Saint-Jacques snackées, émulsion safranée, pigeonneau rôti et déclinaison de chocolat noir fumé.',
          tag: 'Le plus demandé',
        },
        {
          title: 'Accords Mets & Grands Crus',
          price: '55 €',
          desc: 'Sélection rigoureuse de vignerons indépendants et flacons rares du terroir français.',
        },
      ],
    },
  },
  {
    id: 'architecture',
    category: 'Architecture & Design',
    badge: 'Studio & Intérieurs',
    title: 'Studio Vaneau',
    subtitle: 'Architecture d’intérieur & rénovation de prestige',
    url: 'studiovaneau-architectes.fr',
    icon: Home,
    stats: {
      speed: '100 / 100',
      seo: '100 %',
      loadTime: '0.2 s',
      highlight: 'x3 sur les demandes de devis qualifiées',
    },
    features: [
      'Galerie portfolio plein écran haute définition',
      'Module interactif Avant / Après',
      'Simulateur d’estimation de projet',
      'Formulaire de contact sélectif & qualifié',
    ],
    ctaLabel: 'Créer un site d’architecte',
    theme: {
      bg: 'bg-[#18191B]',
      accent: 'text-[#E0C5A8]',
      text: 'text-zinc-100',
    },
    mockup: {
      brandName: 'STUDIO VANEAU',
      navLinks: ['Réalisations', 'Philosophie', 'Expertise', 'Presse', 'Estimer'],
      heroTag: 'AGENCE D’ARCHITECTURE & D’AGENCEMENT PRIVÉ',
      heroTitle: 'Concevoir des espaces rares, équilibrés et durables',
      heroSubtitle: 'Rénovation d’appartements haussmanniens et villas d’exception. Du premier croquis à la livraison clé en main.',
      heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Prix Design & Patrimoine 2025',
      secondaryImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      actionText: 'Demander une étude de projet',
      cards: [
        {
          title: 'Appartement Haussmann • 180 m²',
          price: 'Paris 7e',
          desc: 'Restauration des moulures d’époque, cuisine marbre calacatta et verrière sur mesure.',
          tag: 'Projet récent',
        },
        {
          title: 'Villa contemporaine • 320 m²',
          price: 'Biarritz',
          desc: 'Volumes traversants baignés de lumière, matériaux bruts et vue panoramique océan.',
        },
      ],
    },
  },
  {
    id: 'ecommerce',
    category: 'E-commerce & Créateurs',
    badge: 'Maroquinerie & Luxe',
    title: 'Maison Aurum',
    subtitle: 'Maroquinerie d’artisan & horlogerie d’exception',
    url: 'maisonaurum.com',
    icon: ShoppingBag,
    stats: {
      speed: '98 / 100',
      seo: '100 %',
      loadTime: '0.4 s',
      highlight: 'Tunnel d’achat Stripe en 1 clic',
    },
    features: [
      'Catalogue produit fluide avec filtres instantanés',
      'Paiement sécurisé Stripe & Apple Pay',
      'Gestion des stocks et commandes automatisée',
      'Expérience mobile ultra-rapide sans rechargement',
    ],
    ctaLabel: 'Créer une boutique en ligne',
    theme: {
      bg: 'bg-[#0E1116]',
      accent: 'text-[#C9A96E]',
      text: 'text-slate-100',
    },
    mockup: {
      brandName: 'MAISON AURUM',
      navLinks: ['Maroquinerie', 'Horlogerie', 'Savoir-Faire', 'Sur Mesure', 'Panier (0)'],
      heroTag: 'FABRICATION ARTISANALE FRANÇAISE',
      heroTitle: 'L’alliance du cuir pleine fleur et de la précision horlogère',
      heroSubtitle: 'Chaque pièce est cousue main dans nos ateliers, numérotée et garantie à vie.',
      heroImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Livraison express offerte en France',
      secondaryImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      actionText: 'Découvrir la collection',
      cards: [
        {
          title: 'Le Sac Voyageur 48h • Cuir Ébène',
          price: '480 €',
          desc: 'Cuir pleine fleur tannage végétal, doublure en lin brut, bouclerie en laiton massif.',
          tag: 'Édition limitée',
        },
        {
          title: 'Chronographe Automatique • 39 mm',
          price: '1 250 €',
          desc: 'Mouvement mécanique haute précision, verre saphir inrayable, bracelet cuir sur mesure.',
        },
      ],
    },
  },
  {
    id: 'artisanat',
    category: 'Artisans & Rénovation',
    badge: 'Ébénisterie & Bois',
    title: 'Ateliers d’Anjou',
    subtitle: 'Ébénisterie d’art & agencement sur mesure',
    url: 'ateliersdanjou-ebeniste.fr',
    icon: Hammer,
    stats: {
      speed: '100 / 100',
      seo: '100 %',
      loadTime: '0.2 s',
      highlight: 'Numéro 1 sur les recherches locales',
    },
    features: [
      'Présentation des réalisations par type de meuble',
      'Formulaire de devis avec envoi de plans & photos',
      'Référencement local Google Maps renforcé',
      'Bandeau d’avis clients vérifiés avec photos',
    ],
    ctaLabel: 'Créer un site d’artisan',
    theme: {
      bg: 'bg-[#151412]',
      accent: 'text-[#D89B58]',
      text: 'text-amber-50',
    },
    mockup: {
      brandName: 'ATELIERS D’ANJOU',
      navLinks: ['Mobilier', 'Agencements', 'Bois & Essences', 'Devis en ligne', 'Atelier'],
      heroTag: 'MAÎTRE ARTISAN ÉBÉNISTE DEPUIS 1994',
      heroTitle: 'Du bois brut à la pièce unique conçue pour votre intérieur',
      heroSubtitle: 'Création de tables de repas, bibliothèques monumentales et dressings intégrés en chêne, noyer et essences rares.',
      heroImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Bois français éco-certifié PEFC',
      secondaryImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      actionText: 'Demander un devis gratuit',
      cards: [
        {
          title: 'Table de repas Live Edge en Noyer',
          price: 'Sur mesure',
          desc: 'Plateau massif 60 mm d’épaisseur, piètement acier thermo-laqué noir mat.',
          tag: 'Best-seller',
        },
        {
          title: 'Bibliothèque murale avec claustra',
          price: 'Sur devis',
          desc: 'Agencement toute hauteur avec rétro-éclairage LED intégré et niches de rangement.',
        },
      ],
    },
  },
];

export function ShowcaseGallery() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('coiffure');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const currentProject: ProjectShowcase =
    projects.find((p) => p.id === selectedProjectId) ?? (projects[0] as ProjectShowcase);

  return (
    <div className="w-full">
      {/* ── 1. Sélecteur d'onglets de projets (Secteurs d'activité) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {projects.map((project) => {
          const Icon = project.icon;
          const isSelected = project.id === currentProject.id;
          return (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'bg-ink text-white shadow-md scale-[1.02]'
                  : 'bg-surface text-muted hover:text-ink hover:bg-surface-muted border border-border',
              )}
            >
              <Icon className={cn('size-4', isSelected ? 'text-accent' : 'text-muted')} />
              <span>{project.category}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. Commutateur d'affichage (Desktop / Mobile) & Info URL ── */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            {currentProject.badge}
          </span>
          <span className="font-serif text-lg font-normal text-ink">
            {currentProject.title}
          </span>
          <span className="hidden md:inline text-xs text-muted">
            • {currentProject.subtitle}
          </span>
        </div>

        {/* Boutons de bascule d'écran */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1 shadow-xs">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
              deviceMode === 'desktop'
                ? 'bg-ink text-white shadow-xs'
                : 'text-muted hover:text-ink',
            )}
            title="Afficher la vue ordinateur"
          >
            <Monitor className="size-3.5" />
            <span>Grand écran</span>
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
              deviceMode === 'mobile'
                ? 'bg-ink text-white shadow-xs'
                : 'text-muted hover:text-ink',
            )}
            title="Afficher la vue smartphone"
          >
            <Smartphone className="size-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* ── 3. Zone d'affichage de la maquette (Device Viewport) ── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
        {/* Cadre de visualisation interactif */}
        <div className="lg:col-span-8 flex justify-center">
          {deviceMode === 'desktop' ? (
            /* 🖥️ Fenêtre de navigateur Safari stylisée */
            <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl transition-all duration-300">
              {/* Barre de navigateur */}
              <div className="flex items-center justify-between border-b border-border/60 bg-surface-muted/90 px-4 py-3">
                {/* Feux tricolores macOS */}
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-red-400/80" />
                  <div className="size-3 rounded-full bg-amber-400/80" />
                  <div className="size-3 rounded-full bg-emerald-400/80" />
                </div>

                {/* Barre d'adresse URL */}
                <div className="flex max-w-xs sm:max-w-sm flex-1 items-center justify-center gap-2 rounded-full border border-border/80 bg-surface px-4 py-1 text-[11px] font-mono text-muted shadow-2xs mx-2">
                  <Lock className="size-3 text-emerald-600" />
                  <span className="truncate">https://www.{currentProject.url}</span>
                </div>

                <div className="flex items-center gap-1 text-muted">
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
              </div>

              {/* Rendu du site en direct (Écran large) */}
              <div className={cn('p-6 sm:p-8 select-none', currentProject.theme.bg, currentProject.theme.text)}>
                {/* Header du site maquette */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-serif text-lg tracking-wider font-semibold">
                    {currentProject.mockup.brandName}
                  </span>
                  <div className="hidden sm:flex items-center gap-6 text-xs text-white/70">
                    {currentProject.mockup.navLinks.slice(0, 4).map((link) => (
                      <span key={link} className="hover:text-white transition-colors cursor-pointer">
                        {link}
                      </span>
                    ))}
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold border border-white/20 bg-white/5')}>
                    {currentProject.mockup.actionText}
                  </span>
                </div>

                {/* Hero du site maquette */}
                <div className="mt-8 grid gap-6 sm:grid-cols-12 items-center">
                  <div className="sm:col-span-7">
                    <span className={cn('text-[10px] font-mono tracking-widest uppercase font-semibold', currentProject.theme.accent)}>
                      {currentProject.mockup.heroTag}
                    </span>
                    <h4 className="mt-2 font-serif text-2xl sm:text-3xl font-normal leading-tight">
                      {currentProject.mockup.heroTitle}
                    </h4>
                    <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed">
                      {currentProject.mockup.heroSubtitle}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="rounded-full bg-white text-ink px-4 py-2 text-xs font-semibold shadow-xs">
                        {currentProject.mockup.actionText}
                      </span>
                      <span className="text-xs text-white/60 font-medium">
                        {currentProject.mockup.badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-5 relative overflow-hidden rounded-xl shadow-lg group">
                    <img
                      src={currentProject.mockup.heroImage}
                      alt={currentProject.mockup.heroTitle}
                      className="h-48 sm:h-56 w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                      <span className="bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                        ✦ Rendu 4K
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">0.3s</span>
                    </div>
                  </div>
                </div>

                {/* Cartes de contenu / Menu / Produits */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {currentProject.mockup.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{card.title}</span>
                        <span className={cn('text-xs font-serif font-bold', currentProject.theme.accent)}>
                          {card.price}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-white/70 leading-relaxed">
                        {card.desc}
                      </p>
                      {card.tag && (
                        <span className="mt-3 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90">
                          {card.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 📱 Cadre de smartphone iPhone stylisé */
            <div className="w-full max-w-[340px] overflow-hidden rounded-[36px] border-[6px] border-[#2c2d30] bg-[#1a1b1e] shadow-2xl p-2 transition-all duration-300">
              {/* Écran du téléphone */}
              <div className={cn('rounded-[28px] overflow-hidden select-none p-4 pb-6 min-h-[520px]', currentProject.theme.bg, currentProject.theme.text)}>
                {/* Dynamic Island / Encoche */}
                <div className="mx-auto mb-4 h-4 w-24 rounded-full bg-black flex items-center justify-center">
                  <div className="size-2 rounded-full bg-black/80" />
                </div>

                {/* En-tête mobile */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-serif text-sm font-semibold tracking-wider">
                    {currentProject.mockup.brandName}
                  </span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-white/20 bg-white/10')}>
                    Menu ☰
                  </span>
                </div>

                {/* Hero mobile */}
                <div className="mt-4">
                  <span className={cn('text-[9px] font-mono tracking-wider font-semibold', currentProject.theme.accent)}>
                    {currentProject.mockup.heroTag}
                  </span>
                  <h5 className="mt-1.5 font-serif text-lg font-normal leading-snug">
                    {currentProject.mockup.heroTitle}
                  </h5>
                  <div className="mt-3 relative rounded-lg overflow-hidden shadow-md">
                    <img
                      src={currentProject.mockup.heroImage}
                      alt={currentProject.mockup.heroTitle}
                      className="h-32 w-full object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-white">
                      100 % Tactile & Fluide
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-white/70 leading-snug">
                    {currentProject.mockup.heroSubtitle}
                  </p>
                  <button className="mt-4 w-full rounded-full bg-white text-ink py-2 text-xs font-bold shadow-sm">
                    {currentProject.mockup.actionText}
                  </button>
                </div>

                {/* Carte produit/service mobile */}
                {currentProject.mockup.cards[0] && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">{currentProject.mockup.cards[0].title}</span>
                      <span className={cn('text-xs font-serif font-bold', currentProject.theme.accent)}>
                        {currentProject.mockup.cards[0].price}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/70 leading-tight">
                      {currentProject.mockup.cards[0].desc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Fiche d'impact & performance (Colonne droite) ── */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="size-4" />
              <span>Performances & Atouts</span>
            </div>

            <h3 className="mt-3 font-serif text-2xl font-normal text-ink">
              {currentProject.title}
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              {currentProject.subtitle}
            </p>

            {/* Jauges de performance réelles */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-surface-muted/60 p-3.5">
              <div className="rounded-lg bg-surface p-2.5 border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-base">
                  <Zap className="size-4" />
                  <span>{currentProject.stats.speed}</span>
                </div>
                <span className="text-[10px] text-muted font-medium">Score Vitesse Google</span>
              </div>

              <div className="rounded-lg bg-surface p-2.5 border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-base">
                  <CheckCircle2 className="size-4" />
                  <span>{currentProject.stats.loadTime}</span>
                </div>
                <span className="text-[10px] text-muted font-medium">Temps de chargement</span>
              </div>
            </div>

            {/* Statistique clé */}
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-center">
              <span className="text-xs font-semibold text-ink">
                🎯 {currentProject.stats.highlight}
              </span>
            </div>

            {/* Liste des fonctionnalités incluses */}
            <div className="mt-6">
              <span className="text-xs font-semibold text-ink">Fonctionnalités intégrées :</span>
              <ul className="mt-3 space-y-2 text-xs text-muted">
                {currentProject.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bouton d'action direct */}
          <div className="mt-8 pt-4 border-t border-border">
            <Button asChild fullWidth variant="primary" size="md">
              <Link to={`/devis?secteur=${currentProject.id}`}>
                {currentProject.ctaLabel}
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
