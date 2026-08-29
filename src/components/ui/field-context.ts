import { createContext, useContext } from 'react';

/**
 * Contexte de câblage d'un champ de formulaire.
 *
 * Séparé de `Field.tsx` parce qu'un fichier exportant autre chose que des
 * composants désactive le rafraîchissement à chaud de React pour tout le
 * fichier.
 */

export interface FieldContextValue {
  readonly controlId: string;
  readonly describedBy: string | undefined;
  readonly invalid: boolean;
  readonly required: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Liaisons ARIA à appliquer au contrôle.
 *
 * Renvoie des valeurs neutres hors d'un `Field`, pour qu'un `Input` isolé
 * reste utilisable sans provoquer d'erreur.
 */
export function useFieldControl() {
  const context = useContext(FieldContext);

  if (!context) {
    return {
      id: undefined,
      'aria-describedby': undefined,
      'aria-invalid': undefined,
      required: undefined,
    };
  }

  return {
    id: context.controlId,
    'aria-describedby': context.describedBy,
    'aria-invalid': context.invalid ? (true as const) : undefined,
    required: context.required || undefined,
  };
}
