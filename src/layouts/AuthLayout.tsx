import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { site } from '@/config/site';
import { Logo } from '@/components/marketing/Logo';
import { LoadingState } from '@/components/ui/States';

/**
 * Mise en page des écrans d'authentification (§9).
 *
 * Colonne étroite et centrée, sans barre de navigation : sur un formulaire de
 * connexion, un menu complet n'offre que des occasions de partir ailleurs. Le
 * retour au site reste accessible par un lien explicite.
 */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_8%_0%,rgba(81,190,119,0.32),transparent_27%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.12),transparent_30%)]" />
      <header className="relative px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <Logo className="text-white [&>img]:brightness-0 [&>img]:invert" />
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-1.5 font-sans text-sm text-white/65 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Retour au site
          </Link>
        </div>
      </header>

      <main id="contenu-principal" className="relative flex flex-1 items-start justify-center px-6 pb-16 sm:px-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<LoadingState label="Chargement…" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <footer className="relative px-6 pb-8 sm:px-10">
        <p className="mx-auto max-w-md text-center text-xs text-white/45">
          <Link to="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/politique-confidentialite" className="hover:text-white">
            Confidentialité
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/cgv" className="hover:text-white">
            CGV
          </Link>
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-xs text-white/45">
          © {new Date().getFullYear()} {site.legalName || site.name}
        </p>
      </footer>
    </div>
  );
}

/** Carte contenant un formulaire d'authentification. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <div className="rounded-[2rem] border border-white/15 bg-surface p-8 shadow-2xl sm:p-10">
        <h1 className="font-serif text-4xl font-normal tracking-[-0.03em] text-ink">{title}</h1>
        {description && (
          <p className="mt-2 font-sans text-[15px] leading-relaxed text-muted">{description}</p>
        )}
        <div className="mt-8">{children}</div>
      </div>

      {footer && <div className="mt-6 text-center font-sans text-sm text-white/65">{footer}</div>}
    </>
  );
}
