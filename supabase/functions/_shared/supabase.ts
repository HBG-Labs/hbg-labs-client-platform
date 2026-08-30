import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2.112.4';
import { requireEnv } from './env.ts';
import { HttpError } from './http.ts';

/**
 * Deux clients Supabase, deux rôles, deux usages qui ne se mélangent jamais.
 *
 *
 * `adminClient` — service_role, BYPASSRLS
 *
 * Le seul autorisé à écrire dans `subscriptions`, `invoices`, `payments`,
 * `stripe_webhook_events` et `organizations.stripe_customer_id`. Ces tables
 * n'ont aucune policy d'écriture : c'est délibéré (migrations 07, 08, 09, 14).
 *
 * Il ne doit JAMAIS servir à lire des données au nom d'un utilisateur : il
 * ignore la RLS, et une lecture faite avec lui renverrait les lignes de tous
 * les clients.
 *
 *
 * `callerClient` — jeton de l'appelant, RLS appliquée
 *
 * Sert à savoir QUI appelle et ce qu'il a le droit de faire. L'autorisation
 * n'est pas recalculée en TypeScript : elle est demandée à PostgreSQL, qui
 * l'établit déjà pour toutes les autres requêtes de la plateforme. Une règle
 * réimplémentée ici finirait par diverger de la policy correspondante, et la
 * divergence ne se verrait pas.
 */

export function adminClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Exige que l'appelant soit le backend lui-même, et non un utilisateur.
 *
 * Le runtime a déjà vérifié la signature du jeton (`verify_jwt = true`) : il
 * reste à savoir QUI il désigne. Sans ce contrôle, n'importe quel client
 * connecté pourrait déclencher une tâche d'exploitation — ici, vider la file
 * de courriels — avec les droits de `service_role`.
 *
 * Deux formes de clé coexistent chez Supabase : le JWT historique, dont la
 * charge utile porte `role`, et les clés `sb_secret_…`, qui n'en sont pas. Les
 * deux sont acceptées, la seconde par comparaison directe avec le secret dont
 * la fonction dispose déjà.
 */
export function requireServiceRole(request: Request): void {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new HttpError(401, 'Authentification requise.');
  }

  if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return;

  const segments = token.split('.');

  if (segments.length === 3 && segments[1]) {
    try {
      const payload = JSON.parse(atob(segments[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role') return;
    } catch {
      // Jeton illisible : traité comme non autorisé, ci-dessous.
    }
  }

  throw new HttpError(403, 'Réservé au backend.');
}

export function callerClient(request: Request): SupabaseClient {
  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    throw new HttpError(401, 'Authentification requise.');
  }

  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
}

/** Utilisateur authentifié, ou 401. */
export async function requireUser(caller: SupabaseClient): Promise<{ id: string; email: string | null }> {
  const { data, error } = await caller.auth.getUser();

  if (error || !data.user) {
    throw new HttpError(401, 'Session expirée. Reconnectez-vous.');
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * L'appelant est-il le dirigeant de cette organisation ?
 *
 * La question est posée à `public.is_org_owner`, la fonction qui fonde déjà
 * les policies de `invoices` et `payments`. Le rôle OWNER est le seul à porter
 * la facturation (migration 01) : un MANAGER gère l'opérationnel « sans accès
 * à la facturation », un MEMBER consulte.
 */
export async function requireOrgOwner(
  caller: SupabaseClient,
  organizationId: string,
): Promise<void> {
  const { data, error } = await caller.rpc('is_org_owner', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('is_org_owner a échoué :', error);
    throw new HttpError(500, "Vos droits n'ont pas pu être vérifiés.");
  }

  if (data !== true) {
    // 403 et non 404 : l'appelant est authentifié, et l'existence d'une
    // organisation n'est pas une information sensible pour lui — il en
    // connaît déjà l'identifiant, qui vient de ses propres adhésions.
    throw new HttpError(
      403,
      "Seul le dirigeant de l'entreprise peut gérer l'abonnement.",
    );
  }
}
