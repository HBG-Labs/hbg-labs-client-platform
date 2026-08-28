-- =============================================================================
-- 06 — domains (§17, §32)
-- =============================================================================
-- Noms de domaine gérés par HBG Labs pour ses clients.
--
-- Même discipline que `websites` : chaque statut a une valeur 'UNKNOWN' par
-- défaut, et des contraintes CHECK interdisent d'affirmer quoi que ce soit
-- tant qu'aucune source ne l'a vérifié. §17 le formule directement :
--
--     « Ne jamais afficher de fausses informations. Si l'intégration
--       Vercel/Cloudflare n'est pas encore disponible, afficher clairement
--       "Vérification non configurée" et non "actif". »
--
-- L'écran cible montre trois voyants — domaine actif, DNS configuré, SSL
-- actif. Chacun a ici sa colonne, et aucun ne peut passer au vert sans que
-- `verification_source` et `checked_at` soient renseignés.
--
--
-- LE DOMAINE EST UNIQUE À L'ÉCHELLE DE LA PLATEFORME
--
-- Un nom de domaine ne peut pointer que vers une infrastructure à la fois.
-- Deux organisations enregistrant `boulangerie-martin.fr` traduiraient soit
-- une erreur de saisie, soit une tentative de rattachement au domaine d'un
-- autre client — le premier pas vers une confusion de tenant.
-- =============================================================================

create table public.domains (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- Site desservi. NULL est un état légitime : un domaine peut être réservé
  -- pour un client avant que son site n'existe.
  --
  -- ON DELETE SET NULL, jamais CASCADE : archiver un site ne doit pas faire
  -- disparaître le domaine, qui reste enregistré, payé et à renouveler.
  website_id uuid
    references public.websites (id) on delete set null,

  -- Nom de domaine, normalisé en minuscules. Le DNS est insensible à la
  -- casse ; stocker « Client.FR » et « client.fr » comme deux lignes
  -- distinctes ferait échouer l'unicité au moment précis où elle compte.
  domain text not null
    constraint domains_lowercase check (domain = lower(domain))
    constraint domains_format check (
      domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
    )
    constraint domains_length check (char_length(domain) between 4 and 253),

  -- Domaine principal du site. Les autres sont des alias qui redirigent.
  is_primary boolean not null default false,

  -- Bureau d'enregistrement (OVH, Gandi, Cloudflare…). Texte libre : la liste
  -- est ouverte et purement descriptive.
  registrar text
    constraint domains_registrar_length check (char_length(trim(registrar)) between 2 and 60),

  -- ---- Les trois voyants de §17 ----
  status public.domain_status not null default 'UNKNOWN',
  dns_status public.dns_status not null default 'UNKNOWN',
  ssl_status public.ssl_status not null default 'UNKNOWN',

  -- ---- Provenance de l'information ----
  verification_source public.verification_source not null default 'NONE',
  checked_at timestamptz,

  -- ---- Renouvellement ----
  -- NULL tant que la date n'est pas connue. Ne jamais estimer une expiration :
  -- un domaine annoncé valide un an de plus qu'en réalité, c'est un site
  -- hors ligne sans préavis.
  expires_at timestamptz,

  -- NULL = inconnu, distinct de false = renouvellement désactivé. Un booléen
  -- non nullable écraserait cette différence, et « auto-renouvellement : non »
  -- s'afficherait pour un domaine dont on ignore simplement le réglage.
  auto_renew boolean,

  -- Serveurs de noms constatés, tableau de chaînes.
  nameservers text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ---- Cohérence de la vérification ----
  constraint domains_checked_at_matches_source check (
    (verification_source = 'NONE') = (checked_at is null)
  ),

  -- Aucune vérification ⇒ les trois voyants restent 'UNKNOWN'.
  -- C'est cette contrainte qui rend « 🟢 DNS configuré » impossible à afficher
  -- avant qu'une intégration ne l'ait réellement constaté.
  constraint domains_unverified_statuses_are_unknown check (
    verification_source <> 'NONE'
    or (status = 'UNKNOWN' and dns_status = 'UNKNOWN' and ssl_status = 'UNKNOWN')
  ),

  -- Un domaine principal doit desservir un site : « principal » n'a pas de
  -- sens hors du site qu'il désigne.
  constraint domains_primary_requires_website check (
    not is_primary or website_id is not null
  ),

  constraint domains_nameservers_not_empty check (
    nameservers is null or array_length(nameservers, 1) > 0
  )
);

comment on table public.domains is
  'Domaines clients. Statuts UNKNOWN par défaut ; contraintes interdisant tout voyant affirmatif sans vérification (§17).';
comment on column public.domains.auto_renew is
  'NULL = réglage inconnu, distinct de false = renouvellement désactivé. Ne jamais confondre les deux à l''affichage.';
comment on column public.domains.expires_at is
  'NULL tant que la date réelle n''est pas connue. Ne jamais estimer une expiration.';

-- Un domaine n'appartient qu'à une organisation, à l'échelle de la plateforme.
create unique index domains_domain_key on public.domains (domain);

create index domains_organization_id_idx on public.domains (organization_id);
create index domains_website_id_idx on public.domains (website_id)
  where website_id is not null;

-- Un seul domaine principal par site.
create unique index domains_one_primary_per_website
  on public.domains (website_id)
  where is_primary and website_id is not null;

-- Alimente l'écran des expirations proches (§32). L'index partiel écarte les
-- domaines sans date connue, qui ne peuvent pas figurer dans cette liste.
create index domains_expires_at_idx on public.domains (expires_at)
  where expires_at is not null;

create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Cohérence du rattachement site ↔ domaine
-- -----------------------------------------------------------------------------
-- `organization_id` et `website_id` sont deux clés étrangères indépendantes.
-- Rien, au niveau du schéma, n'empêche de rattacher un domaine de
-- l'organisation A à un site de l'organisation B : chaque clé est valide prise
-- isolément, mais leur combinaison franchit une frontière de tenant.
--
-- Le client B verrait alors ce domaine sur sa page « Mon site », et une
-- opération sur le site B toucherait un domaine facturé à A.
create or replace function public.guard_domain_website_tenant()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_website_org uuid;
begin
  if new.website_id is null then
    return new;
  end if;

  select w.organization_id
    into v_website_org
    from public.websites w
   where w.id = new.website_id;

  if v_website_org is distinct from new.organization_id then
    raise exception
      'Le site désigné appartient à une autre organisation : rattachement inter-tenant refusé.'
      using errcode = '23514';  -- check_violation
  end if;

  return new;
end;
$$;

create trigger domains_guard_tenant
  before insert or update on public.domains
  for each row execute function public.guard_domain_website_tenant();


-- -----------------------------------------------------------------------------
-- RLS : domains
-- -----------------------------------------------------------------------------
alter table public.domains enable row level security;
alter table public.domains force row level security;

revoke all on table public.domains from anon;
grant select, insert, update, delete on table public.domains to authenticated;

create policy domains_select_member
  on public.domains for select to authenticated
  using (public.is_org_member(organization_id));

create policy domains_select_staff
  on public.domains for select to authenticated
  using (public.is_platform_staff());

-- Écriture réservée à HBG Labs : la configuration DNS et le renouvellement
-- sont des opérations d'exploitation, pas des réglages en libre-service.
create policy domains_insert_admin
  on public.domains for insert to authenticated
  with check (public.is_platform_admin());

create policy domains_update_admin
  on public.domains for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy domains_delete_owner
  on public.domains for delete to authenticated
  using (public.is_platform_owner());
