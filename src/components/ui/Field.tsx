import { useId } from 'react';
import { cn } from '@/lib/utils';
import { FieldContext } from './field-context';

/**
 * Câblage accessible d'un champ de formulaire.
 *
 * Un champ correct demande quatre liaisons ARIA : `id` sur le contrôle,
 * `htmlFor` sur le label, `aria-describedby` vers l'aide et le message
 * d'erreur, `aria-invalid` quand la validation échoue. Répétées à la main sur
 * chaque champ, ces liaisons finissent par diverger, et l'erreur affichée ne
 * parvient plus aux lecteurs d'écran.
 *
 * `Field` génère les identifiants et les distribue par contexte. Les contrôles
 * (`Input`, `Textarea`, `Select`) les consomment sans qu'aucune page n'ait à
 * s'en occuper.
 *
 * Usage :
 *
 *   <Field label="Adresse électronique" error={errors.email?.message} required>
 *     <Input type="email" {...register('email')} />
 *   </Field>
 */

export interface FieldProps {
  label: string;
  children: React.ReactNode;
  /** Message d'erreur de validation. Sa présence marque le champ invalide. */
  error?: string | undefined;
  /** Aide affichée sous le label, avant le contrôle. */
  hint?: string | undefined;
  required?: boolean;
  className?: string;
}

export function Field({
  label,
  children,
  error,
  hint,
  required = false,
  className,
}: FieldProps) {
  const baseId = useId();
  const controlId = `${baseId}-control`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  // L'ordre compte : le lecteur d'écran énonce l'aide puis l'erreur.
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <FieldContext.Provider
      value={{
        controlId,
        describedBy: describedBy || undefined,
        invalid: Boolean(error),
        required,
      }}
    >
      <div className={cn('space-y-1.5', className)}>
        <label htmlFor={controlId} className="block text-sm font-medium">
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="ml-0.5 text-danger">
                *
              </span>
              <span className="sr-only"> (obligatoire)</span>
            </>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-sm text-muted">
            {hint}
          </p>
        )}

        {children}

        {/* role="alert" : l'erreur est annoncée dès son apparition, sans
            attendre que la personne revienne sur le champ. */}
        {error && (
          <p id={errorId} role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
