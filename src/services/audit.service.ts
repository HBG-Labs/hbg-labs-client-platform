import { supabase } from '@/lib/supabase';

/**
 * Journal d'audit (§44).
 *
 * Lecture seule, et sans autre choix possible : `audit_logs` n'a aucune policy
 * INSERT, UPDATE ni DELETE, et `authenticated` n'en détient pas les privilèges.
 * Ce service ne peut donc rien proposer d'autre, ce qui est exactement le
 * point — un journal qu'une application pourrait retoucher ne prouverait rien.
 *
 * Les lignes naissent des triggers de la migration 19, dans la transaction du
 * changement qu'elles décrivent.
 *
 * La policy `audit_logs_select_staff` réserve la lecture au personnel
 * plateforme. Un client n'obtient aucune ligne — pas une erreur, une liste
 * vide : le journal contient des adresses IP, des rôles internes et le détail
 * d'actions d'exploitation.
 */

export interface AuditLogEntry {
  id: string;
  action: string;
  actor_user_id: string | null;
  /** Figé au moment de l'action : le compte a pu disparaître depuis. */
  actor_email: string | null;
  actor_platform_role: string | null;
  organization_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  organization: { id: string; name: string } | null;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  organizationId?: string;
  /** Recherche sur l'adresse de l'auteur, figée dans la ligne. */
  actorEmail?: string;
  limit?: number;
}

const COLUMNS = `
  id, action, actor_user_id, actor_email, actor_platform_role,
  organization_id, resource_type, resource_id, metadata, ip_address, created_at,
  organization:organizations ( id, name )
`;

/**
 * Dernières entrées du journal, de la plus récente à la plus ancienne.
 *
 * La limite est volontairement basse par défaut. Ce journal grossit à chaque
 * action de chaque client : le charger entièrement deviendrait inutilisable
 * bien avant de devenir lent.
 */
export async function fetchAuditLog(
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('audit_logs')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.action) query = query.eq('action', filters.action);
  if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
  if (filters.organizationId) query = query.eq('organization_id', filters.organizationId);
  if (filters.actorEmail) query = query.ilike('actor_email', `%${filters.actorEmail}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AuditLogEntry[];
}

/**
 * Verbes présents dans le journal, pour alimenter le filtre.
 *
 * Lus depuis les données plutôt que depuis une liste écrite en dur : `action`
 * est du texte libre côté schéma, et une liste figée finirait par ne plus
 * décrire ce que le journal contient réellement.
 */
export async function fetchAuditActions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  const seen = new Set((data ?? []).map((row) => (row as { action: string }).action));
  return [...seen].sort();
}
