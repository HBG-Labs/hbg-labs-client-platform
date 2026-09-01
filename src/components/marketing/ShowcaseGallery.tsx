import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SHOWCASE_PROJECTS, type ShowcaseSector } from '@/data/showcase';
import { ShowcaseTotemCard } from './ShowcaseTotemCard';
import { ProjectViewerModal } from './showcase/ProjectViewerModal';
import { Container } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';

type FilterType = ShowcaseSector;

const FILTER_ITEMS: { id: FilterType; label: string }[] = [
  { id: 'BEAUTY', label: 'SOIN & BEAUTÉ' },
  { id: 'BTP', label: 'ARTISAN & BTP' },
];

export function ShowcaseGallery() {
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    SHOWCASE_PROJECTS[0]?.id ?? 'soie-et-terre'
  );

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setModalOpen(true);
  };

  const handleFilterClick = (sectorId: FilterType) => {
    setActiveFilter((prev) => (prev === sectorId ? null : sectorId));
  };

  return (
    <section
      id="realisations"
      className="relative w-full bg-[#E5E3DE] overflow-hidden border-b border-stone-300/80"
    >
      {/* ── Realistic Studio Architectural Concrete Wall (Full 16:9 Scene Height) ── */}
      <div className="relative w-full max-w-[2000px] mx-auto min-h-[680px] sm:min-h-[860px] md:min-h-[980px] lg:min-h-[1100px] flex flex-col justify-start">
        {/* Natural Full-Height Wall Background */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            backgroundImage: "url('/images/showcase-wall-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <Container width="wide" className="relative z-10 max-w-7xl mx-auto pt-16 sm:pt-24 md:pt-28 lg:pt-32 pb-24 sm:pb-36 lg:pb-48">
          {/* ── Header Area (True to reference image) ── */}
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#3B3E48] uppercase">
              Nos réalisations / Showcase
            </p>

            <h2 className="mt-2 font-sans text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-[#111215] leading-tight">
              Des expériences digitales pensées pour votre activité.
            </h2>

            <p className="mt-2 text-xs sm:text-sm md:text-base text-[#4A4D57] font-medium">
              Chaque entreprise est unique. Votre site doit l’être aussi.
            </p>

            {/* ── Minimalist Inline Filter Bar (SOIN & BEAUTÉ | ARTISAN & BTP | ...) ── */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-y-2 text-xs sm:text-sm uppercase tracking-wider font-bold text-[#3B3E48]">
              {FILTER_ITEMS.map((item, index) => {
                const isActive = activeFilter === item.id;
                return (
                  <div key={item.id} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFilterClick(item.id)}
                      className={`px-3 py-1 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'text-[#111215] font-black underline decoration-[#111215] decoration-2 underline-offset-8 scale-105'
                          : 'text-[#4A4D57] hover:text-[#111215]'
                      }`}
                    >
                      {item.label}
                    </button>
                    {index < FILTER_ITEMS.length - 1 && (
                      <span className="text-[#8E929E] select-none px-1.5 font-normal" aria-hidden="true">
                        |
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2 Wall-Mounted Interactive Wide Panoramic Picture Frames ── */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 items-start max-w-6xl xl:max-w-7xl 2xl:max-w-[1560px] mx-auto">
            {SHOWCASE_PROJECTS.map((project) => {
              const isFocused =
                activeFilter === null || activeFilter === project.category;

              return (
                <ShowcaseTotemCard
                  key={project.id}
                  project={project}
                  isFocused={isFocused}
                  onOpen={handleOpenProject}
                />
              );
            })}
          </div>
        </Container>
      </div>

      {/* ── Bottom Call To Action ── */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-[#E5E3DE]/80 to-[#DCD9D3] pt-6 pb-20 sm:pb-24">
        <Container width="wide">
          <div className="max-w-2xl mx-auto rounded-3xl border border-stone-300/90 bg-white/85 backdrop-blur-md p-8 sm:p-10 text-center shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-wider mb-3">
              <Sparkles className="size-3" />
              Sur Mesure &bull; Studio Digital
            </div>
            <h3 className="font-sans text-xl sm:text-2xl font-black uppercase text-[#111215] tracking-tight">
              Votre activité mérite son propre univers digital.
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#4A4D57] leading-relaxed">
              Que vous soyez artisan, restaurateur, professionnel de l’immobilier ou entrepreneur, HBG Labs crée une expérience digitale pensée pour votre activité.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="primary" className="rounded-full px-8 py-3 uppercase text-xs tracking-widest font-bold shadow-md">
                <Link to="/devis">
                  Démarrer mon projet
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* ── Interactive Project Viewer Modal ── */}
      <ProjectViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialProjectId={selectedProjectId}
      />
    </section>
  );
}
