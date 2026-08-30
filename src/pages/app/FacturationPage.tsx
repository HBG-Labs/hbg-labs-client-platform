import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, FileText, Receipt } from 'lucide-react';
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from '@/types/domain';
import { formatAmount, formatDate } from '@/lib/utils';
import {
  useBillingPortal,
  useMyInvoices,
  useMyPayments,
  useMySubscriptions,
  useStartCheckout,
} from '@/features/billing/useBilling';
import { usePublicPlans } from '@/features/pricing/usePublicPlans';
import { isPurchasable, monthlyPrice } from '@/services/plans.service';
import {
  INVOICE_STATUS_TONES,
  PAYMENT_STATUS_TONES,
  SUBSCRIPTION_STATUS_TONES,
  intervalLabel,
  isLiveSubscription,
  renewalNotice,
} from '@/features/billing/billing-display';
import { useMyOrganizations } from '@/features/auth/useProfile';
import type { ClientInvoice, ClientSubscription } from '@/services/billing.service';
import { Seo } from '@/components/Seo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
 * Abonnement et facturation (§18, §23).
 *
 *
 * CET ÉCRAN N'AFFIRME RIEN QUE STRIPE N'AIT ÉTABLI
 *
 * Le statut affiché est celui du miroir local, alimenté par le webhook. Au
 * retour du Checkout, l'abonnement n'existe pas encore : Stripe notifie de
 * façon asynchrone, et quelques secondes s'écoulent. L'écran annonce donc
 * « confirmation en cours », interroge la base à intervalle régulier, et
 * n'affiche l'abonnement qu'une fois qu'il est là (contrat §3.3).
 *
 * Prétendre le succès dès le retour serait faux dans un cas au moins : un
 * paiement peut être refusé après la redirection.
 *
 *
 * FACTURES ET PAIEMENTS SONT RÉSERVÉS AU DIRIGEANT
 *
 * `invoices_select_org_owner` n'expose ces lignes qu'au OWNER de
 * l'organisation. Un MANAGER ou un MEMBER reçoit une liste vide — ce qui, sans
 * explication, ressemblerait à une absence de factures. Le bandeau le dit.
 */

/** Durée au-delà de laquelle l'attente d'un webhook cesse d'être normale. */
const CONFIRMATION_TIMEOUT_MS = 90_000;
const CONFIRMATION_POLL_MS = 4_000;

/**
 * Souscription à une offre du catalogue.
 *
 * N'apparaît que pour le dirigeant, et seulement en l'absence d'abonnement en
 * cours : proposer une seconde souscription produirait deux prélèvements
 * mensuels. La fonction Edge refuse de toute façon — cet écran ne fait
 * qu'éviter au client de découvrir le refus après avoir cliqué.
 *
 * `isPurchasable` écarte les offres sur devis et celles dont le prix n'existe
 * pas encore chez Stripe. Quand aucune offre ne passe ce filtre, aucun bouton
 * n'est affiché : un « Souscrire » qui mène à une erreur Stripe ne vaut pas
 * mieux qu'un bouton absent (§57).
 */
function OffersSection({
  organizationId,
  preselectedCode,
}: {
  organizationId: string;
  preselectedCode: string | null;
}) {
  const plans = usePublicPlans();
  const checkout = useStartCheckout();

  const purchasable = (plans.data ?? []).filter(isPurchasable);

  if (plans.isPending) return <LoadingState label="Chargement des offres…" />;

  if (purchasable.length === 0) {
    return (
      <Alert tone="info" title="Souscription en ligne indisponible">
        <p>
          Aucune de nos offres n’est souscriptible directement pour le moment. Écrivez-
          nous depuis la page <Link to="/devis" className="text-primary hover:underline">
            devis
          </Link>{' '}
          et nous établissons une proposition adaptée à votre projet.
        </p>
      </Alert>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {purchasable.map((plan) => {
          const price = monthlyPrice(plan);
          if (!price) return null;

          const highlighted = preselectedCode === plan.code;

          return (
            <Card
              key={plan.id}
              className={highlighted ? 'border-primary shadow-md' : undefined}
            >
              <CardHeader>
                <CardTitle as="h3">{plan.name}</CardTitle>
                {plan.tagline && (
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatAmount(price.unit_amount_cents, price.currency)}{' '}
                  <span className="text-base font-normal text-muted">
                    {intervalLabel(price.recurring_interval)}
                  </span>
                </p>

                <Button
                  type="button"
                  fullWidth
                  className="mt-4"
                  isLoading={checkout.isPending}
                  loadingLabel="Ouverture du paiement…"
                  onClick={() =>
                    checkout.mutate({ organizationId, planPriceId: price.id })
                  }
                >
                  Souscrire
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {checkout.isError && (
        <Alert tone="danger" title="La souscription n’a pas pu démarrer" className="mt-4">
          <p>{checkout.error.message}</p>
        </Alert>
      )}
    </>
  );
}

function SubscriptionCard({
  subscription,
  onManage,
  isOpeningPortal,
}: {
  subscription: ClientSubscription;
  onManage: (() => void) | null;
  isOpeningPortal: boolean;
}) {
  const notice = renewalNotice(subscription);
  const interval = intervalLabel(subscription.recurring_interval);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle as="h2">
              {subscription.plan?.name ?? 'Abonnement'}
            </CardTitle>
            {subscription.organization && (
              <p className="mt-1 text-sm text-muted">{subscription.organization.name}</p>
            )}
          </div>

          <StatusBadge
            tone={SUBSCRIPTION_STATUS_TONES[subscription.status]}
            label={SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          />
        </div>
      </CardHeader>

      <CardContent>
        <dl className="space-y-0">
          <DetailRow label="Montant">
            {subscription.unit_amount_cents !== null ? (
              <>
                {formatAmount(
                  subscription.unit_amount_cents * subscription.quantity,
                  subscription.currency,
                )}{' '}
                {interval}
              </>
            ) : (
              // Un abonnement sans montant existe : essai gratuit, ou tarif
              // négocié porté par Stripe sans prix unitaire. Afficher « 0,00 € »
              // serait faux.
              <span className="text-muted">Montant non communiqué par Stripe</span>
            )}
          </DetailRow>

          {subscription.status === 'trialing' && subscription.trial_end && (
            <DetailRow label="Fin de la période d’essai">
              {formatDate(subscription.trial_end)}
            </DetailRow>
          )}

          {notice.kind === 'renewal' && (
            <DetailRow label="Prochaine échéance">{formatDate(notice.date)}</DetailRow>
          )}

          {notice.kind === 'ends' && (
            <DetailRow label="Prend fin le">{formatDate(notice.date)}</DetailRow>
          )}

          {notice.kind === 'ended' && (
            <DetailRow label="Terminé le">{formatDate(notice.date)}</DetailRow>
          )}

          <DetailRow label="Souscrit le">{formatDate(subscription.started_at)}</DetailRow>
        </dl>

        {subscription.status === 'past_due' && (
          <Alert tone="warning" title="Dernier paiement en échec" className="mt-6">
            <p>
              Votre service reste actif. Mettez à jour votre moyen de paiement pour
              éviter une interruption.
            </p>
          </Alert>
        )}

        {subscription.cancel_at_period_end && (
          <Alert tone="info" title="Résiliation programmée" className="mt-6">
            <p>
              Votre abonnement reste actif jusqu’au {formatDate(notice.date)}, puis ne
              sera pas reconduit.
            </p>
          </Alert>
        )}

        {onManage && (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onManage}
              isLoading={isOpeningPortal}
              loadingLabel="Ouverture du portail…"
            >
              <CreditCard aria-hidden="true" />
              Gérer mon abonnement
            </Button>
            <p className="mt-2 text-xs text-muted">
              Moyen de paiement, coordonnées de facturation et résiliation, sur la page
              sécurisée de Stripe.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Une ligne de facture.
 *
 * Le PDF n'est pas hébergé chez nous : le lien pointe vers le document émis par
 * Stripe, qui reste l'émetteur de référence (migration 08). Le lien hébergé sert
 * de repli quand le PDF n'a pas encore été produit — une facture au brouillon
 * n'en a pas.
 */
function InvoiceRow({ invoice }: { invoice: ClientInvoice }) {
  const documentUrl = invoice.invoice_pdf_url ?? invoice.hosted_invoice_url;

  return (
    <DataTableRow>
      <DataTableCell label="Numéro">
        {invoice.number ?? <span className="text-muted">En préparation</span>}
      </DataTableCell>

      <DataTableCell label="Date">
        {formatDate(invoice.stripe_created_at ?? invoice.created_at)}
      </DataTableCell>

      <DataTableCell label="Statut">
        <StatusBadge
          tone={INVOICE_STATUS_TONES[invoice.status]}
          label={INVOICE_STATUS_LABELS[invoice.status]}
        />
      </DataTableCell>

      <DataTableCell label="Montant" align="right">
        {invoice.total_cents !== null
          ? formatAmount(invoice.total_cents, invoice.currency)
          : '—'}
      </DataTableCell>

      <DataTableCell label="Document" align="right">
        {documentUrl ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            Télécharger
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-muted">Indisponible</span>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export function FacturationPage() {
  const [searchParams] = useSearchParams();
  const returningFromCheckout = searchParams.get('paiement') === 'retour';
  const canceledCheckout = searchParams.get('paiement') === 'annule';

  // L'attente s'arrête d'elle-même : soit l'abonnement apparaît, soit le délai
  // expire et l'écran cesse d'interroger la base pour dire, honnêtement, que
  // la confirmation tarde.
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    if (!returningFromCheckout) return;

    const timer = setTimeout(() => setWaitedTooLong(true), CONFIRMATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [returningFromCheckout]);

  const organizations = useMyOrganizations();
  const ownedOrganization = organizations.data?.find(
    (membership) => membership.role === 'OWNER',
  );

  const subscriptions = useMySubscriptions(
    returningFromCheckout && !waitedTooLong ? CONFIRMATION_POLL_MS : undefined,
  );

  const invoices = useMyInvoices();
  const payments = useMyPayments();
  const portal = useBillingPortal();

  const live = (subscriptions.data ?? []).filter((row) => isLiveSubscription(row.status));
  const displayed = live.length > 0 ? live : (subscriptions.data ?? []);
  const awaitingConfirmation = returningFromCheckout && live.length === 0;

  return (
    <>
      <Seo
        title="Abonnement et facturation"
        description="Votre abonnement, vos factures et vos paiements."
        path="/dashboard/facturation"
        noIndex
      />

      <Container className="py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Abonnement et facturation
          </h1>
          <p className="mt-2 text-muted">
            Votre offre, vos échéances et l’historique de vos règlements.
          </p>
        </header>

        {canceledCheckout && (
          <Alert tone="info" title="Paiement interrompu" className="mb-6">
            <p>
              Vous avez quitté la page de paiement. Rien n’a été prélevé et aucun
              abonnement n’a été créé.
            </p>
          </Alert>
        )}

        {awaitingConfirmation && !waitedTooLong && (
          <Alert tone="info" title="Confirmation en cours" className="mb-6">
            <p>
              Votre paiement a été transmis à Stripe. La confirmation arrive en
              quelques secondes ; cette page se met à jour toute seule.
            </p>
          </Alert>
        )}

        {awaitingConfirmation && waitedTooLong && (
          <Alert tone="warning" title="La confirmation tarde" className="mb-6">
            <p>
              Votre abonnement n’est pas encore visible ici. Si votre banque a validé le
              paiement, écrivez-nous depuis{' '}
              <Link to="/dashboard/demandes" className="text-primary hover:underline">
                vos demandes
              </Link>{' '}
              : nous vérifions auprès de Stripe. Nous n’affichons pas un abonnement que
              nous ne pouvons pas confirmer.
            </p>
          </Alert>
        )}

        {/* ---- Abonnement ---- */}
        <section aria-labelledby="titre-abonnement" className="mb-10">
          <h2 id="titre-abonnement" className="sr-only">
            Abonnement
          </h2>

          {subscriptions.isPending && <LoadingState label="Chargement de votre abonnement…" />}

          {subscriptions.isError && (
            <ErrorState
              title="Votre abonnement n’a pas pu être chargé"
              error={subscriptions.error}
              onRetry={() => void subscriptions.refetch()}
            />
          )}

          {subscriptions.data && displayed.length === 0 && !awaitingConfirmation && (
            <EmptyState
              icon={Receipt}
              title="Aucun abonnement en cours"
              description="Votre entreprise n’a pas encore souscrit d’offre d’hébergement ou de maintenance."
              action={
                <Button asChild variant="outline">
                  <Link to="/tarifs">Voir les offres</Link>
                </Button>
              }
            />
          )}

          <div className="space-y-6">
            {displayed.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onManage={
                  ownedOrganization
                    ? () => portal.mutate(ownedOrganization.organization.id)
                    : null
                }
                isOpeningPortal={portal.isPending}
              />
            ))}
          </div>

          {/* Souscription : proposée uniquement quand rien n'est en cours. */}
          {subscriptions.data && live.length === 0 && ownedOrganization && (
            <div className="mt-6">
              <h3 className="mb-4 text-lg font-semibold">Souscrire à une offre</h3>
              <OffersSection
                organizationId={ownedOrganization.organization.id}
                preselectedCode={searchParams.get('offre')}
              />
            </div>
          )}

          {portal.isError && (
            <Alert tone="danger" title="Le portail n’a pas pu être ouvert" className="mt-4">
              <p>{portal.error.message}</p>
            </Alert>
          )}
        </section>

        {/* ---- Factures ---- */}
        <section aria-labelledby="titre-factures" className="mb-10">
          <h2 id="titre-factures" className="mb-4 text-lg font-semibold">
            Factures
          </h2>

          {!ownedOrganization && organizations.data && (
            <Alert tone="info" title="Réservé au dirigeant" className="mb-4">
              <p>
                Les factures ne sont accessibles qu’au dirigeant de l’entreprise. Cette
                restriction est appliquée par la base de données, pas par cet écran.
              </p>
            </Alert>
          )}

          {invoices.isPending && <LoadingState label="Chargement des factures…" />}

          {invoices.isError && (
            <ErrorState
              title="Vos factures n’ont pas pu être chargées"
              error={invoices.error}
              onRetry={() => void invoices.refetch()}
            />
          )}

          {invoices.data && invoices.data.length === 0 && ownedOrganization && (
            <EmptyState
              icon={FileText}
              title="Aucune facture"
              description="Vos factures apparaîtront ici dès le premier prélèvement."
            />
          )}

          {invoices.data && invoices.data.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
              <DataTable caption="Vos factures">
                <DataTableHead>
                  <DataTableHeader>Numéro</DataTableHeader>
                  <DataTableHeader>Date</DataTableHeader>
                  <DataTableHeader>Statut</DataTableHeader>
                  <DataTableHeader align="right">Montant</DataTableHeader>
                  <DataTableHeader align="right">Document</DataTableHeader>
                </DataTableHead>
                <DataTableBody>
                  {invoices.data.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          )}
        </section>

        {/* ---- Paiements ---- */}
        {payments.data && payments.data.length > 0 && (
          <section aria-labelledby="titre-paiements">
            <h2 id="titre-paiements" className="mb-4 text-lg font-semibold">
              Paiements
            </h2>

            <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
              <DataTable caption="Vos paiements">
                <DataTableHead>
                  <DataTableHeader>Date</DataTableHeader>
                  <DataTableHeader>Moyen de paiement</DataTableHeader>
                  <DataTableHeader>Statut</DataTableHeader>
                  <DataTableHeader align="right">Montant</DataTableHeader>
                </DataTableHead>
                <DataTableBody>
                  {payments.data.map((payment) => (
                    <DataTableRow key={payment.id}>
                      <DataTableCell label="Date">
                        {formatDate(payment.paid_at ?? payment.created_at)}
                      </DataTableCell>
                      <DataTableCell label="Moyen de paiement">
                        {payment.card_brand && payment.card_last4 ? (
                          <span className="capitalize">
                            {payment.card_brand} •••• {payment.card_last4}
                          </span>
                        ) : (
                          <span className="text-muted">Non renseigné</span>
                        )}
                      </DataTableCell>
                      <DataTableCell label="Statut">
                        <StatusBadge
                          tone={PAYMENT_STATUS_TONES[payment.status]}
                          label={PAYMENT_STATUS_LABELS[payment.status]}
                        />
                      </DataTableCell>
                      <DataTableCell label="Montant" align="right">
                        {formatAmount(payment.amount_cents, payment.currency)}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
