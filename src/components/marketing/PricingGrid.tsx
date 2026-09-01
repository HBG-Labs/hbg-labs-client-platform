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

const COLUMN_GRADIENTS = [
  'bg-white',
  'bg-gradient-to-b from-[#F3E8FF]/80 via-[#FAF5FF]/30 to-white/95',
  'bg-white',
];

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

  const backgroundGradient = COLUMN_GRADIENTS[index % COLUMN_GRADIENTS.length];
  const ctaLabel = CTA_LABELS[index % CTA_LABELS.length];

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-7 sm:p-9 transition-all duration-200',
        backgroundGradient,
      )}
    >
      <div>
        {/* ── Header: Title & Optional Featured Badge ── */}
        <div className="flex items-center justify-between gap-3 min-h-[36px]">
          <h3 className="font-serif text-3xl sm:text-4xl font-normal text-ink">
            {plan.name}
          </h3>
          {plan.is_featured && (
            <span className="rounded-full bg-[#E9D5FF] text-[#6B21A8] text-xs font-semibold px-3 py-1 shadow-2xs whitespace-nowrap">
              Juste le meilleur
            </span>
          )}
        </div>

        {/* ── Subtitle / Tagline ── */}
        <p className="mt-2.5 text-sm text-stone-600 leading-relaxed min-h-[44px]">
          {plan.tagline || plan.description}
        </p>

        {/* ── Price Section ── */}
        <div className="mt-8 mb-6">
          {setup ? (
            <div>
              <p className="text-xs font-sans text-stone-500 font-medium">
                {setup.is_starting_price ? 'à partir de' : 'Tarif'}
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-ink">
                  {formatAmountCompact(setup.unit_amount_cents, setup.currency)}
                </span>
                <span className="text-xs font-bold text-stone-500 tracking-wider">
                  /H.T.
                </span>
              </div>
              {monthly && (
                <p className="mt-2 text-xs text-stone-500 font-medium">
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
            className="w-full rounded-full bg-black text-white px-6 py-3.5 font-semibold text-sm flex items-center justify-between shadow-md hover:bg-stone-900 transition-colors group cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <span className="size-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-xs shrink-0">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </div>

        {/* ── Separator Line ── */}
        <div className="border-t border-stone-200/80 my-8" />

        {/* ── Features List ── */}
        <div>
          <h4 className="text-sm font-bold text-ink mb-4">Inclus</h4>
          <ul className="space-y-3 text-sm">
            {plan.plan_features.map((feature) => (
              <li key={feature.id} className="flex items-start gap-2.5">
                <span className="text-stone-900 font-bold select-none text-base leading-none mt-0.5">•</span>
                <span
                  className={cn(
                    'leading-tight',
                    feature.is_included ? 'text-stone-800' : 'text-stone-400 line-through',
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
        'grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 border border-stone-200/80 rounded-3xl overflow-hidden bg-white/90 shadow-sm relative',
        className,
      )}
    >
      {plans.map((plan, index) => (
        <PlanCard key={plan.id} plan={plan} index={index} />
      ))}
    </div>
  );
}
