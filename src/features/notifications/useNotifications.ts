import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countUnreadNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@/services/notifications.service';
import { useAuth } from '@/features/auth/auth-context';

/** Clés de cache des notifications. */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

/**
 * Compteur de la cloche.
 *
 * Rafraîchi périodiquement : une notification naît d'un trigger côté base, sans
 * que le navigateur en soit averti. Un intervalle d'une minute reste discret
 * en trafic et suffit pour un outil de gestion, où les échanges se comptent en
 * heures.
 *
 * Le temps réel de Supabase ferait mieux, au prix d'une connexion permanente
 * par onglet. À reconsidérer si le volume d'échanges le justifie.
 */
export function useUnreadNotificationCount() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: countUnreadNotifications,
    enabled: !isLoading && Boolean(user),
    refetchInterval: 60_000,
    // Le compteur est la seule requête qu'on relance au retour d'onglet :
    // c'est le moment où une notification arrivée entre-temps compte le plus.
    refetchOnWindowFocus: true,
  });
}

export function useNotifications() {
  const { user, isLoading } = useAuth();

  return useQuery<Notification[]>({
    queryKey: notificationKeys.list(),
    queryFn: () => fetchNotifications(),
    enabled: !isLoading && Boolean(user),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
