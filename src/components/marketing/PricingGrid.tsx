import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn, formatAmountCompact } from '@/lib/utils';
import {
  isPurchasable,
  monthlyPrice,
  setupPrice,
  type PublicPlan,
} from '@/services/plans.service';
import { usePublicPlans } from '@/features/pricing/usePublicPlans';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

const CTA_LABELS = [
  'Lancer la discussion',
  'Découvrir nos offres',
  'Demander un devis',
];

interface PlanCardProps {
  plan: PublicPlan;
  index: number;
}

function PlanCard({ plan, index }: PlanCardProps) {
  const monthly = monthlyPrice(plan);
  const setup = setupPrice(plan);
  const purchasable = isPurchasable(plan);
  const ctaLabel = CTA_LABELS[index % CTA_LABELS.length];

  return (
    <div className={cn(
      'relative flex flex-col justify-between bg-white p-7 transition-all duration-300 sm:p-9',
      plan.is_featured && 'bg-ink text-white md:-my-3 md:rounded-2xl md:shadow-2xl',
    )}>
      <div>
        {/* ── Header: Title ── */}
        <div className="flex items-center justify-between gap-3 min-h-[36px]">
          <h3 className={cn('font-serif text-3xl font-normal sm:text-4xl', plan.is_featured ? 'text-white' : 'text-ink')}>
            {plan.name}
          </h3>
        </div>

        {/* ── Subtitle / Tagline ── */}
        <p className={cn('mt-2.5 min-h-[44px] text-sm leading-relaxed', plan.is_featured ? 'text-white/65' : 'text-stone-600')}>
          {plan.tagline || plan.description}
        </p>

        {/* ── Price Section ── */}
        <div className="mt-8 mb-6">
          {setup ? (
            <div>
              <p className={cn('font-sans text-xs font-medium', plan.is_featured ? 'text-brand-200' : 'text-stone-500')}>
                {setup.is_starting_price ? 'à partir de' : 'Tarif'}
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn('font-serif text-4xl font-normal tracking-tight sm:text-5xl', plan.is_featured ? 'text-white' : 'text-ink')}>
                  {formatAmountCompact(setup.unit_amount_cents, setup.currency)}
                </span>
              </div>
              {monthly && (
                <p className={cn('mt-2 text-xs font-medium', plan.is_featured ? 'text-white/60' : 'text-stone-500')}>
                  + <span>{formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}</span> / mois (hébergement &amp; maintenance)
                </p>
              )}
            </div>
          ) : plan.requires_quote ? (
            <div>
              <p className="text-xs font-sans text-stone-500 font-medium">
                Tarif
              </p>
              <p className="mt-1 font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">
                Sur devis
              </p>
            </div>
          ) : monthly ? (
            <div>
              <p className="text-xs font-sans text-stone-500 font-medium">
                Abonnement
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">
                  {formatAmountCompact(monthly.unit_amount_cents, monthly.currency)}
                </span>
                <span className="text-xs font-bold text-stone-500 tracking-wider">
                  / mois
                </span>
              </div>
            </div>
          ) : (
            <p className="font-serif text-3xl font-normal text-ink">Sur devis</p>
          )}
        </div>

        {/* ── CTA Button (Black Pill with Arrow Circle) ── */}
        <div className="mt-2">
          <Link
            to={
              purchasable
                ? `/dashboard/facturation?offre=${plan.code}`
                : `/devis?offre=${plan.code}`
            }
            className={cn('group flex w-full cursor-pointer items-center justify-between rounded-full px-6 py-3.5 text-sm font-semibold shadow-md transition-colors', plan.is_featured ? 'bg-brand-300 text-ink hover:bg-brand-200' : 'bg-ink text-white hover:bg-ink/85')}
          >
            <span>{ctaLabel}</span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-black text-xs font-bold shadow-xs transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>

        {/* ── Separator Line ── */}
        <div className={cn('my-8 border-t', plan.is_featured ? 'border-white/15' : 'border-stone-200/80')} />

        {/* ── Features List ── */}
        <div>
          <h4 className={cn('mb-4 text-sm font-bold', plan.is_featured ? 'text-white' : 'text-ink')}>Inclus</h4>
          <ul className="space-y-3 text-sm">
            {plan.plan_features.map((feature) => (
              <li key={feature.id} className="flex items-start gap-2.5">
                <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                <span
                  className={cn(
                    'leading-tight',
                    feature.is_included
                      ? plan.is_featured ? 'text-white/75' : 'text-stone-800'
                      : plan.is_featured ? 'text-white/30 line-through' : 'text-stone-400 line-through',
                  )}
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
    <div
      className={cn(
        'relative grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-3 md:grid-cols-3 md:gap-0 md:divide-x md:divide-y-0 md:p-0',
        className,
      )}
    >
      {plans.map((plan, index) => (
        <PlanCard key={plan.id} plan={plan} index={index} />
      ))}
    </div>
  );
}
