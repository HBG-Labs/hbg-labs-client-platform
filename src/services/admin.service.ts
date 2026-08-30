import { supabase } from '@/lib/supabase';
import type {
  DomainStatus,
  DnsStatus,
  LeadStatus,
  OrgRole,
  OrganizationStatus,
  SslStatus,
  TicketStatus,
  VerificationSource,
  WebsiteStatus,
} from '@/types/domain';

/**
 * Accès aux données de l'espace d'administration (§27 à §32).
 *
 * Aucune de ces fonctions ne filtre sur le rôle de l'appelant. Les policies
 * `*_select_staff` s'en chargent : un client qui atteindrait ces requêtes
 * obtiendrait des tableaux vides, jamais les données d'un autre. Reproduire le
 * contrôle ici donnerait l'illusion que la sécurité en dépend.
 *
 * Les écritures reposent sur les policies `*_insert_admin` et `*_update_admin`,
 * réservées aux rôles OWNER et ADMIN de la plateforme. Un membre SUPPORT lit
 * sans pouvoir modifier, et la base le lui refuse.
 *
 *
 * CHAMPS FACULTATIFS ET CHAÎNE VIDE
 *
 * Les colonnes facultatives portent des contraintes de longueur minimale : une
 * chaîne vide les viole et fait échouer l'écriture avec une erreur 23514
 * illisible. Les schémas Zod normalisent le vide en `undefined`, et les
 * constructeurs de charge utile ci-dessous le convertissent en NULL.
 *
 * Ces charges utiles sont écrites champ par champ, sans transformation
 * générique : c'est ce qui permet à supabase-js de vérifier les noms de
 * colonnes à la compilation. Une faute de frappe se voit alors avant
 * l'exécution.
 */

// -----------------------------------------------------------------------------
// Tableau de bord (§27)
// -----------------------------------------------------------------------------

export interface AdminMetrics {
  organizations: number;
  websites: number;
  /** Sites DÉCLARÉS en ligne par HBG Labs, sans vérification externe. */
  websitesDeclaredOnline: number;
  activeSubscriptions: number;
  openTickets: number;
  /** Somme des MRR en centimes. Nul tant que Stripe n'écrit pas. */
  mrrCents: number;
  newLeads: number;
}

/**
 * Compteurs du tableau de bord.
 *
 * `head: true` avec `count: 'exact'` demande à PostgREST le nombre de lignes
 * sans en transférer aucune. Charger les lignes pour les compter deviendrait
 * coûteux dès quelques centaines de clients.
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const HEAD_COUNT = { count: 'exact', head: true } as const;

  const results = await Promise.all([
    supabase.from('organizations').select('*', HEAD_COUNT),
    supabase.from('websites').select('*', HEAD_COUNT),
    supabase.from('websites').select('*', HEAD_COUNT).eq('status', 'ONLINE'),
    supabase
      .from('support_tickets')
      .select('*', HEAD_COUNT)
      .in('status', ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT']),
    supabase.from('quote_requests').select('*', HEAD_COUNT).eq('status', 'NEW'),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;

  const [organizations, websites, websitesDeclaredOnline, openTickets, newLeads] =
    results.map((result) => result.count ?? 0) as [number, number, number, number, number];

  // Le MRR est une colonne générée : on somme des valeurs que la base calcule,
  // jamais un montant reconstitué côté client.
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('mrr_cents')
    .in('status', ['active', 'past_due']);

  if (error) throw error;

  const rows = (subscriptions ?? []) as { mrr_cents: number | null }[];

  return {
    organizations,
    websites,
    websitesDeclaredOnline,
    activeSubscriptions: rows.length,
    openTickets,
    mrrCents: rows.reduce((total, row) => total + (row.mrr_cents ?? 0), 0),
    newLeads,
  };
}

// -----------------------------------------------------------------------------
// Clients (§28)
// -----------------------------------------------------------------------------

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  siret: string | null;
  billing_email: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  address_line1: string | null;
  status: OrganizationStatus;
  stripe_customer_id: string | null;
  created_at: string;
}

const ORGANIZATION_COLUMNS =
  'id, name, slug, legal_name, siret, billing_email, phone, city, postal_code, address_line1, status, stripe_customer_id, created_at';

export async function fetchOrganizations(): Promise<AdminOrganization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AdminOrganization[];
}

export async function fetchOrganization(id: string): Promise<AdminOrganization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as AdminOrganization | null) ?? null;
}

export interface OrganizationInput {
  name: string;
  slug: string;
  legal_name?: string | undefined;
  siret?: string | undefined;
  billing_email?: string | undefined;
  phone?: string | undefined;
  address_line1?: string | undefined;
  postal_code?: string | undefined;
  city?: string | undefined;
}

/**
 * Charge utile d'organisation.
 *
 * Les champs absents deviennent NULL. Le formulaire d'édition soumet toujours
 * l'objet complet : un champ vidé doit effacer la valeur en base, pas la
 * laisser inchangée.
 */
function organizationPayload(input: OrganizationInput) {
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    legal_name: input.legal_name ?? null,
    siret: input.siret ?? null,
    billing_email: input.billing_email ?? null,
    phone: input.phone ?? null,
    address_line1: input.address_line1 ?? null,
    postal_code: input.postal_code ?? null,
    city: input.city ?? null,
  };
}

export async function createOrganization(input: OrganizationInput): Promise<string> {
  const { data, error } = await supabase
    .from('organizations')
    .insert(organizationPayload(input))
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cet identifiant est déjà utilisé par un autre client.');
    }
    throw error;
  }

  return (data as { id: string }).id;
}

export async function updateOrganization(
  id: string,
  input: OrganizationInput,
  status?: OrganizationStatus,
): Promise<void> {
  // `stripe_customer_id` n'est jamais transmis : le trigger
  // `guard_stripe_customer_id` réserve cette colonne au webhook Stripe.
  const { error } = await supabase
    .from('organizations')
    .update({ ...organizationPayload(input), ...(status ? { status } : {}) })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cet identifiant est déjà utilisé par un autre client.');
    }
    throw error;
  }
}

export async function setOrganizationStatus(
  id: string,
  status: OrganizationStatus,
): Promise<void> {
  const { error } = await supabase.from('organizations').update({ status }).eq('id', id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Membres d'une organisation
// -----------------------------------------------------------------------------

export interface OrganizationMember {
  id: string;
  role: OrgRole;
  status: string;
  joined_at: string;
  profile: { id: string; email: string; full_name: string | null } | null;
}

export async function fetchOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('id, role, status, joined_at, profile:profiles ( id, email, full_name )')
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return flattenRelation<OrganizationMember>(data, 'profile');
}

/** Erreur métier : la personne n'a pas encore de compte. */
export class ProfileNotFoundError extends Error {
  constructor(email: string) {
    super(
      `Aucun compte n’existe pour ${email}. Cette personne doit d’abord créer son compte depuis la page d’inscription, vous pourrez ensuite la rattacher.`,
    );
    this.name = 'ProfileNotFoundError';
  }
}

/**
 * Rattache un utilisateur existant à une organisation.
 *
 * Le compte doit préexister : créer un utilisateur d'authentification demande
 * la clé `service_role`, qui n'a rien à faire dans un navigateur (§36). Le
 * client s'inscrit lui-même, HBG Labs le rattache ensuite.
 */
export async function addOrganizationMember(
  organizationId: string,
  email: string,
  role: OrgRole,
): Promise<void> {
  const normalized = email.trim().toLowerCase();

  // La policy `profiles_select_staff` autorise cette recherche au personnel.
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!profile) throw new ProfileNotFoundError(normalized);

  const { error } = await supabase.from('organization_members').insert({
    organization_id: organizationId,
    user_id: (profile as { id: string }).id,
    role,
    status: 'ACTIVE',
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Cette personne est déjà rattachée à cette organisation.');
    }
    throw error;
  }
}

/** Message du trigger `guard_last_org_owner`, traduit pour l'interface. */
const LAST_OWNER_MESSAGE =
  'Cette organisation doit conserver au moins un dirigeant. Promouvez un autre membre au préalable.';

export async function updateMemberRole(memberId: string, role: OrgRole): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId);

  if (error) {
    if (error.code === '23514') throw new Error(LAST_OWNER_MESSAGE);
    throw error;
  }
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    if (error.code === '23514') throw new Error(LAST_OWNER_MESSAGE);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Sites (§29)
// -----------------------------------------------------------------------------

export interface AdminWebsite {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  environment: string;
  hosting_provider: string;
  production_url: string | null;
  repository_url: string | null;
  vercel_project_id: string | null;
  ssl_status: SslStatus;
  verification_source: VerificationSource;
  checked_at: string | null;
  last_deployed_at: string | null;
  created_at: string;
  organization: { id: string; name: string; slug: string } | null;
}

export async function fetchWebsites(): Promise<AdminWebsite[]> {
  const { data, error } = await supabase
    .from('websites')
    .select(
      `id, organization_id, name, slug, status, environment, hosting_provider,
       production_url, repository_url, vercel_project_id, ssl_status,
       verification_source, checked_at, last_deployed_at, created_at,
       organization:organizations ( id, name, slug )`,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return flattenRelation<AdminWebsite>(data, 'organization');
}

export interface WebsiteInput {
  organization_id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  production_url?: string | undefined;
  repository_url?: string | undefined;
  hosting_provider?: string | undefined;
}

function websitePayload(input: WebsiteInput) {
  return {
    organization_id: input.organization_id,
    name: input.name.trim(),
    slug: input.slug.trim(),
    status: input.status,
    production_url: input.production_url ?? null,
    repository_url: input.repository_url ?? null,
    // Colonne NOT NULL avec valeur par défaut : on retombe sur Vercel plutôt
    // que d'envoyer NULL, que la contrainte refuserait.
    hosting_provider: input.hosting_provider ?? 'Vercel',
  };
}

const DUPLICATE_WEBSITE_SLUG =
  'Ce client possède déjà un site portant cet identifiant.';

export async function createWebsite(input: WebsiteInput): Promise<void> {
  const { error } = await supabase.from('websites').insert(websitePayload(input));

  if (error) {
    if (error.code === '23505') throw new Error(DUPLICATE_WEBSITE_SLUG);
    throw error;
  }
}

export async function updateWebsite(id: string, input: WebsiteInput): Promise<void> {
  const { error } = await supabase
    .from('websites')
    .update(websitePayload(input))
    .eq('id', id);

  if (error) {
    if (error.code === '23505') throw new Error(DUPLICATE_WEBSITE_SLUG);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Domaines (§32)
// -----------------------------------------------------------------------------

export interface AdminDomain {
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
  created_at: string;
  organization: { id: string; name: string } | null;
}

export async function fetchDomains(): Promise<AdminDomain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select(
      `id, organization_id, website_id, domain, is_primary, registrar, status,
       dns_status, ssl_status, verification_source, checked_at, expires_at,
       created_at, organization:organizations ( id, name )`,
    )
    .order('domain', { ascending: true });

  if (error) throw error;
  return flattenRelation<AdminDomain>(data, 'organization');
}

export interface DomainInput {
  organization_id: string;
  domain: string;
  website_id?: string | undefined;
  registrar?: string | undefined;
  is_primary?: boolean | undefined;
}

export async function createDomain(input: DomainInput): Promise<void> {
  const { error } = await supabase.from('domains').insert({
    organization_id: input.organization_id,
    domain: input.domain.trim().toLowerCase(),
    website_id: input.website_id ?? null,
    registrar: input.registrar ?? null,
    is_primary: input.is_primary ?? false,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce domaine est déjà enregistré sur la plateforme.');
    }
    // 23514 couvre deux gardes : `guard_domain_website_tenant`, qui refuse le
    // rattachement au site d'une autre organisation, et
    // `domains_primary_requires_website`, qui exige un site pour un domaine
    // principal.
    if (error.code === '23514') {
      throw new Error(
        'Rattachement impossible. Un domaine principal doit désigner un site, et ce site doit appartenir au même client.',
      );
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Demandes reçues (§4, §5)
// -----------------------------------------------------------------------------

export interface AdminQuoteRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  project_type: string | null;
  budget_range: string | null;
  message: string;
  status: LeadStatus;
  source: string;
  created_at: string;
}

export interface AdminContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: LeadStatus;
  created_at: string;
}

export async function fetchQuoteRequests(): Promise<AdminQuoteRequest[]> {
  const { data, error } = await supabase
    .from('quote_requests')
    .select(
      'id, full_name, email, phone, company_name, project_type, budget_range, message, status, source, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AdminQuoteRequest[];
}

export async function fetchContactMessages(): Promise<AdminContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, full_name, email, phone, subject, message, status, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AdminContactMessage[];
}

export async function updateQuoteRequestStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  const { error } = await supabase.from('quote_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateContactMessageStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// -----------------------------------------------------------------------------
// Tickets (§31)
// -----------------------------------------------------------------------------

export interface AdminTicket {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  category: string;
  type: string;
  last_activity_at: string;
  created_at: string;
  organization: { id: string; name: string } | null;
}

export async function fetchTickets(): Promise<AdminTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(
      `id, reference, subject, status, priority, category, type,
       last_activity_at, created_at, organization:organizations ( id, name )`,
    )
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return flattenRelation<AdminTicket>(data, 'organization');
}

// -----------------------------------------------------------------------------

/**
 * Normalise une relation imbriquée.
 *
 * PostgREST renvoie une relation à un seul élément tantôt comme objet, tantôt
 * comme tableau, selon la façon dont la clé étrangère est déclarée. La
 * normalisation a lieu ici, une fois, plutôt que dans chaque composant.
 */
function flattenRelation<T>(data: unknown, key: string): T[] {
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const value = row[key];
    return {
      ...row,
      [key]: Array.isArray(value) ? (value[0] ?? null) : (value ?? null),
    } as T;
  });
}
