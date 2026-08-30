import { cn } from '@/lib/utils';

/**
 * Conteneur de contenu. Base visuelle des tableaux de bord (§14, §27).
 *
 * Sur mobile, les tableaux se transforment en empilement de cartes (§40) :
 * ce composant est donc autant une brique de mise en page qu'un élément
 * décoratif.
 */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface text-surface-foreground transition-colors',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Niveau de titre. Le défaut `h3` convient à une carte imbriquée dans une
   * section ; ajustez-le pour que la hiérarchie de la page reste continue —
   * un lecteur d'écran s'en sert pour naviguer (§43).
   */
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ className, as: Tag = 'h3', ...props }: CardTitleProps) {
  return (
    <Tag className={cn('text-base font-semibold leading-tight', className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border-t border-border p-5 sm:p-6',
        className,
      )}
      {...props}
    />
  );
}
