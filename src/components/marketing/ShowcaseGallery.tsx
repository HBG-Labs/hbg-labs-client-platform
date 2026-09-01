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
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PillarCategory {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  podiumImage: string;
  accentGlow: string;
  glowColor: string;
  project: {
    brandName: string;
    websiteUrl: string;
    categoryLabel: string;
    heroTag: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    badgeText: string;
    actionText: string;
    themeBg: string;
    themeAccent: string;
    themeText: string;
    stats: {
      speed: string;
      loadTime: string;
      highlight: string;
    };
    features: string[];
    cards: Array<{
      title: string;
      price: string;
      desc: string;
      tag?: string;
    }>;
  };
}

const categories: PillarCategory[] = [
  {
    id: 'vitrines',
    badge: 'Digital Goods',
    title: 'Sites Vitrines',
    subtitle: 'Notoriété & Image de marque',
    tagline: 'L’élégance pour marquer les esprits',
    description:
      'Pour indépendants, cabinets d’architecture et entreprises souhaitant une présence en ligne soignée et percutante.',
    podiumImage: '/images/podiums/podium-digital.jpg',
    accentGlow: 'from-amber-400/20 via-rose-500/20 to-purple-600/20',
    glowColor: 'rgba(244,63,94,0.35)',
    project: {
      brandName: 'STUDIO VANEAU',
      websiteUrl: 'studiovaneau-architectes.fr',
      categoryLabel: 'Architecture & Intérieurs Parisiens',
      heroTag: 'STUDIO D’ARCHITECTURE D’INTÉRIEUR & DESIGN PRIVÉ',
      heroTitle: 'Concevoir des espaces rares, équilibrés et durables',
      heroSubtitle:
        'Rénovation d’appartements haussmanniens et villas d’exception. Du premier croquis à la livraison clé en main.',
      heroImage:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Prix Design & Patrimoine 2025',
      actionText: 'Demander une étude',
      themeBg: 'bg-[#18191B]',
      themeAccent: 'text-[#E0C5A8]',
      themeText: 'text-zinc-100',
      stats: {
        speed: '100 / 100',
        loadTime: '0.2 s',
        highlight: 'x3 sur les demandes de devis qualifiées',
      },
      features: [
        'Galerie portfolio plein écran haute définition',
        'Module interactif Avant / Après',
        'Simulateur d’estimation de projet',
        'Formulaire de contact sélectif & qualifié',
      ],
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
    id: 'services',
    badge: 'Services',
    title: 'Services & Devis',
    subtitle: 'Réservation & Conversion directe',
    tagline: 'Automatisez la prise de rendez-vous',
    description:
      'Pour restaurants, artisans et professions de service qui souhaitent convertir leurs visiteurs en clients sans friction.',
    podiumImage: '/images/podiums/podium-services.jpg',
    accentGlow: 'from-fuchsia-500/25 via-purple-600/25 to-indigo-600/25',
    glowColor: 'rgba(217,70,239,0.45)',
    project: {
      brandName: 'MAISON SÉVÉRAC',
      websiteUrl: 'maison-severac.fr',
      categoryLabel: 'Haute Cuisine & Table Gastronomique',
      heroTag: 'RESTAURANT GASTRONOMIQUE • PARIS 1ER',
      heroTitle: 'L’émotion du terroir, sublimée par l’audace culinaire',
      heroSubtitle:
        'Une table intimiste au cœur de la capitale où chaque assiette raconte une histoire d’artisan et de passion.',
      heroImage:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Table récompensée au Guide 2026',
      actionText: 'Réserver une table',
      themeBg: 'bg-[#121110]',
      themeAccent: 'text-[#D4AF37]',
      themeText: 'text-stone-100',
      stats: {
        speed: '99 / 100',
        loadTime: '0.3 s',
        highlight: '+68 % de réservations en direct',
      },
      features: [
        'Module de réservation de table en direct',
        'Menu immersif & carte des vins interactive',
        'Bouton WhatsApp & géolocalisation Maps',
        'Avis Google & Guide Michelin intégrés',
      ],
      cards: [
        {
          title: 'Menu Dégustation en 6 temps',
          price: '95 €',
          desc: 'Saint-Jacques snackées, émulsion safranée, pigeonneau rôti et chocolat noir fumé.',
          tag: 'Le plus demandé',
        },
        {
          title: 'Accords Mets & Grands Crus',
          price: '55 €',
          desc: 'Sélection rigoureuse de vignerons indépendants et flacons rares du terroir.',
        },
      ],
    },
  },
  {
    id: 'ecommerce',
    badge: 'Physical Goods',
    title: 'E-commerce',
    subtitle: 'Boutiques & Vente en ligne',
    tagline: 'Tunnel de vente fluide & Stripe',
    description:
      'Pour marques, créateurs et boutiques souhaitant vendre leurs produits physiques avec une expérience d’achat instantanée.',
    podiumImage: '/images/podiums/podium-commerce.jpg',
    accentGlow: 'from-purple-500/20 via-indigo-500/20 to-blue-500/20',
    glowColor: 'rgba(129,140,248,0.4)',
    project: {
      brandName: 'MAISON AURUM',
      websiteUrl: 'maisonaurum.com',
      categoryLabel: 'Maroquinerie d’Artisan & Horlogerie',
      heroTag: 'FABRICATION ARTISANALE FRANÇAISE',
      heroTitle: 'L’alliance du cuir pleine fleur et de la précision horlogère',
      heroSubtitle:
        'Chaque pièce est cousue main dans nos ateliers, numérotée et garantie à vie.',
      heroImage:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      badgeText: 'Livraison express offerte en France',
      actionText: 'Découvrir la collection',
      themeBg: 'bg-[#0E1116]',
      themeAccent: 'text-[#C9A96E]',
      themeText: 'text-slate-100',
      stats: {
        speed: '98 / 100',
        loadTime: '0.4 s',
        highlight: 'Paiement express Stripe en 1 clic',
      },
      features: [
        'Catalogue produit ultra-rapide avec filtres instantanés',
        'Paiement sécurisé Stripe & Apple Pay',
        'Gestion des stocks et commandes automatisée',
        'Expérience mobile optimisée sans rechargement',
      ],
      cards: [
        {
          title: 'Le Sac Voyageur 48h • Cuir Ébène',
          price: '480 €',
          desc: 'Cuir pleine fleur tannage végétal, doublure lin brut, bouclerie laiton massif.',
          tag: 'Édition limitée',
        },
        {
          title: 'Chronographe Automatique • 39 mm',
          price: '1 250 €',
          desc: 'Mouvement mécanique haute précision, verre saphir inrayable, bracelet cuir.',
        },
      ],
    },
  },
];

export function ShowcaseGallery() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('services');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const activeCategory: PillarCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? (categories[1] as PillarCategory);
  const activeProject = activeCategory.project;

  return (
    <div className="w-full">
      {/* ── 1. Cartes Flottantes 3D Pastel (Style Référence) ── */}
      <div className="grid gap-6 sm:gap-8 md:grid-cols-3 pt-6 pb-12">
        {categories.map((cat, index) => {
          const isSelected = cat.id === activeCategory.id;
          const isCenter = index === 1;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                'group relative flex flex-col justify-between rounded-[32px] p-6 sm:p-8 cursor-pointer transition-all duration-300 ease-out',
                'bg-gradient-to-b from-[#FAF8FD] via-[#F4F1FA] to-[#EBE7F7] border border-white/80',
                isCenter ? 'md:-translate-y-4' : 'hover:-translate-y-2',
                isSelected
                  ? 'ring-2 ring-purple-500/80 shadow-[0_25px_60px_rgba(168,85,247,0.22)]'
                  : 'shadow-[0_20px_45px_rgba(140,120,220,0.12)] hover:shadow-[0_25px_55px_rgba(140,120,220,0.2)]',
              )}
            >
              {/* Reflet lumineux en arrière-plan */}
              <div
                className="absolute inset-0 rounded-[32px] pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-70"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${cat.glowColor}, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                {/* 3D Podium Graphic */}
                <div className="relative mx-auto mb-6 flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl">
                  <img
                    src={cat.podiumImage}
                    alt={cat.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Halo néon sous le podium */}
                  <div
                    className="absolute -bottom-2 h-6 w-32 rounded-full blur-md opacity-80"
                    style={{ backgroundColor: cat.glowColor }}
                  />
                </div>

                {/* Titre & Description de la carte */}
                <div className="text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600/90 font-mono">
                    {cat.badge}
                  </span>
                  <h3 className="mt-1.5 font-serif text-2xl sm:text-3xl font-normal text-[#161722]">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#52546A] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Bouton Pill noir style référence */}
              <div className="relative z-10 mt-6 flex justify-center">
                <button
                  type="button"
                  className={cn(
                    'w-full max-w-[200px] rounded-2xl py-3 text-center text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm cursor-pointer',
                    isSelected
                      ? 'bg-[#0B0C10] text-white shadow-md scale-[1.02]'
                      : 'bg-[#151722] text-white/90 hover:bg-black hover:text-white',
                  )}
                >
                  {isSelected ? '✦ Modèle affiché' : 'Explorer ce style'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. En-tête de la maquette interactive live ── */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            Aperçu en direct
          </span>
          <span className="font-serif text-xl font-normal text-ink">
            {activeProject.brandName}
          </span>
          <span className="hidden md:inline text-xs text-muted">
            • {activeProject.categoryLabel}
          </span>
        </div>

        {/* Commutateur Grand écran / Smartphone */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1 shadow-xs">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
              deviceMode === 'desktop'
                ? 'bg-ink text-white shadow-xs'
                : 'text-muted hover:text-ink',
            )}
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
          >
            <Smartphone className="size-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* ── 3. Visualisation de la maquette (Desktop / Mobile) + Métriques ── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
        {/* Vue de l'interface */}
        <div className="lg:col-span-8 flex justify-center">
          {deviceMode === 'desktop' ? (
            /* 🖥️ Fenêtre Safari élégante */
            <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl transition-all duration-300">
              {/* Barre de navigateur */}
              <div className="flex items-center justify-between border-b border-border/60 bg-surface-muted/90 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="size-3 rounded-full bg-red-400/80" />
                  <div className="size-3 rounded-full bg-amber-400/80" />
                  <div className="size-3 rounded-full bg-emerald-400/80" />
                </div>

                <div className="flex max-w-xs sm:max-w-sm flex-1 items-center justify-center gap-2 rounded-full border border-border/80 bg-surface px-4 py-1 text-[11px] font-mono text-muted shadow-2xs mx-2">
                  <Lock className="size-3 text-emerald-600" />
                  <span className="truncate">https://www.{activeProject.websiteUrl}</span>
                </div>

                <div className="flex items-center gap-1 text-muted">
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
              </div>

              {/* Rendu du site en direct */}
              <div className={cn('p-6 sm:p-8 select-none', activeProject.themeBg, activeProject.themeText)}>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-serif text-lg tracking-wider font-semibold">
                    {activeProject.brandName}
                  </span>
                  <span className="rounded-full px-3 py-1 text-[11px] font-semibold border border-white/20 bg-white/5">
                    {activeProject.actionText}
                  </span>
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-12 items-center">
                  <div className="sm:col-span-7">
                    <span className={cn('text-[10px] font-mono tracking-widest uppercase font-semibold', activeProject.themeAccent)}>
                      {activeProject.heroTag}
                    </span>
                    <h4 className="mt-2 font-serif text-2xl sm:text-3xl font-normal leading-tight">
                      {activeProject.heroTitle}
                    </h4>
                    <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed">
                      {activeProject.heroSubtitle}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="rounded-full bg-white text-ink px-4 py-2 text-xs font-semibold shadow-xs">
                        {activeProject.actionText}
                      </span>
                      <span className="text-xs text-white/60 font-medium">
                        {activeProject.badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-5 relative overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={activeProject.heroImage}
                      alt={activeProject.heroTitle}
                      className="h-48 sm:h-56 w-full object-cover rounded-xl"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                      <span className="bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                        ✦ Rendu Retina 4K
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {activeProject.stats.loadTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cartes de contenu */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {activeProject.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{card.title}</span>
                        <span className={cn('text-xs font-serif font-bold', activeProject.themeAccent)}>
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
            /* 📱 Cadre iPhone stylisé */
            <div className="w-full max-w-[340px] overflow-hidden rounded-[36px] border-[6px] border-[#2c2d30] bg-[#1a1b1e] shadow-2xl p-2 transition-all duration-300">
              <div className={cn('rounded-[28px] overflow-hidden select-none p-4 pb-6 min-h-[500px]', activeProject.themeBg, activeProject.themeText)}>
                {/* Dynamic Island */}
                <div className="mx-auto mb-4 h-4 w-24 rounded-full bg-black flex items-center justify-center" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-serif text-sm font-semibold tracking-wider">
                    {activeProject.brandName}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-white/20 bg-white/10">
                    Menu ☰
                  </span>
                </div>

                <div className="mt-4">
                  <span className={cn('text-[9px] font-mono tracking-wider font-semibold', activeProject.themeAccent)}>
                    {activeProject.heroTag}
                  </span>
                  <h5 className="mt-1.5 font-serif text-lg font-normal leading-snug">
                    {activeProject.heroTitle}
                  </h5>
                  <div className="mt-3 relative rounded-lg overflow-hidden shadow-md">
                    <img
                      src={activeProject.heroImage}
                      alt={activeProject.heroTitle}
                      className="h-32 w-full object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-white">
                      100 % Tactile & Fluide
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-white/70 leading-snug">
                    {activeProject.heroSubtitle}
                  </p>
                  <button className="mt-4 w-full rounded-full bg-white text-ink py-2 text-xs font-bold shadow-sm">
                    {activeProject.actionText}
                  </button>
                </div>

                {activeProject.cards[0] && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold">{activeProject.cards[0].title}</span>
                      <span className={cn('text-xs font-serif font-bold', activeProject.themeAccent)}>
                        {activeProject.cards[0].price}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/70 leading-tight">
                      {activeProject.cards[0].desc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fiche technique & Métriques (Colonne droite) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="size-4" />
              <span>Performances & Atouts</span>
            </div>

            <h3 className="mt-3 font-serif text-2xl font-normal text-ink">
              {activeCategory.title}
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              {activeCategory.tagline}
            </p>

            {/* Jauges */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-surface-muted/60 p-3.5">
              <div className="rounded-lg bg-surface p-2.5 border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-base">
                  <Zap className="size-4" />
                  <span>{activeProject.stats.speed}</span>
                </div>
                <span className="text-[10px] text-muted font-medium">Score Vitesse Google</span>
              </div>

              <div className="rounded-lg bg-surface p-2.5 border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-base">
                  <CheckCircle2 className="size-4" />
                  <span>{activeProject.stats.loadTime}</span>
                </div>
                <span className="text-[10px] text-muted font-medium">Temps de chargement</span>
              </div>
            </div>

            {/* Impact */}
            <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-center">
              <span className="text-xs font-semibold text-ink">
                🎯 {activeProject.stats.highlight}
              </span>
            </div>

            {/* Fonctionnalités */}
            <div className="mt-6">
              <span className="text-xs font-semibold text-ink">Fonctionnalités intégrées :</span>
              <ul className="mt-3 space-y-2 text-xs text-muted">
                {activeProject.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border">
            <Button asChild fullWidth variant="primary" size="md">
              <Link to={`/devis?secteur=${activeCategory.id}`}>
                Créer un projet dans ce style
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
