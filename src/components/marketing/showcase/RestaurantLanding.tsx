import { useState } from 'react';
import { 
  Flame, 
  UtensilsCrossed, 
  Wine, 
  MapPin, 
  Clock, 
  X, 
  Menu,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const MENU_CATEGORIES = [
  {
    id: 'ENTREES',
    name: 'Entrées du Potager & de la Mer',
    items: [
      {
        title: 'Carpaccio de Thon Rouge des Côtes & Huile de Roucou',
        price: '22 €',
        description: 'Taillé au couteau, condiment maracudja givré, pickles d’échalotes pays et émulsion combawa.',
      },
      {
        title: 'Giraumon Braisé aux Braises de Bois d’Inde',
        price: '18 €',
        description: 'Rôti lentement à cœur, crème fumée de pois de bois, graines de courge caramélisées à la mélasse.',
      },
      {
        title: 'Céviche de Vivaneau Sauvage & Eau de Tomate Pimentée',
        price: '24 €',
        description: 'Lait de coco pressé minute, coriandre fraîche des mornes et éclats de chips de manioc doré.',
      },
    ],
  },
  {
    id: 'BRAISES',
    name: 'Les Grandes Pièces au Feu de Bois',
    items: [
      {
        title: 'Poulpe de Roche Caribéen Grillé à la Braise de Manguier',
        price: '34 €',
        tag: 'Plat Signature',
        description: 'Texture fondante et croustillante, mousseline de patate douce violette, sauce chien réduite au piment végétarien.',
      },
      {
        title: 'Côte de Bœuf Péyi Maturée 45 Jours & Jus Corsé au Cacao',
        price: '46 €',
        tag: 'Pour les amateurs',
        description: 'Fumage minute aux essences de gaïac, millefeuille de christophine au beurre noisette.',
      },
      {
        title: 'Ouassous Géants Grillés aux Épices Douces',
        price: '38 €',
        description: 'Flambés au vieux rhum agricole brut de fût, écrasé de fruit à pain au sel fumé.',
      },
    ],
  },
  {
    id: 'DESSERTS',
    name: 'Douceurs & Desserts d’Auteur',
    items: [
      {
        title: 'Ananas Bouteille Caramélisé au Sucre Roux & Glace Vanille Bleue',
        price: '16 €',
        description: 'Rôti à la broche 3 heures au-dessus des braises, crumble de manioc et sabayon rhum ambré.',
      },
      {
        title: 'Sphère Chocolat Noir Grand Cru Martinique & Fève Tonka',
        price: '17 €',
        description: 'Cœur coulant maracudja chaud, biscuit moelleux aux éclats de cacao torréfié.',
      },
    ],
  },
  {
    id: 'CAVE',
    name: 'Sélection de Rhums Hors d’Âge & Vins',
    items: [
      {
        title: 'Accord Mets & Rhums Rares des Antilles (3 dégustations)',
        price: '35 €',
        description: 'Sélection de cuvées millésimées brutes de fût sélectionnées par notre sommelier.',
      },
      {
        title: 'Cocktail Signature « Fumée de Gaïac »',
        price: '16 €',
        description: 'Rhum vieux 6 ans, liqueur de piment des îles, jus de canne fraîche et fumage sous cloche.',
      },
    ],
  },
];

export function RestaurantLanding({ isMobile = false }: { isMobile?: boolean }) {
  const [activeTab, setActiveTab] = useState('BRAISES');
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableSuccess, setTableSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(2);

  const handleBookTable = (e: React.FormEvent) => {
    e.preventDefault();
    setTableSuccess(true);
  };

  const currentCategory = MENU_CATEGORIES.find((c) => c.id === activeTab) ?? MENU_CATEGORIES[0]!;

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F5EFEB] font-sans antialiased selection:bg-[#D97736] selection:text-white">
      {/* ── Top Bar ── */}
      <div className={`bg-[#1A1816] text-[#C4B6AD] ${isMobile ? 'text-[10px] py-1.5 px-3' : 'text-xs py-2 px-4'} text-center border-b border-[#2C2723] tracking-widest uppercase`}>
        Service du soir du Mardi au Samedi &bull; Menu Dégustation en 6 temps
      </div>

      {/* ── Brand Header ── */}
      <header className="sticky top-0 z-40 bg-[#0E0D0C]/90 backdrop-blur-md border-b border-[#24211D]">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 h-16' : 'px-4 sm:px-6 lg:px-8 h-20'} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <Flame className={`${isMobile ? 'size-5' : 'size-6'} text-[#D97736]`} />
            <div>
              <span className={`font-serif ${isMobile ? 'text-lg' : 'text-2xl'} tracking-widest text-[#F5EFEB] uppercase font-normal block leading-none`}>
                Racines &amp; Braise
              </span>
              <span className="text-[8.5px] uppercase tracking-widest text-[#D97736] font-mono">
                Gastronomie Caribéenne
              </span>
            </div>
          </div>

          {!isMobile && (
            <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-medium text-[#A89C94]">
              <a href="#histoire" className="hover:text-[#F5EFEB] transition-colors">Notre Histoire</a>
              <a href="#carte" className="hover:text-[#F5EFEB] transition-colors">La Carte &amp; Braise</a>
              <a href="#chef" className="hover:text-[#F5EFEB] transition-colors">Le Chef</a>
              <a href="#horaires" className="hover:text-[#F5EFEB] transition-colors">Horaires &amp; Lieu</a>
            </nav>
          )}

          <div className="flex items-center gap-2.5">
            {!isMobile && (
              <button
                type="button"
                onClick={() => {
                  setTableModalOpen(true);
                  setTableSuccess(false);
                }}
                className="hidden sm:inline-flex items-center gap-2 bg-[#D97736] text-white text-xs uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full hover:bg-[#E88645] transition-all shadow-md shadow-[#D97736]/20"
              >
                <UtensilsCrossed className="size-3.5" />
                Réserver une table
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${isMobile ? 'block' : 'md:hidden'} p-2 text-[#F5EFEB]`}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="bg-[#1A1816] border-b border-[#2C2723] px-6 py-6 space-y-4 text-xs uppercase tracking-widest font-medium">
            <a href="#histoire" onClick={() => setMobileMenuOpen(false)} className="block py-1">Notre Histoire</a>
            <a href="#carte" onClick={() => setMobileMenuOpen(false)} className="block py-1">La Carte &amp; Braise</a>
            <a href="#chef" onClick={() => setMobileMenuOpen(false)} className="block py-1">Le Chef</a>
            <a href="#horaires" onClick={() => setMobileMenuOpen(false)} className="block py-1">Horaires &amp; Lieu</a>
            <div className="pt-2 border-t border-[#2C2723]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTableModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full bg-[#D97736] text-white text-xs uppercase tracking-widest font-semibold"
              >
                Réserver une table
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className={`relative ${isMobile ? 'py-12 px-4' : 'min-h-[85vh] flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8'} overflow-hidden border-b border-[#24211D]`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1A1816] border border-[#2C2723] text-[#D97736] text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-4 sm:mb-6">
            <Flame className="size-3" />
            <span>Restaurant Gastronomique &bull; Terroir Vivant</span>
          </div>

          <h1 className={`font-serif ${isMobile ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl md:text-7xl'} font-normal tracking-tight text-[#F5EFEB] leading-[1.12]`}>
            Les racines ont du caractère.
          </h1>

          <p className={`mt-4 ${isMobile ? 'text-xs' : 'text-base sm:text-lg'} text-[#C4B6AD] max-w-2xl mx-auto leading-relaxed`}>
            Une cuisine caribéenne façonnée par le feu de bois, les produits sauvages du terroir et l’émotion d’une transmission séculaire.
          </p>

          <div className={`mt-6 sm:mt-10 flex ${isMobile ? 'flex-col gap-3 w-full' : 'flex-col sm:flex-row items-center justify-center gap-4'}`}>
            <a
              href="#carte"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#D97736] text-white text-[11px] sm:text-xs uppercase tracking-widest font-semibold hover:bg-[#E88645] transition-all shadow-lg text-center"
            >
              Découvrir la carte
            </a>
            <button
              type="button"
              onClick={() => {
                setTableModalOpen(true);
                setTableSuccess(false);
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#4D453F] text-[#F5EFEB] text-xs uppercase tracking-widest font-semibold hover:bg-[#1A1816] transition-all"
            >
              Réserver une table
            </button>
          </div>
        </div>
      </section>

      {/* ── Notre Histoire & La Flamme ── */}
      <section id="histoire" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#D97736] font-semibold">Philosophie Culinaire</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl text-[#F5EFEB] leading-tight">
              Sublimer la braise et la mémoire de nos îles.
            </h2>
            <p className="mt-6 text-sm sm:text-base text-[#C4B6AD] leading-relaxed">
              À <strong>Racines &amp; Braise</strong>, chaque pièce de poisson, de viande ou de légume ancien est cuite sur mesure au-dessus de braises de manguier, de bois d’Inde et de gaïac. 
              Une chaleur vivante qui exalte les sucs naturels sans jamais masquer la finesse des produits récoltés le matin même par nos pêcheurs et maraîchers partenaires.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#24211D] pt-6 text-xs">
              <div>
                <p className="font-serif text-2xl text-[#D97736]">100 %</p>
                <p className="text-[#A89C94] mt-1">Pêche &amp; Maraîchage local</p>
              </div>
              <div>
                <p className="font-serif text-2xl text-[#D97736]">3 Essences</p>
                <p className="text-[#A89C94] mt-1">De bois noble de fumage</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#2C2723] bg-[#1A1816] p-8 relative overflow-hidden">
            <div className="space-y-6 text-xs text-[#C4B6AD]">
              <div className="flex gap-4">
                <Flame className="size-6 text-[#D97736] shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-[#F5EFEB]">Fumage &amp; Braisage Minute</h3>
                  <p className="mt-1 leading-relaxed">Températures maîtrisées de 80°C à 320°C selon les textures.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Sparkles className="size-6 text-[#D97736] shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-[#F5EFEB]">Légumes Racines Oubliés</h3>
                  <p className="mt-1 leading-relaxed">Giraumon, manioc doux, igname pourpre, dachine rôtie sous la cendre.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Wine className="size-6 text-[#D97736] shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-[#F5EFEB]">Accords Mets &amp; Rhums Vivants</h3>
                  <p className="mt-1 leading-relaxed">Plus de 60 références de rhums agricoles de dégustation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── La Carte Interactive ── */}
      <section id="carte" className="py-24 bg-[#141210] border-y border-[#24211D]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#D97736] font-semibold">Expérience Sensorielle</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[#F5EFEB]">La Carte du Moment</h2>
          </div>

          {/* Onglets de la carte */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 border-b border-[#24211D] pb-6">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`text-xs uppercase tracking-widest px-5 py-2.5 rounded-full font-medium transition-all ${
                  activeTab === cat.id
                    ? 'bg-[#D97736] text-white shadow-md'
                    : 'bg-[#1A1816] text-[#A89C94] hover:text-[#F5EFEB]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Plats de la catégorie sélectionnée */}
          <div className="mt-12 space-y-6">
            {currentCategory.items.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#2C2723] bg-[#0E0D0C] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 transition-colors hover:border-[#D97736]/60"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#F5EFEB]">{item.title}</h3>
                    {'tag' in item && item.tag && (
                      <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D97736]/20 text-[#D97736] font-semibold">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-[#A89C94] leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
                <div className="font-serif text-2xl text-[#D97736] font-normal shrink-0">
                  {item.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Horaires & Réservation ── */}
      <section id="horaires" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl border border-[#2C2723] bg-[#141210] p-8">
          <Clock className="size-6 text-[#D97736] mb-4" />
          <h3 className="font-serif text-xl text-[#F5EFEB]">Horaires de Service</h3>
          <div className="mt-4 space-y-2 text-xs text-[#A89C94]">
            <p className="flex justify-between border-b border-[#24211D] pb-2">
              <span>Mardi au Vendredi</span>
              <span className="text-[#F5EFEB] font-medium">19h30 &ndash; 23h00</span>
            </p>
            <p className="flex justify-between border-b border-[#24211D] pb-2">
              <span>Samedi (Déjeuner &amp; Dîner)</span>
              <span className="text-[#F5EFEB] font-medium">12h30 &bull; 19h30</span>
            </p>
            <p className="flex justify-between text-[#7E746D] pt-1">
              <span>Dimanche &amp; Lundi</span>
              <span>Fermeture</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2C2723] bg-[#141210] p-8">
          <MapPin className="size-6 text-[#D97736] mb-4" />
          <h3 className="font-serif text-xl text-[#F5EFEB]">Localisation &amp; Accès</h3>
          <p className="mt-4 text-xs text-[#A89C94] leading-relaxed">
            Anse Noire &bull; Vue panoramique sur la baie<br />
            97229 Les Anses-d’Arlet &bull; Martinique<br />
            Service voiturier disponible dès 19h00.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#D97736] bg-[#1A1816] p-8 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#D97736] font-semibold">Table d'Auteur</span>
            <h3 className="font-serif text-2xl text-[#F5EFEB] mt-1">Réservez votre Moment</h3>
            <p className="mt-2 text-xs text-[#C4B6AD]">
              Nombre de couverts limité à 34 par service pour préserver l’intimité et l’attention portée à chaque convive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTableModalOpen(true);
              setTableSuccess(false);
            }}
            className="mt-6 w-full py-3.5 rounded-full bg-[#D97736] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#E88645] transition-all"
          >
            Réserver en ligne
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#080706] text-[#A89C94] py-16 border-t border-[#1C1A17] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="font-serif text-2xl uppercase tracking-widest text-[#F5EFEB] block font-normal">
            Racines &amp; Braise
          </span>
          <p className="text-xs text-[#7E746D] max-w-md mx-auto">
            Gastronomie caribéenne au feu de bois. Maquette interactive conçue et développée par HBG Labs.
          </p>
          <p className="text-[11px] text-[#554E48] pt-4 border-t border-[#141210]">
            &copy; {new Date().getFullYear()} Racines &amp; Braise. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* ── Modal de Réservation de Table ── */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141210] p-6 sm:p-8 shadow-2xl border border-[#2C2723] text-[#F5EFEB]">
            <button
              type="button"
              onClick={() => setTableModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#A89C94] hover:text-white"
            >
              <X className="size-5" />
            </button>

            {tableSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto size-16 rounded-full bg-[#D97736]/20 text-[#D97736] flex items-center justify-center mb-4">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="font-serif text-2xl text-[#F5EFEB]">Table Confirmée</h3>
                <p className="mt-2 text-xs text-[#A89C94] leading-relaxed">
                  Votre table pour <strong>{guestCount} personnes</strong> a été simulée avec succès. Nous vous attendons pour une soirée inoubliable.
                </p>
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="mt-6 px-6 py-3 bg-[#D97736] text-white text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#E88645]"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookTable} className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#D97736] font-semibold">Service du soir</span>
                  <h3 className="font-serif text-2xl text-[#F5EFEB] mt-1">Réserver une Table</h3>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#A89C94] mb-1">Nombre de convives</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          guestCount === num
                            ? 'bg-[#D97736] text-white border-[#D97736]'
                            : 'bg-[#0E0D0C] text-[#A89C94] border-[#2C2723] hover:border-[#4D453F]'
                        }`}
                      >
                        {num} pers.
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#A89C94] mb-1">Date</label>
                    <input
                      type="date"
                      required
                      defaultValue="2026-09-18"
                      className="w-full bg-[#0E0D0C] border border-[#2C2723] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D97736]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#A89C94] mb-1">Service</label>
                    <select className="w-full bg-[#0E0D0C] border border-[#2C2723] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D97736]">
                      <option>19h30 &bull; 1er service</option>
                      <option>20h15 &bull; Service principal</option>
                      <option>21h30 &bull; 2e service</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#A89C94] mb-1">Nom &amp; Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Antoine de Saint-Germain"
                    className="w-full bg-[#0E0D0C] border border-[#2C2723] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D97736]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#A89C94] mb-1">Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+596 696 00 00 00"
                    className="w-full bg-[#0E0D0C] border border-[#2C2723] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D97736]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#D97736] text-white text-xs uppercase tracking-widest font-semibold rounded-full hover:bg-[#E88645] transition-colors shadow-lg"
                  >
                    Confirmer la réservation de table
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
