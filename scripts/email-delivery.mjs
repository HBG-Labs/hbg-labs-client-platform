#!/usr/bin/env node
/**
 * Canal de courriels : état, ouverture, fermeture.
 *
 *
 * CE QUE COMMANDE CET INTERRUPTEUR
 *
 * `platform_settings.email_delivery` décide si les triggers de notification
 * créent une seconde ligne, au canal EMAIL, que la fonction Edge
 * `notifications-dispatch` envoie via Resend (migration 20).
 *
 * Il est fermé par défaut. Tant qu'il l'est, aucune ligne EMAIL n'existe :
 * rien ne s'accumule en attente d'un service d'envoi qui n'est pas raccordé, et
 * l'ouverture ultérieure n'expédie pas un arriéré de messages périmés.
 *
 *
 * POURQUOI UN SCRIPT PLUTÔT QU'UN ÉCRAN
 *
 * `platform_settings` est une table fermée : aucun privilège pour `anon` ni
 * pour `authenticated`, RLS activée sans policy. Un réglage qui commande des
 * envois vers des adresses réelles n'a pas à être basculable depuis une session
 * de navigateur, fût-elle celle d'un administrateur.
 *
 *
 * UTILISATION
 *
 *     node scripts/email-delivery.mjs            # état et file d'attente
 *     node scripts/email-delivery.mjs --on
 *     node scripts/email-delivery.mjs --off
 *
 * Requiert SUPABASE_SERVICE_ROLE_KEY.
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

const wantsOn = process.argv.includes('--on');
const wantsOff = process.argv.includes('--off');

if (wantsOn && wantsOff) {
  console.error(`${RED}✖  --on et --off sont contradictoires.${RESET}`);
  process.exit(1);
}

// --- Bascule ---------------------------------------------------------------
if (wantsOn || wantsOff) {
  const value = wantsOn ? 'on' : 'off';

  const { error } = await supabase
    .from('platform_settings')
    .update({ value })
    .eq('key', 'email_delivery');

  if (error) {
    console.error(`${RED}✖  Bascule impossible :${RESET} ${error.message}`);
    process.exit(1);
  }

  console.log(
    `${GREEN}✔${RESET} Canal EMAIL ${wantsOn ? `${BOLD}ouvert${RESET}` : 'fermé'}.`,
  );

  if (wantsOn) {
    console.log(
      `${DIM}   Vérifiez que RESEND_API_KEY, EMAIL_FROM et APP_URL sont déposés côté fonction,${RESET}`,
    );
    console.log(
      `${DIM}   et que la tâche pg_cron appelle notifications-dispatch (SETUP.md §9).${RESET}`,
    );
  }
}

// --- État ------------------------------------------------------------------
const [setting, pending, failed, sent] = await Promise.all([
  supabase
    .from('platform_settings')
    .select('value, updated_at')
    .eq('key', 'email_delivery')
    .maybeSingle(),
  countEmails('PENDING'),
  countEmails('FAILED'),
  countEmails('SENT'),
]);

function countEmails(status) {
  return supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('channel', 'EMAIL')
    .eq('status', status);
}

if (setting.error) {
  console.error(`${RED}✖  Lecture du réglage impossible :${RESET} ${setting.error.message}`);
  process.exit(1);
}

const state = setting.data?.value ?? 'absent';

console.log(`\n${BOLD}Canal EMAIL${RESET}`);
console.log(
  `  état      ${state === 'on' ? `${GREEN}ouvert${RESET}` : `${YELLOW}fermé${RESET}`} ${DIM}(${state})${RESET}`,
);
console.log(`  envoyés   ${sent.count ?? 0}`);
console.log(`  en file   ${pending.count ?? 0}`);
console.log(`  en échec  ${failed.count ?? 0}`);

// Une file qui ne se vide pas est le symptôme visible d'un ordonnanceur absent
// ou d'un secret manquant. Le signaler ici évite de le découvrir par un client
// qui n'a jamais reçu sa réponse.
if (state === 'on' && (pending.count ?? 0) > 20) {
  console.log(
    `\n${YELLOW}⚠  La file ne se vide pas.${RESET} Vérifiez la tâche pg_cron et les journaux de la fonction.`,
  );
}

if ((failed.count ?? 0) > 0) {
  const { data: reasons } = await supabase
    .from('notifications')
    .select('failure_reason, created_at')
    .eq('channel', 'EMAIL')
    .eq('status', 'FAILED')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log(`\n${DIM}Derniers motifs d'échec :${RESET}`);
  for (const row of reasons ?? []) {
    console.log(`${DIM}  · ${row.failure_reason}${RESET}`);
  }
}

console.log('');
