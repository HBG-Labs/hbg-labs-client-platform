import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { useCookieConsent, type CookiePreferences } from '@/hooks/useCookieConsent';

interface CookiePreferencesFormProps {
  readonly consent: CookiePreferences;
  readonly onSave: (custom: { analytics: boolean; marketing: boolean; preferences: boolean }) => void;
  readonly onAcceptAll: () => void;
  readonly onRejectAll: () => void;
}

function CookiePreferencesForm({
  consent,
  onSave,
  onAcceptAll,
  onRejectAll,
}: CookiePreferencesFormProps) {
  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);
  const [preferences, setPreferences] = useState(consent.preferences);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink/8 bg-surface-muted/50 p-4 text-xs leading-relaxed text-ink-muted flex gap-3 items-start">
        <Info className="size-4 shrink-0 text-ink/70 mt-0.5" aria-hidden="true" />
        <span>
          Conformément aux recommandations de la CNIL, vous pouvez choisir précisément les catégories
          de traceurs autorisées. Votre choix est mémorisé pour une durée de 6 mois et révocable à tout
          moment depuis le pied de page.
        </span>
      </div>

      <div className="space-y-3.5">
        {/* 1. Cookies strictement nécessaires */}
        <div className="rounded-xl border border-ink/8 bg-surface-muted/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-sm text-ink">
                  1. Traceurs strictement nécessaires
                </span>
                <span className="rounded-full bg-ink/5 border border-ink/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink/70">
                  Obligatoire
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">
                Indispensables au fonctionnement de la plateforme (authentification sécurisée, prévention des fraudes, sécurité HTTPS).
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                checked={true}
                disabled
                aria-label="Traceurs strictement nécessaires"
                className="size-4 rounded border-ink/30 accent-ink opacity-60 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2. Mesure d'audience & Analytics */}
        <div className="rounded-xl border border-ink/10 bg-warm-50 p-4 hover:border-ink/25 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="toggle-analytics" className="space-y-1 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-sm text-ink">
                  2. Mesure d’audience et statistiques
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">
                Permettent de mesurer l’affluence et la navigation de manière anonymisée pour perfectionner l’expérience utilisateur.
              </p>
            </label>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                id="toggle-analytics"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="size-4 rounded border-ink/30 accent-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        </div>

        {/* 3. Marketing & Publicité */}
        <div className="rounded-xl border border-ink/10 bg-warm-50 p-4 hover:border-ink/25 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="toggle-marketing" className="space-y-1 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-sm text-ink">
                  3. Marketing et ciblage publicitaire
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">
                Permettent de mesurer l’impact de nos communications et de proposer des contenus pertinents sur nos canaux partenaires.
              </p>
            </label>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                id="toggle-marketing"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="size-4 rounded border-ink/30 accent-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        </div>

        {/* 4. Préférences d'affichage */}
        <div className="rounded-xl border border-ink/10 bg-warm-50 p-4 hover:border-ink/25 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="toggle-preferences" className="space-y-1 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-sm text-ink">
                  4. Préférences d’interface
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">
                Mémorise vos préférences de navigation et d’affichage graphique (par exemple le mode vidéo interactif).
              </p>
            </label>
            <div className="shrink-0 pt-0.5">
              <input
                type="checkbox"
                id="toggle-preferences"
                checked={preferences}
                onChange={(e) => setPreferences(e.target.checked)}
                className="size-4 rounded border-ink/30 accent-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action réglementaires */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-ink/10 sm:justify-between sm:items-center">
        <button
          type="button"
          onClick={onRejectAll}
          className="inline-flex items-center justify-center rounded-full border border-ink/20 px-5 py-2.5 text-xs font-medium text-ink transition-all hover:bg-ink/5 hover:border-ink cursor-pointer"
        >
          Tout refuser
        </button>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => onSave({ analytics, marketing, preferences })}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 px-5 py-2.5 text-xs font-medium text-ink transition-all hover:border-ink hover:bg-ink/5 cursor-pointer"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Enregistrer mes choix
          </button>

          <button
            type="button"
            onClick={onAcceptAll}
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-ink/90 cursor-pointer"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Centre de préférences cookies et traceurs complet et conforme CNIL.
 */
export function CookiePreferencesModal() {
  const {
    consent,
    isPreferencesOpen,
    closePreferences,
    acceptAll,
    rejectAll,
    savePreferences,
  } = useCookieConsent();

  return (
    <Dialog open={isPreferencesOpen} onOpenChange={(open) => !open && closePreferences()}>
      <DialogContent
        title="Préférences relatives aux cookies"
        description="Gérez en toute transparence vos préférences de stockage et de mesure."
        className="max-w-xl bg-warm-50 border-ink/10 p-6 sm:p-8 rounded-2xl shadow-2xl"
      >
        {isPreferencesOpen && (
          <CookiePreferencesForm
            consent={consent}
            onSave={savePreferences}
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
