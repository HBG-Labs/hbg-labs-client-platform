import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Bandeau de consentement cookies et traceurs — Capsule ultra-compacte & discrète.
 * Format bandeau fin arrondi (dock minimaliste) pour ne pas obstruer l'écran.
 */
export function CookieBanner() {
  const { hasAnswered, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (hasAnswered) {
    return null;
  }

  return (
    <aside
      aria-label="Gestion des cookies et traceurs"
      className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-6 md:inset-x-8 z-50 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="rounded-full border border-ink/10 bg-warm-50/95 py-2 px-3.5 sm:py-2.5 sm:px-6 shadow-[0_16px_36px_-6px_rgba(28,26,24,0.16)] backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Texte concis sur une seule ligne */}
          <div className="flex items-center gap-2 text-xs text-ink/80 min-w-0">
            <span className="font-serif text-sm sm:text-base font-normal text-ink shrink-0">
              Vie privée
            </span>
            <span className="text-ink/20 shrink-0">•</span>
            <p className="text-[11px] sm:text-xs text-ink-muted truncate">
              Traceurs d’usage et de mesure d’audience.{' '}
              <Link
                to="/cookies"
                className="text-ink/60 hover:text-ink underline underline-offset-2 ml-1"
              >
                Politique des cookies
              </Link>
            </p>
          </div>

          {/* Actions ultra-compactes */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={openPreferences}
              className="px-2 py-1 text-[11px] text-ink/60 transition-colors hover:text-ink underline underline-offset-2 cursor-pointer"
            >
              Personnaliser
            </button>

            <button
              type="button"
              onClick={rejectAll}
              className="inline-flex h-7.5 items-center justify-center rounded-full border border-ink/20 bg-transparent px-3 text-[11px] font-medium text-ink transition-all hover:border-ink hover:bg-ink/5 active:scale-[0.98] cursor-pointer"
            >
              Tout refuser
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex h-7.5 items-center justify-center rounded-full bg-ink px-3.5 text-[11px] font-medium text-white shadow-2xs transition-all hover:bg-ink/90 active:scale-[0.98] cursor-pointer"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
