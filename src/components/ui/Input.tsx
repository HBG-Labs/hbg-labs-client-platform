import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useFieldControl } from './field-context';

const controlClasses = [
  'w-full rounded-xl border border-input bg-surface px-4 text-sm font-sans',
  'text-foreground placeholder:text-muted/60',
  'transition-all duration-200',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:border-accent',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-danger',
];

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  return (
    <input
      ref={ref}
      // 44 px de haut : cible tactile minimale.
      className={cn(controlClasses, 'h-11', className)}
      {...fieldProps}
      {...props}
    />
  );
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 5, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses, 'resize-y py-2.5 leading-relaxed', className)}
      {...fieldProps}
      {...props}
    />
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Liste déroulante native.
 *
 * Le `<select>` du navigateur est retenu plutôt qu'une liste personnalisée :
 * sur mobile il ouvre le sélecteur du système, qui reste plus rapide et plus
 * familier que tout composant réimplémenté. Une liste personnalisée se
 * justifiera le jour où il faudra des icônes ou une recherche dans les
 * options.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  return (
    <select
      ref={ref}
      className={cn(controlClasses, 'h-11 pr-8', className)}
      {...fieldProps}
      {...props}
    >
      {children}
    </select>
  );
});
