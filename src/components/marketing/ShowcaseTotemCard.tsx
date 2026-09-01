import { useState, useRef } from 'react';
import { ArrowUpRight, Sparkles, HardHat } from 'lucide-react';
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

      {/* ── Outer Interactive Card ── */}
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
            ? '0 24px 48px -12px rgba(0,0,0,0.35), 0 8px 20px -4px rgba(0,0,0,0.2)'
            : '0 16px 36px -10px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.1)',
        }}
        className="cursor-pointer group relative w-full aspect-[2.35/1] rounded-none overflow-hidden shadow-xl select-none"
      >
        {/* Landscape Desktop Layout (No scroll animation, full-bleed) */}
        <div className="w-full h-full select-none">
          {project.id === 'soie-et-terre' ? (
            <SoieEtTerreLandscapeMockup />
          ) : (
            <KayoConstructionLandscapeMockup />
          )}
        </div>

        {/* Anti-Reflective Glass Sheen */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,${glarePosition.opacity * 0.8}) 0%, transparent 60%)`,
          }}
        />

        {/* Hover Action Pill */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/90 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
            <span>Explorer la maquette</span>
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ── Landscape Desktop Mockup for SOIE & TERRE ──
 * Reproduction fidèle 1:1 du vrai site BeautyLanding (Hero immersif sans défilement)
 */
function SoieEtTerreLandscapeMockup() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FAF8F5] text-[#2B2520] font-sans antialiased text-[11px] sm:text-[12px] leading-snug">
      {/* Background Photo */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/showcase/soie-et-terre-hero.jpg')",
        }}
      >
        {/* Real site gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1915]/90 via-[#1E1915]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1915]/80 via-transparent to-black/30" />
      </div>

      {/* Real Site Mini Topbar */}
      <div className="relative z-10 h-7 sm:h-8 px-3 sm:px-5 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8DFD8]/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#8C684F]" />
          <span className="font-serif font-bold text-[10px] sm:text-[11px] tracking-[0.2em] text-[#2B2520]">SOIE &amp; TERRE</span>
        </div>
        <div className="hidden sm:flex items-center gap-3.5 text-[8px] uppercase tracking-[0.15em] text-[#6B6259] font-medium">
          <span>Accueil</span>
          <span>Nos soins</span>
          <span>Rituels</span>
          <span>L’expérience</span>
          <span>Boutique</span>
          <span>Contact</span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full border border-[#2B2520]/60 text-[#2B2520] text-[7.5px] font-bold uppercase tracking-wider whitespace-nowrap shadow-2xs">
          Prendre rendez-vous
        </div>
      </div>

      {/* Real Site Hero Content */}
      <div className="relative z-10 h-[calc(100%-1.75rem)] p-3 sm:p-5 flex flex-col justify-between text-white max-w-lg">
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[7.5px] font-bold uppercase tracking-[0.2em] mb-1.5">
            <Sparkles className="size-2.5 text-[#D4B996]" />
            <span>Rituels de Beauté &bull; Antilles</span>
          </div>

          <h4 className="font-serif text-[16px] sm:text-[20px] lg:text-[23px] font-light text-white leading-tight tracking-tight">
            La beauté <br />
            <span className="italic font-normal">à l’état naturel.</span>
          </h4>

          <p className="mt-1 text-[8.5px] sm:text-[9.5px] text-[#EAE3D9] leading-relaxed line-clamp-2 max-w-sm font-light">
            Des soins inspirés de la nature des Antilles, pensés pour révéler votre éclat et vous offrir un véritable moment de bien-être.
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#2B2520] text-[7.5px] font-bold uppercase tracking-wider shadow-sm">
              Découvrir nos soins
            </span>
            <span className="px-2.5 py-1 rounded-full border border-white/80 text-white text-[7.5px] font-bold uppercase tracking-wider">
              Prendre rendez-vous
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-white/20 flex items-center gap-3 text-[7.5px] font-mono uppercase tracking-widest text-[#D4B996]">
          <span>Martinique</span>
          <span>&bull;</span>
          <span>Guadeloupe</span>
          <span>&bull;</span>
          <span>Caraïbes</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ── Landscape Desktop Mockup for KAYO CONSTRUCTION ──
 * Conçu spécifiquement pour le ratio horizontal panoramique (Sans défilement)
 */
function KayoConstructionLandscapeMockup() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#121316] text-[#F4F5F7] font-sans antialiased text-[11px] sm:text-[12px] leading-snug flex flex-col">
      {/* Mini Desktop Topbar */}
      <div className="h-7 sm:h-8 px-3 sm:px-5 bg-[#181A1F] border-b border-[#2A2E38] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#E65100]" />
          <span className="font-sans font-black text-[10px] sm:text-[11px] tracking-wider text-white">KAYO CONSTRUCTION</span>
        </div>
        <div className="hidden sm:flex items-center gap-3.5 text-[8px] uppercase tracking-wider text-[#A0A6B5] font-semibold">
          <span>Gros Œuvre</span>
          <span>Parc Matériel</span>
          <span>Chantiers</span>
          <span>Contact</span>
        </div>
        <div className="px-2.5 py-0.5 rounded-md bg-[#E65100] text-white text-[7.5px] font-bold tracking-wide whitespace-nowrap shadow-2xs">
          Demander un devis
        </div>
      </div>

      {/* Hero Widescreen 2-Column Banner */}
      <div className="p-3 sm:p-5 flex-1 grid grid-cols-12 gap-4 items-center">
        {/* Left Column: Industrial Presentation */}
        <div className="col-span-7 pr-2 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E65100]/20 border border-[#E65100]/30 text-[#FF8A50] text-[7.5px] font-black uppercase tracking-wider mb-1.5 w-fit">
            <HardHat className="size-2.5" />
            <span>Gros Œuvre &bull; VRD &bull; Génie Civil</span>
          </div>

          <h4 className="font-sans text-[15px] sm:text-[18px] lg:text-[20px] font-black text-white leading-tight uppercase tracking-tight">
            Construire avec force. <br />
            <span className="text-[#E65100]">Bâtir avec précision.</span>
          </h4>

          <p className="mt-1 text-[8.5px] sm:text-[9.5px] text-[#A0A6B5] leading-relaxed line-clamp-2">
            340+ chantiers livrés aux Antilles. 45 engins en parc propre et équipes certifiées parasismique.
          </p>

          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-[#E65100] text-white text-[7.5px] font-bold uppercase tracking-wider">
              Étude de projet
            </span>
            <div className="flex items-center gap-2 text-[7.5px] font-mono text-[#DCDFE4]">
              <span className="text-[#FF8A50] font-bold text-[9px]">45</span> Engins
              <span className="text-stone-600">|</span>
              <span className="text-[#FF8A50] font-bold text-[9px]">340+</span> Chantiers
            </div>
          </div>
        </div>

        {/* Right Column: Site Excavator Image */}
        <div className="col-span-5 relative h-full max-h-[140px] rounded-lg overflow-hidden shadow-md border border-[#2A2E38]">
          <img
            src="/images/showcase/kayo-construction.jpg"
            alt="Kayo Construction Chantiers"
            className="w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-white">
            <p className="text-[7.5px] font-bold text-white uppercase leading-tight">Parc Engins Propre</p>
            <p className="text-[6.5px] text-[#FF8A50]">Pelles chenilles 22T &bull; Camions 8x4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
