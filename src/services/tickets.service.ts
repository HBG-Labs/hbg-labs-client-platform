import { supabase } from '@/lib/supabase';
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@/types/domain';

/**
 * Demandes d'assistance et de modification (§24, §25).
 *
 *
 * UN SEUL SERVICE POUR LE CLIENT ET POUR HBG LABS
 *
 * Les requêtes de lecture sont identiques des deux côtés. C'est la RLS qui
 * fait la différence : `support_messages_select_member` impose
 * `not is_internal_note`, tandis que `support_messages_select_staff` ne
 * l'impose pas. Le client reçoit donc le fil sans les notes internes, le
 * personnel le reçoit entier, sans qu'aucune ligne de ce fichier ne s'en
 * occupe.
 *
 * Écrire deux services aurait dupliqué la logique et créé un endroit où
 * l'oubli d'un filtre exposerait une note interne. Ici, l'oubli est
 * impossible : le filtre n'est pas dans ce code.
 *
 *
 * CE QUE LE CLIENT PEUT ÉCRIRE
 *
 * Créer une demande, y répondre, la clore ou la rouvrir. Rien d'autre. La
 * priorité, la catégorie, l'affectation et les autres transitions de statut
 * sont refusées par le trigger `guard_ticket_client_update`, et les fonctions
 * correspondantes ci-dessous ne sont appelées que depuis l'administration.
 */

export interface TicketSummary {
  id: string;
  reference: string;
  subject: string;
  type: TicketType;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  last_activity_at: string;
  first_response_at: string | null;
  organization_id: string;
  organization: { id: string; name: string } | null;
  website: { id: string; name: string } | null;
}

export interface TicketMessage {
  id: string;
  body: string;
  /** Vrai si HBG Labs a écrit ce message. Figé à l'insertion. */
  author_is_staff: boolean;
  /** Le client ne reçoit jamais de message portant `true` : la RLS les écarte. */
  is_internal_note: boolean;
  created_at: string;
  author: { id: string; full_name: string | null; email: string } | null;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  assigned_to: string | null;
}

const TICKET_COLUMNS = `
  id, reference, subject, type, category, priority, status, description,
  created_at, last_activity_at, first_response_at, resolved_at, closed_at,
  created_by, assigned_to, organization_id,
  organization:organizations ( id, name ),
  website:websites ( id, name )
`;

/**
 * Demandes visibles par l'appelant.
 *
 * Aucun filtre sur l'organisation : les policies s'en chargent. Un client
 * reçoit les demandes de son entreprise, le personnel les reçoit toutes.
 */
export async function fetchTickets(): Promise<TicketSummary[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(TICKET_COLUMNS)
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return flattenRelations<TicketSummary>(data);
}

export async function fetchTicket(id: string): Promise<TicketDetail | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(TICKET_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return flattenRelations<TicketDetail>([data])[0] ?? null;
}

/**
 * Fil de conversation.
 *
 * Le client ne voit pas les notes internes : la policy les écarte avant que la
 * réponse ne quitte PostgreSQL. Ce code ne peut donc pas les divulguer, même
 * modifié par erreur.
 */
export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select(
      `id, body, author_is_staff, is_internal_note, created_at,
       author:profiles ( id, full_name, email )`,
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return flattenRelations<TicketMessage>(data);
}

// -----------------------------------------------------------------------------
// Écritures ouvertes au client
// -----------------------------------------------------------------------------

export interface CreateTicketInput {
  organization_id: string;
  type: TicketType;
  category: TicketCategory;
  subject: string;
  description: string;
  website_id?: string | undefined;
}

export async function createTicket(input: CreateTicketInput): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Vous devez être connecté pour créer une demande.');

  // `created_by` est imposé par la policy d'insertion : sans lui, l'historique
  // ne dirait plus qui a demandé quoi.
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      organization_id: input.organization_id,
      created_by: auth.user.id,
      type: input.type,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      website_id: input.website_id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23514') {
      throw new Error(
        'Le site sélectionné n’appartient pas à cette organisation. Choisissez un autre site.',
      );
    }
    throw error;
  }

  return (data as { id: string }).id;
}

/**
 * Ajoute un message au fil.
 *
 * `is_internal_note` n'est transmis que depuis l'administration. Côté client la
 * policy l'interdit, et le trigger `stamp_message_author_role` le ramènerait à
 * `false` de toute façon : la confidentialité ne dépend pas de cet appel.
 */
export async function addTicketMessage(
  ticketId: string,
  body: string,
  isInternalNote = false,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Vous devez être connecté pour répondre.');

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    author_id: auth.user.id,
    body: body.trim(),
    is_internal_note: isInternalNote,
  });

  if (error) throw error;
}

/**
 * Change le statut d'une demande.
 *
 * Un client ne peut que clore ou rouvrir : le trigger
 * `guard_ticket_client_update` refuse les autres transitions, et son message
 * est traduit ici. Les dates de résolution et de clôture sont posées par la
 * base, jamais par l'appelant.
 */
export async function setTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', id);

  if (error) {
    if (error.code === '42501') {
      throw new Error(
        'Cette action est réservée à HBG Labs. Vous pouvez clore votre demande, ou la rouvrir si la réponse ne vous satisfait pas.',
      );
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Écritures réservées à HBG Labs
// -----------------------------------------------------------------------------

export interface TicketTriageInput {
  priority?: TicketPriority | undefined;
  status?: TicketStatus | undefined;
  assigned_to?: string | null | undefined;
}

/**
 * Traitement d'une demande par HBG Labs.
 *
 * Les policies `support_tickets_update_staff` autorisent ces champs, que le
 * client ne peut pas toucher. Un membre SUPPORT y a accès, un client non : la
 * base tranche, pas l'interface.
 */
export async function triageTicket(id: string, input: TicketTriageInput): Promise<void> {
  // Charge utile construite champ par champ plutôt que par accumulation dans
  // un `Record<string, unknown>` : supabase-js perdrait alors la vérification
  // des noms de colonnes à la compilation.
  //
  // Seuls les champs transmis sont modifiés. `resolved_at` et `closed_at` ne
  // figurent jamais ici : le trigger `sync_ticket_milestones` les pose à partir
  // du statut, et les envoyer produirait des demandes résolues sans date.
  const payload = {
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.assigned_to !== undefined ? { assigned_to: input.assigned_to } : {}),
  };

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('support_tickets').update(payload).eq('id', id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------

/**
 * Normalise les relations imbriquées.
 *
 * PostgREST renvoie une relation à un seul élément tantôt comme objet, tantôt
 * comme tableau selon la déclaration de la clé étrangère. La normalisation a
 * lieu ici, une fois, plutôt que dans chaque composant.
 */
function flattenRelations<T>(data: unknown): T[] {
  const keys = ['organization', 'website', 'author'];

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const normalized: Record<string, unknown> = { ...row };

    for (const key of keys) {
      if (!(key in normalized)) continue;
      const value = normalized[key];
      normalized[key] = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    }

    return normalized as T;
  });
}
