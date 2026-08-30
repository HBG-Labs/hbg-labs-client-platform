import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

/** Préfixe de toutes les données de test. Doit rester aligné sur fixtures.ts. */
const TEST_PREFIX = 'rlstest';

export default function globalSetup(): () => Promise<void> {
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
        'REFUS D’EXÉCUTION : VITE_APP_ENV vaut « production ».',
        '',
        'Ces tests créent et suppriment des utilisateurs et des organisations.',
        'Ne les lancez jamais contre la base de production.',
        '',
      ].join('\n'),
    );
  }

  return sweepTestArtifacts;
}

/**
 * Balayage final : supprime tout ce qui porte le préfixe de test.
 *
 * Chaque fichier nettoie déjà ses propres données, et le montage rattrape ses
 * échecs partiels. Ce balayage est le dernier filet : il rattrape les cas que
 * ni l'un ni l'autre ne couvre, notamment une exécution interrompue au clavier
 * ou un processus tué.
 *
 * Sans lui, chaque incident laissait quatre comptes en base. Vingt s'y étaient
 * accumulés avant que le mécanisme ne soit ajouté.
 *
 * Le filtre porte sur le préfixe `rlstest`, jamais sur une date ou un compteur :
 * une donnée réelle ne peut pas porter ce préfixe, un critère temporel finirait
 * par emporter autre chose.
 */
async function sweepTestArtifacts(): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );

  const pattern = `${TEST_PREFIX}-%`;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .like('email', pattern);

  for (const profile of profiles ?? []) {
    await supabase.auth.admin.deleteUser((profile as { id: string }).id);
  }

  await supabase.from('platform_access').delete().like('email', pattern);
  await supabase.from('quote_requests').delete().like('email', pattern);
  await supabase.from('contact_messages').delete().like('email', pattern);
  await supabase.from('organizations').delete().like('slug', pattern);

  if ((profiles ?? []).length > 0) {
    console.log(
      `\nBalayage : ${(profiles ?? []).length} compte(s) de test supprimé(s).`,
    );
  }
}
