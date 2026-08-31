import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  readonly necessary: true;
  readonly analytics: boolean;
  readonly marketing: boolean;
  readonly preferences: boolean;
}

export interface StoredConsent {
  readonly version: number;
  readonly timestamp: number;
  readonly preferences: CookiePreferences;
}

const STORAGE_KEY = 'hbg_cookie_consent_v1';
const CONSENT_DURATION_MS = 180 * 24 * 60 * 60 * 1000; // 6 mois (recommandation CNIL)
const CONSENT_EVENT = 'hbg:cookie-consent-updated';
const PREFERENCES_MODAL_EVENT = 'hbg:open-cookie-preferences';

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

function readStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    // Vérifier l'expiration (6 mois max)
    if (Date.now() - parsed.timestamp > CONSENT_DURATION_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  const payload: StoredConsent = {
    version: 1,
    timestamp: Date.now(),
    preferences,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: payload }));
}

/**
 * Hook de gestion du consentement des cookies et traceurs (CNIL / RGPD).
 */
export function useCookieConsent() {
  const [stored, setStored] = useState<StoredConsent | null>(() => readStoredConsent());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    const onConsentUpdated = () => {
      setStored(readStoredConsent());
    };

    const onOpenPreferences = () => {
      setIsPreferencesOpen(true);
    };

    window.addEventListener(CONSENT_EVENT, onConsentUpdated);
    window.addEventListener(PREFERENCES_MODAL_EVENT, onOpenPreferences);
    window.addEventListener('storage', onConsentUpdated);

    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentUpdated);
      window.removeEventListener(PREFERENCES_MODAL_EVENT, onOpenPreferences);
      window.removeEventListener('storage', onConsentUpdated);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const fullConsent: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    persistConsent(fullConsent);
    setIsPreferencesOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    const minimalConsent: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    persistConsent(minimalConsent);
    setIsPreferencesOpen(false);
  }, []);

  const savePreferences = useCallback(
    (custom: { analytics: boolean; marketing: boolean; preferences: boolean }) => {
      const preferences: CookiePreferences = {
        necessary: true,
        analytics: custom.analytics,
        marketing: custom.marketing,
        preferences: custom.preferences,
      };
      persistConsent(preferences);
      setIsPreferencesOpen(false);
    },
    [],
  );

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PREFERENCES_MODAL_EVENT));
    }
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  return {
    hasAnswered: stored !== null,
    consent: stored?.preferences ?? DEFAULT_PREFERENCES,
    storedDate: stored?.timestamp ? new Date(stored.timestamp) : null,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    isPreferencesOpen,
    openPreferences,
    closePreferences,
  };
}

/**
 * Fonction utilitaire globale pour déclencher l'ouverture du panneau de préférences cookies.
 */
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PREFERENCES_MODAL_EVENT));
}
