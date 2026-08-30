import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { TicketMessage } from '@/services/tickets.service';

/**
 * Fil de conversation d'une demande (§24).
 *
 * Ce que ces tests couvrent : l'AFFICHAGE. La confidentialité des notes
 * internes, elle, est appliquée par la policy
 * `support_messages_select_member`, vérifiée contre une vraie base par
 * `tests/rls/04-support-confidentiality.test.ts`.
 *
 * Les deux comptent. Un client ne reçoit jamais de note interne, mais si le
 * composant en affichait une sans la distinguer visuellement, un membre de
 * HBG Labs pourrait croire son message privé alors qu'il ne l'est pas. C'est
 * ce risque-là que l'on couvre ici.
 */

const messagesState: { current: TicketMessage[] } = { current: [] };
const addMessage = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock('@/features/tickets/useTickets', () => ({
  useTicketMessages: () => ({
    data: messagesState.current,
    isPending: false,
    isError: false,
  }),
  useAddTicketMessage: () => ({
    mutateAsync: (...args: unknown[]) => addMessage(...args),
    isError: false,
    error: null,
  }),
}));

const publicReply: TicketMessage = {
  id: 'msg-public',
  body: 'Votre demande est prise en compte, modification en ligne demain.',
  author_is_staff: true,
  is_internal_note: false,
  created_at: '2026-08-29T10:00:00.000Z',
  author: { id: 'staff-1', full_name: 'Harry Bergoz', email: 'hbglabs@gmail.com' },
};

const internalNote: TicketMessage = {
  id: 'msg-internal',
  body: 'Vérifier le règlement de la facture avant intervention.',
  author_is_staff: true,
  is_internal_note: true,
  created_at: '2026-08-29T10:05:00.000Z',
  author: { id: 'staff-1', full_name: 'Harry Bergoz', email: 'hbglabs@gmail.com' },
};

beforeEach(() => {
  messagesState.current = [];
  addMessage.mockClear();
});

describe('Fil de conversation', () => {
  it('ouvre le fil par la description initiale', async () => {
    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Merci de remplacer les horaires du samedi."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
      />,
    );

    expect(
      screen.getByText('Merci de remplacer les horaires du samedi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
  });

  it('signale clairement une note interne', async () => {
    messagesState.current = [publicReply, internalNote];

    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
        allowInternalNotes
      />,
    );

    // Le marquage doit être explicite : un membre du personnel qui croirait
    // son message privé alors qu'il ne l'est pas commettrait une faute réelle.
    expect(screen.getByText('Note interne')).toBeInTheDocument();
    expect(
      screen.getByText('Cette note n’est pas visible par le client.'),
    ).toBeInTheDocument();
  });

  it('attribue les réponses de HBG Labs à leur auteur', async () => {
    messagesState.current = [publicReply];

    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
      />,
    );

    expect(screen.getByText('Harry Bergoz, HBG Labs')).toBeInTheDocument();
  });

  it('ne propose pas la note interne au client', async () => {
    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
      />,
    );

    expect(
      screen.queryByLabelText(/Note interne, invisible du client/i),
    ).not.toBeInTheDocument();
  });

  it('propose la note interne à HBG Labs', async () => {
    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
        allowInternalNotes
      />,
    );

    expect(
      screen.getByLabelText(/Note interne, invisible du client/i),
    ).toBeInTheDocument();
  });

  it('transmet le caractère interne du message', async () => {
    const user = userEvent.setup();
    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
        allowInternalNotes
      />,
    );

    await user.type(screen.getByLabelText(/Votre réponse/), 'Note de suivi.');
    await user.click(screen.getByLabelText(/Note interne, invisible du client/i));
    await user.click(screen.getByRole('button', { name: /Envoyer/i }));

    expect(addMessage).toHaveBeenCalledWith({
      body: 'Note de suivi.',
      isInternalNote: true,
    });
  });

  it('ferme la réponse sur une demande close', async () => {
    const { TicketConversation } = await import('./TicketConversation');
    renderWithProviders(
      <TicketConversation
        ticketId="ticket-1"
        description="Description."
        authorName="Marie Dupont"
        createdAt="2026-08-29T09:00:00.000Z"
        readOnly
      />,
    );

    expect(screen.queryByRole('button', { name: /Envoyer/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Cette demande est close/i)).toBeInTheDocument();
  });
});
