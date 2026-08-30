import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useTickets } from '@/features/tickets/useTickets';
import {
  TICKET_PRIORITY_TONES,
  TICKET_STATUS_TONES,
  TICKET_TYPE_LABELS,
  isOpenTicket,
} from '@/features/tickets/ticket-display';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/types/domain';
import { cn, formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/ui/Table';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * File de traitement (§31).
 *
 * Le tri par défaut suit `last_activity_at` décroissant, décidé par la base.
 * Les demandes closes et résolues sont masquées par défaut : la file sert à
 * savoir quoi traiter, pas à consulter l'historique.
 */
export function TicketsPage() {
  const { data, isPending, isError, error, refetch } = useTickets();
  const [showClosed, setShowClosed] = useState(false);

  const tickets = (data ?? []).filter(
    (ticket) => showClosed || isOpenTicket(ticket.status),
  );
  const openCount = (data ?? []).filter((ticket) => isOpenTicket(ticket.status)).length;

  return (
    <>
      <Seo title="Demandes" description="File de traitement." path="/admin/tickets" noIndex />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Demandes clients"
          description={
            openCount === 0
              ? 'Aucune demande en attente.'
              : `${openCount} demande${openCount > 1 ? 's' : ''} à traiter.`
          }
          action={
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(event) => setShowClosed(event.target.checked)}
                className="size-4 rounded border-input accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              Afficher les demandes closes
            </label>
          }
        />

        {isPending && <LoadingState label="Chargement de la file…" />}

        {isError && (
          <ErrorState
            title="La file n’a pas pu être chargée"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && tickets.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={showClosed ? 'Aucune demande' : 'Aucune demande en attente'}
            description={
              showClosed
                ? 'Les demandes ouvertes par vos clients apparaîtront ici.'
                : 'Tout est traité. Cochez la case pour consulter les demandes closes.'
            }
          />
        )}

        {tickets.length > 0 && (
          <DataTable caption="Demandes des clients">
            <DataTableHead>
              <DataTableHeader>Demande</DataTableHeader>
              <DataTableHeader>Client</DataTableHeader>
              <DataTableHeader>Priorité</DataTableHeader>
              <DataTableHeader>Statut</DataTableHeader>
              <DataTableHeader>Dernière activité</DataTableHeader>
            </DataTableHead>

            <DataTableBody>
              {tickets.map((ticket) => (
                <DataTableRow
                  key={ticket.id}
                  className={cn(
                    // Une demande sans première réponse se repère d'un coup
                    // d'oeil : c'est l'indicateur de qualité de service le plus
                    // parlant.
                    ticket.first_response_at === null &&
                      isOpenTicket(ticket.status) &&
                      'max-md:border-primary',
                  )}
                >
                  <DataTableCell label="Demande">
                    <Link
                      to={`/admin/tickets/${ticket.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    <span className="block text-xs text-muted">
                      {ticket.reference} · {TICKET_TYPE_LABELS[ticket.type]} ·{' '}
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </span>
                    {ticket.first_response_at === null && isOpenTicket(ticket.status) && (
                      <span className="mt-1 inline-block">
                        <StatusBadge tone="warning" label="Sans réponse" withDot={false} />
                      </span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Client">
                    {ticket.organization?.name ?? (
                      <span className="text-muted">Non rattachée</span>
                    )}
                  </DataTableCell>

                  <DataTableCell label="Priorité">
                    <StatusBadge
                      tone={TICKET_PRIORITY_TONES[ticket.priority]}
                      label={TICKET_PRIORITY_LABELS[ticket.priority]}
                      withDot={false}
                    />
                  </DataTableCell>

                  <DataTableCell label="Statut">
                    <StatusBadge
                      tone={TICKET_STATUS_TONES[ticket.status]}
                      label={TICKET_STATUS_LABELS[ticket.status]}
                    />
                  </DataTableCell>

                  <DataTableCell label="Dernière activité">
                    {formatDateTime(ticket.last_activity_at)}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Container>
    </>
  );
}
