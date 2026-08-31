import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { site } from '@/config/site';

/**
 * Identité visuelle officielle HBG Labs.
 * Intègre le logo officiel de la marque en tête, suivi du lettrage éditorial.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2.5 font-sans text-[15px] uppercase tracking-[-0.02em] text-ink transition-opacity duration-200 hover:opacity-90',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
        className,
      )}
      aria-label={`${site.name}, retour à l’accueil`}
    >
      <img
        src="/images/logo.png"
        alt="Logo HBG Labs"
        className="h-6 sm:h-7 w-auto object-contain shrink-0"
      />
      <span className="inline-flex items-baseline">
        <span className="font-normal">HBG</span>
        <span className="font-extrabold">LABS</span>
      </span>
    </Link>
  );
}
