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

export default async function globalSetup(): Promise<() => Promise<void>> {
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

  await refuseProductionDatabase();

  return sweepTestArtifacts;
}

/**
 * Second garde-fou, posé DANS la base visée.
 *
 * `VITE_APP_ENV` décrit l'intention du poste de travail, pas l'identité de la
 * base. Copier l'URL et la clé de service du projet de production dans un
 * `.env` resté en « development » suffirait à faire passer le contrôle
 * précédent — et la suite balaierait la production.
 *
 * `platform_settings.environment` voyage avec la base (migration 22). Quelle
 * que soit la machine, quel que soit le fichier `.env`, une base marquée
 * « production » refuse ces tests.
 *
 * Le réglage absent n'est pas bloquant : une base qui n'a pas encore reçu la
 * migration 22 est forcément une base de développement.
 */
async function refuseProductionDatabase(): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'environment')
    .maybeSingle();

  if (error) {
    // Une base injoignable se signalera d'elle-même au premier test. Ce
    // contrôle ne doit pas transformer une panne de réseau en message
    // trompeur sur l'environnement.
    console.warn(`Marqueur d'environnement illisible : ${error.message}`);
    return;
  }

  const environment = (data as { value: string } | null)?.value;

  if (environment === 'production') {
    throw new Error(
      [
        '',
        'REFUS D’EXÉCUTION : la base visée se déclare « production ».',
        '',
        `Cible : ${process.env.VITE_SUPABASE_URL}`,
        '',
        'Ces tests créent et suppriment des utilisateurs et des organisations.',
        'Vérifiez VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.',
        '',
      ].join('\n'),
    );
  }
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
 *
 *
 * L'ORDRE N'EST PAS INDIFFÉRENT
 *
 * Supprimer les comptes d'abord ÉCHOUE. La suppression d'un profil fait tomber
 * ses adhésions en cascade, et `guard_last_org_owner` refuse de laisser une
 * organisation sans OWNER : GoTrue répond « Database error deleting user » et
 * le compte reste.
 *
 * Ce défaut est resté invisible parce que le balayage annonçait le nombre de
 * comptes TROUVÉS, non supprimés. Quatorze comptes et quinze organisations
 * s'étaient accumulés pendant que la console affichait des suppressions
 * réussies. Les organisations partent donc en premier, et l'issue réelle de
 * chaque suppression est désormais rapportée.
 */
async function sweepTestArtifacts(): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );

  const pattern = `${TEST_PREFIX}-%`;
  const failures: string[] = [];

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id')
    .like('slug', pattern);
  const orgIds = (organizations ?? []).map((o) => (o as { id: string }).id);

  // Les comptes sont relevés AVANT toute suppression : le journal d'audit garde
  // trace d'actions qui n'ont ni organisation ni auteur survivant, et seul
  // l'identifiant du profil permet encore de les retrouver.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .like('email', pattern);
  const profileIds = (profiles ?? []).map((p) => (p as { id: string }).id);

  if (orgIds.length > 0) {
    // `invoices` et `payments` référencent l'organisation en ON DELETE RESTRICT
    // — conservation légale des pièces comptables (migration 08). Ils doivent
    // partir avant elle.
    await supabase.from('payments').delete().in('organization_id', orgIds);
    await supabase.from('invoices').delete().in('organization_id', orgIds);
    await supabase.from('subscriptions').delete().in('organization_id', orgIds);
    await supabase.from('notifications').delete().in('organization_id', orgIds);
    await supabase.from('support_tickets').delete().in('organization_id', orgIds);

    // Journal d'audit, avant l'organisation : la référence est en ON DELETE
    // SET NULL, et une trace orpheline n'est plus retrouvable par ce critère.
    await supabase.from('audit_logs').delete().in('organization_id', orgIds);

    const { error } = await supabase.from('organizations').delete().in('id', orgIds);
    if (error) failures.push(`organisations : ${error.message}`);

    // La suppression fait tomber les adhésions et journalise MEMBER_REMOVED,
    // dont le rattachement a migré dans `metadata` (migration 19).
    await supabase.from('audit_logs').delete().in('metadata->>organization_id', orgIds);
  }

  let deleted = 0;
  for (const profile of profiles ?? []) {
    const { id, email } = profile as { id: string; email: string };
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) failures.push(`compte ${email} : ${error.message}`);
    else deleted += 1;
  }

  await supabase.from('platform_access').delete().like('email', pattern);
  await supabase.from('quote_requests').delete().like('email', pattern);
  await supabase.from('contact_messages').delete().like('email', pattern);

  // Journal d'audit, ce qui n'a jamais eu d'organisation : connexions, rôles
  // plateforme, liste d'accès. `actor_email` est figé au moment de l'action et
  // survit à la suppression du compte ; `resource_id` rattrape les lignes
  // écrites par `service_role`, qui n'ont pas d'auteur du tout.
  await supabase.from('audit_logs').delete().like('actor_email', pattern);
  await supabase.from('audit_logs').delete().like('resource_id', pattern);
  if (profileIds.length > 0) {
    await supabase.from('audit_logs').delete().in('resource_id', profileIds);
  }

  if (deleted > 0 || orgIds.length > 0) {
    console.log(
      `\nBalayage : ${deleted} compte(s) et ${orgIds.length} organisation(s) supprimés.`,
    );
  }

  // Un échec est dit, jamais avalé : c'est précisément le silence qui avait
  // laissé les résidus s'accumuler.
  if (failures.length > 0) {
    console.error(
      [`\nBalayage INCOMPLET — ${failures.length} suppression(s) en échec :`, ...failures]
        .map((line) => `  ${line}`)
        .join('\n'),
    );
  }
}
