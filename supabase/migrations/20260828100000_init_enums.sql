-- =============================================================================
-- 01 — Types énumérés et utilitaires communs
-- =============================================================================
-- Fondation de tout le schéma. Aucune table ici : uniquement le vocabulaire
-- que les 17 migrations suivantes réutilisent.
--
-- CONVENTION DE CASSE — délibérée, et à respecter partout :
--
--   * minuscules  → l'énumération REFLÈTE une valeur produite par Stripe
--     (subscription_status, invoice_status, billing_interval, payment_status).
--     On copie la casse de Stripe à l'identique pour qu'aucune couche de
--     traduction ne s'intercale. Stripe est la source de vérité (§20, §22) ;
--     une table de correspondance serait un endroit de plus où dériver.
--
--   * MAJUSCULES  → l'énumération appartient au métier HBG Labs
--     (rôles, statuts de site, catégories de ticket). Notation du prompt maître.
--
-- Note : `gen_random_uuid()` fait partie du cœur de PostgreSQL depuis la
-- version 13 ; aucune extension n'est requise pour les clés primaires.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Identité et rôles (§13)
-- -----------------------------------------------------------------------------

-- Rôle au sein de l'ÉQUIPE HBG LABS. Un utilisateur client n'en a jamais
-- (profiles.platform_role vaut NULL pour lui). Cette énumération et `org_role`
-- ci-dessous décrivent deux populations disjointes : les confondre est la
-- première cause de faille d'autorisation dans une application multi-tenant.
create type public.platform_role as enum (
  'OWNER',    -- direction HBG Labs — accès total, y compris gestion du personnel
  'ADMIN',    -- administration complète de la plateforme
  'STAFF',    -- exploitation : sites, domaines, déploiements
  'SUPPORT'   -- support client : tickets et messages uniquement
);

-- Rôle au sein d'une ORGANISATION CLIENTE.
create type public.org_role as enum (
  'OWNER',    -- dirigeant du client : facturation et gestion des membres
  'MANAGER',  -- gestion opérationnelle, sans accès à la facturation
  'MEMBER'    -- consultation et création de demandes
);

create type public.membership_status as enum (
  'INVITED',  -- invitation envoyée, compte pas encore rattaché
  'ACTIVE',
  'REVOKED'   -- accès retiré — conservé pour la traçabilité, jamais supprimé
);

create type public.organization_status as enum (
  'ACTIVE',
  'SUSPENDED',  -- accès gelé (impayé, litige) — les données restent intactes
  'ARCHIVED'    -- client sorti — lecture seule
);


-- -----------------------------------------------------------------------------
-- Sites et domaines (§16, §17, §34)
-- -----------------------------------------------------------------------------

create type public.website_status as enum (
  'DRAFT',
  'IN_DEVELOPMENT',
  'STAGING',
  'ONLINE',
  'SUSPENDED',
  'ARCHIVED'
);

create type public.deploy_environment as enum (
  'DEVELOPMENT',
  'PREVIEW',
  'PRODUCTION'
);

-- D'OÙ vient l'information de statut affichée au client (§17, §57).
--
-- Le prompt maître est catégorique : ne jamais afficher « actif » quand rien
-- n'a été vérifié. Cette colonne rend l'ignorance explicite et vérifiable en
-- base, plutôt que de la laisser à l'interprétation du frontend.
--
-- Contrat d'affichage, appliqué par une contrainte CHECK sur chaque table
-- concernée : tant que la valeur est 'NONE', TOUS les statuts de la ligne
-- valent 'UNKNOWN', et l'interface DOIT afficher « Vérification non
-- configurée ». Jamais un voyant vert.
create type public.verification_source as enum (
  'NONE',            -- rien n'a jamais été vérifié — état initial
  'MANUAL',          -- constaté et saisi par un opérateur HBG Labs
  'VERCEL_API',      -- lu depuis l'API Vercel (§33)
  'CLOUDFLARE_API'   -- lu depuis l'API Cloudflare
);

create type public.dns_status as enum (
  'UNKNOWN',      -- défaut : non vérifié
  'PENDING',      -- enregistrements posés, propagation en cours
  'CONFIGURED',
  'MISCONFIGURED',
  'ERROR'
);

create type public.ssl_status as enum (
  'UNKNOWN',      -- défaut : non vérifié
  'PENDING',      -- certificat en cours d'émission
  'ACTIVE',
  'EXPIRING',     -- expire sous 30 jours
  'EXPIRED',
  'ERROR'
);

create type public.domain_status as enum (
  'UNKNOWN',      -- défaut : non vérifié
  'PENDING',
  'ACTIVE',
  'EXPIRING',
  'EXPIRED',
  'TRANSFERRING',
  'ERROR'
);


-- -----------------------------------------------------------------------------
-- Facturation — casse Stripe à l'identique (§22)
-- -----------------------------------------------------------------------------

-- Reproduit exactement `Subscription.status` de l'API Stripe. Toute valeur
-- ajoutée par Stripe devra être ajoutée ici avant que le webhook ne puisse
-- l'enregistrer : un ALTER TYPE ... ADD VALUE en migration, jamais une
-- conversion silencieuse qui masquerait un état réel de l'abonnement.
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

-- Reproduit `Invoice.status` de l'API Stripe.
create type public.invoice_status as enum (
  'draft',
  'open',
  'paid',
  'uncollectible',
  'void'
);

-- Dérivé de `PaymentIntent.status`, augmenté des états de remboursement que
-- Stripe porte sur l'objet Charge et non sur le PaymentIntent.
create type public.payment_status as enum (
  'requires_payment_method',
  'requires_action',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
  'partially_refunded'
);

-- Reproduit `Price.recurring.interval` de l'API Stripe.
create type public.billing_interval as enum (
  'day',
  'week',
  'month',
  'year'
);

-- Distingue le prix d'AMORÇAGE (création du site, paiement unique — §7) du
-- prix RÉCURRENT (hébergement et maintenance mensuels).
create type public.price_kind as enum (
  'RECURRING',
  'ONE_TIME'
);


-- -----------------------------------------------------------------------------
-- Support (§24, §25)
-- -----------------------------------------------------------------------------

create type public.ticket_category as enum (
  'SITE',
  'DOMAINE',
  'HEBERGEMENT',
  'FACTURATION',
  'SUPPORT',
  'AUTRE'
);

create type public.ticket_priority as enum (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

create type public.ticket_status as enum (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'RESOLVED',
  'CLOSED'
);

-- Sépare la demande d'assistance de la demande de modification du site (§25).
-- Ce sont deux flux de travail distincts côté HBG Labs, sur une même table :
-- même conversation, même RLS, même historique.
create type public.ticket_type as enum (
  'SUPPORT',
  'CHANGE_REQUEST'
);


-- -----------------------------------------------------------------------------
-- Notifications (§26)
-- -----------------------------------------------------------------------------

create type public.notification_channel as enum (
  'IN_APP',
  'EMAIL'
);

create type public.notification_status as enum (
  'PENDING',
  'SENT',
  'FAILED'
);


-- -----------------------------------------------------------------------------
-- Prospects (§4, §5 — /devis et /contact)
-- -----------------------------------------------------------------------------

create type public.lead_status as enum (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CONVERTED',
  'REJECTED',
  'SPAM'
);


-- -----------------------------------------------------------------------------
-- Utilitaire : horodatage de modification
-- -----------------------------------------------------------------------------
-- Tenir `updated_at` à jour depuis l'application est un pari perdu d'avance :
-- il suffit d'un écrit oublié, d'un backfill ou d'une correction manuelle en
-- SQL pour que la colonne mente. Un trigger le garantit sans exception.
--
-- SECURITY INVOKER (le défaut) : cette fonction n'accède à aucune table, elle
-- n'a donc besoin d'aucun privilège élevé.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger BEFORE UPDATE : force updated_at = now() à chaque modification.';
