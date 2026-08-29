import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { site } from '@/config/site';

/**
 * Identité visuelle textuelle.
 *
 * Aucun fichier d'image : la marque n'a pas encore de logo dessiné. Un
 * placeholder graphique donnerait l'illusion d'une identité arrêtée et
 * faudrait le remplacer partout le jour venu. Le jour où un logo existe, il
 * remplace le contenu de ce seul composant.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2 rounded-sm font-semibold tracking-tight',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
        className,
      )}
      aria-label={`${site.name}, retour à l’accueil`}
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        H
      </span>
      <span className="text-lg">{site.name}</span>
    </Link>
  );
}
