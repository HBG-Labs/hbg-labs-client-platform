#!/usr/bin/env node
/**
 * Génère `sitemap.xml` et `robots.txt` dans dist/, après le build (§41).
 *
 *
 * POURQUOI GÉNÉRER PLUTÔT QUE VERSIONNER
 *
 * Les deux fichiers contiennent des URL absolues. Écrites en dur dans
 * `public/`, elles pointeraient vers un domaine choisi au moment de la
 * rédaction : soit un domaine encore inexistant, soit celui de développement
 * une fois en production. Un sitemap qui référence localhost n'est pas
 * seulement inutile, il fait échouer la validation dans la Search Console.
 *
 * Le domaine vient donc de `VITE_APP_URL`, la variable qui décrit réellement
 * l'environnement déployé.
 *
 * Les pages sans valeur pour la recherche sont exclues : conditions générales,
 * mentions légales, et tout ce qui relève de l'espace client.
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

/**
 * Pages indexables.
 *
 * `changefreq` et `priority` sont indicatifs : les moteurs les ignorent
 * largement, mais leur absence fait échouer certains validateurs.
 */
const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/services', priority: '0.9', changefreq: 'monthly' },
  { path: '/creation-site-web', priority: '0.9', changefreq: 'monthly' },
  { path: '/hebergement', priority: '0.8', changefreq: 'monthly' },
  { path: '/maintenance', priority: '0.8', changefreq: 'monthly' },
  { path: '/tarifs', priority: '0.9', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'yearly' },
  { path: '/devis', priority: '0.7', changefreq: 'yearly' },
  { path: '/politique-confidentialite', priority: '0.3', changefreq: 'yearly' },
];

/** Exclues de l'index, cohérent avec la balise noindex des pages concernées. */
const DISALLOWED = ['/cgv', '/mentions-legales', '/dashboard', '/admin'];

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

if (!existsSync(DIST)) {
  console.error(`${RED}✖ dist/ est introuvable.${RESET} Lancez ce script après le build.`);
  process.exit(1);
}

const rawUrl = readEnvValue('VITE_APP_URL');

if (!rawUrl) {
  console.error(
    `${RED}✖ VITE_APP_URL est absente.${RESET} Impossible de produire des URL absolues.`,
  );
  process.exit(1);
}

let origin;
try {
  origin = new URL(rawUrl).origin;
} catch {
  console.error(`${RED}✖ VITE_APP_URL n'est pas une URL valide : ${rawUrl}${RESET}`);
  process.exit(1);
}

const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);
if (isLocal) {
  // Avertissement et non erreur : un build local doit rester possible. Le
  // déploiement, lui, fournira la vraie valeur.
  console.warn(
    `${YELLOW}⚠  VITE_APP_URL pointe vers ${origin}.${RESET} Le sitemap produit ne vaut que pour le développement.`,
  );
}

const today = new Date().toISOString().slice(0, 10);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PAGES.map((page) =>
    [
      '  <url>',
      `    <loc>${origin}${page.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

const robots = [
  '# HBG Labs',
  '',
  'User-agent: *',
  'Allow: /',
  '',
  '# Pages sans valeur pour la recherche.',
  ...DISALLOWED.map((path) => `Disallow: ${path}`),
  '',
  `Sitemap: ${origin}/sitemap.xml`,
  '',
].join('\n');

writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(join(DIST, 'robots.txt'), robots, 'utf8');

console.log(
  `${GREEN}✔${RESET} sitemap.xml et robots.txt générés ${DIM}(${PAGES.length} pages, origine ${origin})${RESET}`,
);
