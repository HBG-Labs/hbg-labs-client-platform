import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { SHOWCASE_PROJECTS, type ShowcaseSector } from '@/data/showcase';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { ShowcaseTotemCard } from './ShowcaseTotemCard';
import { ProjectViewerModal } from './showcase/ProjectViewerModal';
import './showcase.css';

const FILTERS: { id: ShowcaseSector | null; label: string }[] = [
  { id: null, label: 'Tout voir' },
  { id: 'BEAUTY', label: 'Soin & Beauté' },
  { id: 'BTP', label: 'Artisan & BTP' },
];

export function ShowcaseGallery({ asPage = false }: { asPage?: boolean }) {
  const [activeFilter, setActiveFilter] = useState<ShowcaseSector | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const Heading = asPage ? 'h1' : 'h2';
  const projects = SHOWCASE_PROJECTS.filter((project) =>
    activeFilter === null || project.category === activeFilter,
  );

  useEffect(() => {
    const root = galleryRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elements = root.querySelectorAll<HTMLElement>('[data-showcase-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.showcaseReveal = 'visible';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    // Le contenu reste visible sans observer ou en mouvement réduit.
    const reveal = () => {
      observer.disconnect();
      elements.forEach((element) => {
        if (!motion.matches && element.getBoundingClientRect().top >= window.innerHeight) {
          element.dataset.showcaseReveal = 'pending';
          observer.observe(element);
        } else {
          element.dataset.showcaseReveal = '';
        }
      });
    };
    reveal();
    motion.addEventListener('change', reveal);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', reveal);
      elements.forEach((element) => { element.dataset.showcaseReveal = ''; });
    };
  }, [activeFilter]);

  return (
    <section id="realisations" ref={galleryRef} className="showcase-studio">
      <Container width="wide">
        <header className="showcase-intro">
          <div className="showcase-kicker showcase-entrance">
            <span>HBG Labs / Réalisations</span>
            <span>Design & développement</span>
          </div>
          <div className="showcase-intro-grid">
            <Heading className="showcase-title showcase-entrance">
              Le web prend<br />{' '}
              <span>du caractère.</span>
            </Heading>
            <div className="showcase-intro-note showcase-entrance">
              <p>Des univers singuliers, pensés pour votre métier. Découvrez nos concepts de sites et parcourez les maquettes interactives.</p>
              <a className="showcase-scroll" href="#selection-projets">
                <span className="showcase-scroll-icon"><ArrowDown size={20} aria-hidden="true" /></span>
                Voir la sélection
              </a>
            </div>
          </div>
        </header>

        <div id="selection-projets" className="showcase-selection">
          {asPage && <h2 className="sr-only">Notre sélection de concepts</h2>}
          <div className="showcase-filter-row">
            <div className="showcase-filters" role="group" aria-label="Filtrer par secteur">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id ?? 'all'}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  aria-controls="showcase-projects"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn('showcase-filter', activeFilter === filter.id && 'is-active')}
                >
                  {filter.label}
                  {filter.id === null && <span aria-hidden="true">{String(SHOWCASE_PROJECTS.length).padStart(2, '0')}</span>}
                </button>
              ))}
            </div>
            <p className="showcase-project-count" role="status" aria-live="polite">
              {projects.length} concept{projects.length > 1 ? 's' : ''} à découvrir
            </p>
          </div>

          <div id="showcase-projects" className={cn('showcase-project-grid', projects.length === 1 && 'is-filtered')}>
            {projects.map((project) => (
              <ShowcaseTotemCard key={project.id} project={project} isFocused onOpen={setSelectedProjectId} />
            ))}
          </div>
          <p className="showcase-disclaimer">Créations de démonstration du studio. Chaque projet illustre une direction artistique et un parcours de navigation.</p>
        </div>

        <div className="showcase-next" data-showcase-reveal="">
          <div>
            <p className="showcase-kicker">Et maintenant, votre univers.</p>
            <h2>Votre projet a<br />{' '}<span>sa place ici.</span></h2>
          </div>
          <div className="showcase-next-action">
            <p>Une identité à affirmer, une activité à faire connaître. Construisons le site qui vous ressemble.</p>
            <Button asChild size="lg" className="showcase-cta">
              <Link to="/devis">Parlons de votre projet <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </Container>
      {selectedProjectId && (
        <ProjectViewerModal
          isOpen
          onClose={() => setSelectedProjectId(null)}
          initialProjectId={selectedProjectId}
        />
      )}
    </section>
  );
}
