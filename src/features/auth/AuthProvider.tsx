import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { signOut as signOutRequest } from '@/services/auth.service';
import { AuthContext } from './auth-context';

/**
 * Source unique de la session applicative (§9).
 *
 * La session vient de `onAuthStateChange`, jamais d'un état local recopié.
 * Supabase émet cet événement à l'ouverture, à la fermeture, au
 * rafraîchissement du jeton et au retour d'un lien reçu par courriel. S'abonner
 * couvre donc tous les cas, y compris ceux qu'un appel ponctuel manquerait :
 * un jeton expiré pendant que l'onglet dormait, ou une déconnexion depuis un
 * autre onglet.
 *
 * `getSession()` est appelé en complément au montage : l'abonnement seul ne
 * dit rien tant qu'aucun événement ne survient, et l'application resterait en
 * chargement.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    // Session déjà présente dans le stockage local, le cas du rechargement.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setIsLoading(false);

      // Vider le cache à la déconnexion. Sans cela, les données de la personne
      // précédente resteraient affichées à la connexion suivante sur le même
      // navigateur, le temps qu'une requête les remplace.
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }

      // Changement de compte sur le même navigateur : les requêtes en cache
      // appartiennent à l'utilisateur précédent.
      if (event === 'SIGNED_IN') {
        void queryClient.invalidateQueries();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    // L'état est mis à jour par l'événement SIGNED_OUT, pas ici : une écriture
    // directe divergerait de ce que Supabase considère comme la session
    // courante.
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isLoading, signOut }),
    [session, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
