import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Popover from '@radix-ui/react-popover';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/useNotifications';
import type { Notification } from '@/services/notifications.service';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Cloche de notifications (§26).
 *
 * Le même composant sert l'espace client et l'administration : chacun ne voit
 * que ses propres notifications, la policy `notifications_select_own` s'en
 * charge. Les liens diffèrent naturellement, `action_url` étant écrit par le
 * trigger qui a émis la notification.
 *
 * Ouvrir une notification la marque lue. Laisser ce geste à l'utilisateur
 * produirait un compteur qui ne redescend jamais, et une cloche qu'on finit
 * par ignorer.
 */

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: () => void;
}) {
  const unread = notification.read_at === null;

  const content = (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 text-left transition-colors',
        unread ? 'bg-brand-50 dark:bg-brand-950' : 'bg-transparent',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          unread ? 'bg-primary' : 'bg-transparent',
        )}
      />

      <div className="min-w-0">
        <p className={cn('text-sm', unread ? 'font-medium' : '')}>{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-muted">{formatDateTime(notification.created_at)}</p>
        {unread && <span className="sr-only">Non lue</span>}
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <li className="border-b border-border last:border-b-0">
        <Link
          to={notification.action_url}
          onClick={onOpen}
          className="block hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {content}
      </button>
    </li>
  );
}

export interface NotificationBellProps {
  /**
   * Alignement du panneau. `end` convient à une cloche placée à droite d'un
   * en-tête ; `start` à celle logée dans une barre latérale, où le panneau doit
   * s'ouvrir vers l'intérieur de la page.
   */
  align?: 'start' | 'end';
}

export function NotificationBell({ align = 'end' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const count = unread.data ?? 0;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'relative inline-flex size-11 items-center justify-center rounded-md',
            'hover:bg-surface-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
          aria-label={
            count > 0
              ? `Notifications, ${count} non lue${count > 1 ? 's' : ''}`
              : 'Notifications'
          }
        >
          <Bell className="size-5" aria-hidden="true" />

          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={8}
          collisionPadding={8}
          className="z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>

            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                isLoading={markAllRead.isPending}
                loadingLabel="Marquage en cours"
              >
                <CheckCheck aria-hidden="true" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.isPending && <LoadingState label="Chargement…" />}

            {notifications.isError && (
              <ErrorState
                title="Chargement impossible"
                error={notifications.error}
                onRetry={() => void notifications.refetch()}
                className="m-4"
              />
            )}

            {notifications.data?.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Aucune notification pour le moment.
              </p>
            )}

            {notifications.data && notifications.data.length > 0 && (
              <ul>
                {notifications.data.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={() => {
                      if (notification.read_at === null) markRead.mutate(notification.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
