import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SHOWCASE_PROJECTS, type ShowcaseSector } from '@/data/showcase';
import { ShowcaseTotemCard } from './ShowcaseTotemCard';
import { ProjectViewerModal } from './showcase/ProjectViewerModal';
import { Container, Section } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';

type FilterType = 'ALL' | ShowcaseSector;

const FILTER_ITEMS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'TOUS' },
  { id: 'BEAUTY', label: 'SOIN & BEAUTÉ' },
  { id: 'BTP', label: 'ARTISAN & BTP' },
  { id: 'RESTAURANT', label: 'RESTAURATION' },
  { id: 'REAL_ESTATE', label: 'IMMOBILIER' },
];

export function ShowcaseGallery() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    SHOWCASE_PROJECTS[0]?.id ?? 'soie-et-terre'
  );

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setModalOpen(true);
  };

  return (
    <Section
      id="realisations"
      className="relative py-28 sm:py-36 overflow-hidden border-y border-stone-300/80 bg-[#E3E1DC]"
    >
      {/* ── Realistic Studio Architectural Concrete Wall Background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/images/showcase-wall-bg.jpg')" }}
      />
      {/* Ambient depth overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/5 via-transparent to-stone-900/15 pointer-events-none" />

      <Container width="wide" className="relative z-10">
        {/* ── Header Area (True to reference image) ── */}
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#3B3E48] uppercase">
            Nos réalisations / Showcase
          </p>

          <h2 className="mt-3 font-sans text-2xl sm:text-4xl md:text-5xl lg:text-[2.65rem] font-black uppercase tracking-tight text-[#111215] leading-tight">
            Des expériences digitales pensées pour votre activité.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#4A4D57] font-medium">
            Chaque entreprise est unique. Votre site doit l’être aussi.
          </p>

          {/* ── Minimalist Inline Filter Bar (TOUS | SOIN & BEAUTÉ | ...) ── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 text-xs sm:text-sm uppercase tracking-wider font-bold text-[#3B3E48]">
            {FILTER_ITEMS.map((item, index) => {
              const isActive = activeFilter === item.id;
              return (
                <div key={item.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveFilter(item.id)}
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

        {/* ── 4 Wall-Mounted Interactive Screens Grid ── */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start">
          {SHOWCASE_PROJECTS.map((project) => {
            const isFocused =
              activeFilter === 'ALL' || activeFilter === project.category;

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

        {/* ── Studio Brushed Aluminum Plaque "HBGLabs" ── */}
        <div className="mt-14 flex justify-center">
          <div className="relative inline-flex items-center gap-3 px-8 py-2.5 rounded-md bg-gradient-to-b from-[#E6E8EC] via-[#CED2D9] to-[#ADB3BD] border border-white/60 shadow-[0_6px_20px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] select-none">
            {/* Corner metallic rivets */}
            <div className="absolute top-1.5 left-2 size-1.5 rounded-full bg-stone-500/70 shadow-inner" />
            <div className="absolute top-1.5 right-2 size-1.5 rounded-full bg-stone-500/70 shadow-inner" />
            <div className="absolute bottom-1.5 left-2 size-1.5 rounded-full bg-stone-500/70 shadow-inner" />
            <div className="absolute bottom-1.5 right-2 size-1.5 rounded-full bg-stone-500/70 shadow-inner" />

            <span className="font-mono text-xs sm:text-sm font-black tracking-[0.25em] uppercase text-[#1E2128] drop-shadow-[0_1px_0px_rgba(255,255,255,0.8)]">
              HBGLabs
            </span>
          </div>
        </div>

        {/* ── Bottom Call To Action ── */}
        <div className="mt-20 max-w-2xl mx-auto rounded-3xl border border-stone-300/80 bg-white/80 backdrop-blur-md p-8 sm:p-10 text-center shadow-xl">
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

      {/* ── Interactive Project Viewer Modal ── */}
      <ProjectViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialProjectId={selectedProjectId}
      />
    </Section>
  );
}
