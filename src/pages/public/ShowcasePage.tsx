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
        title="Réalisations et concepts de sites web"
        description="Découvrez les concepts interactifs du studio HBG Labs : Soie & Terre, pour le soin et la beauté, et Kayo Construction, pour les métiers du bâtiment."
        path="/showcase"
      />

      <ShowcaseGallery asPage />

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
