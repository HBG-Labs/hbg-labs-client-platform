import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useSetTicketStatus,
  useTicket,
} from '@/features/tickets/useTickets';
import { TICKET_STATUS_TONES, TICKET_TYPE_LABELS } from '@/features/tickets/ticket-display';
import { useProfile } from '@/features/auth/useProfile';
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/types/domain';
import { formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { TicketConversation } from '@/components/tickets/TicketConversation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Détail d'une demande, côté client.
 *
 * Deux actions seulement : clore, ou rouvrir. Le trigger
 * `guard_ticket_client_update` refuse toute autre transition, et refuse aussi
 * de toucher à la priorité, à l'affectation ou au contenu de la demande.
 * L'interface ne propose donc que ce qui aboutira.
 *
 * Les notes internes de HBG Labs n'apparaissent pas ici, et ne peuvent pas y
 * apparaître : la policy les écarte côté base.
 */
export function DemandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ?? '';

  const ticket = useTicket(ticketId);
  const profile = useProfile();
  const setStatus = useSetTicketStatus(ticketId);

  const isClosed = ticket.data?.status === 'CLOSED';
  const isResolved = ticket.data?.status === 'RESOLVED';

  return (
    <>
      <Seo
        title={ticket.data?.subject ?? 'Demande'}
        description="Détail de votre demande."
        path={`/dashboard/demandes/${ticketId}`}
        noIndex
      />

      <Container width="narrow" className="py-10 sm:py-14">
        <Link
          to="/dashboard/demandes"
          className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Toutes mes demandes
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
          <>
            <header className="mb-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {ticket.data.subject}
                  </h1>
                  <p className="mt-2 text-sm text-muted">
                    {ticket.data.reference} · {TICKET_TYPE_LABELS[ticket.data.type]} ·{' '}
                    {TICKET_CATEGORY_LABELS[ticket.data.category]}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Ouverte le {formatDateTime(ticket.data.created_at)}
                  </p>
                </div>

                <StatusBadge
                  tone={TICKET_STATUS_TONES[ticket.data.status]}
                  label={TICKET_STATUS_LABELS[ticket.data.status]}
                />
              </div>

              {ticket.data.status === 'WAITING_CLIENT' && (
                <Alert tone="warning" title="Nous attendons votre réponse" className="mt-6">
                  <p>
                    Répondez ci-dessous pour que nous puissions poursuivre le traitement.
                  </p>
                </Alert>
              )}
            </header>

            <Card>
              <CardContent className="pt-6">
                <TicketConversation
                  ticketId={ticketId}
                  description={ticket.data.description}
                  authorName={profile.data?.full_name || 'Vous'}
                  createdAt={ticket.data.created_at}
                  readOnly={isClosed}
                />
              </CardContent>
            </Card>

            {setStatus.isError && (
              <Alert tone="warning" title="Action impossible" className="mt-6">
                <p>{setStatus.error.message}</p>
              </Alert>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {isClosed ? (
                <Button
                  variant="outline"
                  onClick={() => setStatus.mutate('OPEN')}
                  isLoading={setStatus.isPending}
                  loadingLabel="Réouverture en cours"
                >
                  Rouvrir la demande
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStatus.mutate('CLOSED')}
                  isLoading={setStatus.isPending}
                  loadingLabel="Clôture en cours"
                >
                  {isResolved ? 'Clore la demande' : 'Clore, je n’ai plus besoin d’aide'}
                </Button>
              )}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
