/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Régénération, une fois le projet Supabase relié :
 *
 *     npm run db:types
 *
 * (soit `supabase gen types typescript --linked --schema public`)
 *
 *
 * ÉTAT ACTUEL : PLACEHOLDER
 *
 * Aucun projet Supabase n'est encore relié — les types complets des tables ne
 * peuvent donc pas être produits. Le contenu ci-dessous compile et donne accès
 * aux énumérations réelles, mais les lignes sont typées de façon permissive.
 *
 * Écrire ces types à la main serait pire que de les laisser en attente : ils
 * dériveraient du schéma au premier changement de migration, sans que rien ne
 * le signale, et le frontend croirait à des colonnes inexistantes.
 *
 * Pour le VOCABULAIRE stable (rôles, statuts, catégories) et les libellés
 * français, utilisez `@/types/domain` — écrit à la main, commenté, aligné sur
 * la migration 01.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Tables du schéma `public`, dans l'ordre des migrations. */
export type PublicTableName =
  | 'profiles'
  | 'organizations'
  | 'organization_members'
  | 'plans'
  | 'plan_prices'
  | 'plan_features'
  | 'websites'
  | 'domains'
  | 'subscriptions'
  | 'invoices'
  | 'payments'
  | 'support_tickets'
  | 'support_messages'
  | 'ticket_attachments'
  | 'notifications'
  | 'audit_logs'
  | 'stripe_webhook_events'
  | 'quote_requests'
  | 'contact_messages';

interface UntypedTable {
  Row: Record<string, Json>;
  Insert: Record<string, Json | undefined>;
  Update: Record<string, Json | undefined>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: Record<PublicTableName, UntypedTable>;
    Views: Record<never, never>;
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_resource_type?: string | null;
          p_resource_id?: string | null;
          p_organization_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
    /** Reproduit les types énumérés de la migration 01. */
    Enums: {
      platform_role: 'OWNER' | 'ADMIN' | 'STAFF' | 'SUPPORT';
      org_role: 'OWNER' | 'MANAGER' | 'MEMBER';
      membership_status: 'INVITED' | 'ACTIVE' | 'REVOKED';
      organization_status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
      website_status:
        | 'DRAFT'
        | 'IN_DEVELOPMENT'
        | 'STAGING'
        | 'ONLINE'
        | 'SUSPENDED'
        | 'ARCHIVED';
      deploy_environment: 'DEVELOPMENT' | 'PREVIEW' | 'PRODUCTION';
      verification_source: 'NONE' | 'MANUAL' | 'VERCEL_API' | 'CLOUDFLARE_API';
      dns_status: 'UNKNOWN' | 'PENDING' | 'CONFIGURED' | 'MISCONFIGURED' | 'ERROR';
      ssl_status: 'UNKNOWN' | 'PENDING' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'ERROR';
      domain_status:
        | 'UNKNOWN'
        | 'PENDING'
        | 'ACTIVE'
        | 'EXPIRING'
        | 'EXPIRED'
        | 'TRANSFERRING'
        | 'ERROR';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'incomplete'
        | 'incomplete_expired'
        | 'paused';
      invoice_status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
      payment_status:
        | 'requires_payment_method'
        | 'requires_action'
        | 'processing'
        | 'succeeded'
        | 'failed'
        | 'canceled'
        | 'refunded'
        | 'partially_refunded';
      billing_interval: 'day' | 'week' | 'month' | 'year';
      price_kind: 'RECURRING' | 'ONE_TIME';
      ticket_category:
        | 'SITE'
        | 'DOMAINE'
        | 'HEBERGEMENT'
        | 'FACTURATION'
        | 'SUPPORT'
        | 'AUTRE';
      ticket_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      ticket_status:
        | 'OPEN'
        | 'IN_PROGRESS'
        | 'WAITING_CLIENT'
        | 'RESOLVED'
        | 'CLOSED';
      ticket_type: 'SUPPORT' | 'CHANGE_REQUEST';
      notification_channel: 'IN_APP' | 'EMAIL';
      notification_status: 'PENDING' | 'SENT' | 'FAILED';
      lead_status:
        | 'NEW'
        | 'CONTACTED'
        | 'QUALIFIED'
        | 'CONVERTED'
        | 'REJECTED'
        | 'SPAM';
    };
    CompositeTypes: Record<never, never>;
  };
}
