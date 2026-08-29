import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Tests unitaires et tests de rendu.
 *
 * Distincts de `vitest.rls.config.ts`, qui exige une base Supabase. Ceux-ci
 * tournent partout, sans compte externe, et servent de filet contre les
 * erreurs d'exécution que la compilation ne voit pas : un composant Radix mal
 * assemblé, une valeur nulle déréférencée au rendu, une importation
 * circulaire.
 *
 * Les variables `VITE_*` sont chargées par Vite depuis `.env`, comme dans
 * l'application.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
