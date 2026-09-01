import { useState, useRef } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
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

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale(1.02)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)');
    setGlarePosition({ x: 50, y: 50, opacity: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Backlight halo cast on the architectural concrete wall
  const haloColor = isHovered || isFocused
    ? project.accentColor
    : 'rgba(235, 160, 90, 0.4)';

  return (
    <div
      className={`flex flex-col items-center transition-all duration-300 ${
        isFocused ? 'opacity-100 scale-100' : 'opacity-70 hover:opacity-100 scale-[0.98] hover:scale-100'
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

      {/* ── 3D Architectural Shadowbox Frame (Outer Molded Bevel) ── */}
      <div
        ref={cardRef}
        onClick={() => onOpen(project.id)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: transform || 'perspective(1200px) rotateX(0deg) rotateY(0deg)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out, box-shadow 0.4s ease-out',
          boxShadow: isHovered || isFocused
            ? `0 0 55px 12px ${haloColor}70, 0 30px 60px -15px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.6)`
            : '0 0 35px 5px rgba(245, 175, 100, 0.3), 0 20px 40px -10px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.5)',
        }}
        className="cursor-pointer group relative w-full aspect-[9/16] rounded-[24px] sm:rounded-[28px] p-2.5 sm:p-3 bg-gradient-to-b from-[#252830] via-[#1A1C22] to-[#121318] border-[3px] border-[#363A47] overflow-hidden select-none"
      >
        {/* Ambient Backlight Glow Behind Frame Layer */}
        <div
          className="absolute inset-0 -z-10 rounded-[28px] blur-2xl transition-opacity duration-500 pointer-events-none"
          style={{
            backgroundColor: haloColor,
            opacity: isHovered || isFocused ? 0.65 : 0.3,
          }}
        />

        {/* ── Recessed Shadowbox Alcove (Deep Cavity Layer) ── */}
        <div className="relative w-full h-full rounded-[16px] sm:rounded-[20px] p-2 sm:p-2.5 bg-[#090A0D] shadow-[inset_0_10px_25px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(255,255,255,0.1),inset_0_-4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center">
          
          {/* ── Floating Inner OLED Mockup Screen ── */}
          <div className="relative w-full h-full rounded-[10px] sm:rounded-[14px] overflow-hidden bg-black shadow-[0_12px_28px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col">
            
            {/* Scrollable Website Image */}
            <div className="relative w-full h-full overflow-hidden bg-stone-900">
              <img
                src={project.mockupImage}
                alt={`Maquette ${project.name} par HBG Labs`}
                loading="lazy"
                className={`w-full object-cover object-top transition-transform ease-in-out ${
                  isHovered ? 'duration-[6000ms] -translate-y-[45%]' : 'duration-[1200ms] translate-y-0'
                }`}
                style={{
                  height: '250%',
                  maxHeight: 'none',
                }}
              />

              {/* Glass Glare Reflection on Mouse Move */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle 260px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glarePosition.opacity}), transparent 75%)`,
                }}
              />

              {/* Bottom Gradient for Contrast */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              {/* Floating Explore Action Badge */}
              <div className="absolute inset-x-2 bottom-3.5 flex items-center justify-center pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-semibold tracking-wide shadow-lg group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300 group-hover:scale-105">
                  <Maximize2 className="size-3" />
                  <span>Explorer la maquette</span>
                </span>
              </div>

              {/* Live Indicator Top Corner */}
              <div className="absolute top-2.5 right-2.5 pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white/90">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Micro Sector Tag Below ── */}
      <div className="mt-3 text-center">
        <span className="text-[11px] font-bold text-[#3B3E48] flex items-center justify-center gap-1">
          <Sparkles className="size-3 text-accent" />
          {project.sectorLabel}
        </span>
      </div>
    </div>
  );
}
