import { useState, useEffect, useCallback } from 'react';

export type HeroVariant = 'video' | 'classic';

const STORAGE_KEY = 'hbg_hero_variant';
const CHANGE_EVENT = 'hbg_hero_variant_change';

/**
 * Hook de bascule entre le Hero vidéo interactif et le Hero classique statique.
 * Synchronisé par localStorage et CustomEvent sur l'ensemble des onglets / composants.
 */
export function useHeroVariant() {
  const [variant, setVariantState] = useState<HeroVariant>(() => {
    if (typeof window === 'undefined') return 'video';
    return (localStorage.getItem(STORAGE_KEY) as HeroVariant) || 'video';
  });

  const setVariant = useCallback((newVariant: HeroVariant) => {
    setVariantState(newVariant);
    localStorage.setItem(STORAGE_KEY, newVariant);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggleVariant = useCallback(() => {
    setVariantState((prev) => {
      const next: HeroVariant = prev === 'video' ? 'classic' : 'video';
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleChange = () => {
      const stored = (localStorage.getItem(STORAGE_KEY) as HeroVariant) || 'video';
      setVariantState(stored);
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return { variant, setVariant, toggleVariant };
}
