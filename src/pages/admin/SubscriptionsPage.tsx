import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { SUBSCRIPTION_STATUS_LABELS } from '@/types/domain';
import { formatAmount, formatAmountCompact, formatDate } from '@/lib/utils';
import { useAllSubscriptions } from '@/features/billing/useBilling';
import {
  SUBSCRIPTION_STATUS_TONES,
  intervalLabel,
  isLiveSubscription,
} from '@/features/billing/billing-display';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Alert } from '@/components/ui/Alert';
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
 * Abonnements de la plateforme (§30).
 *
 *
 * LE MRR N'EST PAS CALCULÉ ICI
 *
 * `subscriptions.mrr_cents` est une colonne générée par PostgreSQL : elle
 * normalise l'annuel au mois et ne compte que les statuts `active` et
 * `past_due`. Cet écran en fait la somme, il ne refait pas le calcul.
 *
 * Refaire la règle en TypeScript produirait deux définitions du revenu — celle
 * de la base et celle de l'interface — qui divergeraient au premier
 * changement, sans que rien ne signale laquelle est juste.
 *
 *
 * AUCUNE ACTION SUR CET ÉCRAN
 *
 * Ni résilier, ni changer d'offre, ni corriger un statut. Les tables
 * financières n'ont aucune policy d'écriture, service_role excepté : un bouton
 * ici ne ferait rien, ou pire, laisserait croire qu'il a fait quelque chose.
 * Les modifications se font dans Stripe, et le webhook les propage.
 */

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SubscriptionsPage() {
  const { data, isPending, isError, error, refetch } = useAllSubscriptions();

  const subscriptions = data ?? [];
  const live = subscriptions.filter((row) => isLiveSubscription(row.status));
  const mrrCents = subscriptions.reduce((total, row) => total + (row.mrr_cents ?? 0), 0);
  const pastDue = subscriptions.filter((row) => row.status === 'past_due').length;

  return (
    <>
      <AdminPageHeader
        title="Abonnements"
        description="Contrats en cours, revenu récurrent et incidents de paiement."
      />

      {isPending && <LoadingState label="Chargement des abonnements…" />}

      {isError && (
        <ErrorState
          title="Les abonnements n’ont pas pu être chargés"
          error={error}
          onRetry={() => void refetch()}
        />
      )}

      {data && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <MetricTile
              label="Abonnements en cours"
              value={String(live.length)}
              hint="Essai, actif ou paiement en retard."
            />
            <MetricTile
              label="Revenu mensuel récurrent"
              value={formatAmountCompact(mrrCents)}
              hint="Colonne générée : actifs et impayés en cours, annuel ramené au mois."
            />
            <MetricTile
              label="Paiements en retard"
              value={String(pastDue)}
              hint={pastDue > 0 ? 'À relancer depuis Stripe.' : 'Aucun incident.'}
            />
          </div>

          {subscriptions.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="Aucun abonnement"
              description="Les abonnements apparaissent ici dès qu’un client souscrit et que Stripe confirme le paiement."
            />
          )}

          {subscriptions.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
              <DataTable caption="Abonnements">
                <DataTableHead>
                  <DataTableHeader>Client</DataTableHeader>
                  <DataTableHeader>Offre</DataTableHeader>
                  <DataTableHeader>Statut</DataTableHeader>
                  <DataTableHeader>Prochaine échéance</DataTableHeader>
                  <DataTableHeader align="right">Montant</DataTableHeader>
                  <DataTableHeader align="right">MRR</DataTableHeader>
                </DataTableHead>
                <DataTableBody>
                  {subscriptions.map((subscription) => (
                    <DataTableRow key={subscription.id}>
                      <DataTableCell label="Client">
                        {subscription.organization ? (
                          <Link
                            to={`/admin/clients/${subscription.organization.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {subscription.organization.name}
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </DataTableCell>

                      <DataTableCell label="Offre">
                        {subscription.plan?.name ?? (
                          // Un abonnement peut porter un prix hors catalogue,
                          // créé à la main dans Stripe. Le dire vaut mieux que
                          // de lui attribuer une offre au hasard.
                          <span className="text-muted">Hors catalogue</span>
                        )}
                      </DataTableCell>

                      <DataTableCell label="Statut">
                        <StatusBadge
                          tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}
                          label={SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                        />
                      </DataTableCell>

                      <DataTableCell label="Prochaine échéance">
                        {subscription.cancel_at_period_end ? (
                          <span className="text-warning">
                            Fin le {formatDate(subscription.current_period_end)}
                          </span>
                        ) : (
                          formatDate(subscription.current_period_end)
                        )}
                      </DataTableCell>

                      <DataTableCell label="Montant" align="right">
                        {subscription.unit_amount_cents !== null ? (
                          <>
                            {formatAmount(
                              subscription.unit_amount_cents * subscription.quantity,
                              subscription.currency,
                            )}{' '}
                            <span className="text-muted">
                              {intervalLabel(subscription.recurring_interval)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </DataTableCell>

                      <DataTableCell label="MRR" align="right">
                        {subscription.mrr_cents > 0 ? (
                          formatAmount(subscription.mrr_cents, subscription.currency)
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}

          <Alert tone="info" title="Toute modification se fait dans Stripe" className="mt-6">
            <p>
              Cet écran ne propose aucune action : les tables d’abonnement, de facture
              et de paiement sont en lecture seule pour tout le monde, y compris pour
              vous. Changer une offre ou résilier se fait dans le tableau de bord
              Stripe ; le webhook met cette page à jour dans la foulée.
            </p>
          </Alert>
        </>
      )}
    </>
  );
}
