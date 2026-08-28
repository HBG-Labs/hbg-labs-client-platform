#!/usr/bin/env node
/**
 * Analyse statique des migrations SQL.
 *
 * `supabase db push` détecte les erreurs — mais seulement une fois une base
 * disponible, et il s'arrête à la première. Ce script tourne sans base, en
 * quelques millisecondes, et rapporte TOUS les problèmes d'un coup.
 *
 * Il vérifie ce qu'une relecture humaine laisse passer :
 *
 *   1. Toute clé étrangère désigne une table créée dans une migration
 *      ANTÉRIEURE. Les migrations s'appliquent dans l'ordre des noms de
 *      fichiers ; référencer une table créée plus tard échoue au déploiement.
 *   2. Toute fonction appelée existe et est définie avant son premier usage.
 *      Une faute de frappe dans `is_org_member` produit une policy qui échoue
 *      à l'exécution — donc en refusant tout, donc en cassant l'application.
 *   3. Tout type énuméré est créé avant d'être utilisé comme type de colonne.
 *   4. CHAQUE table a `ENABLE` **et** `FORCE ROW LEVEL SECURITY`.
 *      C'est la vérification la plus importante du lot : une table oubliée est
 *      lisible par n'importe quel porteur de la clé anon, c'est-à-dire par
 *      Internet. Rien dans le comportement de l'application ne le signale.
 *   5. Toute policy porte sur une table réellement créée.
 *   6. Tout trigger appelle une fonction définie.
 *
 * Limite assumée : ce script lit du texte, il n'exécute pas PostgreSQL. Il ne
 * dit rien de la JUSTESSE des policies — seule la suite `npm run test:rls`,
 * exécutée contre une vraie base, en répond.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/** Retire les commentaires : une déclaration citée en prose n'en est pas une. */
const stripComments = (sql) => sql.replace(/--[^\n]*/g, '');

/** Aplatit les espaces pour des comparaisons insensibles à la mise en forme. */
const flatten = (sql) => stripComments(sql).replace(/\s+/g, ' ').toLowerCase();

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS_DIR, name), 'utf8') }));

if (files.length === 0) {
  console.error(`${RED}✖ Aucune migration trouvée dans supabase/migrations.${RESET}`);
  process.exit(1);
}

const problems = [];

// --- Passe 1 : inventaire progressif des définitions -------------------------
const types = new Set();
const tables = new Set();
const functions = new Set();
/** État de l'inventaire tel qu'il est au MOMENT où chaque fichier s'applique. */
const snapshots = [];

for (const file of files) {
  const sql = stripComments(file.sql);
  for (const m of sql.matchAll(/create\s+type\s+public\.(\w+)/gi)) types.add(m[1]);
  for (const m of sql.matchAll(/create\s+table\s+public\.(\w+)/gi)) tables.add(m[1]);
  for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)/gi)) {
    functions.add(m[1]);
  }
  snapshots.push({
    types: new Set(types),
    tables: new Set(tables),
    functions: new Set(functions),
  });
}

// --- Passe 2 : chaque référence se résout, et pas en avance ------------------
files.forEach((file, index) => {
  const sql = stripComments(file.sql);
  const known = snapshots[index];
  const where = basename(file.name);

  for (const m of sql.matchAll(/references\s+public\.(\w+)\s*\(/gi)) {
    if (!known.tables.has(m[1])) {
      problems.push(`${where} — clé étrangère vers public.${m[1]} : table inconnue à ce stade`);
    }
  }

  for (const m of sql.matchAll(/public\.(\w+)\s*\(/gi)) {
    const name = m[1];
    // Un nom suivi d'une parenthèse peut être une table (dans une clause
    // REFERENCES) ou un type paramétré : on ne retient que les fonctions.
    if (tables.has(name) || types.has(name)) continue;

    if (!functions.has(name)) {
      problems.push(`${where} — public.${name}() n'est défini nulle part`);
    } else if (!known.functions.has(name)) {
      problems.push(`${where} — public.${name}() est appelé avant sa définition`);
    }
  }

  for (const m of sql.matchAll(/\bpublic\.(\w+)\b/gi)) {
    const name = m[1];
    if (types.has(name) && !known.types.has(name)) {
      problems.push(`${where} — type public.${name} utilisé avant sa création`);
    }
  }
});

// --- Passe 3 : RLS sur chaque table ------------------------------------------
const allSql = stripComments(files.map((f) => f.sql).join('\n'));
const allFlat = flatten(files.map((f) => f.sql).join('\n'));

const policyTables = new Set(
  [...allSql.matchAll(/create\s+policy\s+"?[\w]+"?\s+on\s+public\.(\w+)/gi)].map((m) => m[1]),
);

for (const table of tables) {
  if (!allFlat.includes(`alter table public.${table} enable row level security`)) {
    problems.push(`public.${table} — RLS JAMAIS ACTIVÉE : table exposée à la clé anon`);
  }
  if (!allFlat.includes(`alter table public.${table} force row level security`)) {
    problems.push(`public.${table} — RLS activée mais non FORCE`);
  }
}

for (const table of policyTables) {
  if (!tables.has(table)) {
    problems.push(`policy sur public.${table} — table jamais créée`);
  }
}

for (const m of allFlat.matchAll(/execute function public\.(\w+)\s*\(/g)) {
  const found = [...functions].some((f) => f.toLowerCase() === m[1]);
  if (!found) problems.push(`trigger → public.${m[1]}() : fonction non définie`);
}

// --- Rapport -----------------------------------------------------------------
const withoutPolicy = [...tables].filter((t) => !policyTables.has(t));

console.log(
  `${DIM}${files.length} migrations · ${types.size} types · ${tables.size} tables · ` +
    `${functions.size} fonctions · ${policyTables.size} tables avec policies${RESET}`,
);

if (withoutPolicy.length > 0) {
  // RLS activée sans aucune policy = refus total. C'est un choix valide
  // (stripe_webhook_events), mais qui mérite d'être vu à chaque exécution.
  console.log(
    `${DIM}Tables sans policy — accès entièrement fermé : ${withoutPolicy.join(', ')}${RESET}`,
  );
}

if (problems.length > 0) {
  console.error(`\n${RED}${BOLD}✖ Incohérences détectées dans le schéma${RESET}\n`);
  for (const problem of problems) {
    console.error(`  ${RED}•${RESET} ${problem}`);
  }
  console.error('');
  process.exit(1);
}

console.log(`${GREEN}✔${RESET} Schéma cohérent — RLS activée et forcée sur les ${tables.size} tables.`);
