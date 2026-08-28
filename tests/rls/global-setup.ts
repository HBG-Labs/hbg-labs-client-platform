import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Charge .env avant l'exécution des tests et vérifie que la cible est
 * exploitable.
 *
 * GARDE-FOU CENTRAL : ces tests créent des utilisateurs, des organisations et
 * des tickets, puis les détruisent. Les lancer contre la base de PRODUCTION
 * détruirait des données clients.
 *
 * On refuse donc de démarrer si l'environnement n'est pas explicitement
 * déclaré comme non productif.
 */
export default function globalSetup(): void {
  loadEnv({ path: resolve(process.cwd(), '.env') });

  const missing = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      [
        '',
        'Les tests RLS exigent une base Supabase accessible.',
        '',
        `Variables manquantes dans .env : ${missing.join(', ')}`,
        '',
        'Créez un projet Supabase (offre gratuite), puis suivez docs/SETUP.md.',
        '',
      ].join('\n'),
    );
  }

  const appEnv = process.env.VITE_APP_ENV ?? 'development';
  if (appEnv === 'production') {
    throw new Error(
      [
        '',
        'REFUS D\'EXÉCUTION : VITE_APP_ENV vaut « production ».',
        '',
        'Ces tests créent et suppriment des utilisateurs et des organisations.',
        'Ne les lancez jamais contre la base de production.',
        '',
      ].join('\n'),
    );
  }
}
