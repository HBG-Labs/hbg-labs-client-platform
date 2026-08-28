import { cva, type VariantProps } from 'class-variance-authority';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isVerified, UNVERIFIED_LABEL, type VerificationSource } from '@/types/domain';

/**
 * Voyant d'état.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSANT CHARNIÈRE POUR §17 ET §57
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Ne jamais afficher de fausses informations. Si l'intégration
 *   Vercel/Cloudflare n'est pas encore disponible, afficher clairement
 *   "Vérification non configurée" et non "actif". »
 *
 * `VerifiedStatusBadge` prend la source de vérification en PROPRIÉTÉ
 * OBLIGATOIRE. Tant qu'elle vaut 'NONE', il affiche « Vérification non
 * configurée » en gris, quel que soit le statut transmis. Un développeur ne
 * peut pas produire un voyant vert non vérifié par distraction : il faudrait
 * mentir sur la source, ce qu'aucune donnée en base ne permet — les
 * contraintes CHECK des migrations 05 et 06 imposent des statuts 'UNKNOWN'
 * dès lors que la source est 'NONE'.
 *
 * Pour un état interne, non issu d'une vérification externe (statut d'un
 * ticket, d'un abonnement), utilisez `StatusBadge`, sans cette contrainte.
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        success: 'bg-success-surface text-success',
        warning: 'bg-warning-surface text-warning',
        danger: 'bg-danger-surface text-danger',
        info: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
        neutral: 'bg-surface-muted text-muted',
        /** Réservé à l'information non vérifiée. Jamais coloré. */
        unknown: 'bg-unknown-surface text-unknown',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

interface DotProps {
  tone: BadgeTone;
}

function Dot({ tone }: DotProps) {
  const color: Record<BadgeTone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-brand-500',
    neutral: 'bg-muted',
    unknown: 'bg-unknown',
  };

  return <span className={cn('size-1.5 rounded-full', color[tone])} aria-hidden="true" />;
}

export interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
  /** Masque la pastille pour les statuts qui n'en tirent aucun sens. */
  withDot?: boolean;
}

/** Voyant d'état interne (ticket, abonnement, organisation). */
export function StatusBadge({
  label,
  tone = 'neutral',
  withDot = true,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {withDot && <Dot tone={tone ?? 'neutral'} />}
      {label}
    </span>
  );
}

export interface VerifiedStatusBadgeProps {
  /**
   * Provenance de l'information. OBLIGATOIRE — c'est ce qui empêche
   * d'afficher un état non vérifié comme s'il l'était.
   */
  source: VerificationSource;
  /** Libellé du statut réel, affiché seulement si la source est fiable. */
  label: string;
  tone: BadgeTone;
  /** Date de la dernière vérification, pour l'infobulle. */
  checkedAt?: string | null;
  className?: string;
}

/**
 * Voyant d'état ISSU D'UNE VÉRIFICATION EXTERNE — site, DNS, SSL, domaine.
 *
 * Ne peut pas afficher d'état affirmatif sans source.
 */
export function VerifiedStatusBadge({
  source,
  label,
  tone,
  checkedAt,
  className,
}: VerifiedStatusBadgeProps) {
  if (!isVerified(source)) {
    return (
      <span
        className={cn(badgeVariants({ tone: 'unknown' }), className)}
        title="Aucune intégration ne vérifie encore cet état. L’information affichée serait invérifiable."
      >
        <CircleHelp className="size-3" aria-hidden="true" />
        {UNVERIFIED_LABEL}
      </span>
    );
  }

  const sourceLabel: Record<Exclude<VerificationSource, 'NONE'>, string> = {
    MANUAL: 'Vérifié manuellement par HBG Labs',
    VERCEL_API: 'Vérifié via Vercel',
    CLOUDFLARE_API: 'Vérifié via Cloudflare',
  };

  const checkedLabel = checkedAt
    ? ` le ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(checkedAt))}`
    : '';

  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      title={`${sourceLabel[source]}${checkedLabel}`}
    >
      <Dot tone={tone} />
      {label}
    </span>
  );
}
