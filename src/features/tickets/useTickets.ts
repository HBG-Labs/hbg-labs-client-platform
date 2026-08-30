import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addTicketMessage,
  createTicket,
  fetchTicket,
  fetchTicketMessages,
  fetchTickets,
  setTicketStatus,
  triageTicket,
  type CreateTicketInput,
  type TicketTriageInput,
} from '@/services/tickets.service';
import type { TicketStatus } from '@/types/domain';
import { useAuth } from '@/features/auth/auth-context';
import { adminKeys } from '@/features/admin/admin.keys';
import { ticketKeys } from './tickets.keys';

/**
 * Demandes d'assistance et de modification.
 *
 * Les mêmes hooks servent l'espace client et l'administration : la RLS décide
 * de ce que chacun reçoit, l'interface n'a pas à trancher.
 */

export function useTickets() {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ticketKeys.list(),
    queryFn: fetchTickets,
    enabled: !isLoading && Boolean(user),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicket(id),
    enabled: Boolean(id),
  });
}

export function useTicketMessages(id: string) {
  return useQuery({
    queryKey: ticketKeys.messages(id),
    queryFn: () => fetchTicketMessages(id),
    enabled: Boolean(id),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.list() });
      // Le compteur de demandes ouvertes du tableau de bord admin en dépend.
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useAddTicketMessage(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, isInternalNote }: { body: string; isInternalNote?: boolean }) =>
      addTicketMessage(ticketId, body, isInternalNote ?? false),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) });
      // Le message a pu changer le statut : `bump_ticket_activity` repasse une
      // demande en attente de réponse à OPEN quand le client écrit.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.list() });
    },
  });
}

export function useSetTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TicketStatus) => setTicketStatus(ticketId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.list() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}

export function useTriageTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TicketTriageInput) => triageTicket(ticketId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.list() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.metrics() });
    },
  });
}
