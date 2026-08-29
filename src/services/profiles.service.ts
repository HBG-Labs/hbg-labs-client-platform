import { supabase } from '@/lib/supabase';
import type { OrgRole, OrganizationStatus, PlatformRole } from '@/types/domain';

/**
 * Profil applicatif et rattachements aux organisations.
 *
 * Aucun filtre sur l'identité de l'utilisateur : les policies
 * `profiles_select_self` et `organization_members_select_member` s'en chargent.
 * Ajouter un `.eq('id', user.id)` donnerait l'impression que la
 * confidentialité dépend de cette requête, alors qu'elle repose sur la base.
 */

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  /** NULL pour un client. Non NULL pour le personnel HBG Labs (§13). */
  platform_role: PlatformRole | null;
  created_at: string;
}

/**
 * Profil de l'utilisateur courant.
 *
 * Renvoie `null` si aucune session n'est ouverte, plutôt que de lever : les
 * composants appellent ce hook avant de savoir s'il y a une session.
 */
export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, avatar_url, platform_role, created_at')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export interface MembershipWithOrganization {
  id: string;
  role: OrgRole;
  organization: {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
    created_at: string;
  };
}

/**
 * Organisations dont l'utilisateur est membre actif.
 *
 * La liste peut être vide : un compte créé depuis le site public n'est
 * rattaché à aucune organisation tant que HBG Labs ne l'a pas fait. C'est un
 * état normal, pas une erreur, et l'interface doit le traiter comme tel.
 */
export async function fetchMyOrganizations(): Promise<MembershipWithOrganization[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      id, role,
      organization:organizations ( id, name, slug, status, created_at )
    `,
    )
    .eq('status', 'ACTIVE');

  if (error) throw error;

  // PostgREST renvoie la relation à un seul élément comme objet, mais le type
  // généré la décrit parfois comme tableau selon la façon dont la clé
  // étrangère est déclarée. On normalise avant de sortir du service.
  return ((data ?? []) as unknown[])
    .map((row) => {
      const record = row as {
        id: string;
        role: OrgRole;
        organization:
          | MembershipWithOrganization['organization']
          | MembershipWithOrganization['organization'][]
          | null;
      };

      const organization = Array.isArray(record.organization)
        ? record.organization[0]
        : record.organization;

      if (!organization) return null;
      return { id: record.id, role: record.role, organization };
    })
    .filter((row): row is MembershipWithOrganization => row !== null);
}
