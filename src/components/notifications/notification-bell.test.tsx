import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { Notification } from '@/services/notifications.service';

/**
 * Cloche de notifications (§26).
 *
 * Ces tests couvrent l'AFFICHAGE et le marquage « lu ». Ce qu'ils ne couvrent
 * pas — qui reçoit quoi, et le fait qu'une note interne ne notifie personne —
 * relève des triggers de la migration 18 et se vérifie contre une vraie base
 * par `scripts/e2e-notifications-check.mjs`.
 */

const state: { list: Notification[]; unread: number } = { list: [], unread: 0 };
const markRead = vi.fn();
const markAllRead = vi.fn();

vi.mock('@/features/notifications/useNotifications', () => ({
  useNotifications: () => ({
    data: state.list,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUnreadNotificationCount: () => ({ data: state.unread }),
  useMarkNotificationRead: () => ({ mutate: markRead, isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: markAllRead, isPending: false }),
}));

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    type: 'TICKET_REPLIED',
    channel: 'IN_APP',
    title: 'Réponse à votre demande HBG-000012',
    body: 'Harry Bergoz a répondu : la modification est en ligne.',
    action_url: '/dashboard/demandes/ticket-1',
    resource_type: 'support_ticket',
    resource_id: 'ticket-1',
    read_at: null,
    created_at: '2026-08-30T09:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  state.list = [];
  state.unread = 0;
  markRead.mockClear();
  markAllRead.mockClear();
});

describe('Cloche de notifications', () => {
  it('n’affiche aucune pastille sans notification non lue', async () => {
    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    // Le libellé accessible ne doit pas annoncer de non-lues : une pastille
    // absente visuellement mais annoncée vocalement serait un mensonge.
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('annonce le nombre de non-lues dans le libellé accessible', async () => {
    state.unread = 3;
    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    expect(
      screen.getByRole('button', { name: 'Notifications, 3 non lues' }),
    ).toBeInTheDocument();
  });

  it('plafonne l’affichage de la pastille à 9+', async () => {
    state.unread = 42;
    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('dit clairement qu’il n’y a rien plutôt que d’afficher un panneau vide', async () => {
    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('Aucune notification pour le moment.')).toBeInTheDocument();
  });

  it('mène à la ressource concernée', async () => {
    state.list = [notification()];
    state.unread = 1;

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));

    const link = screen.getByRole('link', {
      name: /Réponse à votre demande HBG-000012/,
    });
    expect(link).toHaveAttribute('href', '/dashboard/demandes/ticket-1');
  });

  it('marque la notification lue à l’ouverture', async () => {
    state.list = [notification()];
    state.unread = 1;

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    await userEvent.click(
      screen.getByRole('link', { name: /Réponse à votre demande HBG-000012/ }),
    );

    // Sans ce geste automatique, le compteur ne redescendrait jamais et la
    // cloche finirait ignorée.
    expect(markRead).toHaveBeenCalledWith('notif-1');
  });

  it('ne remarque pas une notification déjà lue', async () => {
    state.list = [notification({ read_at: '2026-08-30T10:00:00.000Z' })];

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    await userEvent.click(
      screen.getByRole('link', { name: /Réponse à votre demande HBG-000012/ }),
    );

    expect(markRead).not.toHaveBeenCalled();
  });

  it('distingue une non-lue pour les lecteurs d’écran', async () => {
    state.list = [notification(), notification({ id: 'notif-2', read_at: '2026-08-30T10:00:00.000Z' })];
    state.unread = 1;

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));

    // La pastille colorée est `aria-hidden` : sans ce texte, la distinction
    // lu / non lu serait purement visuelle (§43).
    expect(screen.getAllByText('Non lue')).toHaveLength(1);
  });

  it('n’offre « tout marquer comme lu » que s’il y a quelque chose à marquer', async () => {
    state.list = [notification({ read_at: '2026-08-30T10:00:00.000Z' })];

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(
      screen.queryByRole('button', { name: /Tout marquer comme lu/ }),
    ).not.toBeInTheDocument();
  });

  it('marque tout comme lu à la demande', async () => {
    state.list = [notification()];
    state.unread = 1;

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    await userEvent.click(screen.getByRole('button', { name: /Tout marquer comme lu/ }));

    expect(markAllRead).toHaveBeenCalled();
  });

  it('affiche une notification sans lien sans casser', async () => {
    state.list = [notification({ action_url: null, title: 'Message sans destination' })];
    state.unread = 1;

    const { NotificationBell } = await import('./NotificationBell');
    renderWithProviders(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));

    expect(screen.getByText('Message sans destination')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Message sans destination/ }),
    ).not.toBeInTheDocument();
  });
});
