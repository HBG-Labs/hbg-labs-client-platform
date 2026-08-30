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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Retour au site
          </Link>
        </div>
      </header>

      <main id="contenu-principal" className="flex flex-1 items-start justify-center px-6 pb-16 sm:px-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<LoadingState label="Chargement…" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <footer className="px-6 pb-8 sm:px-10">
        <p className="mx-auto max-w-md text-center text-xs text-muted">
          <Link to="/mentions-legales" className="hover:text-ink">
            Mentions légales
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/politique-confidentialite" className="hover:text-ink">
            Confidentialité
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/cgv" className="hover:text-ink">
            CGV
          </Link>
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-xs text-muted">
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
      <div className="rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-sm">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-2 font-sans text-[15px] leading-relaxed text-muted">{description}</p>
        )}
        <div className="mt-8">{children}</div>
      </div>

      {footer && <div className="mt-6 text-center font-sans text-sm text-muted">{footer}</div>}
    </>
  );
}
