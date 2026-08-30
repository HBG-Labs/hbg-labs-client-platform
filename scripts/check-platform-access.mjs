#!/usr/bin/env node
/**
 * Qui peut atteindre l'espace d'administration.
 *
 *
 * POURQUOI CE CONTRÔLE
 *
 * L'accès à l'administration se lit dans deux endroits qui doivent concorder :
 * `platform_access`, qui dit qui a le droit, et `profiles.platform_role`, qui
 * dit qui l'a effectivement. La migration 17 garantit qu'on ne peut pas
 * accorder un rôle hors liste, mais deux dérives restent possibles :
 *
 *   * un rôle attribué avant la migration, donc sans passer par la liste ;
 *   * une adresse retirée de la liste sans que le rôle correspondant le soit.
 *
 * Aucune des deux ne produit d'erreur visible. Ce script les fait apparaître.
 *
 * Il lit également le nombre total de comptes, pour que la proportion soit
 * lisible d'un coup d'œil : « 1 accès plateforme sur 47 comptes » se vérifie
 * mieux qu'une liste isolée.
 *
 *
 * UTILISATION
 *
 *     node scripts/check-platform-access.mjs
 *
 * Requiert SUPABASE_SERVICE_ROLE_KEY : la liste d'autorisation est
 * délibérément inaccessible depuis l'application.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function readEnvValue(key) {
  if (process.env[key]) return process.env[key];

  const envPath = resolve(ROOT, '.env');
  if (!existsSync(envPath)) return undefined;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() === key) return trimmed.slice(eq + 1).trim();
  }
  return undefined;
}

const url = readEnvValue('VITE_SUPABASE_URL');
const serviceKey = readEnvValue('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !serviceKey) {
  console.error(
    `${YELLOW}⚠  Ignoré.${RESET} Requiert VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.`,
  );
  process.exit(0);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const [allowlist, holders, total] = await Promise.all([
  supabase.from('platform_access').select('email, role, note').order('email'),
  supabase
    .from('profiles')
    .select('email, platform_role')
    .not('platform_role', 'is', null)
    .order('email'),
  supabase.from('profiles').select('*', { count: 'exact', head: true }),
]);

for (const result of [allowlist, holders, total]) {
  if (result.error) {
    console.error(`${RED}✖ Lecture impossible :${RESET} ${result.error.message}`);
    process.exit(1);
  }
}

const allowed = new Map((allowlist.data ?? []).map((row) => [row.email, row]));
const actual = new Map((holders.data ?? []).map((row) => [row.email, row.platform_role]));

const problems = [];

// Un rôle détenu sans autorisation correspondante.
for (const [email, role] of actual) {
  const entry = allowed.get(email);

  if (!entry) {
    problems.push({
      severe: true,
      text: `${email} détient le rôle ${role} sans figurer dans la liste d'autorisation`,
    });
  } else if (entry.role !== role) {
    problems.push({
      severe: true,
      text: `${email} détient ${role} alors que la liste autorise ${entry.role}`,
    });
  }
}

// Une autorisation sans compte : normal tant que la personne ne s'est pas
// inscrite, le rôle étant appliqué automatiquement à ce moment-là.
const pending = [...allowed.keys()].filter((email) => !actual.has(email));

console.log(
  `${DIM}${allowed.size} adresse(s) autorisée(s) · ${actual.size} accès effectif(s) · ${total.count ?? 0} compte(s) au total${RESET}\n`,
);

console.log(`${BOLD}Accès plateforme${RESET}`);
if (actual.size === 0) {
  console.log(`  ${DIM}aucun accès effectif${RESET}`);
} else {
  for (const [email, role] of actual) {
    const conforme = allowed.get(email)?.role === role;
    console.log(`  ${conforme ? GREEN + '✔' : RED + '✖'}${RESET} ${role.padEnd(8)} ${email}`);
  }
}

if (pending.length > 0) {
  console.log(`\n${BOLD}Autorisé, compte non encore créé${RESET}`);
  for (const email of pending) {
    console.log(`  ${DIM}·${RESET} ${allowed.get(email).role.padEnd(8)} ${email}`);
  }
  console.log(
    `  ${DIM}Le rôle sera appliqué automatiquement à l'inscription (trigger apply_platform_access).${RESET}`,
  );
}

if (problems.length > 0) {
  console.error(`\n${RED}${BOLD}✖ Accès non conformes${RESET}\n`);
  for (const problem of problems) {
    console.error(`  ${RED}•${RESET} ${problem.text}`);
  }
  console.error('');
  process.exitCode = 1;
} else {
  console.log(`\n${GREEN}✔${RESET} Tous les accès plateforme sont couverts par la liste.`);
}
