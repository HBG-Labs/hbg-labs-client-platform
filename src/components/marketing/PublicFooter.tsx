import { Link } from 'react-router-dom';
import { Mail, Phone, SlidersHorizontal } from 'lucide-react';
import { site } from '@/config/site';
import { footerNav } from '@/config/navigation';
import { Container } from '@/components/ui/Layout';
import { openCookiePreferences } from '@/hooks/useCookieConsent';
import { Logo } from './Logo';

/**
 * Pied de page public.
 */
export function PublicFooter() {
  const year = new Date().getFullYear();
  const { email, phone } = site.contact;

  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-muted">
              {site.positioning}
            </p>

            {(email || phone) && (
              <ul className="mt-6 space-y-2 text-sm">
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 text-muted transition-colors hover:text-accent"
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-2 text-muted transition-colors hover:text-accent"
                    >
                      <Phone className="size-4" aria-hidden="true" />
                      {phone}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          {footerNav.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink">{column.title}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-sans text-sm text-muted transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {column.title === 'Informations légales' && (
                  <li>
                    <button
                      type="button"
                      onClick={openCookiePreferences}
                      className="inline-flex items-center gap-1.5 font-sans text-sm text-muted transition-colors hover:text-accent cursor-pointer"
                    >
                      <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                      Gérer mes cookies
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-8 font-sans text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName || site.name}. Tous droits réservés.
          </p>
          <p>
            Sites web créés, hébergés et maintenus en {site.area}.
          </p>
        </div>
      </Container>
    </footer>
  );
}
