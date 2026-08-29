import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { site } from '@/config/site';
import { footerNav } from '@/config/navigation';
import { Container } from '@/components/ui/Layout';
import { Logo } from './Logo';

/**
 * Pied de page.
 *
 * Les coordonnées ne s'affichent que si elles sont renseignées dans
 * `src/config/site.ts`. Une adresse de contact inventée renverrait les
 * messages des prospects dans le vide.
 */
export function PublicFooter() {
  const year = new Date().getFullYear();
  const { email, phone } = site.contact;

  return (
    <footer className="border-t border-border bg-surface-muted">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {site.positioning}
            </p>

            {(email || phone) && (
              <ul className="mt-5 space-y-2 text-sm">
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 text-muted hover:text-foreground"
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
                      className="inline-flex items-center gap-2 text-muted hover:text-foreground"
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
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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
