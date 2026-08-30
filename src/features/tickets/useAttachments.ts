import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAttachmentDownloadUrl,
  deleteTicketAttachment,
  fetchTicketAttachments,
  uploadTicketAttachment,
  type TicketAttachment,
  type UploadAttachmentInput,
} from '@/services/attachments.service';
import { ticketKeys } from './tickets.keys';

/**
 * Pièces jointes d'une demande (§35).
 *
 * Les mêmes hooks servent l'espace client et l'administration : c'est la RLS
 * qui décide de ce que chacun reçoit, et la policy Storage qui décide de ce que
 * chacun peut téléverser.
 */

export function useTicketAttachments(ticketId: string) {
  return useQuery<TicketAttachment[]>({
    queryKey: ticketKeys.attachments(ticketId),
    queryFn: () => fetchTicketAttachments(ticketId),
    enabled: Boolean(ticketId),
  });
}

export function useUploadAttachment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadAttachmentInput) => uploadTicketAttachment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
    },
  });
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachment: TicketAttachment) => deleteTicketAttachment(attachment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
    },
  });
}

/**
 * Ouvre une pièce jointe dans un nouvel onglet.
 *
 * L'URL est signée au moment du clic et vaut une minute. Elle n'entre jamais
 * dans le cache de TanStack Query : une URL signée conservée continuerait
 * d'ouvrir le document après la révocation de l'accès de son porteur, et le
 * lien survivrait à la raison pour laquelle il avait été accordé.
 */
export function useOpenAttachment() {
  return useMutation({
    mutationFn: async (attachment: TicketAttachment) => {
      const url = await createAttachmentDownloadUrl(attachment.storage_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}
