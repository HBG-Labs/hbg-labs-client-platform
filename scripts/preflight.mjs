#!/usr/bin/env node
/**
 * Contrôle avant mise en production (§3 des règles de production).
 *
 *
 * POURQUOI UN SCRIPT PLUTÔT QU'UNE LISTE À COCHER
 *
 * La checklist existait en prose. Une liste que l'on coche à la main se coche
 * de mémoire : au troisième déploiement, on se souvient l'avoir vérifiée la
 * fois précédente, et c'est exactement le déploiement qui casse.
 *
 * Ce script exécute ce qui est exécutable, LIT ce qui est lisible, et énumère
 * ce qui reste manuel — sans faire semblant de l'avoir vérifié.
 *
 *
 * TROIS ISSUES, PAS DEUX
 *
 *   ✔  vérifié ici, à l'instant
 *   ✖  vérifié ici, et faux — le déploiement doit s'arrêter
 *   ⚠  connu mais non bloquant pour l'environnement visé
 *   ·  MANUEL : le script ne peut pas en juger, et le dit
 *
 * Le quatrième cas est le plus important. Un contrôle qui afficherait ✔ sur
 * une chose qu'il n'a pas vue vaudrait moins que pas de contrôle du tout : il
 * donnerait la certitude en plus de l'ignorance.
 *
 *
 * UTILISATION
 *
 *     npm run preflight              # environnement de VITE_APP_ENV
 *     npm run preflight -- --prod    # exigences de production
 *     npm run preflight -- --quick   # configuration seule, sans les suites
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const QUICK = process.argv.includes('--quick');
const FORCE_PROD = process.argv.includes('--prod');

// -----------------------------------------------------------------------------
// Lecture de l'environnement
// -----------------------------------------------------------------------------

function readEnvFile() {
  const envPath = resolve(ROOT, '.env');
  if (!existsSync(envPath)) return {};

  const values = {};
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return values;
}

const env = { ...readEnvFile(), ...process.env };
const target = FORCE_PROD ? 'production' : (env.VITE_APP_ENV ?? 'development');
const isProductionTarget = target === 'production';

// -----------------------------------------------------------------------------
// Journal des résultats
// -----------------------------------------------------------------------------

const results = [];

/** @param {'ok'|'ko'|'warn'|'manual'} state */
function record(state, label, detail) {
  results.push({ state, label, detail });

  const mark = { ok: `${GREEN}✔${RESET}`, ko: `${RED}✖${RESET}`, warn: `${YELLOW}⚠${RESET}`, manual: `${BLUE}·${RESET}` };
  const line = `  ${mark[state]}  ${label}`;
  console.log(detail ? `${line}\n     ${DIM}${detail}${RESET}` : line);
}

function heading(text) {
  console.log(`\n${BOLD}${text}${RESET}`);
}

// -----------------------------------------------------------------------------
// 1. Suites automatisées
// -----------------------------------------------------------------------------

/**
 * Lance un script npm, sans passer par un shell.
 *
 * `shell: true` concatène les arguments au lieu de les échapper — Node le
 * signale désormais à chaque exécution. Un contrôle qui émet un avertissement
 * de sécurité chaque fois qu'on le lance finit par ne plus être lu.
 *
 * Invoquer `npm.cmd` directement ne marche pas davantage : depuis Node 20,
 * l'exécution d'un `.cmd` hors shell est refusée (EINVAL), précisément à cause
 * du défaut d'échappement. Reste la voie propre : appeler le CLI npm avec
 * l'interpréteur courant. `npm_execpath` est renseigné par npm lui-même, et ce
 * script est toujours lancé par `npm run preflight`.
 */
function runScript(name) {
  const npmCli = process.env.npm_execpath;

  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, 'run', name], { cwd: ROOT, encoding: 'utf8' })
    : spawnSync('npm', ['run', name], {
        cwd: ROOT,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      });

  if (result.error) {
    return { ok: false, output: `npm run ${name} : ${result.error.message}` };
  }

  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

/** Dernières lignes utiles d'une sortie en échec. */
function tail(output, lines = 12) {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(-lines)
    .map((line) => `     ${DIM}${line}${RESET}`)
    .join('\n');
}

function runSuites() {
  heading('Suites automatisées');

  if (QUICK) {
    record('manual', 'Suites ignorées (--quick)', 'Relancez sans --quick avant toute mise en production.');
    return;
  }

  const verify = runScript('verify');
  record(
    verify.ok ? 'ok' : 'ko',
    'Schéma, privilèges, accès, Auth, lint, types, tests, build, secrets',
    'npm run verify',
  );
  if (!verify.ok) console.log(tail(verify.output));

  const rls = runScript('test:rls');
  record(
    rls.ok ? 'ok' : 'ko',
    'Isolation multi-tenant contre la base réelle',
    'npm run test:rls',
  );
  if (!rls.ok) console.log(tail(rls.output));
}

// -----------------------------------------------------------------------------
// 2. Configuration
// -----------------------------------------------------------------------------

function checkSecretBoundary() {
  heading('Frontière des secrets');

  const leaked = Object.keys(env).filter(
    (key) =>
      key.startsWith('VITE_') &&
      /SECRET|SERVICE_ROLE|PRIVATE_KEY|_TOKEN|API_KEY/.test(key) &&
      key !== 'VITE_SENTRY_DSN',
  );

  record(
    leaked.length === 0 ? 'ok' : 'ko',
    'Aucun secret serveur sous préfixe VITE_',
    leaked.length === 0 ? undefined : `Exposées dans le bundle : ${leaked.join(', ')}`,
  );

  // Le DSN Sentry est public par conception, comme la clé anon : il désigne le
  // projet qui reçoit, il n'ouvre aucun accès en lecture. Un JETON Sentry, lui,
  // n'a rien à faire côté client.
  record(
    env.VITE_SENTRY_AUTH_TOKEN ? 'ko' : 'ok',
    'Jeton Sentry absent du bundle',
    env.VITE_SENTRY_AUTH_TOKEN ? 'VITE_SENTRY_AUTH_TOKEN est lisible par tous.' : undefined,
  );
}

/**
 * Aucune donnée de démonstration dans le code livré.
 *
 * Le contrôle est HEURISTIQUE, et le dit. Il cherche des identifiants qui
 * trahissent une donnée fabriquée — `mockData`, `lorem ipsum`, un `FIXME`
 * resté en place — hors des fichiers de test, où ces mêmes noms sont
 * légitimes.
 *
 * Il ne remplace pas une relecture : une constante nommée `plans` et remplie à
 * la main passerait au travers. Il rattrape l'oubli, pas l'intention.
 */
function checkNoFakeData() {
  heading('Intégrité du code livré');

  const suspects = /\b(mockData|fakeData|dummyData|lorem ipsum|FIXME)\b/i;
  const found = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) continue;

      const source = readFileSync(path, 'utf8');
      if (suspects.test(source)) {
        found.push(path.slice(ROOT.length + 1).replace(/\\/g, '/'));
      }
    }
  };

  walk(resolve(ROOT, 'src'));

  record(
    found.length === 0 ? 'ok' : 'ko',
    'Aucune donnée de démonstration détectée',
    found.length === 0 ? 'Recherche heuristique, hors fichiers de test.' : found.join(', '),
  );
}

function checkStripe() {
  heading('Stripe');

  const key = env.STRIPE_SECRET_KEY ?? '';
  const mode = key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : null;

  if (!key) {
    record(
      isProductionTarget ? 'ko' : 'warn',
      'Clé secrète configurée',
      'STRIPE_SECRET_KEY absente : aucune offre ne sera souscriptible.',
    );
  } else if (isProductionTarget && mode !== 'live') {
    record('ko', 'Clé en mode Live pour la production', `Clé de ${mode} détectée.`);
  } else if (!isProductionTarget && mode === 'live') {
    record('ko', 'Clé de test hors production', `Clé LIVE avec VITE_APP_ENV = ${target}.`);
  } else {
    record('ok', `Clé secrète en mode ${mode}`, `Cible : ${target}`);
  }

  record(
    env.STRIPE_WEBHOOK_SECRET ? 'ok' : isProductionTarget ? 'ko' : 'warn',
    'Secret de signature du webhook',
    env.STRIPE_WEBHOOK_SECRET
      ? undefined
      : "Sans lui, la fonction refuse tout événement : aucun abonnement ne sera reflété.",
  );

  record(
    'manual',
    'Point d’entrée webhook déclaré chez Stripe, en mode Live',
    'Tableau de bord Stripe → Developers → Webhooks. Voir docs/SETUP.md §8.3.',
  );
}

function checkEmailAndMonitoring() {
  heading('Courriels et supervision');

  const hasResend = Boolean(env.RESEND_API_KEY);
  record(
    hasResend ? 'ok' : isProductionTarget ? 'ko' : 'warn',
    'Clé Resend configurée',
    hasResend
      ? undefined
      : 'Le serveur SMTP intégré plafonne à deux courriels par heure : insuffisant dès les premiers clients.',
  );

  record(
    env.EMAIL_FROM ? 'ok' : hasResend ? 'ko' : 'warn',
    'Adresse d’expédition définie',
    env.EMAIL_FROM ? undefined : 'EMAIL_FROM doit appartenir à un domaine vérifié dans Resend.',
  );

  record(
    env.VITE_SENTRY_DSN ? 'ok' : 'warn',
    'Supervision configurée',
    env.VITE_SENTRY_DSN ? undefined : 'Sans DSN, aucune erreur ne remonte : vous l’apprendrez par un client.',
  );
}

function checkHeaders() {
  heading('En-têtes de sécurité');

  const configPath = resolve(ROOT, 'vercel.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const headers = (config.headers ?? []).flatMap((entry) => entry.headers ?? []);
  const byKey = Object.fromEntries(headers.map((h) => [h.key, h.value]));

  const required = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ];

  const missing = required.filter((key) => !byKey[key]);
  record(
    missing.length === 0 ? 'ok' : 'ko',
    'En-têtes obligatoires présents',
    missing.length === 0 ? undefined : `Manquants : ${missing.join(', ')}`,
  );

  // Une politique de sécurité du contenu qui oublierait l'origine Supabase
  // couperait toute l'application, sans erreur au build : le navigateur
  // bloquerait silencieusement chaque requête.
  const csp = byKey['Content-Security-Policy'] ?? '';
  const supabaseHost = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).host : null;
  const covered =
    !supabaseHost ||
    csp.includes(supabaseHost) ||
    csp.includes('*.supabase.co');

  record(
    covered ? 'ok' : 'ko',
    'La politique de contenu autorise la base',
    covered ? undefined : `connect-src ne couvre pas ${supabaseHost}.`,
  );

  record(
    'manual',
    'Politique de contenu validée sur une URL de prévisualisation',
    'Ouvrez une preview, console du navigateur : aucune violation ne doit apparaître.',
  );
}

function checkLegal() {
  heading('Mentions légales');

  const source = readFileSync(resolve(ROOT, 'src/config/site.ts'), 'utf8');
  const required = {
    legalName: 'Dénomination sociale',
    legalForm: 'Forme juridique',
    siret: 'Numéro SIRET',
    publicationDirector: 'Directeur de la publication',
    email: 'Adresse de contact',
  };

  // Lecture textuelle du fichier de configuration : le champ vide s'y écrit
  // littéralement `clé: ''`. Le contrôle est volontairement simple, et son
  // périmètre est dit — il ne remplace pas la lecture des pages légales.
  const empty = Object.entries(required)
    .filter(([key]) => new RegExp(`${key}:\\s*''`).test(source))
    .map(([, label]) => label);

  record(
    empty.length === 0 ? 'ok' : isProductionTarget ? 'ko' : 'warn',
    'Informations d’entreprise renseignées',
    empty.length === 0
      ? undefined
      : `Manquantes : ${empty.join(', ')}. Obligatoires avant toute mise en ligne publique.`,
  );
}

// -----------------------------------------------------------------------------
// 3. État de la base
// -----------------------------------------------------------------------------

async function checkDatabase() {
  heading('Base de données');

  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    record('manual', 'État de la base', 'Requiert SUPABASE_SERVICE_ROLE_KEY dans .env.');
    return;
  }

  const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // --- Marqueur d'environnement ---
  const { data: marker } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', 'environment')
    .maybeSingle();

  const declared = marker?.value ?? 'absent';

  if (declared === target) {
    record('ok', `La base se déclare « ${declared} »`, env.VITE_SUPABASE_URL);
  } else {
    record(
      isProductionTarget ? 'ko' : 'warn',
      `La base se déclare « ${declared} », la cible est « ${target} »`,
      'Une base de production doit porter le marqueur : il refuse la suite de tests destructive.',
    );
  }

  // --- Catalogue Stripe ---
  const { count: purchasable } = await db
    .from('plan_prices')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('stripe_price_id', 'is', null);

  record(
    (purchasable ?? 0) > 0 ? 'ok' : isProductionTarget ? 'ko' : 'warn',
    `Offres souscriptibles en ligne : ${purchasable ?? 0}`,
    (purchasable ?? 0) > 0 ? undefined : 'npm run stripe:sync publie le catalogue chez Stripe.',
  );

  // --- Webhooks en échec ---
  const { count: stuck } = await db
    .from('stripe_webhook_events')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false);

  record(
    (stuck ?? 0) === 0 ? 'ok' : 'ko',
    `Événements Stripe non traités : ${stuck ?? 0}`,
    (stuck ?? 0) === 0 ? undefined : 'Un abonnement ou une facture ne sont pas reflétés. Voir docs/RUNBOOK.md.',
  );

  // --- File de courriels ---
  const { data: delivery } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', 'email_delivery')
    .maybeSingle();

  const { count: pending } = await db
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('channel', 'EMAIL')
    .eq('status', 'PENDING');

  if (delivery?.value !== 'on') {
    record(
      isProductionTarget ? 'ko' : 'warn',
      'Canal courriel fermé',
      'npm run email:on, une fois Resend configuré.',
    );
  } else {
    record(
      (pending ?? 0) < 20 ? 'ok' : 'ko',
      `Canal courriel ouvert, ${pending ?? 0} en file`,
      (pending ?? 0) < 20 ? undefined : 'La file ne se vide pas : vérifiez la tâche pg_cron.',
    );
  }

  // --- Sites suivis ---
  const { count: watched } = await db
    .from('websites')
    .select('*', { count: 'exact', head: true })
    .not('vercel_project_id', 'is', null);

  const { count: total } = await db
    .from('websites')
    .select('*', { count: 'exact', head: true });

  record(
    (total ?? 0) === 0 || watched === total ? 'ok' : 'warn',
    `Sites rattachés à un projet Vercel : ${watched ?? 0} / ${total ?? 0}`,
    (total ?? 0) === 0 || watched === total
      ? undefined
      : 'Les autres afficheront « Vérification non configurée ».',
  );
}

// -----------------------------------------------------------------------------
// 4. Ce que le script ne peut pas voir
// -----------------------------------------------------------------------------

function listManual() {
  heading('À vérifier vous-même');

  record('manual', 'Sauvegardes Supabase activées et restauration testée', 'Une sauvegarde jamais restaurée n’est pas une sauvegarde.');
  record('manual', 'Projets Supabase séparés entre développement et production', 'docs/SETUP.md §7.5');
  record('manual', 'Variables d’environnement Vercel à jour en production et en preview', 'npx vercel env ls');
  record('manual', 'Migration rétrocompatible avec la version en ligne', 'Aucune colonne supprimée ni renommée sans transition.');
  record('manual', 'Retour arrière identifié', 'Déploiement précédent repéré dans Vercel. docs/RUNBOOK.md');
}

// -----------------------------------------------------------------------------
// Exécution
// -----------------------------------------------------------------------------

console.log(`\n${BOLD}Contrôle avant mise en production${RESET} ${DIM}— cible : ${target}${RESET}`);

runSuites();
checkSecretBoundary();
checkNoFakeData();
checkStripe();
checkEmailAndMonitoring();
checkHeaders();
checkLegal();
await checkDatabase();
listManual();

const failures = results.filter((r) => r.state === 'ko').length;
const warnings = results.filter((r) => r.state === 'warn').length;
const manual = results.filter((r) => r.state === 'manual').length;

console.log('');

if (failures > 0) {
  console.log(
    `${RED}${BOLD}✖  ${failures} point(s) bloquant(s).${RESET} Ne déployez pas en l'état.`,
  );
} else {
  console.log(
    `${GREEN}${BOLD}✔  Aucun point bloquant.${RESET} ${warnings} avertissement(s), ${manual} vérification(s) manuelle(s).`,
  );
  console.log(
    `${DIM}   Les vérifications manuelles ne sont pas facultatives : elles sont hors de portée de ce script.${RESET}`,
  );
}

console.log('');
process.exit(failures > 0 ? 1 : 0);
