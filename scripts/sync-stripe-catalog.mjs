#!/usr/bin/env node
/**
 * Synchronise le catalogue d'offres vers Stripe.
 *
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * La grille tarifaire vit en base (`plans`, `plan_prices`) : §7 l'exige, et
 * c'est elle que le site public affiche. Stripe, lui, ne sait facturer que ses
 * propres objets Product et Price. Les deux catalogues doivent donc désigner
 * les mêmes offres, aux mêmes montants.
 *
 * Les saisir deux fois à la main garantit qu'ils divergeront : le jour où le
 * tarif PRO passe de 49 € à 59 € en base sans changer chez Stripe, le site
 * affiche 59 € et prélève 49 €. Rien ne le signale — les deux systèmes sont
 * cohérents avec eux-mêmes.
 *
 * Ce script fait de la base la source, et de Stripe le reflet.
 *
 *
 * UN PRIX STRIPE EST IMMUABLE
 *
 * Ni le montant, ni la devise, ni la périodicité d'un Price ne se modifient.
 * Quand la base s'en écarte, un NOUVEAU Price est créé et l'ancien archivé.
 * C'est exactement le modèle de `plan_prices`, où un prix remplacé est
 * désactivé et jamais supprimé : les abonnements en cours continuent de
 * référencer celui qu'ils ont souscrit.
 *
 *
 * CE QUI N'EST PAS PUBLIÉ CHEZ STRIPE
 *
 *   * les offres `requires_quote` — leur tarif est établi après étude ;
 *   * les prix `is_starting_price` — « à partir de 590 € » n'est pas un montant
 *     ferme, et un Price Stripe est toujours ferme.
 *
 * Publier ces montants créerait des objets facturables pour des tarifs qui ne
 * sont pas arrêtés. Le premier prélèvement contredirait le devis.
 *
 *
 * UTILISATION
 *
 *     node scripts/sync-stripe-catalog.mjs --check   # rapport, sans écriture
 *     node scripts/sync-stripe-catalog.mjs           # applique
 *
 * Requiert STRIPE_SECRET_KEY et SUPABASE_SERVICE_ROLE_KEY dans .env.
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

const CHECK_ONLY = process.argv.includes('--check');

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

const supabaseUrl = readEnvValue('VITE_SUPABASE_URL');
const serviceKey = readEnvValue('SUPABASE_SERVICE_ROLE_KEY');
const stripeKey = readEnvValue('STRIPE_SECRET_KEY');
const appEnv = readEnvValue('VITE_APP_ENV') ?? 'development';

if (!supabaseUrl || !serviceKey) {
  console.error(
    `${YELLOW}⚠  Ignoré.${RESET} Requiert VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.`,
  );
  process.exit(0);
}

if (!stripeKey) {
  console.error(
    `${YELLOW}⚠  Ignoré.${RESET} STRIPE_SECRET_KEY est absente : le catalogue Stripe n'existe pas encore.`,
  );
  process.exit(0);
}

// Même garde-fou que `check-env.mjs` (§48). Publier un catalogue depuis un
// poste de développement vers le compte Stripe de production créerait des
// offres réellement facturables.
if (stripeKey.startsWith('sk_live_') && appEnv !== 'production') {
  console.error(
    `${RED}✖  Clé Stripe LIVE avec VITE_APP_ENV = « ${appEnv} ».${RESET} Utilisez une clé de test hors production.`,
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

// -----------------------------------------------------------------------------
// Appels Stripe
// -----------------------------------------------------------------------------
// L'API REST est appelée directement plutôt que par la bibliothèque officielle :
// ce script fait six sortes de requêtes, et ajouter une dépendance de production
// pour un outil d'administration alourdirait l'installation de tout le monde.

/** Encode un objet imbriqué au format attendu par Stripe (`a[b]=c`). */
function formEncode(payload, prefix = '') {
  const parts = [];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;

    if (typeof value === 'object') {
      parts.push(formEncode(value, name));
    } else {
      parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.filter(Boolean).join('&');
}

async function stripeRequest(method, path, payload) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload ? formEncode(payload) : undefined,
  });

  const body = await response.json();

  if (!response.ok) {
    // 404 sur une lecture n'est pas une panne : c'est la réponse à « cet objet
    // existe-t-il encore ? ». L'appelant décide quoi en faire.
    if (response.status === 404 && method === 'GET') return null;
    throw new Error(body?.error?.message ?? `Stripe a répondu ${response.status}.`);
  }

  return body;
}

// -----------------------------------------------------------------------------
// Lecture du catalogue
// -----------------------------------------------------------------------------

const { data: plans, error } = await supabase
  .from('plans')
  .select(
    `id, code, name, tagline, description, is_active, requires_quote, stripe_product_id,
     plan_prices ( id, kind, recurring_interval, unit_amount_cents, currency,
                   is_starting_price, is_active, stripe_price_id )`,
  )
  .order('sort_order', { ascending: true });

if (error) {
  console.error(`${RED}✖  Lecture du catalogue impossible :${RESET} ${error.message}`);
  process.exit(1);
}

const actions = [];
const skipped = [];
let failures = 0;

console.log(`\n${BOLD}Catalogue Stripe${RESET} ${DIM}(${appEnv})${RESET}\n`);

for (const plan of plans ?? []) {
  if (!plan.is_active) {
    skipped.push(`${plan.code} — offre désactivée`);
    continue;
  }

  if (plan.requires_quote) {
    skipped.push(`${plan.code} — sur devis, aucun montant ferme à publier`);
    continue;
  }

  try {
    const productId = await syncProduct(plan);

    for (const price of plan.plan_prices ?? []) {
      if (!price.is_active) continue;

      if (price.is_starting_price) {
        skipped.push(`${plan.code} — prix « à partir de », non publié`);
        continue;
      }

      await syncPrice(plan, price, productId);
    }
  } catch (cause) {
    failures += 1;
    console.error(`${RED}✖  ${plan.code} :${RESET} ${cause.message}`);
  }
}

// -----------------------------------------------------------------------------
// Product
// -----------------------------------------------------------------------------

async function syncProduct(plan) {
  const wanted = {
    name: plan.name,
    description: plan.description ?? plan.tagline ?? undefined,
    metadata: { plan_code: plan.code, plan_id: plan.id },
  };

  if (plan.stripe_product_id) {
    const existing = await stripeRequest('GET', `/v1/products/${plan.stripe_product_id}`);

    if (existing) {
      const drifted =
        existing.name !== wanted.name ||
        (existing.description ?? undefined) !== wanted.description;

      if (drifted) {
        actions.push(`${plan.code} — produit mis à jour`);
        if (!CHECK_ONLY) {
          await stripeRequest('POST', `/v1/products/${existing.id}`, wanted);
        }
      }

      return existing.id;
    }

    // Produit supprimé côté Stripe : la référence en base ne désigne plus rien.
    console.warn(
      `${YELLOW}⚠  ${plan.code} : produit ${plan.stripe_product_id} introuvable, recréation.${RESET}`,
    );
  }

  actions.push(`${plan.code} — produit créé`);
  if (CHECK_ONLY) return null;

  const created = await stripeRequest('POST', '/v1/products', wanted);
  await writeBack('plans', plan.id, { stripe_product_id: created.id });
  return created.id;
}

// -----------------------------------------------------------------------------
// Price
// -----------------------------------------------------------------------------

async function syncPrice(plan, price, productId) {
  const label = `${plan.code} ${price.kind === 'RECURRING' ? `${price.recurring_interval}` : 'création'}`;

  if (price.stripe_price_id) {
    const existing = await stripeRequest('GET', `/v1/prices/${price.stripe_price_id}`);

    if (existing && matches(existing, price, productId)) return;

    if (existing) {
      // Le montant, la devise ou la périodicité ont changé en base. Le Price
      // existant ne peut pas être modifié : on l'archive et on en crée un.
      actions.push(`${label} — prix remplacé (${existing.unit_amount} → ${price.unit_amount_cents})`);
      if (!CHECK_ONLY) {
        await stripeRequest('POST', `/v1/prices/${existing.id}`, { active: false });
      }
    } else {
      console.warn(
        `${YELLOW}⚠  ${label} : prix ${price.stripe_price_id} introuvable, recréation.${RESET}`,
      );
    }
  } else {
    actions.push(`${label} — prix créé`);
  }

  if (CHECK_ONLY || !productId) return;

  const created = await stripeRequest('POST', '/v1/prices', {
    product: productId,
    unit_amount: price.unit_amount_cents,
    currency: price.currency.toLowerCase(),
    recurring:
      price.kind === 'RECURRING' ? { interval: price.recurring_interval } : undefined,
    metadata: { plan_price_id: price.id, plan_code: plan.code },
  });

  await writeBack('plan_prices', price.id, { stripe_price_id: created.id });
}

/** Le Price Stripe décrit-il exactement ce que porte la base ? */
function matches(stripePrice, price, productId) {
  const sameInterval =
    price.kind === 'RECURRING'
      ? stripePrice.recurring?.interval === price.recurring_interval
      : !stripePrice.recurring;

  return (
    stripePrice.active === true &&
    stripePrice.product === productId &&
    stripePrice.unit_amount === price.unit_amount_cents &&
    stripePrice.currency === price.currency.toLowerCase() &&
    sameInterval
  );
}

async function writeBack(table, id, patch) {
  const { error: writeError } = await supabase.from(table).update(patch).eq('id', id);

  if (writeError) {
    // L'objet existe chez Stripe mais la base l'ignore : la prochaine exécution
    // en créerait un second. L'échec doit être bruyant.
    throw new Error(`écriture de ${Object.keys(patch)[0]} impossible — ${writeError.message}`);
  }
}

// -----------------------------------------------------------------------------
// Rapport
// -----------------------------------------------------------------------------

for (const line of skipped) {
  console.log(`${DIM}·  ${line}${RESET}`);
}

if (actions.length === 0) {
  console.log(`${GREEN}✔  Stripe reflète le catalogue.${RESET}`);
} else {
  for (const line of actions) {
    console.log(`${CHECK_ONLY ? YELLOW + '~' : GREEN + '✔'}  ${line}${RESET}`);
  }

  if (CHECK_ONLY) {
    console.log(
      `\n${YELLOW}${actions.length} écart(s).${RESET} Lancez ${BOLD}npm run stripe:sync${RESET} pour les appliquer.`,
    );
  }
}

console.log('');
process.exit(failures > 0 ? 1 : 0);
