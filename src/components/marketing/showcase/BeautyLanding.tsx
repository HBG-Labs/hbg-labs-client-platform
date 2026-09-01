import { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Check, 
  Star, 
  ArrowRight, 
  Leaf, 
  X, 
  Menu,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';

export interface SoinItem {
  id: string;
  title: string;
  duration: string;
  price: string;
  tag: string;
  description: string;
  ingredients: string[];
}

const SOINS: SoinItem[] = [
  {
    id: '1',
    title: 'Gommage Velours Sucre de Canne & Coco',
    duration: '45 min',
    price: '75 €',
    tag: 'Soin signature',
    description: 'Exfoliation douce aux cristaux de sucre de canne bio et pulpe de coco fraîche. La peau retrouve souplesse et éclat soyeux.',
    ingredients: ['Sucre de canne bio', 'Huile de coco vierge', 'Fleur d’hibiscus'],
  },
  {
    id: '2',
    title: 'Soin Visage Éclat Goyave & Hibiscus',
    duration: '60 min',
    price: '95 €',
    tag: 'Best-seller',
    description: 'Infusion antioxydante d’extraits de goyave sauvage et d’acides doux de fleurs d’hibiscus pour un teint lumineux et reposé.',
    ingredients: ['Extrait de goyave', 'Hydrolat d’hibiscus', 'Acide hyaluronique végétal'],
  },
  {
    id: '3',
    title: 'Massage Holistique Bois Bandé & Ylang-Ylang',
    duration: '75 min',
    price: '120 €',
    tag: 'Détente profonde',
    description: 'Manœuvres lentes et enveloppantes aux huiles végétales tiédies de bois bandé et ylang-ylang pour dénouer les tensions.',
    ingredients: ['Huile de bois bandé', 'Ylang-ylang sauvage', 'Macérât de vanille'],
  },
  {
    id: '4',
    title: 'Enveloppement Régénérant Argile Rouge & Aloé',
    duration: '50 min',
    price: '85 €',
    tag: 'Détox & Minéraux',
    description: 'Masque corporel tiède à l’argile volcanique rouge enrichie en pulpe d’aloé vera fraîchement cueillie.',
    ingredients: ['Argile rouge minérale', 'Gel d’aloé vera pur', 'Eau florale de rose'],
  },
];

const PRODUITS = [
  {
    id: 'p1',
    name: 'Élixir Botanique Éclat Solaire',
    volume: '30 ml',
    price: '48 €',
    tag: 'Sérum visage',
    description: 'Concentré de 7 huiles précieuses caribéennes pour nourrir et illuminer la peau.',
  },
  {
    id: 'p2',
    name: 'Brume Florale Hibiscus & Rose Sauvage',
    volume: '100 ml',
    price: '32 €',
    tag: 'Tonique apaisant',
    description: 'Hydratation instantanée et protection contre les agressions extérieures.',
  },
  {
    id: 'p3',
    name: 'Baume Fondant Karité & Vanille Noire',
    volume: '150 ml',
    price: '39 €',
    tag: 'Corps & Mains',
    description: 'Nutrition intense et parfum subtil de gousse de vanille Bourbon.',
  },
];

const AVIS = [
  {
    name: 'Élodie M.',
    location: 'Fort-de-France',
    rating: 5,
    comment: 'Une expérience sensorielle hors du temps. Le gommage coco et le massage ylang-ylang m’ont procuré une détente absolue.',
    soin: 'Massage Holistique',
  },
  {
    name: 'Camille D.',
    location: 'Les Trois-Îlets',
    rating: 5,
    comment: 'Des cosmétiques d’une pureté rare. Ma peau sensible tolère parfaitement l’élixir botanique.',
    soin: 'Soin Visage Éclat',
  },
  {
    name: 'Sarah L.',
    location: 'Le Diamant',
    rating: 5,
    comment: 'Cadre sublime, accueil bienveillant et soins d’exception. Je réserve mon rituel chaque mois.',
    soin: 'Rituel Renaissance',
  },
];

export function BeautyLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSoin, setSelectedSoin] = useState<SoinItem>(SOINS[0]!);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const handleBook = (soin: SoinItem) => {
    setSelectedSoin(soin);
    setBookingModalOpen(true);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2724] font-sans antialiased selection:bg-[#EAE3D9] selection:text-[#2C2724]">
      {/* ── Top Announcement ── */}
      <div className="bg-[#4A5B4E] text-[#FAF8F5] text-xs py-2 text-center tracking-widest uppercase font-medium">
        Rituel d’accueil offert pour toute première réservation en ligne
      </div>

      {/* ── Brand Header ── */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl sm:text-3xl tracking-widest text-[#2C2724] uppercase font-normal">
              Soie &amp; Terre
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-[#8C684F] border-l border-[#EAE3D9] pl-3">
              Maison de Beauté &bull; Caraïbes
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-medium text-[#6B615B]">
            <a href="#soins" className="hover:text-[#2C2724] transition-colors">Soins Signature</a>
            <a href="#rituels" className="hover:text-[#2C2724] transition-colors">Nos Rituels</a>
            <a href="#produits" className="hover:text-[#2C2724] transition-colors">Boutique Botanique</a>
            <a href="#philosophie" className="hover:text-[#2C2724] transition-colors">Philosophie</a>
            <a href="#avis" className="hover:text-[#2C2724] transition-colors">Avis</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setCartCount((c) => c + 1)}
              className="relative p-2 text-[#6B615B] hover:text-[#2C2724] transition-colors"
              aria-label="Panier d’achats"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 size-4 bg-[#8C684F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleBook(SOINS[0]!)}
              className="hidden sm:inline-flex items-center gap-2 bg-[#2C2724] text-[#FAF8F5] text-xs uppercase tracking-widest font-medium px-5 py-2.5 rounded-full hover:bg-[#8C684F] transition-all shadow-xs"
            >
              <Calendar className="size-3.5" />
              Prendre rendez-vous
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#2C2724]"
              aria-label="Menu"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#EAE3D9] bg-[#FAF8F5] px-6 py-6 space-y-4 text-xs uppercase tracking-widest font-medium">
            <a href="#soins" onClick={() => setMobileMenuOpen(false)} className="block py-1">Soins Signature</a>
            <a href="#rituels" onClick={() => setMobileMenuOpen(false)} className="block py-1">Nos Rituels</a>
            <a href="#produits" onClick={() => setMobileMenuOpen(false)} className="block py-1">Boutique Botanique</a>
            <a href="#philosophie" onClick={() => setMobileMenuOpen(false)} className="block py-1">Philosophie</a>
            <a href="#avis" onClick={() => setMobileMenuOpen(false)} className="block py-1">Avis</a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleBook(SOINS[0]!);
              }}
              className="w-full mt-4 bg-[#2C2724] text-[#FAF8F5] py-3 rounded-full uppercase tracking-widest text-xs font-semibold"
            >
              Prendre rendez-vous
            </button>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#EAE3D9]/40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#4A5B4E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#8C684F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EAE3D9] text-[#8C684F] text-xs font-medium uppercase tracking-widest mb-6">
            <Sparkles className="size-3.5" />
            Maison de bien-être caribéenne
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#2C2724] leading-[1.08]">
            La beauté à l’état naturel.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#6B615B] max-w-2xl mx-auto leading-relaxed">
            Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat à travers des rituels sensoriels et holistiques.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#soins"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#2C2724] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold hover:bg-[#8C684F] transition-all shadow-md"
            >
              Découvrir nos soins
            </a>
            <button
              type="button"
              onClick={() => handleBook(SOINS[0]!)}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#2C2724] text-[#2C2724] text-xs uppercase tracking-widest font-semibold hover:bg-[#2C2724] hover:text-[#FAF8F5] transition-all"
            >
              Prendre rendez-vous
            </button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-4 border-t border-[#EAE3D9] pt-8 max-w-xl mx-auto text-center">
            <div>
              <p className="font-serif text-2xl sm:text-3xl text-[#2C2724]">100 %</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C684F] mt-1">Actifs naturels</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl text-[#2C2724]">12</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C684F] mt-1">Rituels exclusifs</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl text-[#2C2724]">4.9/5</p>
              <p className="text-[11px] uppercase tracking-wider text-[#8C684F] mt-1">Satisfaction clientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Soins Signature ── */}
      <section id="soins" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-[#8C684F] font-semibold">Exclusivités</span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-[#2C2724]">Nos Soins Signature</h2>
          <p className="mt-3 text-sm text-[#6B615B]">
            Chaque soin associe le toucher thérapeutique à des actifs botaniques fraîchement extraits.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {SOINS.map((soin) => (
            <div
              key={soin.id}
              className="group relative rounded-2xl border border-[#EAE3D9] bg-[#FAF8F5] p-8 transition-all hover:border-[#8C684F] hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAE3D9] text-[#8C684F] font-medium">
                    {soin.tag}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-[#6B615B]">
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> {soin.duration}</span>
                    <span className="font-serif text-xl font-medium text-[#2C2724]">{soin.price}</span>
                  </div>
                </div>

                <h3 className="mt-5 font-serif text-2xl text-[#2C2724] group-hover:text-[#8C684F] transition-colors">
                  {soin.title}
                </h3>

                <p className="mt-3 text-sm text-[#6B615B] leading-relaxed">
                  {soin.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {soin.ingredients.map((ing) => (
                    <span key={ing} className="inline-flex items-center gap-1 text-[11px] text-[#4A5B4E] bg-[#4A5B4E]/10 px-2.5 py-1 rounded-md">
                      <Leaf className="size-3" />
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#EAE3D9] flex items-center justify-between">
                <span className="text-xs text-[#8C684F] font-medium">Réservation instantanée</span>
                <button
                  type="button"
                  onClick={() => handleBook(soin)}
                  className="inline-flex items-center gap-2 bg-[#2C2724] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full hover:bg-[#8C684F] transition-all"
                >
                  Réserver ce soin
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Boutique Botanique ── */}
      <section id="produits" className="py-24 bg-[#EAE3D9]/30 border-y border-[#EAE3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8C684F] font-semibold">Cosmétiques purs</span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-[#2C2724]">Prolongez le Rituel chez Vous</h2>
            </div>
            <p className="text-sm text-[#6B615B] max-w-md">
              Nos formules botaniques sont fabriquées artisanalement en séries limitées aux Antilles.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PRODUITS.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#EAE3D9] bg-[#FAF8F5] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C684F] font-semibold">{p.tag}</span>
                  <h3 className="mt-2 font-serif text-xl text-[#2C2724]">{p.name}</h3>
                  <p className="mt-1 text-xs text-[#8C684F]">{p.volume}</p>
                  <p className="mt-3 text-xs text-[#6B615B] leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EAE3D9] flex items-center justify-between">
                  <span className="font-serif text-xl text-[#2C2724]">{p.price}</span>
                  <button
                    type="button"
                    onClick={() => setCartCount((c) => c + 1)}
                    className="inline-flex items-center gap-1.5 text-xs bg-[#4A5B4E] text-white px-4 py-2 rounded-full hover:bg-[#2C2724] transition-colors"
                  >
                    <ShoppingBag className="size-3" />
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophie ── */}
      <section id="philosophie" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-xs uppercase tracking-widest text-[#8C684F] font-semibold">Notre Engagement</span>
        <h2 className="mt-3 font-serif text-3xl sm:text-5xl text-[#2C2724] leading-tight">
          « Puiser la puissance de la terre sans altérer son équilibre. »
        </h2>
        <p className="mt-6 text-base text-[#6B615B] leading-relaxed max-w-2xl mx-auto">
          Soie &amp; Terre célèbre la biodiversité des îles caribéennes. Tous nos ingrédients sont issus de récoltes durables et respectueuses des sols, sans additifs de synthèse ni conservateurs agressifs.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-8 text-xs uppercase tracking-widest text-[#4A5B4E] font-medium">
          <span className="flex items-center gap-2"><Check className="size-4" /> 100 % Végétal &amp; Bio</span>
          <span className="flex items-center gap-2"><Check className="size-4" /> Flaconnage en verre recyclable</span>
          <span className="flex items-center gap-2"><Check className="size-4" /> Cueillette éco-responsable</span>
        </div>
      </section>

      {/* ── Avis Clientes ── */}
      <section id="avis" className="py-20 bg-[#FAF8F5] border-t border-[#EAE3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#8C684F] font-semibold">Témoignages</span>
            <h2 className="mt-2 font-serif text-3xl text-[#2C2724]">L’Expérience Vécue</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {AVIS.map((a) => (
              <div key={a.name} className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-xs">
                <div className="flex gap-1 text-[#8C684F]">
                  {[...Array(a.rating)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#6B615B] italic">
                  « {a.comment} »
                </p>
                <div className="mt-6 pt-4 border-t border-[#EAE3D9] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#2C2724]">{a.name}</p>
                    <p className="text-[11px] text-[#8C684F]">{a.location}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-[#FAF8F5] text-[#4A5B4E]">
                    {a.soin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#2C2724] text-[#FAF8F5] py-16 border-t border-[#443D39]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4 text-xs">
          <div>
            <span className="font-serif text-2xl uppercase tracking-widest block font-normal">Soie &amp; Terre</span>
            <p className="mt-3 text-[#A89F99] leading-relaxed">
              Maison de beauté et soins holistiques inspirés de la nature des Antilles.
            </p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-[#EAE3D9] font-semibold mb-3">Horaires d’ouverture</h4>
            <p className="text-[#A89F99]">Mardi au Samedi</p>
            <p className="text-[#FAF8F5] font-medium mt-1">9h30 &ndash; 19h00</p>
            <p className="text-[#A89F99] mt-2">Dimanche &amp; Lundi : Fermé</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-[#EAE3D9] font-semibold mb-3">Maison Principale</h4>
            <p className="text-[#A89F99]">14 Rue des Bougainvilliers</p>
            <p className="text-[#A89F99]">97200 Fort-de-France &bull; Martinique</p>
            <p className="text-[#FAF8F5] font-medium mt-2">+596 596 00 00 00</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-[#EAE3D9] font-semibold mb-3">Newsletter Beauté</h4>
            <p className="text-[#A89F99] mb-3">Recevez nos rituels saisonniers et invitations privées.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                className="bg-[#3D3632] border border-[#524A44] rounded-full px-3 py-2 text-xs text-white focus:outline-none w-full"
              />
              <button type="button" className="bg-[#8C684F] text-white px-4 py-2 rounded-full font-semibold">
                OK
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-[#3D3632] text-center text-[11px] text-[#A89F99]">
          &copy; {new Date().getFullYear()} Soie &amp; Terre. Tous droits réservés. Maquette interactive conçue par HBG Labs.
        </div>
      </footer>

      {/* ── Modal de Réservation Interactive ── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF8F5] p-6 sm:p-8 shadow-2xl border border-[#EAE3D9] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#6B615B] hover:text-[#2C2724]"
            >
              <X className="size-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto size-16 rounded-full bg-[#4A5B4E]/10 text-[#4A5B4E] flex items-center justify-center mb-4">
                  <ShieldCheck className="size-8" />
                </div>
                <h3 className="font-serif text-2xl text-[#2C2724]">Réservation Confirmée</h3>
                <p className="mt-2 text-xs text-[#6B615B] leading-relaxed">
                  Votre séance pour <strong>{selectedSoin.title}</strong> a été simulée avec succès. Un SMS et un e-mail de rappel vous ont été adressés.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="mt-6 px-6 py-3 bg-[#2C2724] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#8C684F]"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C684F] font-semibold">Réservation en direct</span>
                  <h3 className="font-serif text-2xl text-[#2C2724] mt-1">Prendre Rendez-vous</h3>
                </div>

                <div className="p-4 rounded-xl bg-[#EAE3D9]/50 border border-[#EAE3D9]">
                  <p className="text-xs font-semibold text-[#2C2724]">{selectedSoin.title}</p>
                  <p className="text-[11px] text-[#6B615B] mt-0.5">{selectedSoin.duration} &bull; {selectedSoin.price}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6B615B] mb-1">Date souhaitée</label>
                    <input
                      type="date"
                      required
                      defaultValue="2026-09-15"
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C2724] focus:outline-none focus:border-[#8C684F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6B615B] mb-1">Créneau horaire</label>
                    <select className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C2724] focus:outline-none focus:border-[#8C684F]">
                      <option>10h00 &ndash; 11h00</option>
                      <option>11h30 &ndash; 12h30</option>
                      <option>14h30 &ndash; 15h30</option>
                      <option>16h00 &ndash; 17h00</option>
                      <option>17h30 &ndash; 18h30</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6B615B] mb-1">Votre Nom &amp; Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Sophie Martin"
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C2724] focus:outline-none focus:border-[#8C684F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6B615B] mb-1">Téléphone portable</label>
                  <input
                    type="tel"
                    required
                    placeholder="+596 696 00 00 00"
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-xs text-[#2C2724] focus:outline-none focus:border-[#8C684F]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#2C2724] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#8C684F] transition-colors shadow-md"
                  >
                    Confirmer la réservation ({selectedSoin.price})
                  </button>
                  <p className="text-[10px] text-center text-[#8C684F] mt-2">
                    Annulation sans frais jusqu’à 24h avant le soin
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
