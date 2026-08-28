-- =============================================================================
-- 05 — websites (§16, §34)
-- =============================================================================
-- Le site web d'un client. Champs de §34, complétés par ce que la page
-- « Mon site » (§16) doit afficher : hébergeur, SSL, dernier déploiement,
-- disponibilité.
--
--
-- LA RÈGLE DU FAUX VOYANT, APPLIQUÉE PAR CONTRAINTE
--
-- §17 et §57 sont sans ambiguïté : tant qu'aucune intégration ne vérifie
-- réellement l'état, l'interface affiche « Vérification non configurée » et
-- non « actif ».
--
-- Laisser cette règle au frontend, c'est attendre qu'elle soit oubliée. Le
-- premier composant qui affichera `status === 'ONLINE' ? '🟢 En ligne' : ...`
-- annoncera un site en ligne sur la foi d'un champ que personne n'a vérifié.
--
-- Les contraintes CHECK ci-dessous rendent l'état incohérent IMPOSSIBLE À
-- ÉCRIRE : tant que `verification_source = 'NONE'`, `ssl_status` ne peut
-- valoir que 'UNKNOWN' et `checked_at` reste NULL. Le frontend n'a alors plus
-- de moyen d'afficher un voyant vert, puisque la donnée qui l'autoriserait ne
-- peut pas exister en base.
--
--
-- ÉCRITURE RÉSERVÉE À HBG LABS
--
-- Le client ne modifie pas son site depuis l'espace : il consulte, et demande
-- une modification via un ticket CHANGE_REQUEST (§25). C'est le produit décrit
-- par le prompt maître, et cela supprime toute une classe de risques — un
-- client ne peut pas repointer `production_url` ni s'attribuer le projet
-- Vercel d'un autre.
-- =============================================================================

create table public.websites (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  name text not null
    constraint websites_name_length check (char_length(trim(name)) between 2 and 120),

  -- Identifiant lisible, unique au sein de l'organisation.
  slug text not null
    constraint websites_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
    constraint websites_slug_length check (char_length(slug) between 2 and 63),

  status public.website_status not null default 'DRAFT',

  environment public.deploy_environment not null default 'PRODUCTION',

  -- ---- Hébergement (§16, §33) ----
  -- Texte libre plutôt qu'énumération : HBG Labs héberge sur Vercel
  -- aujourd'hui, mais peut reprendre un site déjà hébergé ailleurs lors d'une
  -- migration client. Une énumération obligerait à migrer le schéma pour
  -- enregistrer un fait purement descriptif.
  hosting_provider text not null default 'Vercel'
    constraint websites_hosting_provider_length check (char_length(trim(hosting_provider)) between 2 and 60),

  -- Identifiants Vercel (§33). NULL tant que l'intégration n'est pas établie.
  -- Aucun token ici : les secrets Vercel restent côté serveur (§36).
  vercel_project_id text
    constraint websites_vercel_project_id_length check (char_length(vercel_project_id) between 1 and 100),

  vercel_team_id text
    constraint websites_vercel_team_id_length check (char_length(vercel_team_id) between 1 and 100),

  -- URL de production servie par l'hébergeur (*.vercel.app ou domaine final).
  -- HTTPS imposé : un site client livré en HTTP clair serait un défaut de
  -- conformité, pas une donnée à enregistrer telle quelle.
  production_url text
    constraint websites_production_url_https check (production_url ~ '^https://[^[:space:]]+$'),

  repository_url text
    constraint websites_repository_url_format check (repository_url ~ '^https://[^[:space:]]+$'),

  -- ---- Dernier déploiement (§16, §29) ----
  last_deployment_id text
    constraint websites_last_deployment_id_length check (char_length(last_deployment_id) between 1 and 100),

  last_deployed_at timestamptz,

  -- ---- État vérifié (§17, §57) ----
  ssl_status public.ssl_status not null default 'UNKNOWN',

  -- D'où provient l'information ci-dessus. 'NONE' = rien n'a été vérifié.
  verification_source public.verification_source not null default 'NONE',

  -- Horodatage de la dernière vérification réelle. NULL si jamais vérifié.
  checked_at timestamptz,

  -- ---- Disponibilité (§16 « uptime si disponible ») ----
  -- « Si disponible » : ces colonnes restent NULL jusqu'à ce qu'une sonde
  -- existe. L'interface masque alors la section — elle n'affiche pas 100 %.
  uptime_percentage numeric(5, 2)
    constraint websites_uptime_percentage_range check (uptime_percentage between 0 and 100),

  uptime_window_days integer
    constraint websites_uptime_window_positive check (uptime_window_days > 0),

  -- Notes internes HBG Labs : ne PAS ajouter ici. La RLS filtre les lignes,
  -- pas les colonnes ; le client lisant sa ligne lirait aussi les notes.
  -- Une table dédiée, réservée au personnel, sera créée le jour venu.

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Deux sites d'une même organisation ne peuvent partager un slug ;
  -- deux organisations différentes le peuvent.
  constraint websites_unique_slug_per_org unique (organization_id, slug),

  -- ---- Cohérence de la vérification ----
  -- Un horodatage existe si et seulement si une vérification a eu lieu.
  -- Interdit les deux incohérences symétriques : prétendre avoir vérifié sans
  -- date, ou porter une date sans source.
  constraint websites_checked_at_matches_source check (
    (verification_source = 'NONE') = (checked_at is null)
  ),

  -- Aucune vérification ⇒ aucun statut affirmatif. C'est la traduction en
  -- contrainte de « ne jamais afficher de fausses informations » (§17).
  constraint websites_unverified_status_is_unknown check (
    verification_source <> 'NONE' or ssl_status = 'UNKNOWN'
  ),

  -- Une disponibilité ne s'affiche qu'accompagnée de sa fenêtre de mesure :
  -- « 99,9 % » sans « sur 30 jours » n'est pas une information exploitable.
  constraint websites_uptime_requires_window check (
    (uptime_percentage is null) = (uptime_window_days is null)
  ),

  -- Une mesure de disponibilité suppose une source de vérification.
  constraint websites_uptime_requires_verification check (
    uptime_percentage is null or verification_source <> 'NONE'
  ),

  -- Une date de déploiement suppose un déploiement identifié.
  constraint websites_deployment_id_with_date check (
    (last_deployed_at is null) or (last_deployment_id is not null)
  )
);

comment on table public.websites is
  'Site web d''un client. Écriture réservée au personnel HBG Labs ; le client consulte et passe par un ticket CHANGE_REQUEST (§25).';
comment on column public.websites.verification_source is
  'NONE = aucune vérification. Les contraintes imposent alors ssl_status = UNKNOWN et checked_at NULL. L''interface DOIT afficher « Vérification non configurée ».';
comment on column public.websites.uptime_percentage is
  'NULL tant qu''aucune sonde n''existe. L''interface masque la section — elle n''affiche jamais 100 % par défaut.';

-- Chargement de la page « Mon site » : filtre systématique sur l'organisation.
create index websites_organization_id_idx on public.websites (organization_id);

-- Tableau /admin/websites, filtré par statut (§29).
create index websites_status_idx on public.websites (status);

-- Un projet Vercel ne pilote qu'un seul site : sans cette unicité, un
-- déploiement remonté par l'API mettrait à jour plusieurs lignes.
create unique index websites_vercel_project_id_key
  on public.websites (vercel_project_id)
  where vercel_project_id is not null;

create trigger websites_set_updated_at
  before update on public.websites
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS : websites
-- -----------------------------------------------------------------------------
alter table public.websites enable row level security;
alter table public.websites force row level security;

revoke all on table public.websites from anon;
grant select on table public.websites to authenticated;
grant insert, update, delete on table public.websites to authenticated;

-- Le client consulte les sites de SON organisation.
create policy websites_select_member
  on public.websites for select to authenticated
  using (public.is_org_member(organization_id));

create policy websites_select_staff
  on public.websites for select to authenticated
  using (public.is_platform_staff());

-- Écriture réservée à HBG Labs. Aucune policy d'écriture pour les membres
-- d'organisation, volontairement : les demandes passent par un ticket (§25).
create policy websites_insert_admin
  on public.websites for insert to authenticated
  with check (public.is_platform_admin());

create policy websites_update_admin
  on public.websites for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy websites_delete_owner
  on public.websites for delete to authenticated
  using (public.is_platform_owner());
