import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Check, 
  Maximize2
} from 'lucide-react';
import { SHOWCASE_PROJECTS, type ShowcaseSector } from '@/data/showcase';
import { ProjectViewerModal } from './showcase/ProjectViewerModal';
import { Container, Section } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';

const FILTER_TABS: { id: ShowcaseSector; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'BEAUTY', label: 'Soin & Beauté' },
  { id: 'BTP', label: 'Artisan & BTP' },
  { id: 'RESTAURANT', label: 'Restauration' },
  { id: 'REAL_ESTATE', label: 'Immobilier' },
];

export function ShowcaseGallery() {
  const [selectedCategory, setSelectedCategory] = useState<ShowcaseSector>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    SHOWCASE_PROJECTS[0]?.id ?? 'soie-et-terre'
  );

  const filteredProjects = selectedCategory === 'ALL'
    ? SHOWCASE_PROJECTS
    : SHOWCASE_PROJECTS.filter((p) => p.category === selectedCategory);

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setModalOpen(true);
  };

  return (
    <Section id="realisations" className="bg-[#0B0D11] text-white py-24 sm:py-32 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-muted/10 border border-white/10 text-white/90 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="size-3.5 text-accent" />
            Nos Réalisations &bull; Showcase
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight leading-[1.08]">
            Des expériences digitales pensées pour votre activité.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Chaque entreprise est unique. Votre site doit l’être aussi. Explorez nos concepts sur mesure conçus pour valoriser l’identité et maximiser la conversion de chaque métier.
          </p>
        </div>

        {/* ── Category Filters ── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                selectedCategory === tab.id
                  ? 'bg-white text-black shadow-md scale-105'
                  : 'bg-white/5 text-[#94A3B8] hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Projects Grid ── */}
        <div className="mt-16 space-y-20">
          {filteredProjects.map((project, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={project.id}
                className="group relative rounded-3xl border border-white/10 bg-[#12151D]/90 backdrop-blur-sm p-6 sm:p-10 lg:p-12 transition-all hover:border-white/20 shadow-2xl"
              >
                <div className={`grid gap-10 lg:grid-cols-12 lg:items-center ${isReversed ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Left Column: Info & Metrics */}
                  <div className={`lg:col-span-5 ${isReversed ? 'lg:col-start-8' : ''}`}>
                    <span className="inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white/90 font-semibold mb-4">
                      {project.sectorLabel}
                    </span>

                    <h3 className="font-serif text-3xl sm:text-4xl text-white font-normal">
                      {project.name}
                    </h3>

                    <p className="mt-2 text-sm font-serif italic text-[#CBD5E1]">
                      « {project.tagline} »
                    </p>

                    <p className="mt-4 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                      {project.shortPitch}
                    </p>

                    {/* Metrics Badges */}
                    <div className="mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-4">
                      {project.metrics.map((m) => (
                        <div key={m.label}>
                          <span className="font-mono text-lg sm:text-xl font-bold text-white block">
                            {m.value}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Features checklist */}
                    <ul className="mt-6 space-y-2 text-xs text-[#CBD5E1]">
                      {project.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5">
                          <Check className="size-3.5 text-accent shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => handleOpenProject(project.id)}
                        className="inline-flex items-center gap-3 bg-white text-black font-semibold text-xs uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-accent hover:text-white transition-all shadow-md group/btn"
                      >
                        <span>Voir le projet</span>
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Interactive Device Mockup Frame */}
                  <div className={`lg:col-span-7 ${isReversed ? 'lg:col-start-1' : ''}`}>
                    <div 
                      onClick={() => handleOpenProject(project.id)}
                      className="cursor-pointer group/frame relative rounded-2xl border border-white/15 bg-[#181C26] overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                    >
                      {/* Safari Top Bar Mockup */}
                      <div className="h-9 bg-[#1F2432] border-b border-white/10 px-4 flex items-center justify-between select-none">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2.5 rounded-full bg-[#EF4444]" />
                          <div className="size-2.5 rounded-full bg-[#F59E0B]" />
                          <div className="size-2.5 rounded-full bg-[#10B981]" />
                        </div>
                        <div className="w-60 max-w-[60%] h-5 bg-[#12151E] rounded-md px-3 flex items-center justify-center text-[10px] text-[#64748B] font-mono truncate">
                          https://{project.slug}.hbg-labs.com
                        </div>
                        <div className="flex items-center gap-2 text-[#64748B]">
                          <Maximize2 className="size-3.5 group-hover/frame:text-white transition-colors" />
                        </div>
                      </div>

                      {/* Screen Preview Container */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={project.mockupImage}
                          alt={`Maquette interactive ${project.name} par HBG Labs`}
                          loading="lazy"
                          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover/frame:scale-105"
                        />

                        {/* Hover Overlay Hint */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 bg-white/95 text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            <Maximize2 className="size-3.5" />
                            Explorer la maquette interactive
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Conversion Banner ── */}
        <div className="mt-28 rounded-3xl border border-white/10 bg-gradient-to-r from-[#181C26] to-[#12151E] p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-2">
              Sur Mesure &bull; Studio Digital
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl text-white font-normal">
              Votre activité mérite son propre univers digital.
            </h3>
            <p className="mt-4 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Que vous soyez artisan, restaurateur, professionnel de l’immobilier ou entrepreneur, HBG Labs crée une expérience digitale pensée pour votre activité.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="primary" className="rounded-full px-8 py-4 uppercase text-xs tracking-widest font-bold">
                <Link to="/devis">
                  Démarrer mon projet
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
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
