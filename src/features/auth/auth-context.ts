import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Contexte de session.
 *
 * Séparé du composant fournisseur : un fichier exportant autre chose que des
 * composants désactive le rafraîchissement à chaud pour tout le fichier.
 */

export interface AuthContextValue {
  readonly session: Session | null;
  readonly user: User | null;
  /**
   * Vrai tant que la session initiale n'est pas résolue.
   *
   * Distinguer « en cours de résolution » de « non connecté » est essentiel :
   * sans cela, les gardes de route redirigeraient vers la connexion pendant la
   * fraction de seconde qui précède la relecture de la session, et un
   * utilisateur connecté serait éjecté à chaque rechargement de page.
   */
  readonly isLoading: boolean;
  readonly signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }

  return context;
}
