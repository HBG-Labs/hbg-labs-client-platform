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
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

/**
 * Grille tarifaire (§7).
 *
 * Le tarif de création est mis en avant en valeur principale en haut de carte,
 * et le tarif mensuel d'hébergement & maintenance (HBG Care) est positionné en bas.
 */
function PlanCard({ plan }: { plan: PublicPlan }) {
  const monthly = monthlyPrice(plan);
  const setup = setupPrice(plan);
  const purchasable = isPurchasable(plan);

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between rounded-2xl border bg-surface p-6 sm:p-8 transition-all duration-200',
        plan.is_featured ? 'border-accent shadow-md ring-1 ring-accent' : 'border-border hover:border-ink/30',
      )}
    >
      {plan.is_featured && (
        <div className="absolute -top-3 left-6">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            Le plus choisi
          </span>
        </div>
      )}

      <div>
        <div>
          <h3 className="font-serif text-2xl font-normal text-ink">{plan.name}</h3>
          {plan.tagline && <p className="mt-1.5 text-sm text-muted">{plan.tagline}</p>}
        </div>

        {/* ── 1. Prix de création (mis en valeur en haut) ── */}
        <div className="mt-6 border-y border-border py-6">
          {setup ? (
            <div>
              <p className="text-xs font-sans uppercase tracking-wider text-muted font-medium">
                {setup.is_starting_price ? 'Création à partir de' : 'Création'}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">
                  {formatAmountCompact(setup.unit_amount_cents, setup.currency)}
                </span>
              </p>
            </div>
          ) : plan.requires_quote ? (
            <div>
              <p className="text-xs font-sans uppercase tracking-wider text-muted font-medium">
                Création
              </p>
              <p className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
                Sur devis
              </p>
            </div>
          ) : monthly ? (
            <div>
              <p className="text-xs font-sans uppercase tracking-wider text-muted font-medium">
                Abonnement
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">
                  {formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}
                </span>
                <span className="text-muted">/ mois</span>
              </p>
            </div>
          ) : (
            <p className="font-serif text-2xl font-normal text-ink">Sur devis</p>
          )}
        </div>

        {plan.description && (
          <p className="mt-6 text-sm leading-relaxed text-muted">{plan.description}</p>
        )}

        <ul className="mt-6 space-y-3">
          {plan.plan_features.map((feature) => (
            <li key={feature.id} className="flex gap-2.5 text-sm">
              {feature.is_included ? (
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <Minus className="mt-0.5 size-4 shrink-0 text-muted/40" aria-hidden="true" />
              )}
              <span
                className={cn(feature.is_included ? 'text-ink' : 'text-muted/60 line-through')}
                title={feature.detail ?? undefined}
              >
                {feature.label}
              </span>
              <span className="sr-only">
                {feature.is_included ? 'inclus' : 'non inclus'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 2. Prix mensuel (positionné en bas au-dessus du bouton) ── */}
      <div className="mt-8 pt-4 border-t border-border/80">
        {monthly ? (
          <p className="mb-4 text-center text-xs text-muted">
            Hébergement &amp; maintenance :{' '}
            <span className="font-semibold text-ink">
              {formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}
            </span>{' '}
            / mois
          </p>
        ) : (
          <p className="mb-4 text-center text-xs text-muted">
            Maintenance &amp; hébergement sur devis
          </p>
        )}

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
