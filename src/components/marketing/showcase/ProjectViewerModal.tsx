import { useState, useEffect } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  ArrowLeft, 
  Sparkles
} from 'lucide-react';
import { SHOWCASE_PROJECTS } from '@/data/showcase';
import { BeautyLanding } from './BeautyLanding';
import { ConstructionLanding } from './ConstructionLanding';
import { RestaurantLanding } from './RestaurantLanding';
import { RealEstateLanding } from './RealEstateLanding';

interface ProjectViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProjectId: string;
}

export function ProjectViewerModal({
  isOpen,
  onClose,
  initialProjectId,
}: ProjectViewerModalProps) {
  const [prevInitialId, setPrevInitialId] = useState(initialProjectId);
  const [currentId, setCurrentId] = useState(initialProjectId);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  if (initialProjectId !== prevInitialId) {
    setPrevInitialId(initialProjectId);
    setCurrentId(initialProjectId);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentProject = SHOWCASE_PROJECTS.find((p) => p.id === currentId) ?? SHOWCASE_PROJECTS[0]!;

  const renderLanding = () => {
    switch (currentProject.id) {
      case 'soie-et-terre':
        return <BeautyLanding />;
      case 'kayo-construction':
        return <ConstructionLanding />;
      case 'racines-et-braise':
        return <RestaurantLanding />;
      case 'horizons-prestige':
        return <RealEstateLanding />;
      default:
        return <BeautyLanding />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A0B0D] text-white animate-in fade-in duration-200">
      {/* ── Studio Top Toolbar ── */}
      <header className="h-16 shrink-0 bg-[#12141A] border-b border-[#232733] px-4 sm:px-6 flex items-center justify-between z-50 select-none">
        {/* Left: Back button & brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0] hover:text-white bg-[#1A1D26] hover:bg-[#252A36] px-3.5 py-2 rounded-lg transition-colors border border-[#2B3140]"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Retour au site HBG Labs</span>
            <span className="sm:hidden">Fermer</span>
          </button>

          {/* Project Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 border-l border-[#2B3140] pl-4">
            {SHOWCASE_PROJECTS.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => setCurrentId(proj.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentId === proj.id
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-[#A0AEC0] hover:text-white hover:bg-[#1A1D26]'
                }`}
              >
                {proj.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Device Mode Switcher */}
        <div className="flex items-center bg-[#1A1D26] p-1 rounded-xl border border-[#2B3140]">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceMode === 'desktop'
                ? 'bg-[#2B3140] text-white shadow-xs'
                : 'text-[#718096] hover:text-white'
            }`}
            title="Aperçu Écran Large / Ordinateur"
          >
            <Monitor className="size-4" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceMode === 'mobile'
                ? 'bg-[#2B3140] text-white shadow-xs'
                : 'text-[#718096] hover:text-white'
            }`}
            title="Aperçu Format Smartphone"
          >
            <Smartphone className="size-4" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <a
            href={`/devis?concept=${currentProject.id}`}
            className="inline-flex items-center gap-2 bg-[#E65100] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[#FF6D00] transition-all shadow-sm"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Créer mon site similaire</span>
            <span className="sm:hidden">Devis</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#718096] hover:text-white rounded-lg hover:bg-[#1A1D26]"
            aria-label="Fermer la vue immersive"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* ── Main Viewport Container ── */}
      <main className="flex-1 overflow-auto bg-[#07080A] flex items-center justify-center p-0 md:p-4">
        {deviceMode === 'desktop' ? (
          <div className="w-full h-full overflow-y-auto bg-white shadow-2xl">
            {renderLanding()}
          </div>
        ) : (
          /* ── Mockup Mobile Smartphone Frame ── */
          <div className="my-auto relative w-full max-w-[390px] h-[844px] bg-[#12141A] rounded-[52px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-[#2B3140] flex flex-col">
            {/* Dynamic Island */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-end px-3">
              <div className="size-2 rounded-full bg-[#1A1D26]" />
            </div>

            {/* Screen Content */}
            <div className="w-full h-full rounded-[40px] overflow-y-auto overflow-x-hidden bg-white">
              {renderLanding()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
