import { cn } from '@/lib/utils';

/**
 * Briques de mise en page du site public.
 *
 * `Container` fixe la largeur de lecture et les marges latérales, `Section`
 * le rythme vertical. Les répéter dans chaque page produirait des écarts
 * d'espacement d'une page à l'autre, visibles dès qu'on navigue.
 */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `narrow` pour du texte suivi (pages légales), `wide` pour les grilles. */
  width?: 'narrow' | 'default' | 'wide';
}

export function Container({ className, width = 'default', ...props }: ContainerProps) {
  const widths = {
    // 65 caractères par ligne environ, la longueur confortable en lecture.
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
  };

  return (
    <div className={cn('mx-auto w-full px-5 sm:px-8', widths[width], className)} {...props} />
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Fond alterné, pour séparer visuellement deux sections successives. */
  tone?: 'default' | 'muted';
  spacing?: 'default' | 'tight';
}

export function Section({
  className,
  tone = 'default',
  spacing = 'default',
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        spacing === 'default' ? 'py-16 sm:py-24' : 'py-12 sm:py-16',
        tone === 'muted' && 'bg-surface-muted',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export interface SectionHeadingProps {
  /** Court libellé au-dessus du titre, pour situer la section. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Niveau de titre. La page porte le `h1`, les sections des `h2`. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = 'h2',
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}

      <Tag
        className={cn(
          'text-balance font-semibold tracking-tight',
          Tag === 'h1' ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
        )}
      >
        {title}
      </Tag>

      {description && (
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
