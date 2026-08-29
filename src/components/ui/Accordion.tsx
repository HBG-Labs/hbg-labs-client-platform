import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Accordéon bâti sur `<details>` et `<summary>`.
 *
 * Le navigateur fournit déjà l'ouverture, la fermeture, la navigation clavier,
 * l'état `aria-expanded` et l'annonce vocale. Une réimplémentation en React
 * ajouterait du code à maintenir pour retrouver un comportement natif, et le
 * contenu resterait replié pour un moteur de recherche si le composant ne
 * s'hydratait pas.
 *
 * La foire aux questions gagne à rester lisible sans JavaScript : les réponses
 * sont dans le document, indexables (§41).
 */

export interface AccordionItemProps {
  question: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ question, children, className }: AccordionItemProps) {
  return (
    <details
      className={cn(
        'group border-b border-border last:border-b-0',
        '[&[open]_.accordion-chevron]:rotate-180',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-4 py-5',
          'text-left font-medium',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          // Retire le triangle par défaut sur WebKit.
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        {question}
        <ChevronDown
          className="accordion-chevron size-5 shrink-0 text-muted transition-transform"
          aria-hidden="true"
        />
      </summary>

      <div className="pb-5 pr-8 leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-surface px-5 sm:px-6', className)}
      {...props}
    />
  );
}
