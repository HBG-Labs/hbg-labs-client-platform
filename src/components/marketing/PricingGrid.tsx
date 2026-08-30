import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { cn, formatAmountCompact } from '@/lib/utils';
import {
  isPurchasable,
  monthlyPrice,
  setupPrice,
  type PublicPlan,
} from '@/services/plans.service';
import { usePublicPlans } from '@/features/pricing/usePublicPlans';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Grille tarifaire (§7).
 *
 * Tous les montants proviennent de `plan_prices`. Aucun chiffre n'est écrit
 * dans ce fichier : une grille figée dans le code continuerait d'annoncer
 * l'ancien tarif après un changement, et le paiement porterait sur un autre
 * montant que celui affiché.
 *
 * `is_starting_price` déclenche la mention « À partir de », imposée par §7 : le
 * tarif de création dépend du périmètre réel du projet.
 */

function PlanCard({ plan }: { plan: PublicPlan }) {
  const monthly = monthlyPrice(plan);
  const setup = setupPrice(plan);
  const purchasable = isPurchasable(plan);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-surface p-6 sm:p-8',
        plan.is_featured ? 'border-primary shadow-lg' : 'border-border',
      )}
    >
      {plan.is_featured && (
        <div className="absolute -top-3 left-6">
          <StatusBadge tone="info" label="Le plus choisi" withDot={false} />
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        {plan.tagline && <p className="mt-1.5 text-sm text-muted">{plan.tagline}</p>}
      </div>

      <div className="mt-6 border-y border-border py-6">
        {monthly ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight">
              {formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}
            </span>
            <span className="text-muted">par mois</span>
          </p>
        ) : (
          <p className="text-2xl font-semibold">Sur devis</p>
        )}

        <p className="mt-2 text-sm text-muted">
          {setup ? (
            <>
              Création {setup.is_starting_price && 'à partir de '}
              <span className="font-medium text-foreground">
                {formatAmountCompact(setup.unit_amount_cents, setup.currency)}
              </span>
            </>
          ) : plan.requires_quote ? (
            'Création sur mesure, tarif établi après étude'
          ) : null}
        </p>
      </div>

      {plan.description && (
        <p className="mt-6 text-sm leading-relaxed text-muted">{plan.description}</p>
      )}

      <ul className="mt-6 flex-1 space-y-3">
        {plan.plan_features.map((feature) => (
          <li key={feature.id} className="flex gap-2.5 text-sm">
            {feature.is_included ? (
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Minus className="mt-0.5 size-4 shrink-0 text-unknown" aria-hidden="true" />
            )}
            <span
              className={cn(feature.is_included ? '' : 'text-muted line-through')}
              title={feature.detail ?? undefined}
            >
              {feature.label}
            </span>
            {/* L'icône seule ne dit rien à un lecteur d'écran : le statut est
                énoncé en toutes lettres, hors du flux visuel. */}
            <span className="sr-only">
              {feature.is_included ? 'inclus' : 'non inclus'}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {/* Le bouton reflète ce qui est réellement possible. Tant que le
            catalogue Stripe n'existe pas, `isPurchasable` renvoie false et
            l'appel à l'action mène au devis. Un bouton « Souscrire » aboutirait
            à une erreur Stripe incompréhensible pour le visiteur.

            Souscriptible, il mène à l'espace client et non directement au
            paiement : le Checkout facture une ENTREPRISE, et il faut donc
            savoir laquelle. La garde `RequireAuth` conduit à la connexion si
            nécessaire, puis l'écran de facturation reprend l'offre choisie. */}
        <Button asChild fullWidth variant={plan.is_featured ? 'primary' : 'outline'}>
          <Link
            to={
              purchasable
                ? `/dashboard/facturation?offre=${plan.code}`
                : `/devis?offre=${plan.code}`
            }
          >
            {purchasable ? 'Choisir cette offre' : 'Demander un devis'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export interface PricingGridProps {
  /** Nombre maximum d'offres affichées, pour un aperçu sur l'accueil. */
  limit?: number;
  className?: string;
}

export function PricingGrid({ limit, className }: PricingGridProps) {
  const { data, isPending, isError, error, refetch } = usePublicPlans();

  if (isPending) {
    return <LoadingState label="Chargement des offres…" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Les offres n’ont pas pu être chargées"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Aucune offre disponible"
        description="Le catalogue est momentanément indisponible. Écrivez-nous pour obtenir une proposition adaptée."
      />
    );
  }

  const plans = limit ? data.slice(0, limit) : data;

  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
