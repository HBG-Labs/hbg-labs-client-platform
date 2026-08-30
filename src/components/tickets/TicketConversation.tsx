import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeOff, Send } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import {
  ticketMessageSchema,
  type TicketMessageFormInput,
  type TicketMessageFormValues,
} from '@/schemas/ticket.schema';
import { useAddTicketMessage, useTicketMessages } from '@/features/tickets/useTickets';
import type { TicketMessage } from '@/services/tickets.service';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Input';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { TicketAttachments } from './TicketAttachments';

/**
 * Fil de conversation d'une demande.
 *
 * Le même composant sert l'espace client et l'administration. Le client ne
 * reçoit jamais les notes internes : la policy
 * `support_messages_select_member` les écarte avant que la réponse ne quitte
 * PostgreSQL. Ce composant n'a donc aucun filtre à appliquer, et ne peut pas
 * en oublier un.
 *
 * `allowInternalNotes` ne contrôle que l'affichage de la case à cocher. Un
 * client qui la forcerait verrait son message publié en clair : le trigger
 * `stamp_message_author_role` ramène `is_internal_note` à `false` pour tout
 * auteur non-staff.
 *
 * Les pièces jointes sont rattachées à la DEMANDE, non à un message. Le schéma
 * permet les deux (`ticket_attachments.message_id` est nullable), mais lier un
 * fichier à un message obligerait à envoyer le message avant de pouvoir joindre
 * quoi que ce soit — ou à téléverser vers un message qui n'existe pas encore.
 */

function MessageBubble({ message }: { message: TicketMessage }) {
  const authorName = message.author?.full_name || message.author?.email || 'Compte supprimé';

  if (message.is_internal_note) {
    return (
      <li className="rounded-lg border border-dashed border-warning/50 bg-warning-surface p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-warning">
            <EyeOff className="size-3.5" aria-hidden="true" />
            Note interne
          </span>
          <span className="text-muted">
            {authorName} · {formatDateTime(message.created_at)}
          </span>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{message.body}</p>
        <p className="mt-2 text-xs text-muted">
          Cette note n’est pas visible par le client.
        </p>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'rounded-lg border p-4',
        message.author_is_staff
          ? 'border-primary/30 bg-brand-50 dark:bg-brand-950'
          : 'border-border bg-surface',
      )}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-xs">
        <span className="font-medium">
          {message.author_is_staff ? `${authorName}, HBG Labs` : authorName}
        </span>
        <span className="text-muted">{formatDateTime(message.created_at)}</span>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed">{message.body}</p>
    </li>
  );
}

export interface TicketConversationProps {
  ticketId: string;
  /**
   * Organisation de la demande. Sert à composer le chemin Storage des pièces
   * jointes, dont elle est le premier segment — c'est sur lui que repose
   * l'isolation côté Storage. Le trigger le recalcule de toute façon depuis le
   * ticket : une valeur erronée serait refusée, pas appliquée.
   */
  organizationId: string;
  /** Description initiale, premier élément du fil. */
  description: string;
  authorName: string;
  createdAt: string;
  /** Affiche la case « note interne ». Réservé à l'administration. */
  allowInternalNotes?: boolean;
  /** Désactive la réponse, sur une demande close. */
  readOnly?: boolean;
}

export function TicketConversation({
  ticketId,
  organizationId,
  description,
  authorName,
  createdAt,
  allowInternalNotes = false,
  readOnly = false,
}: TicketConversationProps) {
  const messages = useTicketMessages(ticketId);
  const addMessage = useAddTicketMessage(ticketId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketMessageFormInput, unknown, TicketMessageFormValues>({
    resolver: zodResolver(ticketMessageSchema),
  });

  const onSubmit = handleSubmit(async (values, event) => {
    // La case est lue depuis le formulaire natif : react-hook-form n'a pas à
    // gérer un champ que le schéma ne valide pas.
    const form = event?.target as HTMLFormElement | undefined;
    const checkbox = form?.elements.namedItem('internal_note') as HTMLInputElement | null;

    await addMessage.mutateAsync({
      body: values.body,
      isInternalNote: Boolean(checkbox?.checked),
    });

    reset({ body: '' });
    if (checkbox) checkbox.checked = false;
  });

  return (
    <div className="space-y-6">
      <ol className="space-y-4">
        {/* La description initiale ouvre le fil : c'est le premier message de
            la conversation, même si la base la range dans le ticket. */}
        <li className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-2 text-xs">
            <span className="font-medium">{authorName}</span>
            <span className="text-muted">{formatDateTime(createdAt)}</span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">{description}</p>
        </li>

        {messages.isPending && <LoadingState label="Chargement des échanges…" />}

        {messages.isError && (
          <ErrorState
            title="Les échanges n’ont pas pu être chargés"
            error={messages.error}
            onRetry={() => void messages.refetch()}
          />
        )}

        {messages.data?.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ol>

      <div className="border-t border-border pt-6">
        <TicketAttachments
          ticketId={ticketId}
          organizationId={organizationId}
          readOnly={readOnly}
        />
      </div>

      {readOnly ? (
        <Alert tone="info" title="Demande close">
          <p>
            Cette demande est close. Rouvrez-la si vous souhaitez poursuivre l’échange.
          </p>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4 border-t border-border pt-6">
          {addMessage.isError && (
            <Alert tone="danger" title="Envoi impossible">
              <p>{addMessage.error.message}</p>
            </Alert>
          )}

          <Field label="Votre réponse" error={errors.body?.message}>
            <Textarea
              {...register('body')}
              rows={5}
              placeholder="Écrivez votre message…"
            />
          </Field>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {allowInternalNotes ? (
              <div className="flex items-start gap-3">
                <input
                  id="internal_note"
                  name="internal_note"
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-input accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <label htmlFor="internal_note" className="text-sm leading-relaxed text-muted">
                  Note interne, invisible du client
                </label>
              </div>
            ) : (
              <span />
            )}

            <Button type="submit" isLoading={isSubmitting} loadingLabel="Envoi en cours">
              <Send aria-hidden="true" />
              Envoyer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
