import { useState, useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog } from '@/components/ui/Dialog';
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
  const returnFocusRef = useRef<HTMLElement | null>(null);

  if (initialProjectId !== prevInitialId) {
    setPrevInitialId(initialProjectId);
    setCurrentId(initialProjectId);
  }

  if (!isOpen) return null;

  const currentProject = SHOWCASE_PROJECTS.find((p) => p.id === currentId) ?? SHOWCASE_PROJECTS[0]!;

  const renderLanding = () => {
    const isMobile = deviceMode === 'mobile';
    switch (currentProject.id) {
      case 'soie-et-terre':
        return <BeautyLanding isMobile={isMobile} />;
      case 'kayo-construction':
        return <ConstructionLanding isMobile={isMobile} />;
      case 'racines-et-braise':
        return <RestaurantLanding isMobile={isMobile} />;
      case 'horizons-prestige':
        return <RealEstateLanding isMobile={isMobile} />;
      default:
        return <BeautyLanding isMobile={isMobile} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <RadixDialog.Content
          className="showcase-viewer fixed inset-0 z-50 flex flex-col bg-[#0A0B0D] text-white"
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          <RadixDialog.Title className="sr-only">Maquette {currentProject.name}</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">Concept de démonstration interactif. Changez le format d’aperçu ou appuyez sur Échap pour revenir à la galerie.</RadixDialog.Description>
      {/* ── Studio Top Toolbar ── */}
      <header className="h-16 shrink-0 bg-[#12141A] border-b border-[#232733] px-3 sm:px-6 flex items-center justify-between gap-2 z-50 select-none">
        {/* Left: Back button & brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0] hover:text-white bg-[#1A1D26] hover:bg-[#252A36] px-2 sm:px-3.5 py-2 rounded-lg transition-colors border border-[#2B3140]"
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
                aria-pressed={currentId === proj.id}
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
            aria-label="Aperçu ordinateur"
            aria-pressed={deviceMode === 'desktop'}
            className={`flex min-h-11 items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceMode === 'desktop'
                ? 'bg-[#2B3140] text-white shadow-xs'
                : 'text-[#718096] hover:text-white'
            }`}
            title="Aperçu Écran Large / Ordinateur"
          >
            <Monitor className="size-4" />
            <span className="hidden md:inline">Ordinateur</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            aria-label="Aperçu mobile"
            aria-pressed={deviceMode === 'mobile'}
            className={`flex min-h-11 items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            className="inline-flex min-h-11 items-center gap-2 bg-[#E65100] text-white text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 rounded-lg hover:bg-[#FF6D00] transition-all shadow-sm"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Créer mon site similaire</span>
            <span className="sm:hidden">Devis</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-[#718096] hover:text-white rounded-lg hover:bg-[#1A1D26]"
            aria-label="Fermer la vue immersive"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <p className="shrink-0 px-3 py-1.5 text-center text-[10px] tracking-wide text-[#A0AEC0]">
        Concept de démonstration : {currentProject.name}
      </p>

      {/* ── Main Viewport Container ── */}
      <main className="flex-1 overflow-auto bg-[#07080A] flex items-center justify-center p-0 md:p-4">
        {deviceMode === 'desktop' ? (
          <div className="w-full h-full overflow-y-auto bg-white shadow-2xl">
            {renderLanding()}
          </div>
        ) : (
          /* ── Clean Mobile Viewport Container ── */
          <div className="my-auto relative w-full max-w-[390px] h-[min(844px,calc(100dvh-120px))] bg-black rounded-[36px] p-2 shadow-2xl ring-1 ring-white/15 border-2 border-[#2B3140] flex flex-col">
            {/* Screen Content */}
            <div className="w-full h-full rounded-[28px] overflow-y-auto overflow-x-hidden bg-white">
              {renderLanding()}
            </div>
          </div>
        )}
      </main>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </Dialog>
  );
}
