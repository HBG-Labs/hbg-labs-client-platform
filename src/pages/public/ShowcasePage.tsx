import { useParams, useNavigate } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { ShowcaseGallery } from '@/components/marketing/ShowcaseGallery';
import { ProjectViewerModal } from '@/components/marketing/showcase/ProjectViewerModal';
import { SHOWCASE_PROJECTS } from '@/data/showcase';

export function ShowcasePage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const isModalOpen = Boolean(projectId && SHOWCASE_PROJECTS.some((p) => p.id === projectId));

  return (
    <>
      <Seo
        title="Nos Réalisations &bull; Showcase de Maquettes"
        description="Découvrez nos concepts de sites web et applications sur mesure : Soie & Terre (Soin & Beauté), Kayo Construction (BTP), Racines & Braise (Restauration), Horizons Prestige (Immobilier)."
        path="/showcase"
      />

      <ShowcaseGallery />

      {isModalOpen && projectId && (
        <ProjectViewerModal
          isOpen={isModalOpen}
          onClose={() => navigate('/showcase')}
          initialProjectId={projectId}
        />
      )}
    </>
  );
}
