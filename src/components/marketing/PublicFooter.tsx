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
    <footer className="border-t border-white/10 bg-ink text-white">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo className="text-white [&>img]:brightness-0 [&>img]:invert" />
            <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-white/60">
              {site.positioning}
            </p>

            {(email || phone) && (
              <ul className="mt-6 space-y-2 text-sm">
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-brand-200"
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
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-white">{column.title}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-sans text-sm text-white/60 transition-colors hover:text-brand-200"
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
                      className="inline-flex items-center gap-1.5 font-sans text-sm text-white/60 transition-colors hover:text-brand-200 cursor-pointer"
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

        <div className="mt-16 flex flex-col gap-3 border-t border-white/15 pt-8 font-sans text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
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
