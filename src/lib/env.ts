import { z } from 'zod';

/**
 * Validation de la configuration client, au démarrage.
 *
 * Sans elle, une variable absente ne se manifeste qu'au premier appel réseau,
 * sous la forme d'un « Failed to fetch » qui ne désigne pas sa cause. Le
 * schéma ci-dessous fait échouer l'application immédiatement, avec un message
 * qui nomme la variable manquante.
 *
 *
 * SEULES LES VARIABLES `VITE_` EXISTENT ICI
 *
 * Vite ne transmet au navigateur que les variables préfixées `VITE_`, et les
 * INSCRIT EN CLAIR dans le bundle. Tout ce qui est lisible ici est donc public.
 *
 * Les secrets — clé service_role, clés Stripe, jeton Vercel, clé Resend — ne
 * doivent jamais apparaître dans ce fichier ni dans aucun module de `src/`.
 * Ils vivent côté serveur : fonctions Edge Supabase et variables
 * d'environnement Vercel.
 *
 * Deux garde-fous le vérifient automatiquement :
 *   - `scripts/check-env.mjs` avant le build ;
 *   - `scripts/check-bundle-secrets.mjs` sur le bundle produit.
 */

const envSchema = z.object({
  /** URL du projet Supabase. */
  VITE_SUPABASE_URL: z
    .string({ required_error: 'VITE_SUPABASE_URL est absente.' })
    .url('VITE_SUPABASE_URL doit être une URL valide (https://xxxx.supabase.co).'),

  /**
   * Clé anonyme, publique par conception.
   *
   * Sa divulgation n'est pas une faille : elle n'ouvre que ce que les policies
   * RLS autorisent à un visiteur non authentifié. C'est la RLS qui protège les
   * données, jamais le secret de cette clé.
   */
  VITE_SUPABASE_ANON_KEY: z
    .string({ required_error: 'VITE_SUPABASE_ANON_KEY est absente.' })
    .min(20, 'VITE_SUPABASE_ANON_KEY paraît tronquée.'),

  /** development | staging | production (§48). */
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  /** URL publique de l'application : redirections auth, emails, canonical SEO. */
  VITE_APP_URL: z.string().url().default('http://localhost:5173'),

  /** DSN Sentry navigateur (§17). Vide = supervision désactivée. */
  VITE_SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || undefined,
  VITE_APP_URL: import.meta.env.VITE_APP_URL || undefined,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || undefined,
});

/**
 * Problèmes de configuration, vides si tout est correct.
 *
 * Ce module ne lève PAS d'exception à l'import — et ce choix est délibéré.
 * Une exception au chargement d'un module se produit avant le premier rendu
 * React : l'utilisateur obtient une page blanche, et la cause n'apparaît que
 * dans la console du navigateur.
 *
 * `main.tsx` consulte cette liste et affiche un écran d'installation lisible,
 * qui nomme les variables manquantes et renvoie vers docs/SETUP.md.
 */
export const envIssues: string[] = result.success
  ? []
  : result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'configuration'} — ${issue.message}`,
    );

/**
 * Configuration validée.
 *
 * INVARIANT : n'est lu que lorsque `envIssues` est vide. `main.tsx` ne charge
 * l'application — et donc aucun module qui importe `env` — qu'après cette
 * vérification. Le repli ci-dessous n'est jamais atteint en pratique ; il
 * existe pour que le typage reste honnête sans recourir à une assertion.
 */
export const env: Env = result.success
  ? result.data
  : {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_APP_ENV: 'development',
      VITE_APP_URL: 'http://localhost:5173',
    };

/** Vrai hors production : sert à activer les aides au développement. */
export const isDevelopment = env.VITE_APP_ENV === 'development';
export const isProduction = env.VITE_APP_ENV === 'production';
