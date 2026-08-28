#!/usr/bin/env node
/**
 * Garde PRE-BUILD (§36, §37).
 *
 * Deux vérifications, exécutées avant que Vite ne compile quoi que ce soit :
 *
 *   1. Les variables VITE_ obligatoires sont présentes. Un build sans
 *      VITE_SUPABASE_URL produirait une application qui échoue au premier
 *      appel réseau, en production, chez le client.
 *
 *   2. Aucun secret serveur n'est exposé via un préfixe VITE_. C'est l'erreur
 *      la plus coûteuse possible sur ce projet : une clé service_role publiée
 *      dans un bundle donne à n'importe quel visiteur un accès total aux
 *      données de tous les clients, RLS contournée.
 *
 * Ce script lit .env puis l'environnement réel (Vercel injecte ses variables
 * directement dans process.env, sans fichier .env).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/** Variables VITE_ sans lesquelles l'application ne peut pas démarrer. */
const REQUIRED_PUBLIC = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

/**
 * Noms de variables qui ne doivent JAMAIS porter le préfixe VITE_.
 * Comparaison faite sur le nom privé de son préfixe.
 */
const NEVER_PUBLIC = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'VERCEL_TOKEN',
  'RESEND_API_KEY',
];

/** Fragments qui trahissent un secret, quel que soit le nom de la variable. */
const SECRET_NAME_FRAGMENTS = [
  'SERVICE_ROLE',
  'SECRET',
  'PRIVATE_KEY',
  'WEBHOOK_SECRET',
  'ACCESS_TOKEN',
];

/** Motifs de VALEURS secrètes, détectés même si le nom paraît anodin. */
const SECRET_VALUE_PATTERNS = [
  { pattern: /\bsk_live_[A-Za-z0-9]/, label: 'clé secrète Stripe LIVE' },
  { pattern: /\bsk_test_[A-Za-z0-9]/, label: 'clé secrète Stripe TEST' },
  { pattern: /\brk_(live|test)_[A-Za-z0-9]/, label: 'clé restreinte Stripe' },
  { pattern: /\bwhsec_[A-Za-z0-9]/, label: 'secret de webhook Stripe' },
  { pattern: /\bre_[A-Za-z0-9]{20,}/, label: 'clé API Resend' },
  { pattern: /"role"\s*:\s*"service_role"/, label: 'JWT service_role Supabase' },
  { pattern: /\bsb_secret_[A-Za-z0-9]/, label: 'clé secrète Supabase' },
];

/**
 * Un JWT Supabase encode son rôle en base64url dans le payload. Une clé
 * service_role reste donc détectable même sous forme compactée : on décode
 * chaque segment JWT rencontré pour inspecter le rôle réel.
 */
function jwtDeclaresServiceRole(value) {
  const segments = value.split('.');
  if (segments.length !== 3) return false;
  try {
    const payload = Buffer.from(segments[1], 'base64url').toString('utf8');
    return JSON.parse(payload).role === 'service_role';
  } catch {
    return false;
  }
}

/** Parseur .env minimal : suffisant ici, et évite une dépendance au build. */
function parseEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;

  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = parseEnvFile(resolve(ROOT, '.env'));
// process.env prime : c'est ce que Vercel fournit en CI.
const env = { ...fileEnv, ...process.env };

const errors = [];
const warnings = [];

// --- 1. Présence des variables publiques obligatoires ----------------------
for (const key of REQUIRED_PUBLIC) {
  if (!env[key] || env[key].trim() === '') {
    errors.push(
      `${key} est absente ou vide. Copiez .env.example vers .env et renseignez-la.`,
    );
  }
}

// --- 2. Aucun secret sous préfixe VITE_ ------------------------------------
for (const [key, value] of Object.entries(env)) {
  if (!key.startsWith('VITE_')) continue;

  const bare = key.slice('VITE_'.length);

  if (NEVER_PUBLIC.includes(bare)) {
    errors.push(
      `${key} expose un secret serveur dans le bundle client. Retirez le préfixe VITE_.`,
    );
    continue;
  }

  const fragment = SECRET_NAME_FRAGMENTS.find((f) => bare.includes(f));
  if (fragment) {
    errors.push(
      `${key} contient « ${fragment} » : ce nom désigne un secret, il ne peut pas être public. Retirez le préfixe VITE_.`,
    );
    continue;
  }

  if (typeof value !== 'string' || value === '') continue;

  const match = SECRET_VALUE_PATTERNS.find((p) => p.pattern.test(value));
  if (match) {
    errors.push(`${key} a pour valeur une ${match.label}. Retirez le préfixe VITE_.`);
    continue;
  }

  if (jwtDeclaresServiceRole(value)) {
    errors.push(
      `${key} contient un JWT Supabase de rôle service_role, qui contourne toutes les policies RLS. Retirez le préfixe VITE_ et utilisez la clé anon.`,
    );
  }
}

// --- 3. Garde-fou environnement (§48) --------------------------------------
// Le prompt maître interdit de connecter Stripe LIVE à un environnement de
// développement. On ne dispose pas ici des clés Stripe (elles sont serveur),
// mais on peut détecter la contradiction de configuration.
const appEnv = env.VITE_APP_ENV;
if (appEnv && !['development', 'staging', 'production'].includes(appEnv)) {
  warnings.push(
    `VITE_APP_ENV vaut « ${appEnv} » ; attendu : development, staging ou production.`,
  );
}
if (env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && appEnv !== 'production') {
  errors.push(
    `Une clé Stripe LIVE est configurée alors que VITE_APP_ENV vaut « ${appEnv ?? 'non défini'} ». Utilisez une clé de test hors production (§48).`,
  );
}

// --- Rapport ---------------------------------------------------------------
for (const w of warnings) {
  console.warn(`${YELLOW}⚠  ${w}${RESET}`);
}

if (errors.length > 0) {
  console.error(`\n${RED}${BOLD}✖ Vérification d'environnement échouée${RESET}\n`);
  for (const e of errors) {
    console.error(`  ${RED}•${RESET} ${e}`);
  }
  console.error(
    `\n  Référence : ${BOLD}.env.example${RESET} et ${BOLD}docs/SETUP.md${RESET}\n`,
  );
  process.exit(1);
}

console.log(`${GREEN}✔${RESET} Environnement validé — aucun secret exposé côté client.`);
