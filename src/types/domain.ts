/**
 * CONTRAT DE DOMAINE — backend ↔ frontend (§51, §52)
 *
 * Ce fichier est écrit à la main et fait autorité sur le VOCABULAIRE : les
 * énumérations reproduisent exactement celles de
 * `supabase/migrations/20260828100000_init_enums.sql`.
 *
 * `database.types.ts`, à côté, est GÉNÉRÉ depuis la base (`npm run db:types`)
 * et fait autorité sur la FORME des lignes. Les deux se complètent : celui-ci
 * reste lisible et commenté, celui-là reste exact et exhaustif.
 *
 * Toute valeur ajoutée ici doit d'abord exister dans une migration.
 * N'inventez ni statut, ni rôle, ni catégorie (§51).
 *
 *
 * CONVENTION DE CASSE — voir migration 01
 *   minuscules  → valeur produite par Stripe, recopiée à l'identique
 *   MAJUSCULES  → vocabulaire métier HBG Labs
 */

// -----------------------------------------------------------------------------
// Identité et rôles (§13)
// -----------------------------------------------------------------------------

/**
 * Rôle au sein de l'équipe HBG Labs.
 * `null` = utilisateur client. Ne jamais déduire un rôle depuis le frontend :
 * il vient de `profiles.platform_role`, que seul un OWNER peut écrire.
 */
export type PlatformRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'SUPPORT';

/** Rôle au sein d'une organisation cliente. Sans rapport avec PlatformRole. */
export type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'REVOKED';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

// -----------------------------------------------------------------------------
// Sites et domaines (§16, §17, §34)
// -----------------------------------------------------------------------------

export type WebsiteStatus =
  | 'DRAFT'
  | 'IN_DEVELOPMENT'
  | 'STAGING'
  | 'ONLINE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export type DeployEnvironment = 'DEVELOPMENT' | 'PREVIEW' | 'PRODUCTION';

/**
 * Provenance d'une information de statut.
 *
 * RÈGLE D'AFFICHAGE, NON NÉGOCIABLE (§17, §57) :
 * si la valeur est 'NONE', l'interface affiche « Vérification non configurée ».
 * Jamais un voyant vert, jamais « actif ».
 *
 * Utilisez `isVerified()` plus bas plutôt que de tester la valeur à la main.
 */
export type VerificationSource = 'NONE' | 'MANUAL' | 'VERCEL_API' | 'CLOUDFLARE_API';

export type DnsStatus = 'UNKNOWN' | 'PENDING' | 'CONFIGURED' | 'MISCONFIGURED' | 'ERROR';

export type SslStatus = 'UNKNOWN' | 'PENDING' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'ERROR';

export type DomainStatus =
  | 'UNKNOWN'
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'TRANSFERRING'
  | 'ERROR';

// -----------------------------------------------------------------------------
// Facturation — casse Stripe (§22)
// -----------------------------------------------------------------------------

/** Reproduit `Subscription.status` de l'API Stripe. Source de vérité : Stripe. */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

/** Reproduit `Invoice.status` de l'API Stripe. */
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';

export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export type BillingInterval = 'day' | 'week' | 'month' | 'year';

export type PriceKind = 'RECURRING' | 'ONE_TIME';

// -----------------------------------------------------------------------------
// Support (§24, §25)
// -----------------------------------------------------------------------------

export type TicketCategory =
  | 'SITE'
  | 'DOMAINE'
  | 'HEBERGEMENT'
  | 'FACTURATION'
  | 'SUPPORT'
  | 'AUTRE';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'RESOLVED'
  | 'CLOSED';

/** SUPPORT = assistance (§24). CHANGE_REQUEST = modification du site (§25). */
export type TicketType = 'SUPPORT' | 'CHANGE_REQUEST';

// -----------------------------------------------------------------------------
// Notifications et prospects
// -----------------------------------------------------------------------------

export type NotificationChannel = 'IN_APP' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'REJECTED'
  | 'SPAM';

// -----------------------------------------------------------------------------
// Aides d'affichage
// -----------------------------------------------------------------------------

/**
 * Une information vérifiée peut-elle être affichée comme telle ?
 *
 * À APPELER AVANT TOUT VOYANT D'ÉTAT sur un site ou un domaine. Le schéma
 * garantit qu'une source 'NONE' s'accompagne de statuts 'UNKNOWN' ; cette
 * fonction évite d'avoir à s'en souvenir composant par composant.
 */
export function isVerified(
  source: VerificationSource,
): source is Exclude<VerificationSource, 'NONE'> {
  // Prédicat de type, et non simple booléen : après un `if (!isVerified(s))
  // return …`, TypeScript sait que 'NONE' est écarté. Les composants peuvent
  // alors indexer un dictionnaire de libellés sans avoir à traiter un cas
  // que le flux de contrôle a déjà exclu.
  return source !== 'NONE';
}

/** Libellé imposé quand rien n'a été vérifié (§17). */
export const UNVERIFIED_LABEL = 'Vérification non configurée';

/** Libellés français des statuts, pour l'interface. */
export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  DRAFT: 'Brouillon',
  IN_DEVELOPMENT: 'En développement',
  STAGING: 'Préproduction',
  ONLINE: 'En ligne',
  SUSPENDED: 'Suspendu',
  ARCHIVED: 'Archivé',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Période d’essai',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Annulé',
  unpaid: 'Impayé',
  incomplete: 'Incomplet',
  incomplete_expired: 'Incomplet (expiré)',
  paused: 'En pause',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  open: 'À payer',
  paid: 'Payée',
  uncollectible: 'Irrécouvrable',
  void: 'Annulée',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Ouverte',
  IN_PROGRESS: 'En cours',
  WAITING_CLIENT: 'En attente de votre réponse',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  SITE: 'Site web',
  DOMAINE: 'Nom de domaine',
  HEBERGEMENT: 'Hébergement',
  FACTURATION: 'Facturation',
  SUPPORT: 'Assistance',
  AUTRE: 'Autre',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Basse',
  NORMAL: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Dirigeant',
  MANAGER: 'Gestionnaire',
  MEMBER: 'Collaborateur',
};

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  OWNER: 'Direction',
  ADMIN: 'Administration',
  STAFF: 'Exploitation',
  SUPPORT: 'Support',
};
