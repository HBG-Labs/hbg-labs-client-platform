import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `supabase/functions` s'exécute sous Deno, pas sous Node ni dans le
    // navigateur : `Deno.env`, les imports `npm:` et les URL de modules y sont
    // légitimes et seraient signalés comme des erreurs par la configuration
    // ci-dessous. Ce code est vérifié par `deno check` et par le déploiement.
    ignores: ['dist', 'node_modules', 'supabase/.temp', 'supabase/functions', 'coverage'],
  },

  // Code applicatif (navigateur)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Interdiction stricte : aucun secret serveur ne doit être lu depuis le
      // code client. Seules les variables VITE_ sont légitimes ici (§36).
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'process.env est indisponible dans le bundle client. Utilisez src/lib/env.ts (variables VITE_ uniquement).',
        },
      ],
    },
  },

  // Scripts Node et tests (hors bundle client)
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.ts', '*.config.{ts,js}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
  },
);
