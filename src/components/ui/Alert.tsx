import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Message contextuel : confirmation, avertissement, échec.
 *
 * Le ton `danger` porte `role="alert"`, qui interrompt la lecture en cours
 * d'un lecteur d'écran. Les autres tons utilisent `role="status"`, qui attend
 * une pause. Appliquer `alert` partout rendrait la navigation vocale pénible ;
 * ne l'appliquer nulle part ferait passer un échec de soumission inaperçu.
 */

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<AlertTone, { container: string; icon: typeof Info }> = {
  info: {
    container: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-100',
    icon: Info,
  },
  success: {
    container: 'border-success/30 bg-success-surface text-foreground',
    icon: CheckCircle2,
  },
  warning: {
    container: 'border-warning/30 bg-warning-surface text-foreground',
    icon: AlertTriangle,
  },
  danger: {
    container: 'border-danger/30 bg-danger-surface text-foreground',
    icon: XCircle,
  },
};

const iconColors: Record<AlertTone, string> = {
  info: 'text-brand-600 dark:text-brand-400',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { container, icon: Icon } = tones[tone];

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4', container, className)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconColors[tone])} aria-hidden="true" />

      <div className="min-w-0 space-y-1 text-sm">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
