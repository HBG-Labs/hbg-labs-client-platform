import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Bandeau de consentement cookies et traceurs — Format horizontal large & raffiné.
 * Sans aucun défilement horizontal ni barre de navigation latérale.
 */
export function CookieBanner() {
  const { hasAnswered, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (hasAnswered) {
    return null;
  }

  return (
    <aside
      aria-label="Gestion des cookies et traceurs"
      className="fixed bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 md:inset-x-8 z-50 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="rounded-2xl border border-ink/10 bg-warm-50/95 p-5 sm:p-6 lg:py-4.5 lg:px-8 shadow-[0_24px_60px_-12px_rgba(28,26,24,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl sm:text-2xl tracking-tight text-ink font-normal">
                Vie privée & <span className="italic font-normal">mesure</span>
              </h2>
              <span className="text-ink/20 hidden sm:inline">•</span>
              <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-ink/40 hidden sm:inline">
                HBG Labs
              </span>
            </div>

            <p className="font-sans text-xs leading-relaxed text-ink-muted">
              Nous utilisons des technologies de mesure et de stockage local pour assurer le bon
              fonctionnement du site et affiner votre expérience.{' '}
              <span className="hidden md:inline">
                Vous gardez la pleine maîtrise de vos choix à tout moment.
              </span>
            </p>

            <div className="flex items-center gap-3 pt-0.5 text-[11px] text-ink/60">
              <Link
                to="/politique-confidentialite"
                className="transition-colors hover:text-ink underline underline-offset-2"
              >
                Confidentialité
              </Link>
              <span className="text-ink/20">•</span>
              <Link
                to="/cookies"
                className="transition-colors hover:text-ink underline underline-offset-2"
              >
                Politique des cookies
              </Link>
            </div>
          </div>

          {/* Actions sans défilement latéral */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-ink/8">
            <button
              type="button"
              onClick={openPreferences}
              className="inline-flex h-9 items-center justify-center rounded-full px-3 text-xs text-ink/60 transition-colors hover:text-ink hover:bg-ink/5 underline underline-offset-4 cursor-pointer order-last sm:order-first"
            >
              Personnaliser
            </button>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={rejectAll}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center rounded-full border border-ink/20 bg-transparent px-4 sm:px-5 text-xs font-medium text-ink transition-all duration-200 hover:border-ink hover:bg-ink/5 active:scale-[0.98] cursor-pointer"
              >
                Tout refuser
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center rounded-full bg-ink px-5 sm:px-6 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-ink/90 active:scale-[0.98] cursor-pointer"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
