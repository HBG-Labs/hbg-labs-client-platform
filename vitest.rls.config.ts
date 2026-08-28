import { defineConfig } from 'vitest/config';

/**
 * Suite de tests RLS (§46, §47).
 *
 * Séparée de la configuration Vitest par défaut : ces tests exigent une base
 * Supabase réelle et la clé service_role. Les mêler aux tests unitaires ferait
 * échouer `npm test` sur toute machine sans base configurée, et le premier
 * réflexe serait alors de les désactiver.
 *
 * Lancement : `npm run test:rls`
 */
export default defineConfig({
  test: {
    include: ['tests/rls/**/*.test.ts'],
    environment: 'node',

    // Fichiers exécutés en série. Chacun crée puis détruit son propre jeu
    // d'organisations et d'utilisateurs ; en parallèle, les démontages se
    // chevaucheraient et produiraient des échecs intermittents qui ne
    // diraient rien de la RLS elle-même.
    fileParallelism: false,

    // Chaque assertion est un aller-retour réseau vers Supabase.
    testTimeout: 30_000,
    hookTimeout: 120_000,

    globalSetup: ['tests/rls/global-setup.ts'],
    reporters: ['verbose'],
  },
});
