import { useQuery } from '@tanstack/react-query';
import {
  fetchMyOrganizations,
  fetchMyProfile,
  type MembershipWithOrganization,
  type Profile,
} from '@/services/profiles.service';
import { useAuth } from './auth-context';
import { authKeys } from './auth.keys';

/**
 * Profil applicatif de l'utilisateur connecté.
 *
 * Distinct de `useAuth().user`, qui vient de GoTrue et ne connaît que
 * l'identité d'authentification. Le profil porte les données métier :
 * nom complet, téléphone, et surtout `platform_role`, qui détermine l'accès
 * à l'espace d'administration.
 *
 * La requête n'est lancée qu'une fois la session résolue : la déclencher plus
 * tôt produirait un appel garanti sans résultat.
 */
export function useProfile() {
  const { user, isLoading } = useAuth();

  return useQuery<Profile | null>({
    queryKey: authKeys.profile(),
    queryFn: fetchMyProfile,
    enabled: !isLoading && Boolean(user),
    staleTime: 5 * 60_000,
  });
}

/**
 * Organisations dont l'utilisateur est membre actif.
 *
 * Une liste vide est un état légitime : un compte créé depuis le site public
 * n'est rattaché à aucune organisation tant que HBG Labs ne l'a pas fait.
 */
export function useMyOrganizations() {
  const { user, isLoading } = useAuth();

  return useQuery<MembershipWithOrganization[]>({
    queryKey: authKeys.organizations(),
    queryFn: fetchMyOrganizations,
    enabled: !isLoading && Boolean(user),
    staleTime: 5 * 60_000,
  });
}

/**
 * L'utilisateur appartient-il à l'équipe HBG Labs ?
 *
 * Lu depuis `profiles.platform_role`, écrit uniquement par un OWNER
 * plateforme et protégé par le trigger `guard_platform_role`. Cette valeur
 * sert à AFFICHER ou masquer une entrée de menu, jamais à autoriser un accès :
 * l'autorisation réelle est appliquée par les policies RLS, que le frontend ne
 * peut pas contourner (§36).
 */
export function useIsPlatformStaff(): boolean {
  const { data } = useProfile();
  return data?.platform_role != null;
}
