import { useMutation } from '@tanstack/react-query';
import { submitContactMessage, submitQuoteRequest } from '@/services/leads.service';
import type { ContactMessageValues, QuoteRequestValues } from '@/schemas/lead.schema';

/**
 * Envoi des formulaires publics.
 *
 * Aucune reprise automatique : `retry` vaut déjà `false` pour les mutations
 * dans la configuration globale. Rejouer un envoi dont on ignore s'il a abouti
 * créerait une seconde demande identique, que HBG Labs traiterait deux fois.
 *
 * Pas d'invalidation de cache non plus : le visiteur n'a aucun droit de lecture
 * sur ces tables, il n'existe donc aucune vue à rafraîchir.
 */

export function useSubmitQuoteRequest() {
  return useMutation<void, Error, QuoteRequestValues>({
    mutationFn: submitQuoteRequest,
  });
}

export function useSubmitContactMessage() {
  return useMutation<void, Error, ContactMessageValues>({
    mutationFn: submitContactMessage,
  });
}
