import { ArrowUpRight } from 'lucide-react';
import type { ShowcaseProject } from '@/data/showcase';
import { cn } from '@/lib/utils';

interface ShowcaseTotemCardProps {
  project: ShowcaseProject;
  isFocused: boolean;
  onOpen: (id: string) => void;
}

/** Aperçu graphique, ouvert par un bouton natif utilisable au clavier. */
export function ShowcaseTotemCard({ project, isFocused, onOpen }: ShowcaseTotemCardProps) {
  const isBeauty = project.category === 'BEAUTY';
  const previewImage = isBeauty
    ? '/images/showcase/soie-et-terre-hero.jpg'
    : '/images/showcase/kayo-construction-hero.jpg';

  return (
    <article className={cn('showcase-project', !isFocused && 'is-muted')} data-showcase-reveal="">
      <button
        type="button"
        className={cn('showcase-project-button', isBeauty ? 'showcase-beauty' : 'showcase-construction')}
        onClick={() => onOpen(project.id)}
        aria-label={`Découvrir la maquette ${project.name}`}
      >
        <span className="showcase-artboard" aria-hidden="true">
          <span className="showcase-artboard-label"><span>{project.sectorLabel}</span><span>Concept interactif</span></span>
          <span className="showcase-browser">
            <span className="showcase-browser-bar"><span className="showcase-window-dots"><i /><i /><i /></span><span>{project.name}</span><span>↗</span></span>
            <span className="showcase-preview">
              <img src={previewImage} alt="" width={1024} height={571} loading="lazy" decoding="async" />
              <span className="showcase-preview-shade" />
              <span className="showcase-preview-content">
                <span className="showcase-preview-eyebrow">{isBeauty ? 'Rituels de beauté · Antilles' : 'Construire aux Antilles'}</span>
                <span className="showcase-preview-title">{isBeauty ? <>La beauté<br /><em>à l’état naturel.</em></> : <>Construire<br />avec force.</>}</span>
                <span className="showcase-preview-link">{isBeauty ? 'Découvrir les soins' : 'Découvrir notre savoir-faire'} <ArrowUpRight size={12} /></span>
              </span>
            </span>
            <span className="showcase-preview-bottom"><span>{isBeauty ? 'Le soin, dans chaque détail.' : 'Des fondations solides. Une vision claire.'}</span><span>01 / 03</span></span>
          </span>
          <span className="showcase-artboard-footer"><span>Design sur mesure</span><span className="showcase-view-hint">Ouvrir la maquette <ArrowUpRight size={14} /></span></span>
        </span>
        <span className="showcase-caption">
          <span className="showcase-caption-text"><span className="showcase-project-sector">{project.sectorLabel}</span><span className="showcase-project-name">{project.name}</span></span>
          <span className="showcase-open-icon" aria-hidden="true"><ArrowUpRight size={25} /></span>
        </span>
      </button>
      <h3 className="sr-only">{project.name}</h3>
      <p className="showcase-project-description">{project.shortPitch}</p>
      <ul className="showcase-project-tags" aria-label={`Disciplines du concept ${project.name}`}>
        <li>Direction artistique</li><li>Web design</li><li>Développement</li>
      </ul>
    </article>
  );
}
