import { useState, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
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
        className="cursor-pointer group relative w-full aspect-[4/3] p-2 sm:p-2.5 bg-[#16171B] border-[5px] sm:border-[7px] border-[#1C1D22] shadow-2xl select-none"
      >
        {/* Subtle Frame Outer Bevel Edge Highlight */}
        <div className="absolute inset-0 border border-white/10 pointer-events-none" />

        {/* ── Gallery Passe-Partout (Matte Board) ── */}
        <div className="relative w-full h-full p-2 sm:p-2.5 bg-[#F5F4F0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          
          {/* Inner Artwork Cutout Window */}
          <div className="relative w-full flex-1 overflow-hidden bg-stone-900 shadow-[inset_0_3px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.15)] border border-stone-400/30">
            
            {/* Scrollable Website Mockup Art */}
            <img
              src={project.mockupImage}
              alt={`Maquette ${project.name} par HBG Labs`}
              loading="lazy"
              className={`w-full object-cover object-top transition-transform ease-in-out ${
                isHovered ? 'duration-[5000ms] -translate-y-[45%]' : 'duration-[1000ms] translate-y-0'
              }`}
              style={{
                height: '280%',
                maxHeight: 'none',
              }}
            />

            {/* Museum Anti-Reflective Glass Sheen */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,${glarePosition.opacity * 0.8}) 0%, transparent 60%)`,
              }}
            />

            {/* Hover Action Pill */}
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                <span>Explorer</span>
                <ArrowUpRight className="size-3" />
              </span>
            </div>
          </div>

          {/* ── Museum Mat Bottom Label ── */}
          <div className="pt-1.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#4A4D57]">
            <span className="font-bold text-[#22242B] truncate max-w-[140px]">{project.name}</span>
            <span className="text-[#7A7E8B]">HBG LABS</span>
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
