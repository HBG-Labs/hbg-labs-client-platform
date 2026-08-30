import { supabase } from '@/lib/supabase';
import type {
  DnsStatus,
  DomainStatus,
  SslStatus,
  VerificationSource,
  WebsiteStatus,
} from '@/types/domain';

/**
 * Données de l'espace client (§16, §17).
 *
 * Aucune de ces requêtes ne filtre sur l'organisation. Les policies
 * `websites_select_member` et `domains_select_member` s'en chargent : un
 * utilisateur ne reçoit que les lignes de ses propres organisations, et
 * dupliquer le filtre laisserait croire que l'isolation en dépend (§51).
 */

export interface ClientWebsite {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  environment: string;
  hosting_provider: string;
  production_url: string | null;
  ssl_status: SslStatus;
  /** 'NONE' impose l'affichage « Vérification non configurée » (§17). */
  verification_source: VerificationSource;
  checked_at: string | null;
  last_deployed_at: string | null;
  uptime_percentage: number | null;
  uptime_window_days: number | null;
  created_at: string;
  organization: { id: string; name: string } | null;
}

export async function fetchMyWebsites(): Promise<ClientWebsite[]> {
  const { data, error } = await supabase
    .from('websites')
    .select(
      `id, organization_id, name, slug, status, environment, hosting_provider,
       production_url, ssl_status, verification_source, checked_at,
       last_deployed_at, uptime_percentage, uptime_window_days, created_at,
       organization:organizations ( id, name )`,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return flatten<ClientWebsite>(data, 'organization');
}

export interface ClientDomain {
  id: string;
  organization_id: string;
  website_id: string | null;
  domain: string;
  is_primary: boolean;
  registrar: string | null;
  status: DomainStatus;
  dns_status: DnsStatus;
  ssl_status: SslStatus;
  verification_source: VerificationSource;
  checked_at: string | null;
  expires_at: string | null;
  auto_renew: boolean | null;
  created_at: string;
}

export async function fetchMyDomains(): Promise<ClientDomain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select(
      `id, organization_id, website_id, domain, is_primary, registrar, status,
       dns_status, ssl_status, verification_source, checked_at, expires_at,
       auto_renew, created_at`,
    )
    .order('is_primary', { ascending: false })
    .order('domain', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ClientDomain[];
}

function flatten<T>(data: unknown, key: string): T[] {
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const value = row[key];
    return {
      ...row,
      [key]: Array.isArray(value) ? (value[0] ?? null) : (value ?? null),
    } as T;
  });
}
