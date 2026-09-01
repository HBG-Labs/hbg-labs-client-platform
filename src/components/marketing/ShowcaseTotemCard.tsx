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

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale(1.02)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
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

  // Backlight halo color based on brand accent
  const haloColor = isHovered || isFocused
    ? project.accentColor
    : 'rgba(235, 175, 120, 0.3)';

  return (
    <div
      className={`flex flex-col items-center transition-opacity duration-300 ${
        isFocused ? 'opacity-100 scale-100' : 'opacity-85 hover:opacity-100'
      }`}
    >
      {/* ── Screen Label ── */}
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        className="mb-3 text-center cursor-pointer group/title"
      >
        <h3 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 group-hover/title:text-accent transition-colors">
          {project.name}
        </h3>
      </button>

      {/* ── Wall-Mounted Kiosk Frame ── */}
      <div
        ref={cardRef}
        onClick={() => onOpen(project.id)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out, box-shadow 0.4s ease-out',
          boxShadow: isHovered || isFocused
            ? `0 0 50px 8px ${haloColor}55, 0 30px 60px -15px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.2)`
            : '0 0 35px 2px rgba(240, 180, 120, 0.2), 0 20px 40px -10px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
        className="cursor-pointer group relative w-full aspect-[9/16] rounded-[24px] sm:rounded-[28px] p-2 bg-[#121419] border-2 border-[#2B303C] overflow-hidden select-none"
      >
        {/* Ambient Backlight Glow Behind Frame Layer */}
        <div
          className="absolute inset-0 -z-10 rounded-[28px] blur-xl transition-opacity duration-500 pointer-events-none"
          style={{
            backgroundColor: haloColor,
            opacity: isHovered || isFocused ? 0.35 : 0.15,
          }}
        />

        {/* ── Bezel Screen Border ── */}
        <div className="relative w-full h-full rounded-[18px] sm:rounded-[22px] overflow-hidden bg-black flex flex-col">
          
          {/* Inner Scrollable Screen Image */}
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
                background: `radial-gradient(circle 280px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glarePosition.opacity}), transparent 75%)`,
              }}
            />

            {/* Bottom Gradient for Contrast */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Floating Explore Action Badge */}
            <div className="absolute inset-x-3 bottom-4 flex items-center justify-center pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wide shadow-lg group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300 group-hover:scale-105">
                <Maximize2 className="size-3" />
                <span>Explorer la maquette</span>
              </span>
            </div>

            {/* Live Indicator Top Corner */}
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white/90">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Micro Sector Tag Below ── */}
      <div className="mt-3 text-center">
        <span className="text-[11px] font-medium text-stone-400 flex items-center justify-center gap-1">
          <Sparkles className="size-3 text-accent" />
          {project.sectorLabel}
        </span>
      </div>
    </div>
  );
}
