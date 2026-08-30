import { z } from 'zod';

/**
 * Validation des demandes d'assistance et de modification (§24, §25).
 *
 * Reproduit les contraintes CHECK de la migration 10. Comme ailleurs, le vide
 * est normalisé en `undefined` avant validation : une chaîne vide envoyée sur
 * `website_id` provoquerait une erreur de type UUID, et sur une colonne texte
 * une violation de longueur minimale.
 */

/** Catégories de la migration 01, dans l'ordre d'affichage souhaité. */
export const TICKET_CATEGORIES = [
  'SITE',
  'DOMAINE',
  'HEBERGEMENT',
  'FACTURATION',
  'SUPPORT',
  'AUTRE',
] as const;

export const TICKET_TYPES = ['CHANGE_REQUEST', 'SUPPORT'] as const;

export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'RESOLVED',
  'CLOSED',
] as const;

export const createTicketSchema = z.object({
  organization_id: z.string().uuid('Sélectionnez l’entreprise concernée.'),

  type: z.enum(TICKET_TYPES),
  category: z.enum(TICKET_CATEGORIES),

  subject: z
    .string()
    .trim()
    .min(3, 'Résumez votre demande en quelques mots (3 caractères minimum).')
    .max(200, 'L’objet ne peut pas dépasser 200 caractères.'),

  description: z
    .string()
    .trim()
    .min(10, 'Décrivez votre demande en 10 caractères au minimum.')
    .max(10000, 'Votre description ne peut pas dépasser 10 000 caractères.'),

  website_id: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
});

export type CreateTicketFormInput = z.input<typeof createTicketSchema>;
export type CreateTicketFormValues = z.output<typeof createTicketSchema>;

export const ticketMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Écrivez votre message avant de l’envoyer.')
    .max(10000, 'Votre message ne peut pas dépasser 10 000 caractères.'),
});

export type TicketMessageFormInput = z.input<typeof ticketMessageSchema>;
export type TicketMessageFormValues = z.output<typeof ticketMessageSchema>;

/**
 * Exemples de demandes de modification, repris de §25.
 *
 * Affichés en aide à la saisie : une personne qui ne sait pas ce qu'elle a le
 * droit de demander ne demande rien.
 */
export const CHANGE_REQUEST_EXAMPLES = [
  'Changer un texte ou un titre',
  'Remplacer ou ajouter une photo',
  'Modifier vos horaires d’ouverture',
  'Ajouter une section à une page',
  'Créer une nouvelle page',
  'Ajouter un bouton ou un lien',
] as const;
