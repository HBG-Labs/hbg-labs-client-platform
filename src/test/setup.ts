import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Amorçage des tests de rendu.
 *
 * jsdom n'implémente pas tout ce dont les composants ont besoin. Les prothèses
 * ci-dessous couvrent le strict nécessaire, sans masquer de comportement
 * applicatif.
 */

afterEach(() => {
  cleanup();
});

// Radix s'appuie sur ResizeObserver pour positionner ses surfaces flottantes.
// jsdom ne le fournit pas, et son absence fait échouer le rendu du tiroir.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Idem pour les API de pointeur, utilisées par les composants Radix.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// `scrollTo` est appelé à chaque navigation par PublicLayout.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
