import { useState, useRef } from 'react';
import { ArrowUpRight, Sparkles, Calendar, ShieldCheck, HardHat } from 'lucide-react';
import type { ShowcaseProject } from '@/data/showcase';

interface ShowcaseTotemCardProps {
  project: ShowcaseProject;
  isFocused: boolean;
  onOpen: (id: string) => void;
}

export function ShowcaseTotemCard({
  project,
  isFocused,
  onOpen,
}: ShowcaseTotemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale(1.01)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)');
    setGlarePosition({ x: 50, y: 50, opacity: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      className={`flex flex-col items-center transition-all duration-300 ${
        isFocused ? 'opacity-100 scale-100' : 'opacity-65 hover:opacity-100 scale-[0.98] hover:scale-100'
      }`}
    >
      {/* ── Screen Label ── */}
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        className="mb-3 text-center cursor-pointer group/title"
      >
        <h3 className="font-sans text-xs sm:text-sm font-black uppercase tracking-wider text-[#181A20] group-hover/title:text-accent transition-colors drop-shadow-xs">
          {project.name}
        </h3>
      </button>

      {/* ── Real Architectural Gallery Wall Picture Frame (Horizontal Landscape 4:3) ── */}
      <div
        ref={cardRef}
        onClick={() => onOpen(project.id)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
          boxShadow: isHovered || isFocused
            ? '0 24px 48px -12px rgba(0,0,0,0.5), 0 8px 20px -4px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.9)'
            : '0 16px 36px -10px rgba(0,0,0,0.35), 0 4px 12px -2px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.85)',
        }}
        className="cursor-pointer group relative w-full aspect-[2.35/1] p-3 sm:p-4 bg-[#16171B] border-[6px] sm:border-[8px] border-[#1C1D22] shadow-2xl select-none"
      >
        {/* Subtle Frame Outer Bevel Edge Highlight */}
        <div className="absolute inset-0 border border-white/10 pointer-events-none" />

        {/* ── Gallery Passe-Partout (Matte Board) ── */}
        <div className="relative w-full h-full p-2.5 sm:p-3.5 bg-[#F5F4F0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          
          {/* Inner Artwork Cutout Window */}
          <div className="relative w-full flex-1 overflow-hidden bg-white shadow-[inset_0_3px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.15)] border border-stone-400/30">
            
            {/* Scrollable Landscape Desktop Layout */}
            <div
              className={`w-full transition-transform ease-in-out select-none ${
                isHovered ? 'duration-[6000ms] -translate-y-[40%]' : 'duration-[1000ms] translate-y-0'
              }`}
            >
              {project.id === 'soie-et-terre' ? (
                <SoieEtTerreLandscapeMockup />
              ) : (
                <KayoConstructionLandscapeMockup />
              )}
            </div>

            {/* Museum Anti-Reflective Glass Sheen */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,${glarePosition.opacity * 0.8}) 0%, transparent 60%)`,
              }}
            />

            {/* Hover Action Pill */}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                <span>Explorer la maquette</span>
                <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </div>

          {/* ── Museum Mat Bottom Label ── */}
          <div className="pt-2 flex items-center justify-between text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#4A4D57]">
            <span className="font-bold text-[#22242B] truncate max-w-[200px]">{project.name}</span>
            <span className="text-[#7A7E8B]">HBG LABS &bull; CONCEPT DIGITAL</span>
          </div>
        </div>
      </div>

      {/* ── Sector Label Below Frame ── */}
      <div className="mt-2.5 text-center">
        <span className="text-[11px] font-bold text-[#3B3E48] tracking-wide">
          {project.sectorLabel}
        </span>
      </div>
    </div>
  );
}

/**
 * ── Landscape Desktop Mockup for SOIE & TERRE ──
 * Conçu spécifiquement pour le ratio horizontal panoramique ultra-large
 */
function SoieEtTerreLandscapeMockup() {
  return (
    <div className="w-full bg-[#FAF8F5] text-[#2D2A26] font-sans antialiased text-[11px] sm:text-[12px] leading-snug">
      {/* ── Mini Desktop Topbar ── */}
      <div className="h-8 sm:h-9 px-4 sm:px-6 bg-[#FAF8F5]/90 border-b border-[#E8E4DC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#8C684F]" />
          <span className="font-serif font-bold text-[11px] sm:text-[12px] tracking-wider text-[#2D2A26]">SOIE & TERRE</span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-[9px] uppercase tracking-widest text-[#6B655C] font-medium">
          <span>Rituels</span>
          <span>Soins</span>
          <span>Boutique</span>
          <span>Contact</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#8C684F] text-white text-[9px] font-semibold tracking-wide whitespace-nowrap shadow-2xs">
          Prendre rendez-vous
        </div>
      </div>

      {/* ── Hero Widescreen 2-Column Banner ── */}
      <div className="p-4 sm:p-6 grid grid-cols-12 gap-5 items-center">
        {/* Left Column: Editorial Presentation */}
        <div className="col-span-7 pr-2">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8C684F]/10 text-[#8C684F] text-[8px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="size-2.5" />
            <span>RITUELS DE BEAUTÉ • ANTILLES</span>
          </div>

          <h4 className="font-serif text-[16px] sm:text-[19px] lg:text-[21px] font-normal text-[#2B2520] leading-tight">
            La beauté à l’état naturel.
          </h4>

          <p className="mt-1.5 text-[9px] sm:text-[10px] text-[#6B615B] leading-relaxed line-clamp-2">
            Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat et vous offrir un véritable moment de bien-être.
          </p>

          <div className="mt-3 flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#2B2520] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
              DÉCOUVRIR NOS SOINS
            </span>
            <span className="px-3 py-1 rounded-full border border-[#2B2520] text-[#2B2520] text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider">
              PRENDRE RENDEZ-VOUS
            </span>
          </div>
        </div>

        {/* Right Column: Clean Dedicated Hero Portrait */}
        <div className="col-span-5 relative aspect-[16/11] rounded-xl overflow-hidden shadow-md border border-[#E8DFD8]">
          <img
            src="/images/hero-editorial.jpg"
            alt="Soie & Terre Soins Botaniques"
            className="w-full h-full object-cover object-[center_25%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2 text-white">
            <p className="text-[8px] font-bold leading-tight">Rituel Signature Caraïbes</p>
            <p className="text-[7px] text-white/80">120 min &bull; 190 €</p>
          </div>
        </div>
      </div>

      {/* ── Below Hero: 3 Signature Categories ── */}
      <div className="px-4 sm:px-6 pb-6 pt-2">
        <div className="text-[9px] uppercase tracking-widest font-bold text-[#8C684F] mb-2 flex items-center gap-1">
          <Calendar className="size-2.5" />
          <span>Nos Soins &amp; Rituels</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD8] shadow-2xs">
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-[#8C684F]/10 text-[#8C684F] font-bold">01 — VISAGE</span>
            <p className="mt-1 font-serif text-[10px] font-semibold text-[#2B2520] truncate">Éclat &amp; Hydratation</p>
            <p className="text-[8px] text-[#6B615B]">60 min &bull; 95 €</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD8] shadow-2xs">
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-[#8C684F]/10 text-[#8C684F] font-bold">02 — CORPS</span>
            <p className="mt-1 font-serif text-[10px] font-semibold text-[#2B2520] truncate">Gommage &amp; Argile</p>
            <p className="text-[8px] text-[#6B615B]">50 min &bull; 85 €</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-[#E8DFD8] shadow-2xs">
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-[#8C684F]/10 text-[#8C684F] font-bold">03 — MASSAGES</span>
            <p className="mt-1 font-serif text-[10px] font-semibold text-[#2B2520] truncate">Ylang-Ylang &amp; Bois Bandé</p>
            <p className="text-[8px] text-[#6B615B]">75 min &bull; 120 €</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ── Landscape Desktop Mockup for KAYO CONSTRUCTION ──
 * Conçu spécifiquement pour le ratio horizontal 4:3
 */
function KayoConstructionLandscapeMockup() {
  return (
    <div className="w-full bg-[#121316] text-[#F4F5F7] font-sans antialiased text-[11px] sm:text-[12px] leading-snug">
      {/* ── Mini Desktop Topbar ── */}
      <div className="h-8 sm:h-9 px-4 sm:px-6 bg-[#181A1F] border-b border-[#2A2E38] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#E65100]" />
          <span className="font-sans font-black text-[11px] sm:text-[12px] tracking-wider text-white">KAYO CONSTRUCTION</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[9px] uppercase tracking-wider text-[#A0A6B5] font-semibold">
          <span>Gros Œuvre</span>
          <span>Parc Matériel</span>
          <span>Chantiers</span>
          <span>Contact</span>
        </div>
        <div className="px-3 py-1 rounded-md bg-[#E65100] text-white text-[9px] font-bold tracking-wide whitespace-nowrap shadow-2xs">
          Demander un devis
        </div>
      </div>

      {/* ── Hero Widescreen 2-Column Banner ── */}
      <div className="p-4 sm:p-6 grid grid-cols-12 gap-5 items-center">
        {/* Left Column: Industrial Presentation */}
        <div className="col-span-7 pr-2">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E65100]/20 border border-[#E65100]/30 text-[#FF8A50] text-[8px] font-black uppercase tracking-wider mb-2">
            <HardHat className="size-2.5" />
            <span>Gros Œuvre &bull; VRD &bull; Génie Civil</span>
          </div>

          <h4 className="font-sans text-[16px] sm:text-[19px] lg:text-[21px] font-black text-white leading-tight uppercase tracking-tight">
            Construire avec force. <br />
            <span className="text-[#E65100]">Bâtir avec précision.</span>
          </h4>

          <p className="mt-1.5 text-[9px] sm:text-[10px] text-[#A0A6B5] leading-relaxed line-clamp-2">
            340+ chantiers livrés aux Antilles. 45 engins en parc propre et équipes certifiées parasismique.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="px-3 py-1 rounded-md bg-[#E65100] text-white text-[9px] font-bold uppercase tracking-wider">
              Étude de projet
            </span>
            <div className="flex items-center gap-2 text-[8px] font-mono text-[#DCDFE4]">
              <span className="text-[#FF8A50] font-bold text-[10px]">45</span> Engins
              <span className="text-stone-600">|</span>
              <span className="text-[#FF8A50] font-bold text-[10px]">340+</span> Chantiers
            </div>
          </div>
        </div>

        {/* Right Column: Site Excavator Image */}
        <div className="col-span-5 relative aspect-[16/11] rounded-xl overflow-hidden shadow-md border border-[#2A2E38]">
          <img
            src="/images/showcase/kayo-construction.jpg"
            alt="Kayo Construction Chantiers"
            className="w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 text-white">
            <p className="text-[8px] font-bold text-white uppercase leading-tight">Parc Engins Propre</p>
            <p className="text-[7px] text-[#FF8A50]">Pelles chenilles 22T &bull; Camions 8x4</p>
          </div>
        </div>
      </div>

      {/* ── Below Hero: 3 Equipment & Technical Certifications ── */}
      <div className="px-4 sm:px-6 pb-6 pt-2">
        <div className="text-[9px] uppercase tracking-widest font-black text-[#FF8A50] mb-2 flex items-center gap-1">
          <ShieldCheck className="size-2.5" />
          <span>Expertises Opérationnelles</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-[#181A1F] border border-[#2A2E38]">
            <p className="font-sans text-[10px] font-bold text-white">Gros Œuvre Béton</p>
            <p className="text-[8px] text-[#A0A6B5]">Normes Eurocode 8</p>
          </div>
          <div className="p-2 rounded-lg bg-[#181A1F] border border-[#2A2E38]">
            <p className="font-sans text-[10px] font-bold text-white">VRD & Terrassement</p>
            <p className="text-[8px] text-[#A0A6B5]">Parc 45 engins</p>
          </div>
          <div className="p-2 rounded-lg bg-[#181A1F] border border-[#2A2E38]">
            <p className="font-sans text-[10px] font-bold text-white">Génie Civil</p>
            <p className="text-[8px] text-[#A0A6B5]">Ouvrages d'art</p>
          </div>
        </div>
      </div>
    </div>
  );
}
