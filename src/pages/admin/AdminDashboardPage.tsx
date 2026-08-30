import { Link } from 'react-router-dom';
import { Building2, Globe, Inbox, MonitorSmartphone } from 'lucide-react';
import { useAdminMetrics } from '@/features/admin/useAdmin';
import { formatAmountCompact } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { AdminPageHeader } from '@/layouts/AdminLayout';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { Container } from '@/components/ui/Layout';
import { ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Vue globale (§27).
 *
 * Tous les compteurs viennent de la base. Là où un nombre vaut zéro parce
 * qu'un système n'est pas branché, la page le dit : un « 0 € » de revenu
 * mensuel sans explication se lit comme un échec commercial, alors qu'il
 * traduit simplement l'absence de Stripe.
 *
 * « Sites en ligne » est libellé « déclarés en ligne ». Ce statut est saisi par
 * HBG Labs, aucune sonde ne le vérifie. Le présenter comme un constat serait le
 * faux voyant que §17 proscrit.
 */

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Building2;
  to?: string;
}) {
  const content = (
    <CardContent className="pt-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </CardContent>
  );

  if (to) {
    return (
      <Card className="transition-colors hover:border-primary">
        <Link
          to={to}
          className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {content}
        </Link>
      </Card>
    );
  }

  return <Card>{content}</Card>;
}

export function AdminDashboardPage() {
  const { data, isPending, isError, error, refetch } = useAdminMetrics();

  return (
    <>
      <Seo
        title="Administration"
        description="Vue globale de la plateforme HBG Labs."
        path="/admin"
        noIndex
      />

      <Container className="py-8 sm:py-10">
        <AdminPageHeader
          title="Vue globale"
          description="L’état réel de la plateforme, tel qu’il figure en base."
        />

        {isPending && <LoadingState label="Chargement des indicateurs…" />}

        {isError && (
          <ErrorState
            title="Les indicateurs n’ont pas pu être chargés"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Clients"
                value={String(data.organizations)}
                icon={Building2}
                to="/admin/clients"
              />
              <MetricCard
                label="Sites"
                value={String(data.websites)}
                icon={MonitorSmartphone}
                to="/admin/sites"
              />
              <MetricCard
                label="Sites déclarés en ligne"
                value={String(data.websitesDeclaredOnline)}
                hint="Statut saisi par HBG Labs. Aucune sonde ne le vérifie à ce jour."
                icon={MonitorSmartphone}
              />
              <MetricCard
                label="Demandes en attente"
                value={String(data.newLeads)}
                hint="Demandes de devis au statut Nouveau."
                icon={Inbox}
                to="/admin/demandes"
              />
              <MetricCard
                label="Tickets ouverts"
                value={String(data.openTickets)}
                hint="Le suivi des tickets arrive au prochain lot."
                icon={Inbox}
              />
              <MetricCard
                label="Abonnements actifs"
                value={String(data.activeSubscriptions)}
                hint="Alimenté par Stripe, non connecté à ce jour."
                icon={Globe}
              />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted">Revenu mensuel récurrent</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {formatAmountCompact(data.mrrCents)}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    Somme calculée par la base sur les abonnements actifs et en retard
                    de paiement.
                  </p>
                </CardContent>
              </Card>

              {data.activeSubscriptions === 0 && (
                <Alert tone="info" title="Aucun abonnement enregistré">
                  <p>
                    Le revenu affiché vaut zéro parce que Stripe n’est pas encore
                    connecté, pas parce qu’aucun client ne paie. Les tables
                    d’abonnements et de factures sont en lecture seule et ne se
                    remplissent que par le webhook Stripe, prévu au prochain lot.
                  </p>
                </Alert>
              )}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
