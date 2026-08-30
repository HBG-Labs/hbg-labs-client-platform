import { useState } from 'react';
import { Inbox, Mail } from 'lucide-react';
import {
  useContactMessages,
  useQuoteRequests,
  useUpdateContactMessageStatus,
  useUpdateQuoteRequestStatus,
} from '@/features/admin/useAdmin';
import type { LeadStatus } from '@/types/domain';
import { formatDateTime } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

/**
 * Demandes reçues depuis le site public (§4, §5).
 *
 * Ces deux tables se remplissent depuis les formulaires publics, et n'étaient
 * jusqu'ici lisibles qu'en SQL. Cet écran est le premier endroit où HBG Labs
 * voit réellement ce qui arrive.
 *
 * Le suivi se limite au statut. Convertir une demande en client se fait depuis
 * la page Clients : lier automatiquement les deux demanderait de décider quoi
 * recopier, et une organisation créée à moitié depuis un formulaire de contact
 * serait plus gênante qu'utile.
 */

const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CONVERTED',
  'REJECTED',
  'SPAM',
];

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUALIFIED: 'Qualifié',
  CONVERTED: 'Converti',
  REJECTED: 'Écarté',
  SPAM: 'Indésirable',
};

const LEAD_STATUS_TONES: Record<LeadStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  QUALIFIED: 'warning',
  CONVERTED: 'success',
  REJECTED: 'neutral',
  SPAM: 'neutral',
};

function StatusSelect({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  label: string;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={`status-${id}`}>
        {label}
      </label>
      <select
        id={`status-${id}`}
        value={value}
        onChange={(event) => onChange(event.target.value as LeadStatus)}
        className="h-11 rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {LEAD_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </>
  );
}

function QuoteRequests() {
  const { data, isPending, isError, error, refetch } = useQuoteRequests();
  const updateStatus = useUpdateQuoteRequestStatus();

  if (isPending) return <LoadingState label="Chargement des demandes de devis…" />;

  if (isError) {
    return (
      <ErrorState
        title="Les demandes n’ont pas pu être chargées"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune demande de devis"
        description="Les demandes envoyées depuis la page Devis apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((request) => (
        <Card key={request.id} className={cn(request.status === 'NEW' && 'border-primary')}>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {request.full_name}
                  {request.company_name && (
                    <span className="text-muted"> · {request.company_name}</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm">
                  <a
                    href={`mailto:${request.email}`}
                    className="text-primary hover:underline"
                  >
                    {request.email}
                  </a>
                  {request.phone && <span className="text-muted"> · {request.phone}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Reçue le {formatDateTime(request.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge
                  tone={LEAD_STATUS_TONES[request.status]}
                  label={LEAD_STATUS_LABELS[request.status]}
                />
                <StatusSelect
                  id={request.id}
                  value={request.status}
                  label={`Statut de la demande de ${request.full_name}`}
                  onChange={(status) => updateStatus.mutate({ id: request.id, status })}
                />
              </div>
            </div>

            {(request.project_type ?? request.budget_range) && (
              <p className="mt-4 text-sm text-muted">
                {request.project_type}
                {request.project_type && request.budget_range && ' · '}
                {request.budget_range}
              </p>
            )}

            <p className="mt-4 whitespace-pre-line border-t border-border pt-4 text-sm leading-relaxed">
              {request.message}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ContactMessages() {
  const { data, isPending, isError, error, refetch } = useContactMessages();
  const updateStatus = useUpdateContactMessageStatus();

  if (isPending) return <LoadingState label="Chargement des messages…" />;

  if (isError) {
    return (
      <ErrorState
        title="Les messages n’ont pas pu être chargés"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Aucun message de contact"
        description="Les messages envoyés depuis la page Contact apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((message) => (
        <Card key={message.id} className={cn(message.status === 'NEW' && 'border-primary')}>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{message.subject}</p>
                <p className="mt-0.5 text-sm">
                  {message.full_name} ·{' '}
                  <a
                    href={`mailto:${message.email}`}
                    className="text-primary hover:underline"
                  >
                    {message.email}
                  </a>
                  {message.phone && <span className="text-muted"> · {message.phone}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Reçu le {formatDateTime(message.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge
                  tone={LEAD_STATUS_TONES[message.status]}
                  label={LEAD_STATUS_LABELS[message.status]}
                />
                <StatusSelect
                  id={message.id}
                  value={message.status}
                  label={`Statut du message de ${message.full_name}`}
                  onChange={(status) => updateStatus.mutate({ id: message.id, status })}
                />
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line border-t border-border pt-4 text-sm leading-relaxed">
              {message.message}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LeadsPage() {
  const [tab, setTab] = useState<'quotes' | 'messages'>('quotes');

  return (
    <>
      <Seo
        title="Demandes reçues"
        description="Demandes de devis et messages de contact."
        path="/admin/demandes"
        noIndex
      />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Demandes reçues"
          description="Ce que les visiteurs envoient depuis le site public."
        />

        {/* Onglets bâtis sur des boutons plutôt que sur un composant Radix :
            deux panneaux au comportement simple ne justifient pas la surface
            d'un composant supplémentaire. */}
        <div
          role="tablist"
          aria-label="Type de demande"
          className="mb-6 flex gap-1 border-b border-border"
        >
          {(
            [
              ['quotes', 'Demandes de devis'],
              ['messages', 'Messages de contact'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              id={`tab-${value}`}
              onClick={() => setTab(value)}
              className={cn(
                'min-h-11 border-b-2 px-4 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                tab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === 'quotes' ? <QuoteRequests /> : <ContactMessages />}
        </div>
      </Container>
    </>
  );
}
