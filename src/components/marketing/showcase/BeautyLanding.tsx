import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Star, 
  ArrowRight, 
  X, 
  Menu, 
  ShoppingBag, 
  Flower2
} from 'lucide-react';

export interface SoinItem {
  id: string;
  number: string;
  title: string;
  category: string;
  duration: string;
  price: string;
  tag: string;
  description: string;
  benefits: string[];
  image: string;
}

const SOINS_RITUELS: SoinItem[] = [
  {
    id: 'visage',
    number: '01',
    title: 'SOINS DU VISAGE',
    category: 'Éclat • Hydratation • Régénération',
    duration: '60 min',
    price: '95 €',
    tag: 'Best-seller',
    description: 'Infusion antioxydante d’extraits de goyave sauvage et d’acides doux de fleurs d’hibiscus pour un teint lumineux, repulpé et visiblement reposé.',
    benefits: ['Éclat immédiat', 'Hydratation profonde', 'Lissage des traits'],
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'corps',
    number: '02',
    title: 'SOINS DU CORPS',
    category: 'Gommage • Nutrition • Modelage',
    duration: '50 min',
    price: '85 €',
    tag: 'Soin velours',
    description: 'Exfoliation douce aux cristaux de sucre de canne bio et pulpe de coco fraîche, suivie d’un masque tiède à l’argile minérale volcanique.',
    benefits: ['Grain de peau affiné', 'Nutrition intense', 'Élimination des toxines'],
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'massages',
    number: '03',
    title: 'MASSAGES',
    category: 'Relaxation • Évasion • Équilibre',
    duration: '75 min',
    price: '120 €',
    tag: 'Détente absolue',
    description: 'Manœuvres lentes et enveloppantes aux huiles végétales tiédies de bois bandé et ylang-ylang sauvage pour dénouer chaque tension du corps.',
    benefits: ['Lâcher-prise total', 'Harmonisation musculaire', 'Apaisement de l’esprit'],
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'signature',
    number: '04',
    title: 'RITUELS SIGNATURE',
    category: 'Une expérience complète inspirée des Antilles',
    duration: '120 min',
    price: '190 €',
    tag: 'Expérience 5 étoiles',
    description: 'Le voyage ultime Soie & Terre : bain floral d’accueil, gommage velours, massage holistique et soin visage sublimateur à la fleur d’hibiscus.',
    benefits: ['Rituel complet corps & visage', 'Bain aux pétales tropicaux', 'Dégustation d’infusion rare'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
  },
];

const PRODUITS = [
  {
    id: 'p1',
    name: 'Huile Solaire',
    subtitle: 'Huile nourrissante aux plantes tropicales',
    volume: '100 ml',
    price: '45 €',
    tag: 'Corps & Visage',
    description: 'Concentré précieux d’huile de roucou, macérât de fleur de tiaré et vitamine E pour sublimer et nourrir intensément le derme.',
    image: 'https://images.unsplash.com/photo-1608248597359-59754f9a0d81?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p2',
    name: 'Élixir Éclat',
    subtitle: 'Sérum visage illuminateur',
    volume: '30 ml',
    price: '58 €',
    tag: 'Best-seller',
    description: 'Infusion botanique de goyave caribéenne, extrait pur d’hibiscus et acide hyaluronique végétal pour un teint radieux.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p3',
    name: 'Gommage Terre',
    subtitle: 'Gommage corps aux minéraux et actifs naturels',
    volume: '200 ml',
    price: '42 €',
    tag: 'Exfoliation pure',
    description: 'Cristaux fins de sucre de canne bio, pulpe de coco pressée à froid et argile rouge volcanique pour une peau satinée.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  },
];

const TEMOIGNAGES = [
  {
    author: 'Camille R.',
    location: 'Fort-de-France',
    text: 'Une véritable parenthèse. Tout est magnifique, du lieu jusqu’au soin. Le rituel signature aux huiles d’ylang-ylang est une perfection absolue.',
    soin: 'Rituel Signature',
    rating: 5,
  },
  {
    author: 'Sarah M.',
    location: 'Sainte-Anne',
    text: 'Le cadre est d’une élégance rare, feutré et connecté à la nature. Ma peau n’a jamais été aussi lumineuse après le soin visage à l’hibiscus.',
    soin: 'Soin du Visage Éclat',
    rating: 5,
  },
  {
    author: 'Julien & Élodie D.',
    location: 'Les Trois-Îlets',
    text: 'Un moment hors du temps partagé à deux. Praticiennes attentionnées, odeurs divines et sérénité totale. Nous revenons chaque mois.',
    soin: 'Massage en Duo',
    rating: 5,
  },
];

const GALERIE = [
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    title: 'Bassin thermal & pierre volcanique',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    title: 'Rituels botaniques personnalisés',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
    title: 'Modelage aux huiles d’ylang-ylang',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    title: 'Textures pures & minéraux naturels',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    title: 'Élixirs en flacons d’apothicaire',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
  {
    url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    title: 'Salon de repos sous les palmiers',
    span: 'col-span-12 sm:col-span-6 lg:col-span-4',
  },
];

export function BeautyLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Form State
  const [bookingForm, setBookingForm] = useState({
    soin: 'Rituels Signature (120 min - 190 €)',
    date: '2026-09-15',
    time: '14:30',
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openBookingWithSoin = (soinTitle: string) => {
    setBookingForm((prev) => ({ ...prev, soin: soinTitle }));
    setBookingModalOpen(true);
    setBookingConfirmed(false);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2B2520] font-sans antialiased selection:bg-[#E8DFD8] selection:text-[#2B2520]">
      
      {/* ── 1. HEADER / NAVIGATION ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8DFD8]/80 py-4 shadow-xs text-[#2B2520]'
            : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent py-6 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#accueil" className="flex items-center gap-2 group">
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-light tracking-[0.25em] uppercase">
              SOIE &amp; TERRE
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-[11px] uppercase tracking-[0.2em] font-medium">
            <a href="#accueil" className="hover:opacity-75 transition-opacity">Accueil</a>
            <a href="#soins" className="hover:opacity-75 transition-opacity">Nos soins</a>
            <a href="#rituels" className="hover:opacity-75 transition-opacity">Rituels</a>
            <a href="#experience" className="hover:opacity-75 transition-opacity">L'expérience</a>
            <a href="#philosophie" className="hover:opacity-75 transition-opacity">À propos</a>
            <a href="#contact" className="hover:opacity-75 transition-opacity">Contact</a>
          </nav>

          {/* Right Action Button & Cart Indicator */}
          <div className="flex items-center gap-3">
            {cartCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                <ShoppingBag className="size-3.5" />
                <span>{cartCount}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => openBookingWithSoin('Rituel Signature (120 min)')}
              className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
                isScrolled
                  ? 'border border-[#2B2520] text-[#2B2520] hover:bg-[#2B2520] hover:text-white'
                  : 'border border-white/90 text-white hover:bg-white hover:text-[#2B2520]'
              }`}
            >
              <span>PRENDRE RENDEZ-VOUS</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F5] text-[#2B2520] border-b border-[#E8DFD8] px-6 py-8 space-y-5 text-xs uppercase tracking-[0.2em] font-medium shadow-xl">
            <a href="#accueil" onClick={() => setMobileMenuOpen(false)} className="block py-1">Accueil</a>
            <a href="#soins" onClick={() => setMobileMenuOpen(false)} className="block py-1">Nos soins</a>
            <a href="#rituels" onClick={() => setMobileMenuOpen(false)} className="block py-1">Rituels</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="block py-1">L'expérience</a>
            <a href="#philosophie" onClick={() => setMobileMenuOpen(false)} className="block py-1">À propos</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-1">Contact</a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openBookingWithSoin('Rituel Signature');
              }}
              className="w-full mt-4 py-3 bg-[#2B2520] text-white text-center rounded-full font-bold uppercase tracking-widest text-xs"
            >
              Prendre rendez-vous
            </button>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (FULL SCREEN) ── */}
      <section
        id="accueil"
        className="relative min-h-screen w-full flex items-center justify-center bg-[#1E1A17] text-white overflow-hidden"
      >
        {/* Background Ultra-HD Photo */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: "url('/images/hero-editorial.jpg')",
          }}
        >
          {/* Subtle Warm Cinematic Shadow Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/45" />
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 flex flex-col items-center justify-center min-h-screen">
          
          {/* Superior Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] mb-6">
            <Sparkles className="size-3 text-amber-300" />
            <span>RITUELS DE BEAUTÉ • ANTILLES</span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light leading-[1.08] tracking-tight text-white max-w-4xl">
            La beauté à l’état naturel.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base md:text-lg text-stone-200 max-w-2xl mx-auto leading-relaxed font-light">
            Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat et vous offrir un véritable moment de bien-être.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto">
            <a
              href="#soins"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-[#2B2520] hover:bg-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-xl hover:scale-105 active:scale-95 text-center cursor-pointer"
            >
              DÉCOUVRIR NOS SOINS
            </a>

            <button
              type="button"
              onClick={() => openBookingWithSoin('Rituel Signature')}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/90 text-white hover:bg-white/15 backdrop-blur-xs text-xs uppercase tracking-[0.2em] font-semibold transition-all shadow-md hover:scale-105 active:scale-95 text-center cursor-pointer"
            >
              PRENDRE RENDEZ-VOUS
            </button>
          </div>

          {/* Discret Bottom Location Tag */}
          <div className="absolute bottom-8 inset-x-0 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/80 font-medium">
              Martinique &bull; Guadeloupe &bull; Caraïbes
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. SECTION INTRODUCTION / PHILOSOPHIE ── */}
      <section id="philosophie" className="py-24 sm:py-32 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Text Column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase tracking-[0.25em] text-[#8C684F] font-bold block">
                NOTRE PHILOSOPHIE
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2520] font-normal leading-tight">
                Prendre soin de soi devient un rituel.
              </h2>

              <p className="text-sm sm:text-base text-[#6B615B] leading-relaxed font-light">
                Chez Soie &amp; Terre, chaque soin est pensé comme une parenthèse. Un moment pour ralentir, respirer et retrouver l'essentiel.
              </p>

              <p className="text-sm sm:text-base text-[#6B615B] leading-relaxed font-light">
                Nous puisons dans la richesse des flores insulaires — fleur d’hibiscus, roucou, sucre de canne brut, vanille et huiles précieuses — pour composer des expériences holistiques qui honorent la peau et apaisent l’esprit.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-6 border-t border-[#E8DFD8]">
                <div>
                  <span className="font-serif text-3xl font-light text-[#2B2520]">100 %</span>
                  <p className="text-xs text-[#8C684F] uppercase tracking-wider font-semibold mt-1">Actifs naturels</p>
                </div>
                <div>
                  <span className="font-serif text-3xl font-light text-[#2B2520]">5 &starf;</span>
                  <p className="text-xs text-[#8C684F] uppercase tracking-wider font-semibold mt-1">Expérience Spa Luxe</p>
                </div>
              </div>
            </div>

            {/* Right Editorial Image Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[#E8DFD8]">
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80"
                  alt="Rituel spa et textures naturelles"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Floating Quote Badge */}
              <div className="absolute -bottom-6 -left-6 sm:bottom-6 sm:-left-8 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-[#E8DFD8] shadow-xl max-w-xs hidden sm:block">
                <Flower2 className="size-6 text-[#8C684F] mb-2" />
                <p className="font-serif italic text-xs text-[#2B2520] leading-relaxed">
                  « La nature est la plus haute forme d’art et de guérison. »
                </p>
                <span className="text-[10px] text-[#8C684F] uppercase tracking-widest block mt-2 font-bold">
                  Maison Soie &amp; Terre
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SECTION SOINS & RITUELS (CARTES INTERACTIVES) ── */}
      <section id="soins" className="py-24 sm:py-32 bg-[#F7F4EE] border-y border-[#E8DFD8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-xs uppercase tracking-[0.25em] text-[#8C684F] font-bold block mb-3">
              NOS EXPÉRIENCES
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#2B2520] font-normal tracking-tight">
              Des soins pensés pour vous.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#6B615B] font-light">
              Explorez notre carte de rituels sur-mesure, conçus pour sublimer votre peau et libérer les tensions.
            </p>
          </div>

          {/* 4 Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {SOINS_RITUELS.map((soin) => (
              <div
                key={soin.id}
                className="group relative bg-[#FAF8F5] rounded-3xl overflow-hidden border border-[#E8DFD8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Visual with Zoom Effect */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={soin.image}
                      alt={soin.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-3 left-3 bg-[#FAF8F5]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#8C684F] tracking-widest uppercase">
                      {soin.tag}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/75 text-white px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide">
                      {soin.duration} &bull; {soin.price}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6">
                    <span className="font-mono text-xs text-[#8C684F] font-bold tracking-widest">
                      {soin.number}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[#2B2520] mt-1 group-hover:text-[#8C684F] transition-colors">
                      {soin.title}
                    </h3>
                    <p className="text-[11px] uppercase tracking-wider text-[#8C684F] font-semibold mt-1">
                      {soin.category}
                    </p>
                    <p className="mt-3 text-xs text-[#6B615B] leading-relaxed line-clamp-3">
                      {soin.description}
                    </p>

                    {/* Key Benefits */}
                    <div className="mt-4 pt-4 border-t border-[#E8DFD8]/60 space-y-1.5">
                      {soin.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-[#6B615B]">
                          <Check className="size-3 text-[#8C684F]" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => openBookingWithSoin(`${soin.title} (${soin.duration} - ${soin.price})`)}
                    className="w-full py-3 rounded-full bg-[#2B2520] text-white group-hover:bg-[#8C684F] text-[10px] uppercase tracking-[0.18em] font-bold transition-all text-center flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>RÉSERVER CE SOIN</span>
                    <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SECTION RITUEL SIGNATURE (VOYAGE POUR LES SENS) ── */}
      <section id="rituels" className="relative py-28 sm:py-36 bg-[#2B2520] text-white overflow-hidden">
        {/* Background Image with Dark Texture */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80')",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#E8DFD8] text-xs uppercase tracking-[0.25em] font-medium mb-6">
            <Sparkles className="size-3 text-amber-300" />
            L'EXPÉRIENCE MAISON
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light text-white leading-tight">
            Un voyage pour les sens.
          </h2>

          <p className="mt-6 text-sm sm:text-base md:text-lg text-[#E8DFD8] max-w-2xl mx-auto leading-relaxed font-light">
            Des gestes précis, des textures délicates et des actifs inspirés de notre environnement pour créer une expérience unique.
          </p>

          {/* 4 Steps of the Signature Ritual */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="font-mono text-xs text-amber-300 font-bold">ÉTAPE 01</span>
              <h4 className="font-serif text-lg text-white mt-1">Bain Botanique</h4>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Immersion tiède aux sels marins et pétales frais d'hibiscus pour délier le corps.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="font-mono text-xs text-amber-300 font-bold">ÉTAPE 02</span>
              <h4 className="font-serif text-lg text-white mt-1">Gommage Sucre &amp; Coco</h4>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Exfoliation douce et parfumée pour un grain de peau infiniment soyeux.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="font-mono text-xs text-amber-300 font-bold">ÉTAPE 03</span>
              <h4 className="font-serif text-lg text-white mt-1">Modelage Holistique</h4>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Massage immersif aux huiles tiédies d'ylang-ylang et vanille Bourbon.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <span className="font-mono text-xs text-amber-300 font-bold">ÉTAPE 04</span>
              <h4 className="font-serif text-lg text-white mt-1">Infusion Sensorielle</h4>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                Dégustation d'une tisane locale aux vertus détoxifiantes au salon de repos.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <button
              type="button"
              onClick={() => openBookingWithSoin('Rituel Signature Voyage des Sens (120 min - 190 €)')}
              className="px-10 py-4 rounded-full bg-white text-[#2B2520] hover:bg-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              DÉCOUVRIR LE RITUEL
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. SECTION PRODUITS COSMÉTIQUES ── */}
      <section id="produits" className="py-24 sm:py-32 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[#8C684F] font-bold block mb-3">
              NOTRE BOUTIQUE BOTANIQUE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#2B2520] font-normal">
              La nature au cœur de nos soins.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6B615B] font-light">
              Prolongez l’expérience chez vous avec nos formulations pures composées d’ingrédients antillais certifiés.
            </p>
          </div>

          {/* 3 Products Minimal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUITS.map((produit) => (
              <div
                key={produit.id}
                className="group bg-white rounded-3xl p-6 border border-[#E8DFD8] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] mb-6">
                    <img
                      src={produit.image}
                      alt={produit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#8C684F] uppercase tracking-wider">
                      {produit.tag}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-xl text-[#2B2520] font-medium">
                      {produit.name}
                    </h3>
                    <span className="font-serif text-lg font-semibold text-[#8C684F]">
                      {produit.price}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C684F] font-medium uppercase tracking-wider mt-1">
                    {produit.subtitle} &bull; {produit.volume}
                  </p>

                  <p className="text-xs text-[#6B615B] mt-3 leading-relaxed">
                    {produit.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8DFD8]">
                  <button
                    type="button"
                    onClick={() => setCartCount((c) => c + 1)}
                    className="w-full py-3 rounded-full border border-[#2B2520] text-[#2B2520] hover:bg-[#2B2520] hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>AJOUTER AU PANIER</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SECTION EXPÉRIENCE & VALEURS ── */}
      <section id="experience" className="py-24 sm:py-32 bg-[#F7F4EE] border-t border-[#E8DFD8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] text-center space-y-4">
              <span className="font-mono text-sm text-[#8C684F] font-bold tracking-widest block">
                01 &mdash; EXPERTISE
              </span>
              <h3 className="font-serif text-2xl text-[#2B2520]">Précision &amp; Douceur</h3>
              <p className="text-xs sm:text-sm text-[#6B615B] leading-relaxed font-light">
                Des soins réalisés avec une attention méticuleuse par des praticiennes hautement qualifiées, pour un résultat visible et une détente profonde.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] text-center space-y-4">
              <span className="font-mono text-sm text-[#8C684F] font-bold tracking-widest block">
                02 &mdash; NATURE
              </span>
              <h3 className="font-serif text-2xl text-[#2B2520]">Flore des Caraïbes</h3>
              <p className="text-xs sm:text-sm text-[#6B615B] leading-relaxed font-light">
                Des ingrédients d’une pureté absolue, cueillis de manière éthique et respectueuse de la biodiversité des îles des Antilles.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD8] text-center space-y-4">
              <span className="font-mono text-sm text-[#8C684F] font-bold tracking-widest block">
                03 &mdash; BIEN-ÊTRE
              </span>
              <h3 className="font-serif text-2xl text-[#2B2520]">Parenthèse Intime</h3>
              <p className="text-xs sm:text-sm text-[#6B615B] leading-relaxed font-light">
                Un environnement feutré aux tonalités sable et bois pour suspendre le temps et revitaliser votre énergie vitale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. SECTION GALERIE & TÉMOIGNAGES ── */}
      <section className="py-24 sm:py-32 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.25em] text-[#8C684F] font-bold block mb-3">
              GALERIE &amp; AVIS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#2B2520] font-normal">
              L'écrin Soie &amp; Terre.
            </h2>
          </div>

          {/* Masonry-Style Photo Grid */}
          <div className="grid grid-cols-12 gap-4 sm:gap-6 mb-20">
            {GALERIE.map((item, index) => (
              <div
                key={index}
                className={`${item.span} group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-[#E8DFD8]`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                  <p className="text-white text-xs font-medium tracking-wide">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Slider / Quotes */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#E8DFD8] shadow-md text-center relative">
            <div className="flex justify-center text-amber-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>

            <p className="font-serif italic text-lg sm:text-2xl text-[#2B2520] leading-relaxed">
              « {TEMOIGNAGES[activeTestimonial]?.text} »
            </p>

            <div className="mt-6">
              <span className="font-bold text-sm text-[#2B2520] block">
                {TEMOIGNAGES[activeTestimonial]?.author}
              </span>
              <span className="text-xs text-[#8C684F] uppercase tracking-wider block mt-0.5">
                {TEMOIGNAGES[activeTestimonial]?.location} &bull; {TEMOIGNAGES[activeTestimonial]?.soin}
              </span>
            </div>

            {/* Slider Navigation */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {TEMOIGNAGES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  className={`size-2.5 rounded-full transition-all cursor-pointer ${
                    activeTestimonial === idx ? 'bg-[#8C684F] w-6' : 'bg-[#E8DFD8]'
                  }`}
                  aria-label={`Témoignage ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. MODAL DE RÉSERVATION INTERACTIVE ── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl border border-[#E8DFD8] shadow-2xl p-6 sm:p-8 text-[#2B2520] max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[#6B615B] hover:text-[#2B2520] rounded-full hover:bg-[#E8DFD8]/50 transition-colors"
              aria-label="Fermer la modal"
            >
              <X className="size-5" />
            </button>

            {!bookingConfirmed ? (
              <>
                <div className="mb-6">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C684F] font-bold block mb-1">
                    RÉSERVATION EN LIGNE
                  </span>
                  <h3 className="font-serif text-2xl text-[#2B2520] font-normal">
                    Réservez votre parenthèse.
                  </h3>
                  <p className="text-xs text-[#6B615B] mt-1">
                    Choisissez votre soin et l’horaire qui vous convient.
                  </p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Select Soin */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                      Soin souhaité
                    </label>
                    <select
                      value={bookingForm.soin}
                      onChange={(e) => setBookingForm({ ...bookingForm, soin: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none"
                    >
                      <option>Rituels Signature (120 min - 190 €)</option>
                      <option>Soins du Visage Éclat (60 min - 95 €)</option>
                      <option>Soins du Corps Gommage &amp; Argile (50 min - 85 €)</option>
                      <option>Massages Holistiques Ylang-Ylang (75 min - 120 €)</option>
                    </select>
                  </div>

                  {/* Date & Hour */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                        Créneau horaire
                      </label>
                      <select
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none"
                      >
                        <option>10:00</option>
                        <option>11:30</option>
                        <option>14:00</option>
                        <option>14:30</option>
                        <option>16:00</option>
                        <option>17:30</option>
                      </select>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Camille Robert"
                      value={bookingForm.fullName}
                      onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none placeholder:text-stone-400"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0696 XX XX XX"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#2B2520] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="camille@exemple.com"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E8DFD8] text-xs text-[#2B2520] focus:ring-1 focus:ring-[#8C684F] focus:outline-none placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full mt-4 py-3.5 rounded-full bg-[#2B2520] text-white hover:bg-[#8C684F] text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-lg cursor-pointer"
                  >
                    CONFIRMER LA PRÉ-RÉSERVATION
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="size-16 rounded-full bg-[#8C684F]/15 text-[#8C684F] flex items-center justify-center mx-auto">
                  <Check className="size-8" />
                </div>

                <h3 className="font-serif text-2xl text-[#2B2520]">
                  Réservation confirmée.
                </h3>

                <p className="text-xs text-[#6B615B] leading-relaxed max-w-sm mx-auto">
                  Merci {bookingForm.fullName || 'chère cliente'}. Votre rendez-vous pour le <strong>{bookingForm.soin}</strong> le <strong>{bookingForm.date}</strong> à <strong>{bookingForm.time}</strong> a bien été enregistré.
                </p>

                <div className="p-4 rounded-xl bg-white border border-[#E8DFD8] text-[11px] text-[#6B615B] space-y-1 text-left">
                  <p><strong>Lieu :</strong> Maison Soie &amp; Terre, Cap Est</p>
                  <p><strong>Confirmation :</strong> Envoyée par SMS au {bookingForm.phone || '0696 XX XX XX'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-8 py-3 rounded-full bg-[#2B2520] text-white text-xs uppercase tracking-widest font-bold mt-4"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 10. FOOTER ── */}
      <footer id="contact" className="bg-[#2B2520] text-[#E8DFD8] pt-20 pb-12 border-t border-[#3D352F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#3D352F]">
            
            {/* Column 1: Brand */}
            <div className="md:col-span-5 space-y-4">
              <span className="font-serif text-2xl tracking-[0.25em] uppercase text-white font-light block">
                SOIE &amp; TERRE
              </span>
              <p className="text-xs font-light text-stone-300 leading-relaxed max-w-sm">
                Maison de beauté et de bien-être holistique inspirée de la générosité des flores caribéennes.
              </p>
              <p className="text-[11px] text-amber-300/90 tracking-widest uppercase font-medium">
                La beauté à l'état naturel.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-white block mb-4">
                NAVIGATION
              </span>
              <ul className="space-y-2 text-xs text-stone-300">
                <li><a href="#accueil" className="hover:text-white transition-colors">Accueil</a></li>
                <li><a href="#soins" className="hover:text-white transition-colors">Soins du corps &amp; visage</a></li>
                <li><a href="#rituels" className="hover:text-white transition-colors">Rituels Signature</a></li>
                <li><a href="#produits" className="hover:text-white transition-colors">Boutique Botanique</a></li>
                <li><a href="#philosophie" className="hover:text-white transition-colors">Notre Philosophie</a></li>
              </ul>
            </div>

            {/* Column 3: Newsletter */}
            <div className="md:col-span-4 space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-white block">
                LETTRE BOTANIQUE
              </span>
              <p className="text-xs text-stone-300 leading-relaxed">
                Recevez nos invitations privées, conseils rituels et lancements de cosmétiques saisonniers.
              </p>

              {!newsletterSubmitted ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail) setNewsletterSubmitted(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder:text-stone-400 focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-white text-[#2B2520] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    S'inscrire
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-full bg-white/10 border border-white/20 text-xs text-white text-center">
                  Merci, vous êtes bien inscrit(e).
                </div>
              )}
            </div>
          </div>

          {/* Bottom Copyright & Agency Credits */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-4">
            <p>&copy; 2026 Soie &amp; Terre &mdash; Tous droits réservés.</p>
            <p className="text-stone-300 font-medium">
              Site réalisé par <strong className="text-white">HBG Labs</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
