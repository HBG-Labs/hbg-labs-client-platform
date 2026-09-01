import { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Check, 
  Star, 
  Leaf, 
  X, 
  Menu, 
  ShoppingBag,
  ShieldCheck, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  MapPin, 
  Phone, 
  Mail 
} from 'lucide-react';

export interface SoinCategory {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  tag: string;
  image: string;
}

const CATEGORIES_SOINS: SoinCategory[] = [
  {
    id: 'visage',
    number: '01',
    title: 'SOINS DU VISAGE',
    subtitle: 'Éclat • Hydratation • Régénération',
    description: 'Infusions botaniques d’hibiscus sauvage, d’aloe vera frais et d’acides doux de fruits tropicaux pour un teint lumineux, repulpé et visiblement reposé.',
    duration: '60 min',
    price: '95 €',
    tag: 'Best-seller',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'corps',
    number: '02',
    title: 'SOINS DU CORPS',
    subtitle: 'Gommage • Nutrition • Modelage',
    description: 'Exfoliation précieuse aux cristaux de sucre de canne bio des îles, enveloppements minéraux à l’argile volcanique et nutrition intense aux beurres tropicaux.',
    duration: '50 min',
    price: '85 €',
    tag: 'Régénérant',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'massages',
    number: '03',
    title: 'MASSAGES',
    subtitle: 'Relaxation • Évasion • Équilibre',
    description: 'Manœuvres enveloppantes et fluides aux huiles tièdes infusées d’ylang-ylang et de bois bandé. Dénoue les tensions pour une sensation de sérénité absolue.',
    duration: '75 min',
    price: '120 €',
    tag: 'Détente absolue',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'signature',
    number: '04',
    title: 'RITUELS SIGNATURE',
    subtitle: 'Une expérience complète inspirée des Antilles',
    description: 'Le voyage holistique complet : bain floral aux pétales d’orchidées, gommage velours, massage signature aux pierres chaudes et soin éclat du visage.',
    duration: '120 min',
    price: '190 €',
    tag: 'Expérience Culte',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
  },
];

const PRODUITS = [
  {
    id: 'p1',
    name: 'Huile Solaire',
    subtitle: 'Huile nourrissante aux plantes tropicales',
    volume: '100 ml',
    price: '48 €',
    tag: 'Culte',
    description: 'Concentré de 7 huiles précieuses de coco, roucou et jojoba pour sublimer le hâle et nourrir la peau.',
    image: '/images/showcase/soie-huile-solaire.jpg',
  },
  {
    id: 'p2',
    name: 'Élixir Éclat',
    subtitle: 'Sérum visage illuminateur',
    volume: '30 ml',
    price: '56 €',
    tag: 'Best-seller',
    description: 'Infusion antioxydante d’extraits d’hibiscus, goyave sauvage et vitamine C végétale pour un teint rayonnant.',
    image: '/images/showcase/soie-elixir-eclat.jpg',
  },
  {
    id: 'p3',
    name: 'Gommage Terre',
    subtitle: 'Gommage corps aux minéraux et actifs naturels',
    volume: '200 ml',
    price: '42 €',
    tag: 'Botanique',
    description: 'Formule exfoliante douce associant cristaux de sucre de canne bio, sable volcanique et pulpe d’aloé.',
    image: '/images/showcase/soie-gommage-terre.jpg',
  },
];

const TEMOIGNAGES = [
  {
    author: 'Camille R.',
    location: 'Fort-de-France, Martinique',
    rating: 5,
    quote: 'Une véritable parenthèse. Tout est magnifique, du lieu jusqu’au soin. Le rituel signature m’a transportée dans un état de quiétude absolu.',
    date: 'Il y a 1 semaine',
  },
  {
    author: 'Alexandre M.',
    location: 'Saint-Barthélemy',
    rating: 5,
    quote: 'Le massage holistique est une merveille. Un lâcher-prise total dans un cadre enchanteur, avec des praticiennes d’une bienveillance rare.',
    date: 'Il y a 2 semaines',
  },
  {
    author: 'Sarah L.',
    location: 'Le Gosier, Guadeloupe',
    rating: 5,
    quote: 'Les produits naturels sentent divinement bon et respectent parfaitement ma peau sensible. Mon visage n’a jamais été aussi lumineux.',
    date: 'Il y a 3 semaines',
  },
];

const GALERIE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
    title: 'Textures sensorielle & huiles botaniques',
  },
  {
    url: 'https://images.unsplash.com/photo-1519735777090-ec97162dc266?auto=format&fit=crop&w=600&q=80',
    title: 'Bassin d’eau tiède sous les palmes',
  },
  {
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
    title: 'Architecture boisée & lumière tropicale',
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    title: 'Pétales d’hibiscus & rituels de bain',
  },
];

export function BeautyLanding({ isMobile = false }: { isMobile?: boolean }) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSoin, setSelectedSoin] = useState<string>('RITUELS SIGNATURE (120 min • 190 €)');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '2026-09-04',
    time: '14:30',
  });

  const handleOpenBooking = (soinName?: string) => {
    if (soinName) setSelectedSoin(soinName);
    setBookingSuccess(false);
    setBookingModalOpen(true);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
  };

  const handleAddToCart = (productName: string) => {
    setCartToast(productName);
    setTimeout(() => setCartToast(null), 3000);
  };

  return (
    <div className="relative w-full bg-[#FAF8F5] text-[#2B2520] font-sans antialiased selection:bg-[#8C684F]/20 selection:text-[#2B2520]">
      
      {/* ── Toast Notification for Cart ── */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#2B2520] text-white shadow-2xl animate-fade-in border border-white/10">
          <div className="size-6 rounded-full bg-[#8C684F] flex items-center justify-center text-white">
            <Check className="size-3.5" />
          </div>
          <p className="text-xs font-medium">
            <span className="font-bold">{cartToast}</span> ajouté à votre panier sensoriel.
          </p>
        </div>
      )}

      {/* ── 1. HEADER / NAVIGATION (Sticky glassmorphism) ── */}
      <header className="sticky top-0 z-40 w-full transition-all duration-300 backdrop-blur-md bg-[#FAF8F5]/90 border-b border-[#E8DFD8]/80">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 h-16' : 'px-6 sm:px-8 h-20'} flex items-center justify-between`}>
          
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-2 group">
            <span className="size-2 rounded-full bg-[#8C684F] transition-transform duration-300 group-hover:scale-125" />
            <span className={`font-serif ${isMobile ? 'text-lg tracking-[0.15em]' : 'text-xl sm:text-2xl tracking-[0.2em]'} font-bold text-[#2B2520]`}>
              SOIE &amp; TERRE
            </span>
          </a>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden lg:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.15em] text-[#6B6259]">
              <a href="#accueil" className="hover:text-[#2B2520] transition-colors py-2">Accueil</a>
              <a href="#soins" className="hover:text-[#2B2520] transition-colors py-2">Nos soins</a>
              <a href="#rituel-signature" className="hover:text-[#2B2520] transition-colors py-2">Rituels</a>
              <a href="#philosophie" className="hover:text-[#2B2520] transition-colors py-2">L’expérience</a>
              <a href="#produits" className="hover:text-[#2B2520] transition-colors py-2">Boutique</a>
              <a href="#contact" className="hover:text-[#2B2520] transition-colors py-2">Contact</a>
            </nav>
          )}

          {/* Right CTA */}
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="px-6 py-2.5 rounded-full border border-[#2B2520]/60 hover:border-[#2B2520] text-[#2B2520] hover:bg-[#2B2520] hover:text-white transition-all duration-300 text-[11px] font-bold uppercase tracking-[0.18em] cursor-pointer shadow-2xs"
              >
                Prendre rendez-vous
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuMobileOpen(!menuMobileOpen)}
            className={`${isMobile ? 'block' : 'lg:hidden'} p-2 text-[#2B2520] hover:opacity-75 cursor-pointer`}
            aria-label="Ouvrir le menu"
          >
            {menuMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuMobileOpen && (
          <div className="px-6 py-6 bg-[#FAF8F5] border-b border-[#E8DFD8] flex flex-col gap-4 text-xs font-medium uppercase tracking-widest text-[#2B2520] shadow-xl">
            <a href="#accueil" onClick={() => setMenuMobileOpen(false)}>Accueil</a>
            <a href="#soins" onClick={() => setMenuMobileOpen(false)}>Nos soins</a>
            <a href="#rituel-signature" onClick={() => setMenuMobileOpen(false)}>Rituels</a>
            <a href="#philosophie" onClick={() => setMenuMobileOpen(false)}>L’expérience</a>
            <a href="#produits" onClick={() => setMenuMobileOpen(false)}>Boutique</a>
            <a href="#contact" onClick={() => setMenuMobileOpen(false)}>Contact</a>
            <div className="pt-3 border-t border-[#E8DFD8]">
              <button
                type="button"
                onClick={() => {
                  setMenuMobileOpen(false);
                  handleOpenBooking();
                }}
                className="w-full py-2.5 rounded-full bg-[#2B2520] text-white text-[11px] font-bold uppercase tracking-widest"
              >
                Prendre rendez-vous
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (Plein écran avec l'image fournie) ── */}
      <section 
        id="accueil"
        className={`relative ${isMobile ? 'min-h-[600px] py-10' : 'min-h-[92vh]'} flex items-center justify-start overflow-hidden`}
      >
        {/* Background Image (Fournie par l'utilisateur) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/showcase/soie-et-terre-hero.jpg')",
          }}
        >
          {/* Subtle Luxury Overlay to maximize readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E1915]/85 via-[#1E1915]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1915]/70 via-transparent to-black/30" />
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 max-w-7xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-6 sm:px-8 py-20 lg:py-28'} w-full`}>
          <div className="max-w-2xl text-white">
            
            {/* Top Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase mb-4 sm:mb-6">
              <Sparkles className="size-3 text-[#D4B996]" />
              <span>Rituels de Beauté &bull; Antilles</span>
            </div>

            {/* Main Headline */}
            <h1 className={`font-serif ${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'} font-light tracking-tight text-white leading-[1.12]`}>
              La beauté <br />
              <span className="italic font-normal">à l’état naturel.</span>
            </h1>

            {/* Subtitle */}
            <p className={`mt-4 ${isMobile ? 'text-xs leading-relaxed' : 'text-sm sm:text-base md:text-lg'} text-[#EAE3D9] font-light leading-relaxed max-w-xl`}>
              Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat et vous offrir un véritable moment de bien-être.
            </p>

            {/* CTA Buttons */}
            <div className={`mt-6 sm:mt-9 flex ${isMobile ? 'flex-col gap-3 w-full' : 'flex-col sm:flex-row items-stretch sm:items-center gap-4'}`}>
              <a
                href="#soins"
                className="px-6 sm:px-8 py-3 rounded-full bg-[#FAF8F5] text-[#2B2520] hover:bg-white text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 text-center shadow-lg hover:shadow-xl hover:scale-102"
              >
                Découvrir nos soins
              </a>
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="px-6 sm:px-8 py-3 rounded-full border border-white/80 hover:border-white text-white hover:bg-white/10 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 text-center backdrop-blur-xs cursor-pointer"
              >
                Prendre rendez-vous
              </button>
            </div>

            {/* Bottom Mention */}
            <div className={`mt-8 sm:mt-14 pt-6 sm:pt-8 border-t border-white/20 flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4B996]`}>
              <span>Martinique</span>
              <span className="size-1 rounded-full bg-[#D4B996]/60" />
              <span>Guadeloupe</span>
              <span className="size-1 rounded-full bg-[#D4B996]/60" />
              <span>Caraïbes</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. SECTION INTRODUCTION / PHILOSOPHIE ── */}
      <section id="philosophie" className={`${isMobile ? 'py-12 px-4' : 'py-24 sm:py-32'} bg-[#FAF8F5] border-b border-[#E8DFD8]`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16'} items-center`}>
            
            {/* Left Editorial Text */}
            <div className={`${isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-6 space-y-6'}`}>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#8C684F]">
                <Leaf className="size-3.5" />
                <span>Notre Philosophie</span>
              </div>

              <h2 className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-light text-[#2B2520] leading-tight`}>
                Prendre soin de soi <br />
                <span className="italic font-normal">devient un rituel.</span>
              </h2>

              <p className={`${isMobile ? 'text-xs' : 'text-base sm:text-lg'} text-[#6B6259] leading-relaxed font-light`}>
                Chez Soie &amp; Terre, chaque soin est pensé comme une parenthèse. Un moment pour ralentir, respirer et retrouver l'essentiel au contact des richesses botaniques des îles.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-4 sm:gap-6 border-t border-[#E8DFD8]">
                <div>
                  <p className={`font-serif ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} text-[#8C684F] font-bold`}>100 %</p>
                  <p className="mt-1 text-[10px] sm:text-xs text-[#6B6259] uppercase tracking-wider font-medium">Actifs naturels &amp; purs</p>
                </div>
                <div>
                  <p className={`font-serif ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} text-[#8C684F] font-bold`}>4.9 / 5</p>
                  <p className="mt-1 text-[10px] sm:text-xs text-[#6B6259] uppercase tracking-wider font-medium">Satisfaction clients</p>
                </div>
              </div>
            </div>

            {/* Right Asymmetrical Visual Composition */}
            <div className={`${isMobile ? 'col-span-1 grid grid-cols-1 gap-4' : 'lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6'}`}>
              <div className="space-y-4 sm:space-y-6">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"
                    alt="Rituel d'huile précieuse"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 sm:p-6 rounded-3xl bg-[#F0EAE1] border border-[#E0D6C8] text-center">
                  <Heart className="size-5 sm:size-6 text-[#8C684F] mx-auto mb-2" />
                  <p className="font-serif text-xs sm:text-sm font-semibold text-[#2B2520]">Plantes sauvages des Antilles</p>
                  <p className="text-[10px] sm:text-[11px] text-[#6B6259] mt-1">Cueillies dans le respect de la biodiversité</p>
                </div>
              </div>

              <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'pt-0' : 'pt-8'}`}>
                <div className="p-4 sm:p-6 rounded-3xl bg-[#2B2520] text-white text-center">
                  <ShieldCheck className="size-5 sm:size-6 text-[#D4B996] mx-auto mb-2" />
                  <p className="font-serif text-xs sm:text-sm font-semibold">Formules Éco-responsables</p>
                  <p className="text-[10px] sm:text-[11px] text-[#D4B996]/80 mt-1">Zéro parabène, zéro silicone</p>
                </div>
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"
                    alt="Spa d'exception sous les tropiques"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. SECTION SOINS & RITUELS (4 Cartes Interactives) ── */}
      <section id="soins" className={`${isMobile ? 'py-12 px-4' : 'py-24 sm:py-32'} bg-[#F7F4EE]`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'}`}>
          
          <div className={`text-center max-w-2xl mx-auto ${isMobile ? 'mb-8' : 'mb-16 sm:mb-20'}`}>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#8C684F] mb-2">
              Notre Carte de Rituels
            </p>
            <h2 className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-light text-[#2B2520]`}>
              Des soins pensés pour vous.
            </h2>
            <p className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-[#6B6259]`}>
              Chaque protocole est adapté à votre peau et à votre niveau de fatigue pour une régénération sur-mesure.
            </p>
          </div>

          {/* Cards Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'}`}>
            {CATEGORIES_SOINS.map((soin) => (
              <div
                key={soin.id}
                className="group relative bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
              >
                {/* Image Top */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                  <img
                    src={soin.image}
                    alt={soin.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#2B2520] text-[10px] font-bold uppercase tracking-widest shadow-xs">
                    {soin.tag}
                  </div>
                  <div className="absolute top-3 right-3 size-8 rounded-full bg-[#2B2520]/80 backdrop-blur-xs text-white text-[11px] font-mono flex items-center justify-center">
                    {soin.number}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C684F] mb-1">
                      {soin.subtitle}
                    </p>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2B2520] mb-2">
                      {soin.title}
                    </h3>
                    <p className="text-xs text-[#6B6259] leading-relaxed line-clamp-3">
                      {soin.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E8DFD8] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8C684F] font-mono block">{soin.duration}</span>
                      <span className="text-sm font-serif font-bold text-[#2B2520]">{soin.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenBooking(`${soin.title} (${soin.duration} • ${soin.price})`)}
                      className="px-4 py-2 rounded-full bg-[#2B2520] text-white hover:bg-[#8C684F] text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 5. SECTION RITUEL SIGNATURE (Mise en scène cinématographique) ── */}
      <section id="rituel-signature" className={`${isMobile ? 'py-12 px-4' : 'py-24 sm:py-32'} bg-[#2B2520] text-white relative overflow-hidden`}>
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C684F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4A5B4E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'} relative z-10`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16'} items-center`}>
            
            {/* Visual Box */}
            <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-6'} relative`}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=80"
                  alt="Rituel Signature Soie & Terre"
                  className="w-full h-full object-cover"
                />
              </div>
              {!isMobile && (
                <div className="absolute -bottom-6 -right-6 hidden sm:block p-6 rounded-2xl bg-[#FAF8F5] text-[#2B2520] shadow-2xl max-w-xs border border-[#E8DFD8]">
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                  </div>
                  <p className="font-serif text-xs font-bold">« Le soin le plus complet des Caraïbes. »</p>
                  <p className="text-[10px] text-[#6B6259] mt-0.5">Guide Spa &amp; Bien-être 2026</p>
                </div>
              )}
            </div>

            {/* Text & Steps */}
            <div className={`${isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-6 space-y-6'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4B996] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="size-3" />
                <span>Le Soin Émblématique</span>
              </div>

              <h2 className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-light text-white leading-tight`}>
                Un voyage <br />
                <span className="italic font-normal text-[#D4B996]">pour les sens.</span>
              </h2>

              <p className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-[#D4B996]/90 leading-relaxed font-light`}>
                Des gestes précis, des textures délicates et des actifs inspirés de notre environnement pour créer une expérience unique. Une immersion totale de 120 minutes qui revitalise le corps et apaise l’esprit.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-white/90">
                <li className="flex items-center gap-2.5">
                  <div className="size-4.5 sm:size-5 rounded-full bg-[#8C684F] flex items-center justify-center text-white shrink-0">
                    <Check className="size-2.5 sm:size-3" />
                  </div>
                  <span>Bain de pieds aux fleurs d’oranger &amp; sel rose</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="size-4.5 sm:size-5 rounded-full bg-[#8C684F] flex items-center justify-center text-white shrink-0">
                    <Check className="size-2.5 sm:size-3" />
                  </div>
                  <span>Gommage corporel velours au sucre de canne bio</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="size-4.5 sm:size-5 rounded-full bg-[#8C684F] flex items-center justify-center text-white shrink-0">
                    <Check className="size-2.5 sm:size-3" />
                  </div>
                  <span>Massage profond aux huiles tiédies de vanille &amp; bois bandé</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="size-4.5 sm:size-5 rounded-full bg-[#8C684F] flex items-center justify-center text-white shrink-0">
                    <Check className="size-2.5 sm:size-3" />
                  </div>
                  <span>Soin du visage éclat instantané à l’hibiscus</span>
                </li>
              </ul>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleOpenBooking('RITUELS SIGNATURE (120 min • 190 €)')}
                  className={`px-6 sm:px-8 py-3 rounded-full bg-[#FAF8F5] text-[#2B2520] hover:bg-white ${isMobile ? 'w-full text-center' : ''} text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-lg cursor-pointer`}
                >
                  Découvrir le rituel
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. SECTION PRODUITS COSMÉTIQUES ── */}
      <section id="produits" className={`${isMobile ? 'py-12 px-4' : 'py-24 sm:py-32'} bg-[#FAF8F5] border-b border-[#E8DFD8]`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'}`}>
          
          <div className={`text-center max-w-2xl mx-auto ${isMobile ? 'mb-8' : 'mb-16 sm:mb-20'}`}>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#8C684F] mb-2">
              Notre Ligne Botanique
            </p>
            <h2 className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-light text-[#2B2520]`}>
              La nature au cœur de nos soins.
            </h2>
            <p className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-[#6B6259]`}>
              Prolongez l’expérience chez vous avec nos créations cosmétiques artisanales, formulées et confectionnées dans nos ateliers caribéens.
            </p>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-1 md:grid-cols-3 gap-8'}`}>
            {PRODUITS.map((prod) => (
              <div
                key={prod.id}
                className="group p-5 sm:p-6 rounded-3xl bg-[#F7F4EE] border border-[#E8DFD8] hover:border-[#8C684F]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white mb-5 shadow-xs">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#2B2520]/90 text-white text-[9px] font-bold uppercase tracking-widest backdrop-blur-xs">
                      {prod.tag}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-serif text-lg font-bold text-[#2B2520]">{prod.name}</h3>
                    <span className="font-serif font-bold text-base text-[#8C684F]">{prod.price}</span>
                  </div>
                  
                  <p className="text-xs font-semibold text-[#8C684F] mb-1.5">{prod.subtitle}</p>
                  <p className="text-xs text-[#6B6259] leading-relaxed">{prod.description}</p>
                  <span className="text-[10px] font-mono text-[#8C684F]/80 block mt-2">Flacon verre {prod.volume}</span>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E8DFD8]">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod.name)}
                    className="w-full py-2.5 rounded-full bg-white hover:bg-[#2B2520] text-[#2B2520] hover:text-white border border-[#2B2520]/20 hover:border-[#2B2520] text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>Ajouter au panier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 7. SECTION EXPÉRIENCE & VALEURS ── */}
      <section className={`${isMobile ? 'py-12 px-4' : 'py-20 sm:py-28'} bg-[#F0EAE1]`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12'}`}>
            
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E0D6C8] space-y-3 sm:space-y-4">
              <span className="font-mono text-xs font-bold text-[#8C684F]">01</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2520]">EXPERTISE</h3>
              <p className="text-xs sm:text-sm text-[#6B6259] leading-relaxed">
                Des soins réalisés avec précision et attention par des praticiennes passionnées, formées aux meilleures techniques de modelage et de dermatologie naturelle.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E0D6C8] space-y-3 sm:space-y-4">
              <span className="font-mono text-xs font-bold text-[#8C684F]">02</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2520]">NATURE</h3>
              <p className="text-xs sm:text-sm text-[#6B6259] leading-relaxed">
                Des ingrédients rigoureusement sourcés aux Antilles. Nos formules privilégient les extraits purs de fruits tropicaux, de fleurs sauvages et d’huiles végétales vierges.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E0D6C8] space-y-3 sm:space-y-4">
              <span className="font-mono text-xs font-bold text-[#8C684F]">03</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2520]">BIEN-ÊTRE</h3>
              <p className="text-xs sm:text-sm text-[#6B6259] leading-relaxed">
                Une parenthèse entièrement pensée pour vous. Lumière feutrée, musique douce, textures soyeuses : tout concourt à un lâcher-prise absolu.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 8. SECTION GALERIE & TÉMOIGNAGES ── */}
      <section className={`${isMobile ? 'py-12 px-4' : 'py-24 sm:py-32'} bg-[#FAF8F5]`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-0' : 'px-6 sm:px-8'}`}>
          
          {/* Gallery Grid */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3 mb-10' : 'grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20'}`}>
            {GALERIE_IMAGES.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden group shadow-md">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-4 text-white">
                  <p className="text-[10px] sm:text-[11px] font-medium">{img.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Slider / Box */}
          <div className={`max-w-3xl mx-auto rounded-3xl bg-[#F7F4EE] border border-[#E8DFD8] ${isMobile ? 'p-6' : 'p-8 sm:p-12'} text-center relative shadow-sm`}>
            <div className="flex justify-center text-amber-500 gap-1 mb-3">
              <Star className="size-3.5 sm:size-4 fill-current" />
              <Star className="size-3.5 sm:size-4 fill-current" />
              <Star className="size-3.5 sm:size-4 fill-current" />
              <Star className="size-3.5 sm:size-4 fill-current" />
              <Star className="size-3.5 sm:size-4 fill-current" />
            </div>

            {(() => {
              const currentTestimonial = TEMOIGNAGES[testimonialIndex] ?? TEMOIGNAGES[0]!;
              return (
                <>
                  <blockquote className={`font-serif ${isMobile ? 'text-base' : 'text-lg sm:text-2xl'} text-[#2B2520] italic leading-relaxed`}>
                    « {currentTestimonial.quote} »
                  </blockquote>

                  <div className="mt-4 sm:mt-6">
                    <p className="text-xs sm:text-sm font-bold text-[#2B2520]">{currentTestimonial.author}</p>
                    <p className="text-[11px] sm:text-xs text-[#8C684F]">{currentTestimonial.location}</p>
                  </div>
                </>
              );
            })()}

            {/* Slider Controls */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTestimonialIndex((prev) => (prev === 0 ? TEMOIGNAGES.length - 1 : prev - 1))}
                className="p-1.5 sm:p-2 rounded-full border border-[#2B2520]/20 hover:bg-white text-[#2B2520] transition-colors cursor-pointer"
                aria-label="Témoignage précédent"
              >
                <ChevronLeft className="size-3.5 sm:size-4" />
              </button>
              <span className="text-xs font-mono text-[#8C684F]">
                {testimonialIndex + 1} / {TEMOIGNAGES.length}
              </span>
              <button
                type="button"
                onClick={() => setTestimonialIndex((prev) => (prev === TEMOIGNAGES.length - 1 ? 0 : prev + 1))}
                className="p-1.5 sm:p-2 rounded-full border border-[#2B2520]/20 hover:bg-white text-[#2B2520] transition-colors cursor-pointer"
                aria-label="Témoignage suivant"
              >
                <ChevronRight className="size-3.5 sm:size-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── 9. MODAL DE RÉSERVATION INTERACTIVE ── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] p-6 sm:p-8 shadow-2xl text-[#2B2520]">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-stone-200/60 hover:bg-stone-300 text-[#2B2520] transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>

            {!bookingSuccess ? (
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8C684F]/10 text-[#8C684F] text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Calendar className="size-3" />
                  <span>Réservation en ligne</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2B2520]">
                  Réserver votre parenthèse.
                </h3>
                <p className="text-xs text-[#6B6259] mt-1 mb-6">
                  Choisissez votre soin et l’horaire de votre choix. Confirmation immédiate.
                </p>

                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {/* Select Treatment */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                      Soin souhaité
                    </label>
                    <select
                      value={selectedSoin}
                      onChange={(e) => setSelectedSoin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                    >
                      <option value="SOIN DU VISAGE (60 min • 95 €)">SOIN DU VISAGE (60 min • 95 €)</option>
                      <option value="SOIN DU CORPS (50 min • 85 €)">SOIN DU CORPS (50 min • 85 €)</option>
                      <option value="MASSAGE HOLISTIQUE (75 min • 120 €)">MASSAGE HOLISTIQUE (75 min • 120 €)</option>
                      <option value="RITUELS SIGNATURE (120 min • 190 €)">RITUELS SIGNATURE (120 min • 190 €)</option>
                    </select>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                        Heure
                      </label>
                      <select
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                      >
                        <option value="10:00">10h00</option>
                        <option value="11:30">11h30</option>
                        <option value="14:30">14h30</option>
                        <option value="16:00">16h00</option>
                        <option value="17:30">17h30</option>
                      </select>
                    </div>
                  </div>

                  {/* Personal details */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Camille Raynaud"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+596 696 00 00 00"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6259] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="camille@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD8] text-xs font-medium text-[#2B2520] focus:outline-none focus:border-[#8C684F]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-full bg-[#2B2520] hover:bg-[#8C684F] text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer shadow-md"
                    >
                      Confirmer le rendez-vous
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="size-14 rounded-full bg-[#8C684F]/15 text-[#8C684F] flex items-center justify-center mx-auto">
                  <Check className="size-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2B2520]">
                  Rendez-vous confirmé
                </h3>
                <p className="text-xs text-[#6B6259] leading-relaxed max-w-sm mx-auto">
                  Merci <strong>{formData.name || 'chère cliente'}</strong>. Votre réservation pour le <strong>{selectedSoin}</strong> le <strong>{formData.date} à {formData.time}</strong> est enregistrée.
                </p>
                <div className="p-3 rounded-xl bg-[#F0EAE1] text-[11px] font-mono text-[#8C684F]">
                  RÉFÉRENCE : #ST-2026-8842
                </div>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#2B2520] text-white text-xs font-bold uppercase tracking-widest cursor-pointer mt-2"
                >
                  Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── 10. FOOTER ── */}
      <footer id="contact" className={`bg-[#2B2520] text-white ${isMobile ? 'pt-12 pb-8' : 'pt-20 pb-12'} border-t border-white/10`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6 sm:px-8'}`}>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8 pb-10' : 'grid-cols-1 md:grid-cols-12 gap-12 pb-16'} border-b border-white/10`}>
            
            {/* Brand column */}
            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-5'} space-y-4`}>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#D4B996]" />
                <span className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
                  SOIE &amp; TERRE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#D4B996]/80 font-serif italic">
                La beauté à l’état naturel.
              </p>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm font-light">
                Institut de bien-être holistique &amp; laboratoire cosmétique inspiré des flores tropicales des Antilles.
              </p>
              <div className="pt-2 text-xs text-[#D4B996] space-y-1 font-mono">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>Anse Marcel, Saint-Martin &bull; Trois-Îlets, Martinique</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  <span>+596 596 00 00 00</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0" />
                  <span>contact@soieetterre.com</span>
                </p>
              </div>
            </div>

            {/* Navigation links */}
            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-3'} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4B996]">
                Navigation
              </p>
              <ul className="space-y-2 text-xs text-white/70">
                <li><a href="#accueil" className="hover:text-white transition-colors">Accueil</a></li>
                <li><a href="#soins" className="hover:text-white transition-colors">Carte des soins</a></li>
                <li><a href="#rituel-signature" className="hover:text-white transition-colors">Rituel Signature</a></li>
                <li><a href="#philosophie" className="hover:text-white transition-colors">Notre Philosophie</a></li>
                <li><a href="#produits" className="hover:text-white transition-colors">Cosmétiques</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className={`${isMobile ? 'col-span-1' : 'md:col-span-4'} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4B996]">
                Le Carnet Sensoriel
              </p>
              <p className="text-xs text-white/70 leading-relaxed font-light">
                Recevez nos rituels saisonniers et invitations privées aux lancements de soins.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert('Merci pour votre inscription.'); }} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4B996]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#FAF8F5] text-[#2B2520] hover:bg-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                >
                  <Send className="size-3.5" />
                </button>
              </form>
            </div>

          </div>

          {/* Bottom Copyright and HBG Labs Credit */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>&copy; 2026 Soie &amp; Terre — Tous droits réservés.</p>
            <p className="text-white/70">
              Site réalisé par <strong className="text-white">HBG Labs</strong>
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
