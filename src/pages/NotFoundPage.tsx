import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 bg-surface-muted px-6 text-center">
      <p className="font-serif text-7xl text-accent/50">404</p>
      <h1 className="font-serif text-5xl tracking-[-0.03em]">Cette page s’est perdue.</h1>
      <p className="max-w-md text-muted">
        Cette adresse ne correspond à aucune page de la plateforme.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Revenir à l’accueil</Link>
      </Button>
    </div>
  );
}
