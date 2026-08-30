import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/auth/useProfile';
import { LoadingState } from '@/components/ui/States';

/**
 * Gardes de route (§9).
 *
 * AVERTISSEMENT DE PORTÉE : ces gardes règlent l'AFFICHAGE, pas
 * l'autorisation. Elles évitent qu'un visiteur non connecté atterrisse sur un
 * écran vide, et rien de plus. Un utilisateur peut les contourner en modifiant
 * le JavaScript de la page.
 *
 * L'autorisation réelle vit dans les policies RLS : sans session valide,
 * PostgREST ne renvoie aucune ligne, quelle que soit la route atteinte. Ne
 * jamais raisonner comme si une garde protégeait des données (§36).
 */

/** Accès réservé aux utilisateurs connectés. */
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Attendre la résolution de la session. Rediriger pendant ce laps de temps
  // éjecterait un utilisateur connecté à chaque rechargement de page.
  if (isLoading) {
    return <LoadingState fullPage label="Vérification de votre session…" />;
  }

  if (!user) {
    // `state.from` permet de revenir à la page demandée après connexion, au
    // lieu de renvoyer systématiquement vers l'accueil.
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/**
 * Accès réservé aux visiteurs non connectés.
 *
 * Empêche d'afficher le formulaire de connexion à quelqu'un qui a déjà une
 * session ouverte, situation qui ne mène qu'à la confusion.
 */
export function RequireGuest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullPage label="Vérification de votre session…" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * Accès réservé au personnel HBG Labs.
 *
 * Le rôle vient de `profiles.platform_role`, colonne que seul un OWNER
 * plateforme peut écrire et que le trigger `guard_platform_role` protège
 * (migration 03).
 *
 * Rappel : cette garde masque l'interface, elle ne protège pas les données.
 * Un client qui forcerait la route obtiendrait des écrans vides, les policies
 * RLS ne lui renvoyant aucune ligne des tables d'administration. C'est
 * exactement le comportement voulu, et c'est ce que vérifie tests/rls/.
 */
export function RequirePlatformStaff() {
  const { user, isLoading } = useAuth();
  const profile = useProfile();

  // Le profil porte le rôle : rediriger avant sa réception renverrait le
  // personnel vers l'espace client à chaque rechargement.
  if (isLoading || (user && profile.isPending)) {
    return <LoadingState fullPage label="Vérification de vos accès…" />;
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (profile.data?.platform_role == null) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
