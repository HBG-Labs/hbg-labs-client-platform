#!/usr/bin/env node
/**
 * Audit des privilèges de table réellement en vigueur sur la base distante.
 *
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Il a été écrit après avoir trouvé un défaut que ni la relecture, ni
 * l'analyse statique, ni les 133 tests d'isolation n'avaient signalé.
 *
 * Supabase pose sur chaque projet :
 *
 *     alter default privileges in schema public
 *       grant all on tables to postgres, anon, authenticated, service_role;
 *
 * Les migrations écrivaient ensuite « grant select on table X to
 * authenticated » en croyant DÉFINIR les privilèges. Un GRANT est additif : le
 * surplus est resté. `authenticated` détenait INSERT, UPDATE, DELETE, TRUNCATE,
 * REFERENCES et TRIGGER sur toutes les tables — y compris `invoices`,
 * `payments` et `audit_logs`, documentées comme étant en lecture seule.
 *
 * Les tests ne l'ont pas vu parce que la RLS bloquait bien les effets. Mais
 * TRUNCATE n'est PAS soumis à la RLS : c'est une commande de niveau table. Il
 * n'y avait qu'une barrière là où la documentation en annonçait deux.
 *
 * Une analyse de texte ne peut pas détecter cela : le défaut ne vient pas de ce
 * que les migrations écrivent, mais de ce qu'elles n'écrivent pas, combiné à
 * une configuration posée par la plateforme. Seule une interrogation de la base
 * réelle en rend compte.
 *
 *
 * UTILISATION
 *
 *     node scripts/audit-privileges.mjs
 *
 * Requiert SUPABASE_ACCESS_TOKEN (celui du CLI, via « supabase login ») et
 * SUPABASE_PROJECT_REF (lu dans .env à défaut).
 *
 * LECTURE SEULE : n'exécute que des SELECT sur information_schema.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/**
 * Privilèges attendus, par rôle et par table.
 *
 * Traduction en une table de ce que les policies couvrent. Un privilège sans
 * policy correspondante ne sert à rien ; une policy sans privilège ne
 * s'applique jamais. Toute divergence, dans un sens comme dans l'autre, est
 * signalée.
 *
 * À tenir à jour en même temps que les migrations.
 */
const EXPECTED = {
  anon: {
    plans: ['SELECT'],
    plan_prices: ['SELECT'],
    plan_features: ['SELECT'],
    quote_requests: ['INSERT'],
    contact_messages: ['INSERT'],
  },
  authenticated: {
    profiles: ['SELECT', 'UPDATE'],
    organizations: ['SELECT', 'INSERT', 'UPDATE'],
    organization_members: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    plans: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    plan_prices: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    plan_features: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    websites: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    domains: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    subscriptions: ['SELECT'],
    invoices: ['SELECT'],
    payments: ['SELECT'],
    support_tickets: ['SELECT', 'INSERT', 'UPDATE'],
    support_messages: ['SELECT', 'INSERT'],
    ticket_attachments: ['SELECT', 'INSERT', 'DELETE'],
    notifications: ['SELECT', 'INSERT', 'UPDATE'],
    audit_logs: ['SELECT'],
    quote_requests: ['SELECT', 'INSERT', 'UPDATE'],
    contact_messages: ['SELECT', 'INSERT', 'UPDATE'],
    // stripe_webhook_events : volontairement absente — aucun privilège (§21).
    // platform_settings : idem — réglage d'exploitation, hors de portée de
    // l'application, écriture réservée à service_role (migration 20).
  },
};

function readEnvValue(key) {
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

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF ?? readEnvValue('SUPABASE_PROJECT_REF');

if (!token || !ref) {
  console.error(
    YELLOW +
      '⚠  Audit ignoré.' +
      RESET +
      ' Requiert SUPABASE_ACCESS_TOKEN (via « supabase login »)\n' +
      '   et SUPABASE_PROJECT_REF (dans .env).',
  );
  // Sortie 0 : l'absence de jeton ne doit pas faire échouer un build local.
  // Le contrôle a sa place en CI, où le jeton est fourni.
  process.exit(0);
}

async function query(sql) {
  const endpoint = 'https://api.supabase.com/v1/projects/' + ref + '/database/query';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(body));
  return body;
}

const rows = await query(
  "select grantee, table_name, privilege_type" +
    "  from information_schema.role_table_grants" +
    " where table_schema = 'public'" +
    "   and grantee in ('anon', 'authenticated')" +
    " order by grantee, table_name, privilege_type;",
);

/** { rôle: { table: Set<privilège> } } */
const actual = {};
for (const row of rows) {
  actual[row.grantee] ??= {};
  actual[row.grantee][row.table_name] ??= new Set();
  actual[row.grantee][row.table_name].add(row.privilege_type);
}

const problems = [];

for (const role of ['anon', 'authenticated']) {
  const expected = EXPECTED[role];
  const observed = actual[role] ?? {};

  // Surplus : un privilège que rien ne justifie.
  for (const [table, privileges] of Object.entries(observed)) {
    const allowed = new Set(expected[table] ?? []);
    const surplus = [...privileges].filter((p) => !allowed.has(p));

    if (surplus.length > 0) {
      // TRUNCATE mérite un signalement distinct : c'est le seul privilège de
      // cette liste que la RLS ne rattrape pas.
      const critical = surplus.includes('TRUNCATE');
      problems.push({
        critical,
        text:
          role +
          ' → public.' +
          table +
          ' : privilège en trop ' +
          surplus.join(', ') +
          (critical ? '   ← TRUNCATE CONTOURNE LA RLS' : ''),
      });
    }
  }

  // Manque : une policy qui ne s'appliquera jamais, faute de privilège.
  for (const [table, privileges] of Object.entries(expected)) {
    const observedSet = observed[table] ?? new Set();
    const missing = privileges.filter((p) => !observedSet.has(p));

    if (missing.length > 0) {
      problems.push({
        critical: false,
        text:
          role +
          ' → public.' +
          table +
          ' : privilège MANQUANT ' +
          missing.join(', ') +
          " — la policy correspondante ne s'appliquera jamais",
      });
    }
  }
}

const tableCount = new Set(rows.map((r) => r.table_name)).size;
console.log(
  DIM +
    'Projet ' +
    ref +
    ' · ' +
    rows.length +
    ' attributions inspectées sur ' +
    tableCount +
    ' tables' +
    RESET,
);

if (problems.length > 0) {
  console.error('\n' + RED + BOLD + '✖ Privilèges non conformes' + RESET + '\n');

  const sorted = problems.sort((a, b) => Number(b.critical) - Number(a.critical));
  for (const problem of sorted) {
    console.error('  ' + (problem.critical ? RED : YELLOW) + '•' + RESET + ' ' + problem.text);
  }

  console.error('');
  process.exit(1);
}

console.log(
  GREEN +
    '✔' +
    RESET +
    ' Privilèges conformes — aucun surplus, aucun manque pour anon et authenticated.',
);
