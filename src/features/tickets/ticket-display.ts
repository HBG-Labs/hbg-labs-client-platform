import type { TicketPriority, TicketStatus, TicketType } from '@/types/domain';
import type { BadgeTone } from '@/components/ui/StatusBadge';

/**
 * Correspondances d'affichage des demandes.
 *
 * Dans un module à part : l'espace client et l'administration présentent les
 * mêmes statuts, et deux tables de couleurs finiraient par diverger.
 */

export const TICKET_STATUS_TONES: Record<TicketStatus, BadgeTone> = {
  OPEN: 'info',
  IN_PROGRESS: 'info',
  // Attend une action du client : le ton avertit sans alarmer.
  WAITING_CLIENT: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export const TICKET_PRIORITY_TONES: Record<TicketPriority, BadgeTone> = {
  LOW: 'neutral',
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  SUPPORT: 'Assistance',
  CHANGE_REQUEST: 'Modification du site',
};

/** Une demande encore à traiter, par opposition à résolue ou close. */
export function isOpenTicket(status: TicketStatus): boolean {
  return status === 'OPEN' || status === 'IN_PROGRESS' || status === 'WAITING_CLIENT';
}
