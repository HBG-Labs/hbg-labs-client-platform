/**
 * Clés de cache des demandes.
 *
 * Le fil de messages est une clé distincte de la demande elle-même : répondre
 * invalide le fil et le résumé, sans relancer la liste complète.
 */
export const ticketKeys = {
  all: ['tickets'] as const,
  list: () => [...ticketKeys.all, 'list'] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  messages: (id: string) => [...ticketKeys.all, 'messages', id] as const,
  /** Distinctes du fil : téléverser une pièce jointe ne relance pas les messages. */
  attachments: (id: string) => [...ticketKeys.all, 'attachments', id] as const,
};
