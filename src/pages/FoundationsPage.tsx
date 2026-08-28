import { CheckCircle2, Database, Circle } from 'lucide-react';
import { usePublicPlans } from '@/features/pricing/usePublicPlans';
import { monthlyPrice, setupPrice, isPurchasable } from '@/services/plans.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { formatAmountCompact } from '@/lib/utils';

/**
 * Page d'accueil provisoire — lot 1.
 *
 * La landing page de §6 (hero, problème, solution, services, offres,
 * témoignages, FAQ…) appartient au lot 2. Poser ici une maquette de landing
 * avec des témoignages inventés et des chiffres décoratifs contreviendrait à
 * §57 : « Ne pas déclarer une fonctionnalité terminée si elle est uniquement
 * visuelle. »
 *
 * Cette page fait autre chose, et de réel : elle lit la grille tarifaire
 * DEPUIS LA BASE, sans authentification, et vérifie ainsi la chaîne complète
 * du lot — policy RLS `anon` → PostgREST → TanStack Query → composant. Les
 * montants affichés sont ceux du seed ; aucun n'est écrit dans ce fichier.
 *
 * Si la base n'est pas jointe, l'erreur réelle s'affiche. Aucun repli, aucune
 * donnée de démonstration.
 */
export function FoundationsPage() {
  const { data: plans, isPending, isError, error, refetch } = usePublicPlans();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <header className="mb-12">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          HBG Labs — Client Platform
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fondations, base de données et RLS
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Lot&nbsp;1 livré. Le schéma multi-tenant, les politiques d’isolation et les
          gardes anti-escalade sont en place. La landing page, l’authentification et les
          espaces client et administrateur arrivent au lot&nbsp;2.
        </p>
      </header>

      {/* ---- Vérification de bout en bout ---------------------------------- */}
      <section className="mb-12" aria-labelledby="titre-catalogue">
        <div className="mb-4 flex items-center gap-2">
          <Database className="size-4 text-muted" aria-hidden="true" />
          <h2 id="titre-catalogue" className="text-sm font-medium">
            Catalogue lu depuis Supabase
          </h2>
        </div>

        {isPending && <LoadingState label="Lecture du catalogue…" />}

        {isError && (
          <ErrorState
            title="Le catalogue n’a pas pu être chargé"
            error={error}
            onRetry={() => void refetch()}
          />
        )}

        {!isPending && !isError && (plans ?? []).length === 0 && (
          <EmptyState
            title="Aucune offre en base"
            description="Le schéma est appliqué mais le catalogue est vide. Exécutez le seed : npm run db:seed"
          />
        )}

        {!isPending && !isError && (plans ?? []).length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plans ?? []).map((plan) => {
              const monthly = monthlyPrice(plan);
              const setup = setupPrice(plan);

              return (
                <Card key={plan.id} className={plan.is_featured ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle as="h3">{plan.name}</CardTitle>
                      {plan.is_featured && <StatusBadge tone="info" label="Recommandé" />}
                    </div>
                    {plan.tagline && (
                      <p className="text-sm text-muted">{plan.tagline}</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      {monthly ? (
                        <p className="text-2xl font-semibold">
                          {formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}
                          <span className="text-sm font-normal text-muted"> /mois</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted">Tarif sur devis</p>
                      )}

                      {/* La mention « à partir de » vient de la base, pas d'une
                          règle codée ici : c'est plan_prices.is_starting_price. */}
                      {setup && (
                        <p className="mt-1 text-sm text-muted">
                          Création&nbsp;
                          {setup.is_starting_price && 'à partir de '}
                          {formatAmountCompact(setup.unit_amount_cents, setup.currency)}
                        </p>
                      )}

                      {plan.requires_quote && (
                        <p className="mt-1 text-sm text-muted">Création sur mesure</p>
                      )}
                    </div>

                    <ul className="space-y-1.5">
                      {plan.plan_features.slice(0, 4).map((feature) => (
                        <li
                          key={feature.id}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          {feature.is_included ? (
                            <CheckCircle2
                              className="mt-0.5 size-3.5 shrink-0 text-success"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="mt-0.5 size-3.5 shrink-0 text-unknown"
                              aria-hidden="true"
                            />
                          )}
                          <span className={feature.is_included ? '' : 'line-through'}>
                            {feature.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* État réel de la disponibilité au paiement. Tant que le
                        catalogue Stripe n'existe pas, on le DIT — plutôt que
                        d'afficher un bouton qui échouerait (§57). */}
                    <p className="border-t border-border pt-3 text-xs text-muted">
                      {isPurchasable(plan)
                        ? 'Souscription en ligne disponible'
                        : plan.requires_quote
                          ? 'Sur devis — souscription en ligne non applicable'
                          : 'Souscription en ligne indisponible : catalogue Stripe non configuré'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- Suite du programme -------------------------------------------- */}
      <section aria-labelledby="titre-suite">
        <h2 id="titre-suite" className="mb-4 text-sm font-medium">
          Prochaines étapes
        </h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm text-muted">
              <li>Lot 2 — Landing page et pages publiques (§5, §6)</li>
              <li>Lot 3 — Authentification Supabase et protection des routes (§9)</li>
              <li>Lot 4 — Espaces client et administrateur (§14, §27)</li>
              <li>Lot 5 — Stripe : Checkout, webhooks, abonnements, facturation (§19-23)</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
