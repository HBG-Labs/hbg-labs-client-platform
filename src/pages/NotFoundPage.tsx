import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="max-w-md text-muted">
        Cette adresse ne correspond à aucune page de la plateforme.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Revenir à l’accueil</Link>
      </Button>
    </div>
  );
}
