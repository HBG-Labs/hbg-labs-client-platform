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
        'inline-flex items-baseline font-sans text-[15px] uppercase tracking-[-0.02em] text-ink',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
        className,
      )}
      aria-label={`${site.name}, retour à l’accueil`}
    >
      <span className="font-normal">HBG</span>
      <span className="font-extrabold">LABS</span>
    </Link>
  );
}
