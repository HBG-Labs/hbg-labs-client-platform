#!/usr/bin/env node
/**
 * Garde POST-BUILD (§36).
 *
 * `check-env.mjs` valide la configuration ; ce script valide le RÉSULTAT.
 * Il inspecte chaque fichier réellement produit dans dist/ et échoue si un
 * secret s'y trouve — quelle qu'en soit la cause : variable mal préfixée,
 * clé codée en dur dans un composant, fichier .env copié par mégarde dans
 * public/, secret figé dans un snapshot de test.
 *
 * C'est la dernière barrière avant que le bundle ne parte sur Vercel, donc
 * avant qu'il ne devienne définitivement public.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/** Extensions inspectées. Le binaire (images, polices) est ignoré. */
const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx',
  '.css', '.html', '.json', '.map', '.txt', '.svg', '.webmanifest', '',
]);

const PATTERNS = [
  { pattern: /\bsk_live_[A-Za-z0-9]{8,}/g, label: 'clé secrète Stripe LIVE' },
  { pattern: /\bsk_test_[A-Za-z0-9]{8,}/g, label: 'clé secrète Stripe TEST' },
  { pattern: /\brk_(?:live|test)_[A-Za-z0-9]{8,}/g, label: 'clé restreinte Stripe' },
  { pattern: /\bwhsec_[A-Za-z0-9]{8,}/g, label: 'secret de webhook Stripe' },
  { pattern: /\bre_[A-Za-z0-9_-]{24,}/g, label: 'clé API Resend' },
  { pattern: /\bsb_secret_[A-Za-z0-9_-]{8,}/g, label: 'clé secrète Supabase' },
  { pattern: /\bSUPABASE_SERVICE_ROLE_KEY\b/g, label: 'référence à la clé service_role' },
  { pattern: /"role"\s*:\s*"service_role"/g, label: 'JWT service_role Supabase (en clair)' },
  { pattern: /\bghp_[A-Za-z0-9]{30,}/g, label: 'token GitHub' },
  { pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, label: 'clé privée' },
];

/** Segments base64url d'apparence JWT, à décoder pour inspection du rôle. */
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

function jwtDeclaresServiceRole(token) {
  const segments = token.split('.');
  if (segments.length !== 3) return false;
  try {
    const payload = Buffer.from(segments[1], 'base64url').toString('utf8');
    return JSON.parse(payload).role === 'service_role';
  } catch {
    return false;
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

/** Localise une correspondance pour un rapport lisible. */
function locate(content, index) {
  const before = content.slice(0, index);
  const line = before.split('\n').length;
  const column = index - before.lastIndexOf('\n');
  return { line, column };
}

function redact(value) {
  if (value.length <= 12) return `${value.slice(0, 3)}…`;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

if (!existsSync(DIST)) {
  console.error(
    `${RED}✖ dist/ est introuvable.${RESET} Lancez ce script après « npm run build ».`,
  );
  process.exit(1);
}

const findings = [];
let filesScanned = 0;

for (const file of walk(DIST)) {
  if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue; // binaire ou illisible : hors périmètre
  }
  filesScanned++;

  const rel = relative(ROOT, file);

  for (const { pattern, label } of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const { line, column } = locate(content, match.index);
      findings.push({ file: rel, line, column, label, sample: redact(match[0]) });
    }
  }

  JWT_LIKE.lastIndex = 0;
  let jwt;
  while ((jwt = JWT_LIKE.exec(content)) !== null) {
    if (!jwtDeclaresServiceRole(jwt[0])) continue; // clé anon : légitime et attendue
    const { line, column } = locate(content, jwt.index);
    findings.push({
      file: rel,
      line,
      column,
      label: 'JWT Supabase de rôle service_role',
      sample: redact(jwt[0]),
    });
  }
}

if (findings.length > 0) {
  console.error(
    `\n${RED}${BOLD}✖ SECRET DÉTECTÉ DANS LE BUNDLE DE PRODUCTION${RESET}\n`,
  );
  for (const f of findings) {
    console.error(`  ${RED}•${RESET} ${BOLD}${f.label}${RESET}`);
    console.error(`    ${f.file}:${f.line}:${f.column}  ${DIM}${f.sample}${RESET}`);
  }
  console.error(
    `\n  ${BOLD}Ne déployez pas.${RESET} Tout contenu de dist/ est public une fois en ligne.`,
  );
  console.error(
    `  Si ce secret a déjà été déployé, considérez-le compromis : révoquez-le et régénérez-le.\n`,
  );
  process.exit(1);
}

console.log(
  `${GREEN}✔${RESET} Aucun secret dans dist/ ${DIM}(${filesScanned} fichiers inspectés)${RESET}`,
);
