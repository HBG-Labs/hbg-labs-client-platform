import { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Search, 
  Heart, 
  Bed, 
  Maximize2, 
  Key, 
  ArrowRight, 
  X, 
  Menu,
  ShieldCheck
} from 'lucide-react';

export interface PropertyItem {
  id: string;
  title: string;
  type: string;
  location: string;
  price: string;
  bedrooms: number;
  surface: string;
  tag: string;
  description: string;
}

const PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-1',
    title: 'Villa Céleste &bull; Vue Mer Panoramique',
    type: 'VILLA',
    location: 'St-Barthélemy &bull; Gustavia',
    price: '8 900 000 €',
    bedrooms: 6,
    surface: '680 m²',
    tag: 'Exclusivité Privée',
    description: 'Piscine à débordement 25m, accès direct anse privée, architecture minimaliste signée et héliport.',
  },
  {
    id: 'prop-2',
    title: 'Domaine du Cap &bull; Pieds dans l’Eau',
    type: 'DOMAINE',
    location: 'Martinique &bull; Le François',
    price: '4 200 000 €',
    bedrooms: 7,
    surface: '820 m²',
    tag: 'Front de Mer',
    description: 'Ponton privé sécurisé pour yacht, 8 000 m² de parc tropical arboré, maison de gardien indépendante.',
  },
  {
    id: 'prop-3',
    title: 'Villa Émeraude &bull; Lagon &amp; Golf',
    type: 'VILLA',
    location: 'Guadeloupe &bull; Saint-François',
    price: '3 450 000 €',
    bedrooms: 5,
    surface: '520 m²',
    tag: 'Coup de Cœur',
    description: 'Vue imprenable sur le lagon, terrasse en teck de 300 m², suite parentale avec spa extérieur.',
  },
  {
    id: 'prop-4',
    title: 'Penthouse Alizé &bull; Rooftop 360°',
    type: 'PENTHOUSE',
    location: 'Saint-Martin &bull; Terres Basses',
    price: '2 850 000 €',
    bedrooms: 4,
    surface: '390 m²',
    tag: 'Rooftop Privé',
    description: 'Dernier étage avec piscine privée en toiture, ascenseur direct sécurisé et vue coucher de soleil.',
  },
];

export function RealEstateLanding() {
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem>(PROPERTIES[0]!);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenContact = (property: PropertyItem) => {
    setSelectedProperty(property);
    setContactModalOpen(true);
    setContactSuccess(false);
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
  };

  const filteredProperties = PROPERTIES.filter((p) => {
    const matchType = selectedType === 'ALL' || p.type === selectedType;
    const matchLoc = selectedLocation === 'ALL' || p.location.includes(selectedLocation);
    return matchType && matchLoc;
  });

  return (
    <div className="min-h-screen bg-[#0B131F] text-[#E2E8F0] font-sans antialiased selection:bg-[#0E7490] selection:text-white">
      {/* ── Top Bar Prestige ── */}
      <div className="bg-[#070D16] text-[#94A3B8] text-xs py-2 px-4 border-b border-[#1E293B] flex items-center justify-between">
        <span className="flex items-center gap-2 text-[#CBD5E1]">
          <span className="size-2 rounded-full bg-[#0E7490]" />
          Cabinet Immobilier d’Exception &bull; Caraïbes
        </span>
        <div className="hidden sm:flex items-center gap-6">
          <span>St-Barth &bull; Martinique &bull; Guadeloupe &bull; Paris</span>
          <a href="tel:+596596000000" className="text-[#0E7490] font-semibold hover:underline">
            Ligne Confidentielle VIP
          </a>
        </div>
      </div>

      {/* ── Brand Header ── */}
      <header className="sticky top-0 z-40 bg-[#0B131F]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="size-6 text-[#0E7490]" />
            <div>
              <span className="font-serif text-2xl tracking-widest text-white uppercase font-normal block leading-none">
                Horizons Prestige
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#0E7490] font-mono">
                Propriétés &amp; Domaines d’Exception
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-medium text-[#94A3B8]">
            <a href="#recherche" className="hover:text-white transition-colors">Rechercher</a>
            <a href="#proprietes" className="hover:text-white transition-colors">Propriétés</a>
            <a href="#destinations" className="hover:text-white transition-colors">Destinations</a>
            <a href="#estimation" className="hover:text-white transition-colors">Vendre &amp; Estimer</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenContact(PROPERTIES[0]!)}
              className="inline-flex items-center gap-2 bg-[#0E7490] text-white text-xs uppercase tracking-widest font-semibold px-6 py-3 rounded-full hover:bg-[#0891B2] transition-all shadow-md shadow-[#0E7490]/20"
            >
              <Key className="size-3.5" />
              Accès Dossier Privé
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
              aria-label="Menu"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#070D16] border-b border-[#1E293B] px-6 py-6 space-y-4 text-xs uppercase tracking-widest font-medium">
            <a href="#recherche" onClick={() => setMobileMenuOpen(false)} className="block py-1">Rechercher</a>
            <a href="#proprietes" onClick={() => setMobileMenuOpen(false)} className="block py-1">Propriétés</a>
            <a href="#destinations" onClick={() => setMobileMenuOpen(false)} className="block py-1">Destinations</a>
            <a href="#estimation" onClick={() => setMobileMenuOpen(false)} className="block py-1">Vendre &amp; Estimer</a>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#1E293B] overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#0B131F]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0E7490]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-[#0E7490] text-xs font-medium uppercase tracking-widest mb-6">
            <Building className="size-3.5" />
            Immobilier d’Exception aux Antilles
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white leading-[1.08]">
            Votre horizon commence ici.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Découvrez une sélection confidentielle de villas contemporaines, domaines pieds dans l’eau et résidences d’exception.
          </p>
        </div>

        {/* ── Moteur de Recherche Interactif ── */}
        <div id="recherche" className="mt-12 max-w-4xl mx-auto bg-[#1E293B]/90 backdrop-blur-md rounded-2xl border border-[#334155] p-6 shadow-2xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold mb-1.5">
                Type de bien
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#0B131F] border border-[#334155] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0E7490]"
              >
                <option value="ALL">Tous types de biens</option>
                <option value="VILLA">Villas d’architecte</option>
                <option value="DOMAINE">Domaines d’exception</option>
                <option value="PENTHOUSE">Penthouses &amp; Rooftops</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold mb-1.5">
                Localisation
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#0B131F] border border-[#334155] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0E7490]"
              >
                <option value="ALL">Toutes les îles</option>
                <option value="St-Barth">Saint-Barthélemy</option>
                <option value="Martinique">Martinique</option>
                <option value="Guadeloupe">Guadeloupe</option>
                <option value="Saint-Martin">Saint-Martin</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="w-full py-2.5 bg-[#0E7490] text-white text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-[#0891B2] transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="size-4" />
                Afficher ({filteredProperties.length} biens)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Propriétés à la Une ── */}
      <section id="proprietes" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1E293B] pb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#0E7490] font-semibold">Portfolio Exclusif</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-white">Sélection Confidentielle</h2>
          </div>
          <p className="text-xs text-[#94A3B8] max-w-md">
            Dossiers complets, plans d’architecte et visites privées accessibles sur simple demande qualifiée.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-7 transition-all hover:border-[#0E7490] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-[#0E7490]/20 text-[#0E7490] font-bold">
                    {p.tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p.id)}
                    className="p-2 text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                    aria-label="Ajouter aux favoris"
                  >
                    <Heart className={`size-5 ${favorites[p.id] ? 'fill-[#EF4444] text-[#EF4444]' : ''}`} />
                  </button>
                </div>

                <h3 className="mt-4 font-serif text-2xl text-white">{p.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#94A3B8]">
                  <MapPin className="size-3.5 text-[#0E7490]" /> {p.location}
                </p>

                <p className="mt-3 text-xs text-[#94A3B8] leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-6 flex items-center gap-6 text-xs text-[#CBD5E1] border-y border-[#1E293B] py-3">
                  <span className="flex items-center gap-1.5"><Bed className="size-4 text-[#0E7490]" /> {p.bedrooms} suites</span>
                  <span className="flex items-center gap-1.5"><Maximize2 className="size-4 text-[#0E7490]" /> {p.surface}</span>
                </div>
              </div>

              <div className="mt-6 pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">Prix de présentation</span>
                  <span className="font-serif text-2xl text-white font-medium">{p.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenContact(p)}
                  className="inline-flex items-center gap-2 bg-[#0E7490] text-white text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full hover:bg-[#0891B2] transition-all"
                >
                  Visite privée
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chiffres Clés & Confiance ── */}
      <section className="py-20 bg-[#070D16] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 sm:grid-cols-3 text-center">
          <div>
            <p className="font-serif text-4xl text-white">120M €</p>
            <p className="text-xs uppercase tracking-widest text-[#0E7490] mt-2">Volume sous mandat</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-white">98 %</p>
            <p className="text-xs uppercase tracking-widest text-[#0E7490] mt-2">Mandats exclusifs</p>
          </div>
          <div>
            <p className="font-serif text-4xl text-white">15 Jours</p>
            <p className="text-xs uppercase tracking-widest text-[#0E7490] mt-2">Délai moyen mise en relation</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#050910] text-[#64748B] py-16 border-t border-[#1E293B] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-serif text-2xl uppercase tracking-widest text-white block">
              Horizons Prestige
            </span>
            <p className="mt-3 leading-relaxed">
              Cabinet immobilier spécialisé dans la transaction et le conseil en investissement d’exception aux Antilles.
            </p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-3">Bureaux Privés</h4>
            <p>Gustavia &bull; Saint-Barthélemy</p>
            <p className="mt-1">Fort-de-France &bull; Martinique</p>
            <p className="mt-1">Saint-François &bull; Guadeloupe</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-3">Discrétion &amp; Secret</h4>
            <p className="leading-relaxed">Tous nos échanges et dossiers de commercialisation sont soumis à un accord de confidentialité strict (NDA).</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-3">Contact Direct</h4>
            <p className="text-white font-mono">+596 596 00 00 00</p>
            <p className="mt-1">vip@horizons-prestige.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-[#1E293B] text-center text-[11px] text-[#475569]">
          &copy; {new Date().getFullYear()} Horizons Prestige. Maquette interactive conçue par HBG Labs.
        </div>
      </footer>

      {/* ── Modal Visite Privée / Dossier ── */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] p-6 sm:p-8 shadow-2xl border border-[#334155] text-white">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="size-5" />
            </button>

            {contactSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto size-16 rounded-full bg-[#0E7490]/20 text-[#0E7490] flex items-center justify-center mb-4">
                  <ShieldCheck className="size-8" />
                </div>
                <h3 className="font-serif text-2xl text-white">Demande Transmise</h3>
                <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                  Votre demande pour <strong>{selectedProperty.title}</strong> a été enregistrée avec succès. Un conseiller privé vous contactera en toute discrétion.
                </p>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="mt-6 px-6 py-3 bg-[#0E7490] text-white text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#0891B2]"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#0E7490] font-semibold">Service Privé</span>
                  <h3 className="font-serif text-2xl text-white mt-1">Dossier &amp; Visite Privée</h3>
                </div>

                <div className="p-4 rounded-xl bg-[#1E293B] border border-[#334155]">
                  <p className="text-xs font-semibold text-white">{selectedProperty.title}</p>
                  <p className="text-[11px] text-[#0E7490] mt-0.5">{selectedProperty.location} &bull; {selectedProperty.price}</p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1">Votre Nom &amp; Titre</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. M. Alexandre V."
                    className="w-full bg-[#0B131F] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0E7490]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1">E-mail confidentiel</label>
                    <input
                      type="email"
                      required
                      placeholder="alexandre@domaine.com"
                      className="w-full bg-[#0B131F] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0E7490]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1">Téléphone</label>
                    <input
                      type="tel"
                      required
                      placeholder="+596 696 00 00 00"
                      className="w-full bg-[#0B131F] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0E7490]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="nda" required defaultChecked className="rounded text-[#0E7490] focus:ring-0" />
                  <label htmlFor="nda" className="text-[11px] text-[#94A3B8]">
                    J’accepte l’accord de confidentialité et de discrétion partagée.
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0E7490] text-white text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#0891B2] transition-colors shadow-lg"
                  >
                    Recevoir le dossier d'investissement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
