import { useRef, useState } from 'react';
import { Download, Paperclip, Trash2 } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  type TicketAttachment,
} from '@/services/attachments.service';
import {
  useDeleteAttachment,
  useOpenAttachment,
  useTicketAttachments,
  useUploadAttachment,
} from '@/features/tickets/useAttachments';
import { useProfile } from '@/features/auth/useProfile';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Pièces jointes d'une demande (§35).
 *
 *
 * LE BUCKET EST PRIVÉ, ET LE RESTE
 *
 * Aucune URL publique n'existe. Chaque ouverture demande un lien signé valable
 * une minute, jamais conservé. Un lien mis en cache continuerait d'ouvrir un
 * document de support après la révocation de l'accès de son porteur — le
 * document survivrait à la raison qui l'avait rendu lisible.
 *
 *
 * LA SUPPRESSION EST UNE OPÉRATION D'ADMINISTRATION
 *
 * Le bouton n'apparaît que pour un OWNER ou un ADMIN plateforme. Ce n'est pas
 * ce bouton qui protège : les policies `ticket_attachments_delete_staff` et
 * `ticket_attachments_delete_admin` refusent la suppression à tout le monde
 * d'autre, y compris à qui forcerait la requête. L'affichage suit la règle, il
 * ne la crée pas.
 *
 * Un client ne supprime donc pas ce qu'il a versé, et c'est délibéré : une
 * pièce jointe retirée d'un dossier de support en changerait le sens sans
 * laisser de trace.
 */

const MAX_MEGABYTES = Math.round(MAX_ATTACHMENT_BYTES / 1_048_576);

function AttachmentRow({
  attachment,
  canDelete,
  onOpen,
  onDelete,
  isOpening,
  isDeleting,
}: {
  attachment: TicketAttachment;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
  isOpening: boolean;
  isDeleting: boolean;
}) {
  const author = attachment.author?.full_name || attachment.author?.email;

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Paperclip className="size-4 shrink-0 text-muted" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
        <p className="text-xs text-muted">
          {formatFileSize(attachment.size_bytes)} · {formatDate(attachment.created_at)}
          {author ? ` · ${author}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpen}
          isLoading={isOpening}
          loadingLabel="Ouverture…"
        >
          <Download aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Télécharger</span>
        </Button>

        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            isLoading={isDeleting}
            loadingLabel="Suppression…"
            className="text-danger"
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">Supprimer {attachment.file_name}</span>
          </Button>
        )}
      </div>
    </li>
  );
}

export interface TicketAttachmentsProps {
  ticketId: string;
  organizationId: string;
  /** Une demande close n'accepte plus de dépôt ; les pièces restent lisibles. */
  readOnly?: boolean;
}

export function TicketAttachments({
  ticketId,
  organizationId,
  readOnly = false,
}: TicketAttachmentsProps) {
  const attachments = useTicketAttachments(ticketId);
  const upload = useUploadAttachment(ticketId);
  const remove = useDeleteAttachment(ticketId);
  const open = useOpenAttachment();

  const { data: profile } = useProfile();
  const canDelete = profile?.platform_role === 'OWNER' || profile?.platform_role === 'ADMIN';

  const inputRef = useRef<HTMLInputElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Un fichier à la fois, et l'on s'arrête au premier refus. Le plafond porte
    // sur chaque objet : enchaîner après un échec laisserait l'utilisateur
    // devant un seul message d'erreur sans savoir lesquels sont passés.
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync({ ticketId, organizationId, file });
      } catch {
        // Le motif est affiché par `upload.isError`, avec le message rendu par
        // Storage ou par la base — jamais reformulé.
        break;
      }
    }
  }

  return (
    <section aria-labelledby={`pieces-jointes-${ticketId}`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`pieces-jointes-${ticketId}`} className="text-sm font-semibold">
          Pièces jointes
        </h3>

        {!readOnly && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_ATTACHMENT_TYPES}
              className="sr-only"
              onChange={(event) => {
                void handleFiles(event.target.files).finally(() => {
                  // Le champ est vidé pour que redéposer le même fichier après
                  // un échec déclenche bien un nouvel événement.
                  event.target.value = '';
                });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              isLoading={upload.isPending}
              loadingLabel="Envoi du fichier…"
            >
              <Paperclip aria-hidden="true" />
              Ajouter un fichier
            </Button>
          </>
        )}
      </div>

      {upload.isError && (
        <Alert tone="danger" title="Le fichier n’a pas été joint">
          <p>{upload.error.message}</p>
        </Alert>
      )}

      {remove.isError && (
        <Alert tone="danger" title="La suppression a échoué">
          <p>{remove.error.message}</p>
        </Alert>
      )}

      {open.isError && (
        <Alert tone="danger" title="Le fichier n’a pas pu être ouvert">
          <p>{open.error.message}</p>
        </Alert>
      )}

      {attachments.isPending && <LoadingState label="Chargement des pièces jointes…" />}

      {attachments.isError && (
        <ErrorState
          title="Les pièces jointes n’ont pas pu être chargées"
          error={attachments.error}
          onRetry={() => void attachments.refetch()}
        />
      )}

      {attachments.data && attachments.data.length === 0 && (
        <p className="text-sm text-muted">
          {readOnly
            ? 'Aucune pièce jointe.'
            : `Aucune pièce jointe. Formats courants acceptés, ${MAX_MEGABYTES} Mo par fichier.`}
        </p>
      )}

      {attachments.data && attachments.data.length > 0 && (
        <ul className="rounded-lg border border-border bg-surface px-4">
          {attachments.data.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              canDelete={canDelete}
              isOpening={open.isPending && busyId === attachment.id}
              isDeleting={remove.isPending && busyId === attachment.id}
              onOpen={() => {
                setBusyId(attachment.id);
                open.mutate(attachment);
              }}
              onDelete={() => {
                setBusyId(attachment.id);
                remove.mutate(attachment);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
