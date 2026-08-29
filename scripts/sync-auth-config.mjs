#!/usr/bin/env node
/**
 * Aligne la configuration Auth du projet Supabase distant sur ce dépôt.
 *
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * `supabase/config.toml` est versionné et lisible, mais il ne s'applique qu'à
 * une stack locale. Un projet distant conserve les valeurs par défaut de
 * Supabase, quoi que dise le fichier. Au premier déploiement, l'écart
 * constaté était le suivant :
 *
 *   site_url                       localhost:3000 au lieu de 5173
 *   uri_allow_list                 vide, donc aucun lien de courriel valide
 *   password_min_length            6 au lieu de 10
 *   password_required_characters   aucune exigence
 *
 * Les deux premiers cassent la confirmation d'adresse et la réinitialisation
 * de mot de passe. Les deux suivants affaiblissent silencieusement une règle
 * que le dépôt affirme appliquer.
 *
 * Sans exécution : `node scripts/sync-auth-config.mjs --check` signale l'écart
 * sans rien modifier, ce qui convient à une vérification continue.
 *
 *
 * UTILISATION
 *
 *   node scripts/sync-auth-config.mjs          applique
 *   node scripts/sync-auth-config.mjs --check  compare seulement
 *
 * Requiert SUPABASE_ACCESS_TOKEN (via « supabase login ») et
 * SUPABASE_PROJECT_REF (dans .env).
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
 * Configuration attendue.
 *
 * `uri_allow_list` doit contenir chaque origine depuis laquelle un lien de
 * courriel peut revenir. Une origine absente produit une redirection vers
 * `site_url`, et l'utilisateur atterrit sur l'accueil sans comprendre pourquoi
 * son lien n'a pas fonctionné.
 *
 * Les origines de production seront ajoutées ici au moment du déploiement.
 */
const EXPECTED = {
  site_url: 'http://localhost:5173',
  uri_allow_list: [
    'http://localhost:5173',
    'http://localhost:5173/**',
    'http://localhost:4173',
    'http://localhost:4173/**',
  ].join(','),

  // Aligné sur supabase/config.toml. Un compte client donne accès aux données
  // d'entreprise et à l'historique de facturation.
  password_min_length: 10,
  password_required_characters:
    'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',

  // Confirmation d'adresse exigée (§9). `true` désactiverait la vérification.
  mailer_autoconfirm: false,

  // Rotation des jetons de rafraîchissement : un jeton volé cesse de servir
  // dès que le légitime propriétaire en obtient un nouveau.
  refresh_token_rotation_enabled: true,
};

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

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = readEnvValue('SUPABASE_PROJECT_REF');
const checkOnly = process.argv.includes('--check');

if (!token || !ref) {
  console.error(
    `${YELLOW}⚠  Ignoré.${RESET} Requiert SUPABASE_ACCESS_TOKEN (via « supabase login »)\n` +
      `   et SUPABASE_PROJECT_REF (dans .env).`,
  );
  process.exit(0);
}

const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

async function request(method, body) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(payload));
  return payload;
}

const current = await request('GET');

const drift = Object.entries(EXPECTED).filter(
  ([key, expected]) => current[key] !== expected,
);

if (drift.length === 0) {
  console.log(`${GREEN}✔${RESET} Configuration Auth conforme ${DIM}(projet ${ref})${RESET}`);
} else {
  console.log(`${DIM}Projet ${ref}${RESET}\n`);
  for (const [key, expected] of drift) {
    console.log(`  ${YELLOW}•${RESET} ${BOLD}${key}${RESET}`);
    console.log(`    actuel  ${JSON.stringify(current[key])}`);
    console.log(`    attendu ${JSON.stringify(expected)}`);
  }

  if (checkOnly) {
    console.error(
      `\n${RED}✖ ${drift.length} écart(s).${RESET} Lancez « npm run auth:sync » pour corriger.\n`,
    );
    process.exitCode = 1;
  } else {
    await request('PATCH', Object.fromEntries(drift));
    console.log(`\n${GREEN}✔${RESET} ${drift.length} réglage(s) alignés sur le dépôt.`);
  }
}

// `process.exitCode` plutôt que `process.exit()` : couper le processus juste
// après un fetch ferme les descripteurs d'undici alors qu'ils sont déjà en
// cours de fermeture, ce que libuv signale par une assertion fatale sous
// Windows. Poser le code laisse Node terminer sa boucle proprement.
