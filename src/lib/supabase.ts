import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '@/types/database.types';

/**
 * Client Supabase — instance unique de l'application.
 *
 * Une seule instance, exportée depuis ce module. En créer plusieurs produirait
 * des sessions concurrentes se disputant le même espace de stockage : le
 * rafraîchissement de jeton de l'une invaliderait celui de l'autre, et
 * l'utilisateur serait déconnecté sans raison apparente.
 *
 *
 * CE CLIENT PORTE LA CLÉ ANON, ET SEULEMENT ELLE
 *
 * Chaque requête part avec le JWT de l'utilisateur connecté, et PostgreSQL
 * applique les policies RLS en conséquence. Le frontend ne décide de rien :
 * il demande, la base accorde ou refuse (§2, §36).
 *
 * N'introduisez JAMAIS la clé service_role ici. Elle contourne toute la RLS,
 * et le bundle est public : ce serait donner à chaque visiteur un accès total
 * aux données de tous les clients.
 */
export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Session persistée entre les visites (§9 « session persistante »).
      persistSession: true,
      autoRefreshToken: true,
      // Nécessaire aux liens de confirmation d'email et de réinitialisation de
      // mot de passe, qui reviennent avec les jetons dans le fragment d'URL.
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'hbg-labs-auth',
    },
    global: {
      headers: {
        'x-application-name': 'hbg-labs-client-platform',
      },
    },
  },
);
