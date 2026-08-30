import { supabase } from '@/lib/supabase';
import type { NotificationChannel } from '@/types/domain';

/**
 * Notifications de l'utilisateur connecté (§26).
 *
 * Aucun filtre sur le destinataire : la policy `notifications_select_own`
 * n'expose que les lignes dont `user_id` vaut `auth.uid()`. Même le personnel
 * plateforme ne voit pas les notifications d'un client, faute de policy staff
 * sur cette table : une notification s'adresse à une personne, pas à une
 * organisation.
 *
 * L'écriture se limite à `read_at`. Le trigger `guard_notification_update`
 * refuse toute autre modification, et les notifications naissent par les
 * triggers de la migration 18, jamais depuis le navigateur.
 */

export interface Notification {
  id: string;
  type: string;
  channel: NotificationChannel;
  title: string;
  body: string | null;
  /** Chemin interne, jamais une URL absolue : le domaine varie. */
  action_url: string | null;
  resource_type: string | null;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
}

const COLUMNS =
  'id, type, channel, title, body, action_url, resource_type, resource_id, read_at, created_at';

/**
 * Notifications récentes, non lues d'abord.
 *
 * La limite évite de charger un historique entier dans la cloche. Une page
 * dédiée paginera le jour où le volume le justifiera.
 */
export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .eq('channel', 'IN_APP')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Notification[];
}

/** Nombre de notifications non lues, sans transférer les lignes. */
export async function countUnreadNotifications(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('channel', 'IN_APP')
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);

  if (error) throw error;
}

/**
 * Marque toutes les notifications non lues.
 *
 * `is('read_at', null)` restreint l'écriture aux lignes concernées : sans
 * cette condition, chaque appel réécrirait la date de lecture de tout
 * l'historique.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) throw error;
}
