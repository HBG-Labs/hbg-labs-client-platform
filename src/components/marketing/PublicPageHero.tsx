import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Layout';

interface PublicPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

/** En-tête éditorial partagé par les pages marketing. */
export function PublicPageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: PublicPageHeroProps) {
  return (
    <section className={cn('relative overflow-hidden bg-ink text-white', className)}>
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_82%_15%,rgba(69,174,111,0.38),transparent_30%),radial-gradient(circle_at_12%_90%,rgba(255,255,255,0.1),transparent_28%)]" />
      <Container className="relative py-20 sm:py-28 lg:py-32" width="wide">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-200">{eyebrow}</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.92] tracking-[-0.035em] sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg">
            {description}
          </p>
          {children && <div className="mt-9">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
