import { useState } from 'react';
import { 
  HardHat, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  FileText, 
  Check, 
  Menu, 
  X,
  Gauge,
  ShieldCheck
} from 'lucide-react';

const ENGINS = [
  {
    name: 'Pelle Hydraulique 30T',
    category: 'Terrassement Lourd',
    tonnage: '30 Tonnes',
    capacity: 'Godet 2.2 m³ & Guidage GPS 3D',
    description: 'Engin lourd de pointe pour fouilles profondes, tranchées de réseaux et terrassements de roche massive.',
  },
  {
    name: 'Bulldozer D6 Haute Performance',
    category: 'Nivellement & Défrichage',
    tonnage: '22 Tonnes',
    capacity: 'Lame orientable 5.8 m³',
    description: 'Puissance maximale pour le décapage de grandes superficies, le régalage et le profilage de plateformes.',
  },
  {
    name: 'Chargeuse sur Pneus 966',
    category: 'Chargement & Rendement',
    tonnage: '24 Tonnes',
    capacity: 'Godet 4.5 m³ gros volume',
    description: 'Manutention rapide des agrégats, chargement des convois de camions et réapprovisionnement de centrale.',
  },
  {
    name: 'Camion-Benne 8x4 Tout-Terrain',
    category: 'Transport & Logistique',
    tonnage: '32 Tonnes PTAC',
    capacity: 'Benne calorifugée 20 m³',
    description: 'Acheminement continu de matériaux lourds, roches d’enrochement et évacuation rapide des déblais.',
  },
  {
    name: 'Nacelle Articulée 28m Tout-Terrain',
    category: 'Travaux en Hauteur',
    tonnage: 'Hauteur 28 mètres',
    capacity: 'Déport 19 m / Charge 300 kg',
    description: 'Intervention sécurisée sur charpentes métalliques, façades grande hauteur et toitures industrielles.',
  },
  {
    name: 'Compacteur Vibrant Tandem',
    category: 'VRD & Finition',
    tonnage: '14 Tonnes',
    capacity: 'Compactage haute fréquence',
    description: 'Stabilisation des couches de fondation routière et compactage de haute précision pour enrobés.',
  },
];

const CHANTIERS = [
  {
    title: 'Complexe Logistique Caraïbes',
    category: 'GROS_OEUVRE',
    location: 'Zone Franche &bull; Jarry',
    surface: '12 500 m²',
    delai: '8 mois',
    description: 'Terrassement de 45 000 m³ de roche et élévation de la structure en béton armé parasismique.',
  },
  {
    title: 'Résidence Panoramique Les Alizés',
    category: 'BATIMENT',
    location: 'Sainte-Luce',
    surface: '32 Logements',
    delai: '14 mois',
    description: 'Construction clé en main, fondations spéciales sur pieux forés et aménagements paysagers.',
  },
  {
    title: 'Réfection de Voirie & VRD Littoral',
    category: 'TRAVAUX_PUBLICS',
    location: 'Le Robert',
    surface: '3.4 km de voirie',
    delai: '4 mois',
    description: 'Enrochement maritime de soutènement, pose de réseaux d’assainissement et tapis d’enrobé.',
  },
];

export function ConstructionLanding() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredChantiers = activeFilter === 'ALL'
    ? CHANTIERS
    : CHANTIERS.filter((c) => c.category === activeFilter);

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#121316] text-[#E1E4EA] font-sans antialiased selection:bg-[#E65100] selection:text-white">
      {/* ── Top Bar Métier ── */}
      <div className="bg-[#1A1C22] border-b border-[#2B2F38] text-xs py-2 px-4 text-[#9BA1B0] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white font-medium">
            <span className="size-2 rounded-full bg-[#E65100] animate-pulse" />
            Parc Matériel &bull; 45 Engins Opérationnels
          </span>
          <span className="hidden sm:inline text-[#6C7280]">Garantie Décennale SMABTP &bull; Certifié Qualibat</span>
        </div>
        <a href="tel:+596596000000" className="flex items-center gap-1.5 text-[#E65100] font-semibold hover:underline">
          <PhoneCall className="size-3.5" />
          Urgence Chantier 24/7
        </a>
      </div>

      {/* ── Brand Header ── */}
      <header className="sticky top-0 z-40 bg-[#121316]/95 backdrop-blur-md border-b border-[#22252C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#E65100] rounded-lg flex items-center justify-center text-white font-black text-xl tracking-tighter">
              K
            </div>
            <div>
              <span className="font-black text-xl tracking-wider text-white uppercase block leading-none">
                Kayo Construction
              </span>
              <span className="text-[10px] tracking-widest text-[#9BA1B0] uppercase font-mono">
                BTP &bull; Génie Civil &bull; Caraïbes
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-widest font-semibold text-[#9BA1B0]">
            <a href="#metiers" className="hover:text-white transition-colors">Nos Métiers</a>
            <a href="#parc" className="hover:text-white transition-colors">Parc Matériel</a>
            <a href="#chantiers" className="hover:text-white transition-colors">Réalisations</a>
            <a href="#expertise" className="hover:text-white transition-colors">Normes &amp; Sécurité</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuoteModalOpen(true);
                setQuoteSuccess(false);
              }}
              className="inline-flex items-center gap-2 bg-[#E65100] text-white text-xs uppercase tracking-wider font-bold px-6 py-3 rounded-lg hover:bg-[#FF6D00] transition-all shadow-md shadow-[#E65100]/20"
            >
              <FileText className="size-4" />
              Demander un devis
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
          <div className="md:hidden bg-[#1A1C22] border-b border-[#2B2F38] px-6 py-6 space-y-4 text-xs uppercase tracking-widest font-semibold">
            <a href="#metiers" onClick={() => setMobileMenuOpen(false)} className="block py-1">Nos Métiers</a>
            <a href="#parc" onClick={() => setMobileMenuOpen(false)} className="block py-1">Parc Matériel</a>
            <a href="#chantiers" onClick={() => setMobileMenuOpen(false)} className="block py-1">Réalisations</a>
            <a href="#expertise" onClick={() => setMobileMenuOpen(false)} className="block py-1">Normes &amp; Sécurité</a>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#22252C] overflow-hidden bg-gradient-to-b from-[#181A20] to-[#121316]">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#E65100]/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#22252C] border border-[#323742] text-[#E65100] text-xs font-mono font-semibold uppercase tracking-wider mb-6">
              <HardHat className="size-4" />
              Entreprise Générale de BTP &bull; Gros Œuvre
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight leading-[1.02]">
              Construire avec force. <br />
              <span className="text-[#E65100]">Bâtir avec précision.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#9BA1B0] max-w-xl leading-relaxed">
              Des équipes expérimentées, 45 engins lourds en parc propre et une maîtrise totale des contraintes sismiques et cycloniques des Antilles.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => {
                  setQuoteModalOpen(true);
                  setQuoteSuccess(false);
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#E65100] text-white text-xs uppercase tracking-wider font-bold px-8 py-4 rounded-lg hover:bg-[#FF6D00] transition-all shadow-lg"
              >
                Étudier mon projet de construction
                <ArrowRight className="size-4" />
              </button>
              <a
                href="#parc"
                className="inline-flex items-center justify-center gap-2 bg-[#22252C] border border-[#323742] text-white text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg hover:bg-[#2B2F38] transition-all"
              >
                Découvrir le parc matériel
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-[#1A1C22] border border-[#2B2F38] rounded-xl p-6">
              <p className="font-mono text-3xl sm:text-4xl font-black text-[#E65100]">340+</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider mt-1">Chantiers Livrés</p>
              <p className="text-[11px] text-[#6C7280] mt-1">Bâtiment, industrie et voirie</p>
            </div>
            <div className="bg-[#1A1C22] border border-[#2B2F38] rounded-xl p-6">
              <p className="font-mono text-3xl sm:text-4xl font-black text-white">45</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider mt-1">Engins Lourds</p>
              <p className="text-[11px] text-[#6C7280] mt-1">En propriété exclusive</p>
            </div>
            <div className="bg-[#1A1C22] border border-[#2B2F38] rounded-xl p-6">
              <p className="font-mono text-3xl sm:text-4xl font-black text-white">18 Ans</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider mt-1">D’Expérience</p>
              <p className="text-[11px] text-[#6C7280] mt-1">Implantation locale forte</p>
            </div>
            <div className="bg-[#1A1C22] border border-[#2B2F38] rounded-xl p-6">
              <p className="font-mono text-3xl sm:text-4xl font-black text-[#E65100]">100 %</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider mt-1">Délais Tenus</p>
              <p className="text-[11px] text-[#6C7280] mt-1">Pénalités de retard : 0</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Parc Matériel (Au Cœur du Projet) ── */}
      <section id="parc" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#22252C] pb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E65100] font-bold">Autonomie Opérationnelle</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Notre Parc Matériel &amp; Engins
            </h2>
          </div>
          <p className="text-sm text-[#9BA1B0] max-w-md">
            Une flotte moderne renouvelée tous les 3 ans pour garantir un rendement maximal et zéro temps d’arrêt sur chantier.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ENGINS.map((engin) => (
            <div
              key={engin.name}
              className="rounded-xl border border-[#2B2F38] bg-[#1A1C22] p-6 transition-all hover:border-[#E65100] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#E65100] font-bold">{engin.category}</span>
                  <span className="text-[#9BA1B0] bg-[#22252C] px-2.5 py-1 rounded">{engin.tonnage}</span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-white uppercase">
                  {engin.name}
                </h3>

                <p className="mt-2 text-xs font-mono text-[#E65100] bg-[#E65100]/10 p-2 rounded border border-[#E65100]/20">
                  <Gauge className="size-3.5 inline mr-1" />
                  {engin.capacity}
                </p>

                <p className="mt-3 text-xs text-[#9BA1B0] leading-relaxed">
                  {engin.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#2B2F38] flex items-center justify-between text-[11px] text-[#6C7280]">
                <span>Disponibilité Immédiate</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-[#E65100]" /> Certifié VGP
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Réalisations & Chantiers Majeurs ── */}
      <section id="chantiers" className="py-24 bg-[#181A20] border-y border-[#22252C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#E65100] font-bold">Références</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Chantiers Livrés &amp; En Cours
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'GROS_OEUVRE', label: 'Gros Œuvre' },
                { id: 'BATIMENT', label: 'Bâtiment' },
                { id: 'TRAVAUX_PUBLICS', label: 'Travaux Publics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`text-xs font-mono uppercase px-4 py-2 rounded-lg font-bold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-[#E65100] text-white shadow-md'
                      : 'bg-[#22252C] text-[#9BA1B0] hover:bg-[#2B2F38]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {filteredChantiers.map((ch) => (
              <div key={ch.title} className="rounded-xl border border-[#2B2F38] bg-[#121316] p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E65100] font-bold">
                    {ch.location}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-white uppercase">{ch.title}</h3>
                  <p className="mt-3 text-xs text-[#9BA1B0] leading-relaxed">{ch.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#22252C] grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#6C7280] block text-[10px]">Volume / Surface</span>
                    <span className="text-white font-bold">{ch.surface}</span>
                  </div>
                  <div>
                    <span className="text-[#6C7280] block text-[10px]">Délai Réalisé</span>
                    <span className="text-[#E65100] font-bold">{ch.delai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0C0D0F] text-[#9BA1B0] py-16 border-t border-[#22252C] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-black text-xl tracking-wider text-white uppercase block">
              Kayo Construction
            </span>
            <p className="mt-3 text-[#6C7280] leading-relaxed">
              Entreprise générale de bâtiment, travaux publics, terrassement lourd et génie civil aux Antilles.
            </p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-bold mb-3 font-mono">Siège Opérationnel</h4>
            <p>ZI Cocotte &bull; Voie Principale</p>
            <p>97224 Ducos &bull; Martinique</p>
            <p className="text-[#E65100] font-mono font-bold mt-2">+596 596 00 00 00</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-bold mb-3 font-mono">Qualifications</h4>
            <p className="flex items-center gap-2"><Check className="size-3.5 text-[#E65100]" /> Qualibat 1112 &bull; Terrassement</p>
            <p className="flex items-center gap-2 mt-1"><Check className="size-3.5 text-[#E65100]" /> Qualibat 2112 &bull; Maçonnerie &amp; Béton armé</p>
            <p className="flex items-center gap-2 mt-1"><Check className="size-3.5 text-[#E65100]" /> Garantie Décennale SMABTP</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-white font-bold mb-3 font-mono">Chiffrage Express</h4>
            <p className="text-[#6C7280] mb-3">Transmettez vos CCTP et plans pour une étude technique sous 48h.</p>
            <button
              type="button"
              onClick={() => {
                setQuoteModalOpen(true);
                setQuoteSuccess(false);
              }}
              className="w-full bg-[#E65100] text-white py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#FF6D00]"
            >
              Déposer un dossier
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-[#1F232B] text-center text-[11px] text-[#6C7280]">
          &copy; {new Date().getFullYear()} KAYO Construction. Maquette interactive conçue par HBG Labs.
        </div>
      </footer>

      {/* ── Modal Devis Chantier ── */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#1A1C22] p-6 sm:p-8 shadow-2xl border border-[#2B2F38] text-white">
            <button
              type="button"
              onClick={() => setQuoteModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#9BA1B0] hover:text-white"
            >
              <X className="size-5" />
            </button>

            {quoteSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto size-16 rounded-full bg-[#E65100]/20 text-[#E65100] flex items-center justify-center mb-4">
                  <ShieldCheck className="size-8" />
                </div>
                <h3 className="text-2xl font-black uppercase">Dossier Transmis</h3>
                <p className="mt-2 text-xs text-[#9BA1B0] leading-relaxed">
                  Votre demande d’étude a bien été simulée. Notre bureau d’études technique vous contactera sous 24 à 48h ouvrées.
                </p>
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="mt-6 px-6 py-3 bg-[#E65100] text-white text-xs uppercase font-bold rounded-lg hover:bg-[#FF6D00]"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E65100] font-bold">Bureau d'Études BTP</span>
                  <h3 className="text-2xl font-black uppercase mt-1">Demande de Devis Chantier</h3>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA1B0] mb-1">Type de Projet</label>
                  <select className="w-full bg-[#121316] border border-[#2B2F38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E65100]">
                    <option>Terrassement lourd &amp; Enrochement</option>
                    <option>Gros œuvre &bull; Bâtiment industriel ou collectif</option>
                    <option>Génie civil &bull; VRD &bull; Voirie</option>
                    <option>Démolition contrôlée &bull; Désamiantage</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA1B0] mb-1">Localisation Chantier</label>
                    <input
                      type="text"
                      required
                      placeholder="ex. Le Lamentin"
                      className="w-full bg-[#121316] border border-[#2B2F38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E65100]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA1B0] mb-1">Surface Estimée (m²)</label>
                    <input
                      type="text"
                      placeholder="ex. 1 500 m²"
                      className="w-full bg-[#121316] border border-[#2B2F38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E65100]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA1B0] mb-1">Entreprise / Nom du contact</label>
                  <input
                    type="text"
                    required
                    placeholder="Nom du maître d’ouvrage"
                    className="w-full bg-[#121316] border border-[#2B2F38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E65100]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#9BA1B0] mb-1">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+596 696 00 00 00"
                    className="w-full bg-[#121316] border border-[#2B2F38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E65100]"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#E65100] text-white text-xs uppercase font-bold tracking-wider rounded-lg hover:bg-[#FF6D00] transition-colors shadow-lg"
                  >
                    Transmettre le dossier pour chiffrage
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
