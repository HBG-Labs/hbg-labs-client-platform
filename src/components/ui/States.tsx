import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * États de chargement, de vide et d'erreur (§39).
 *
 * Trois composants, parce que toute vue asynchrone connaît ces trois issues et
 * qu'aucune ne doit être improvisée sur place.
 *
 * `ErrorState` a une responsabilité particulière au regard de §57 : « Ne pas
 * masquer une erreur backend avec des données de démonstration. » Quand une
 * requête échoue, l'écran DIT qu'elle a échoué. Il n'affiche pas un tableau
 * vide, ni des valeurs de repli qui laisseraient croire que tout va bien.
 */

// -----------------------------------------------------------------------------

export interface LoadingStateProps {
  label?: string;
  className?: string;
  /** Occupe toute la hauteur disponible, pour un chargement de page entière. */
  fullPage?: boolean;
}

export function LoadingState({
  label = 'Chargement…',
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      // `status` + `aria-live="polite"` : le chargement est annoncé sans
      // interrompre ce que la personne est en train de lire (§43).
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-muted',
        fullPage && 'min-h-[60vh]',
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center',
        className,
      )}
    >
      <Icon className="size-8 text-muted" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// -----------------------------------------------------------------------------

export interface ErrorStateProps {
  title?: string;
  /** Erreur d'origine. Son message est affiché tel quel : il est utile. */
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Extrait un message lisible d'une erreur Supabase, Postgres ou JavaScript. */
function readErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === 'object') {
    const candidate = error as { message?: unknown; code?: unknown };

    // 42501 = insufficient_privilege : une policy RLS a refusé l'accès. Le
    // message brut de PostgreSQL n'aiderait pas l'utilisateur.
    if (candidate.code === '42501') {
      return 'Vous n’avez pas les droits nécessaires pour accéder à cette information.';
    }

    if (typeof candidate.message === 'string') return candidate.message;
  }

  if (typeof error === 'string') return error;
  return null;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const message = readErrorMessage(error);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger-surface p-8 text-center',
        className,
      )}
    >
      <AlertCircle className="size-8 text-danger" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {/* Le message réel est affiché, jamais remplacé par un texte
            rassurant : une erreur masquée est une erreur qui persiste. */}
        {message && <p className="max-w-md text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Réessayer
        </Button>
      )}
    </div>
  );
}
