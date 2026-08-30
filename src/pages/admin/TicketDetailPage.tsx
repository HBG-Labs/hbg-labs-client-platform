import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTicket, useTriageTicket } from '@/features/tickets/useTickets';
import { TICKET_STATUS_TONES, TICKET_TYPE_LABELS } from '@/features/tickets/ticket-display';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/schemas/ticket.schema';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from '@/types/domain';
import { formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { TicketConversation } from '@/components/tickets/TicketConversation';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Traitement d'une demande, côté HBG Labs (§31).
 *
 * Priorité, statut et notes internes sont accessibles ici et refusés au client
 * par le trigger `guard_ticket_client_update`. Un membre SUPPORT y accède, un
 * client non : la base tranche, l'interface se contente de refléter.
 *
 * Les dates de résolution et de clôture ne sont jamais transmises : le trigger
 * `sync_ticket_milestones` les pose à partir du statut. Les envoyer depuis
 * l'interface produirait des demandes résolues sans date, et fausserait toute
 * mesure de délai.
 */
export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ?? '';

  const ticket = useTicket(ticketId);
  const triage = useTriageTicket(ticketId);

  return (
    <>
      <Seo
        title={ticket.data?.subject ?? 'Demande'}
        description="Traitement d’une demande client."
        path={`/admin/tickets/${ticketId}`}
        noIndex
      />

      <Container className="py-8 sm:py-10">
        <Link
          to="/admin/tickets"
          className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          File de traitement
        </Link>

        {ticket.isPending && <LoadingState label="Chargement de la demande…" />}

        {ticket.isError && (
          <ErrorState
            title="Cette demande n’a pas pu être chargée"
            error={ticket.error}
            onRetry={() => void ticket.refetch()}
          />
        )}

        {!ticket.isPending && !ticket.isError && !ticket.data && (
          <EmptyState
            title="Demande introuvable"
            description="Cette demande n’existe pas, ou elle ne vous est pas accessible."
          />
        )}

        {ticket.data && (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <div>
              <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {ticket.data.subject}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {ticket.data.reference} · {TICKET_TYPE_LABELS[ticket.data.type]} ·{' '}
                  {TICKET_CATEGORY_LABELS[ticket.data.category]}
                </p>
                {ticket.data.organization && (
                  <p className="mt-1 text-sm">
                    <Link
                      to={`/admin/clients/${ticket.data.organization.id}`}
                      className="text-primary hover:underline"
                    >
                      {ticket.data.organization.name}
                    </Link>
                  </p>
                )}
              </header>

              <Card>
                <CardContent className="pt-6">
                  <TicketConversation
                    ticketId={ticketId}
                    organizationId={ticket.data.organization_id}
                    description={ticket.data.description}
                    authorName="Le client"
                    createdAt={ticket.data.created_at}
                    allowInternalNotes
                  />
                </CardContent>
              </Card>
            </div>

            {/* ---- Traitement ---- */}
            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Traitement</CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  {triage.isError && (
                    <Alert tone="danger" title="Modification impossible">
                      <p>{triage.error.message}</p>
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="ticket-status" className="block text-sm font-medium">
                      Statut
                    </label>
                    <select
                      id="ticket-status"
                      value={ticket.data.status}
                      onChange={(event) =>
                        triage.mutate({ status: event.target.value as TicketStatus })
                      }
                      className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {TICKET_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TICKET_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted">
                      Les dates de résolution et de clôture sont posées par la base.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ticket-priority" className="block text-sm font-medium">
                      Priorité
                    </label>
                    <select
                      id="ticket-priority"
                      value={ticket.data.priority}
                      onChange={(event) =>
                        triage.mutate({ priority: event.target.value as TicketPriority })
                      }
                      className="h-11 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {TICKET_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {TICKET_PRIORITY_LABELS[priority]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted">
                      Le client ne peut pas la modifier.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle as="h2">Suivi</CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">
                  <p className="flex justify-between gap-3">
                    <span className="text-muted">Statut</span>
                    <StatusBadge
                      tone={TICKET_STATUS_TONES[ticket.data.status]}
                      label={TICKET_STATUS_LABELS[ticket.data.status]}
                    />
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-muted">Ouverte le</span>
                    <span>{formatDateTime(ticket.data.created_at)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-muted">Première réponse</span>
                    <span>
                      {ticket.data.first_response_at ? (
                        formatDateTime(ticket.data.first_response_at)
                      ) : (
                        <span className="text-warning">Pas encore</span>
                      )}
                    </span>
                  </p>
                  {ticket.data.resolved_at && (
                    <p className="flex justify-between gap-3">
                      <span className="text-muted">Résolue le</span>
                      <span>{formatDateTime(ticket.data.resolved_at)}</span>
                    </p>
                  )}
                  {ticket.data.closed_at && (
                    <p className="flex justify-between gap-3">
                      <span className="text-muted">Close le</span>
                      <span>{formatDateTime(ticket.data.closed_at)}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
