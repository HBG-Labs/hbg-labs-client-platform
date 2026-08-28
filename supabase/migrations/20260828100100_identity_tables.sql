-- =============================================================================
-- 02 — Tables d'identité : profiles, organizations, organization_members
-- =============================================================================
-- Les trois tables qui fondent le multi-tenant (§10, §11). Toute la RLS du
-- schéma se ramène in fine à une question posée à `organization_members` :
-- « cet utilisateur appartient-il à cette organisation ? »
--
-- Cette migration crée les TABLES uniquement. Les fonctions de sécurité et
-- les policies arrivent en 03 : elles interrogent ces tables, qui doivent
-- donc exister d'abord.
--
-- IMPORTANT — la RLS est activée en 03, pas ici. Entre les deux migrations
-- les tables sont sans policy ; c'est sans risque car `db push` applique les
-- migrations dans une transaction unique, et aucune clé anon n'est en jeu
-- durant une migration.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- profiles — extension applicative de auth.users
-- -----------------------------------------------------------------------------
-- Supabase possède `auth.users` et nous n'y touchons pas. `profiles` porte
-- nos données métier, en relation 1-1, avec la même clé primaire.
create table public.profiles (
  -- Pas de clé propre : l'identifiant EST celui de auth.users. La suppression
  -- du compte d'authentification emporte le profil.
  id uuid primary key references auth.users (id) on delete cascade,

  -- Copie dénormalisée de auth.users.email. Recopiée ici pour que la RLS et
  -- les jointures fonctionnent sans donner aux clients le droit de lire le
  -- schéma `auth` — que Supabase protège, à raison.
  -- Normalisée en minuscules pour que l'unicité soit réelle.
  email text not null
    constraint profiles_email_lowercase check (email = lower(email))
    constraint profiles_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  full_name text
    constraint profiles_full_name_length check (char_length(full_name) between 1 and 120),

  phone text
    constraint profiles_phone_length check (char_length(phone) between 4 and 32),

  -- Chemin dans le bucket Storage, jamais une URL publique : les avatars sont
  -- servis par URL signée (§35).
  avatar_url text,

  -- RÔLE PLATEFORME — le champ le plus sensible du schéma.
  --
  -- NULL = utilisateur client (le cas de l'immense majorité des lignes).
  -- Non NULL = membre de l'équipe HBG Labs.
  --
  -- Cette colonne accorde l'accès transversal à TOUTES les organisations.
  -- Elle n'est modifiable ni par son porteur ni par un admin d'organisation :
  -- un trigger dédié (migration 03) verrouille toute écriture hors OWNER
  -- plateforme. La RLS seule ne suffirait pas — elle raisonne par ligne, or
  -- ici la ligne appartient légitimement à l'utilisateur ; c'est la COLONNE
  -- qu'il faut protéger.
  platform_role public.platform_role,

  locale text not null default 'fr'
    constraint profiles_locale_format check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil applicatif, en 1-1 avec auth.users. platform_role non NULL = personnel HBG Labs.';
comment on column public.profiles.platform_role is
  'NULL pour un client. Non NULL accorde un accès transversal à toutes les organisations. Écriture verrouillée par trigger (voir migration 03).';

-- Recherche d'un utilisateur par email depuis l'admin (§28).
create unique index profiles_email_key on public.profiles (email);

-- Le dashboard admin liste fréquemment le personnel. L'index partiel ne porte
-- que sur les quelques lignes concernées, pas sur les milliers de clients.
create index profiles_platform_role_idx on public.profiles (platform_role)
  where platform_role is not null;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- -----------------------------------------------------------------------------
-- Sans ce trigger, un utilisateur pourrait exister dans auth.users sans
-- profil ; toutes les jointures produiraient des trous et l'application
-- afficherait des espaces vides sans explication.
--
-- SECURITY DEFINER est nécessaire : le trigger s'exécute pendant l'inscription,
-- dans un contexte où l'utilisateur n'a encore aucun droit sur `public`.
--
-- MENACE TRAITÉE ICI — `raw_user_meta_data` est ENTIÈREMENT CONTRÔLÉ PAR LE
-- CLIENT. N'importe qui peut s'inscrire avec :
--
--     supabase.auth.signUp({ email, password,
--       options: { data: { platform_role: 'OWNER' } } })
--
-- Cette fonction ne lit donc QUE `full_name`, et n'écrit JAMAIS
-- `platform_role` : la colonne conserve son défaut NULL. Le personnel HBG
-- Labs est promu séparément, par un OWNER existant. Ne jamais ajouter ici la
-- moindre lecture de rôle depuis les métadonnées (§36 : ne pas faire confiance
-- au rôle envoyé par le frontend).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  -- Idempotence : un renvoi d'email de confirmation ou un retry côté Supabase
  -- ne doit pas faire échouer l'inscription sur une violation de clé primaire.
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user is
  'Crée le profil applicatif à l''inscription. N''écrit jamais platform_role : les métadonnées d''inscription sont contrôlées par le client.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- organizations — le tenant (§11)
-- -----------------------------------------------------------------------------
-- Une organisation représente UNE entreprise cliente. C'est l'unité
-- d'isolation : toute donnée métier du schéma porte un `organization_id`, et
-- toute policy RLS s'y rapporte.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  -- Nom commercial, affiché dans l'interface.
  name text not null
    constraint organizations_name_length check (char_length(trim(name)) between 2 and 120),

  -- Identifiant lisible pour les URL (/admin/clients/boulangerie-martin).
  slug text not null
    constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
    constraint organizations_slug_length check (char_length(slug) between 2 and 63),

  -- ---- Informations légales (§15 « Mon entreprise ») ----
  -- Toutes facultatives : une organisation est souvent créée à la signature,
  -- avant que le client n'ait transmis son dossier administratif. Imposer ces
  -- champs bloquerait la création du compte.
  legal_name text
    constraint organizations_legal_name_length check (char_length(legal_name) between 2 and 200),

  -- SIRET : 14 chiffres. Contrainte de forme uniquement — la validité de la
  -- clé de Luhn se vérifie applicativement, pas par une contrainte figée.
  siret text
    constraint organizations_siret_format check (siret ~ '^[0-9]{14}$'),

  -- Numéro de TVA intracommunautaire, format libre selon le pays.
  vat_number text
    constraint organizations_vat_length check (char_length(vat_number) between 4 and 20),

  -- ---- Coordonnées ----
  -- Destinataire des factures. Peut différer de l'email du compte : le
  -- dirigeant se connecte, le comptable reçoit les factures.
  billing_email text
    constraint organizations_billing_email_lowercase check (billing_email = lower(billing_email))
    constraint organizations_billing_email_format check (billing_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  phone text
    constraint organizations_phone_length check (char_length(phone) between 4 and 32),

  address_line1 text,
  address_line2 text,
  postal_code text
    constraint organizations_postal_code_length check (char_length(postal_code) between 2 and 12),
  city text,

  -- ISO 3166-1 alpha-2. Défaut FR : la Martinique (972) est un département
  -- français, le cœur de cible annoncé (§41).
  country text not null default 'FR'
    constraint organizations_country_format check (country ~ '^[A-Z]{2}$'),

  -- Chemin dans le bucket privé `org-logos`, jamais une URL publique (§35).
  logo_url text,

  status public.organization_status not null default 'ACTIVE',

  -- ---- Lien Stripe ----
  -- Identifiant du Customer Stripe (cus_...). Reste NULL tant qu'aucun
  -- paiement n'a été engagé.
  --
  -- Unique : deux organisations partageant un Customer verraient leurs
  -- abonnements et factures se mélanger. La contrainte rend l'erreur
  -- impossible plutôt que difficile à détecter.
  --
  -- Écriture réservée à `service_role` par trigger (migration 03) : réassigner
  -- ce champ reviendrait à rattacher les factures d'un client à un autre.
  stripe_customer_id text
    constraint organizations_stripe_customer_id_format check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Auteur de la création (membre HBG Labs). ON DELETE SET NULL : le départ
  -- d'un collaborateur ne doit pas emporter l'organisation cliente.
  created_by uuid references public.profiles (id) on delete set null
);

comment on table public.organizations is
  'Tenant : une entreprise cliente. Unité d''isolation de toutes les données métier.';
comment on column public.organizations.stripe_customer_id is
  'Customer Stripe (cus_...). Unique. Écriture réservée à service_role via trigger.';

create unique index organizations_slug_key on public.organizations (slug);

-- Unicité du Customer Stripe. Index UNIQUE partiel : PostgreSQL considère
-- chaque NULL comme distinct, la clause WHERE évite donc d'indexer inutilement
-- toutes les organisations sans Stripe.
create unique index organizations_stripe_customer_id_key
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create index organizations_status_idx on public.organizations (status);
create index organizations_created_at_idx on public.organizations (created_at desc);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- organization_members — la table pivot de toute la sécurité
-- -----------------------------------------------------------------------------
-- Rattache un utilisateur à une organisation. C'est LA table interrogée par
-- chaque policy RLS du schéma : sa justesse conditionne l'isolation complète.
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  user_id uuid not null
    references public.profiles (id) on delete cascade,

  -- Rôle DANS CETTE ORGANISATION. Sans rapport avec profiles.platform_role :
  -- être OWNER de son entreprise ne donne évidemment aucun droit sur les
  -- autres clients de HBG Labs.
  role public.org_role not null default 'MEMBER',

  -- Un accès retiré passe à REVOKED, il n'est pas supprimé : l'historique des
  -- accès reste auditable (§44). Les fonctions de sécurité ne reconnaissent
  -- que le statut ACTIVE.
  status public.membership_status not null default 'ACTIVE',

  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un utilisateur ne peut avoir qu'un seul rattachement par organisation.
  -- Sans cette contrainte, deux lignes de rôles différents rendraient
  -- l'autorisation non déterministe.
  constraint organization_members_unique_membership
    unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Table pivot du multi-tenant. Interrogée par toutes les policies RLS via is_org_member(). Seul le statut ACTIVE ouvre l''accès.';

-- « À quelles organisations cet utilisateur appartient-il ? » — la requête la
-- plus fréquente de la base, exécutée à chaque vérification RLS.
create index organization_members_user_id_idx
  on public.organization_members (user_id)
  where status = 'ACTIVE';

-- « Qui sont les membres de cette organisation ? »
create index organization_members_organization_id_idx
  on public.organization_members (organization_id)
  where status = 'ACTIVE';

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();
