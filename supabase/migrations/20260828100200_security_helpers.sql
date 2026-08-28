-- =============================================================================
-- 03 — Fonctions de sécurité, triggers anti-escalade, RLS des tables d'identité
-- =============================================================================
-- Le fichier le plus important du schéma. Tout le reste en dépend.
--
--
-- POURQUOI DES FONCTIONS PLUTÔT QUE DU SQL DANS LES POLICIES
--
-- Écrite naïvement, une policy sur `organization_members` qui interroge
-- `organization_members` boucle à l'infini : la sous-requête déclenche
-- l'évaluation de la policy, qui relance la sous-requête. PostgreSQL rend la
-- table inutilisable avec « infinite recursion detected in policy ».
--
-- Les fonctions ci-dessous sont SECURITY DEFINER : elles s'exécutent avec les
-- droits de leur propriétaire (postgres, superutilisateur), qui n'est pas
-- soumis à la RLS. La lecture interne de `organization_members` ne redéclenche
-- donc aucune policy. Récursion impossible par construction.
--
-- `set search_path` est obligatoire sur toute fonction SECURITY DEFINER : sans
-- lui, un appelant pourrait créer un schéma temporaire contenant une table
-- `organization_members` de son cru et détourner la résolution des noms.
--
--
-- SECURITY DEFINER OU INVOKER — LE PIÈGE À CONNAÎTRE
--
-- Dans une fonction SECURITY DEFINER, `current_user` vaut le PROPRIÉTAIRE, pas
-- l'appelant. Toute fonction devant identifier le rôle de connexion réel
-- (`is_trusted_backend`, et les triggers de garde) est donc volontairement
-- SECURITY INVOKER. `auth.uid()`, lui, lit un paramètre de session et reste
-- fiable dans les deux modes.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Contexte d'appel
-- -----------------------------------------------------------------------------

-- La requête provient-elle d'un backend de confiance (service_role, ou une
-- connexion directe à la base) ?
--
-- Les triggers de garde laissent passer ces contextes : le webhook Stripe et
-- les migrations doivent pouvoir écrire ce qu'ils ont à écrire, et ils
-- contournent déjà la RLS de toute façon.
--
--
-- POURQUOI PAS `current_user`
--
-- C'était l'implémentation évidente, et elle est fausse. `current_user` vaut
-- le PROPRIÉTAIRE à l'intérieur d'une fonction SECURITY DEFINER — soit
-- postgres, un superutilisateur. Toute garde appelée depuis un contexte
-- DEFINER aurait donc considéré n'importe quel client comme un backend de
-- confiance, et se serait laissé traverser sans rien vérifier. Un contrôle de
-- sécurité qui échoue en autorisant est pire qu'absent : il donne l'illusion
-- d'une protection.
--
-- Le rôle réel de la requête est lu dans les revendications du JWT, que
-- PostgREST pose en paramètre de session. Contrairement à `current_user`, ce
-- paramètre n'est pas altéré par un changement de contexte de sécurité : il
-- reste exact dans une fonction DEFINER comme dans un trigger INVOKER.
--
-- Absence de revendications = connexion directe (psql, migrations, seed), qui
-- suppose déjà un accès administrateur à la base.
create or replace function public.is_trusted_backend()
returns boolean
language plpgsql
stable
set search_path = pg_catalog, pg_temp
as $$
declare
  v_claims text := nullif(current_setting('request.jwt.claims', true), '');
  v_role text;
begin
  -- Aucune revendication : la requête ne vient pas de l'API, mais d'une
  -- connexion directe à PostgreSQL.
  if v_claims is null then
    return true;
  end if;

  begin
    v_role := v_claims::jsonb ->> 'role';
  exception
    when others then
      -- Revendications illisibles : on refuse. Un contrôle de sécurité qui
      -- ne comprend pas son entrée doit dire non.
      return false;
  end;

  return v_role = 'service_role';
end;
$$;

comment on function public.is_trusted_backend is
  'True pour service_role ou une connexion directe. Lit le rôle dans les revendications JWT, et NON current_user : ce dernier vaut le propriétaire dans une fonction SECURITY DEFINER et rendrait la garde inopérante.';


-- -----------------------------------------------------------------------------
-- Rôles plateforme (personnel HBG Labs)
-- -----------------------------------------------------------------------------

-- Rôle plateforme de l'utilisateur courant, NULL s'il est client.
create or replace function public.current_platform_role()
returns public.platform_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.platform_role
    from public.profiles p
   where p.id = (select auth.uid());
$$;

-- Appartient à l'équipe HBG Labs, quel que soit son rôle.
-- Ouvre la LECTURE transversale sur toutes les organisations.
create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and p.platform_role is not null
  );
$$;

-- Administre la plateforme (OWNER ou ADMIN).
-- Ouvre l'ÉCRITURE sur les données clients. STAFF et SUPPORT en sont exclus :
-- le support répond aux tickets, il ne modifie pas les sites ni les contrats.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and p.platform_role in ('OWNER', 'ADMIN')
  );
$$;

-- Direction HBG Labs. Seul rôle habilité à promouvoir ou révoquer du personnel.
--
-- Volontairement plus restrictif que is_platform_admin : sans cette
-- séparation, tout ADMIN pourrait se promouvoir OWNER, et la distinction
-- entre les deux rôles ne signifierait plus rien.
create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and p.platform_role = 'OWNER'
  );
$$;


-- -----------------------------------------------------------------------------
-- Appartenance aux organisations (le cœur du multi-tenant)
-- -----------------------------------------------------------------------------

-- L'utilisateur courant est-il membre actif de cette organisation ?
--
-- Fonction la plus appelée de la base : elle est évaluée par la RLS sur chaque
-- ligne de chaque table métier. Elle s'appuie sur l'index partiel
-- `organization_members_user_id_idx` (statut ACTIVE uniquement).
--
-- Seul le statut ACTIVE ouvre l'accès : un membre INVITED n'a pas encore
-- rejoint, un REVOKED a été exclu.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = p_organization_id
       and m.user_id = (select auth.uid())
       and m.status = 'ACTIVE'
  );
$$;

-- Membre disposant de droits de gestion (OWNER ou MANAGER).
create or replace function public.is_org_manager(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = p_organization_id
       and m.user_id = (select auth.uid())
       and m.status = 'ACTIVE'
       and m.role in ('OWNER', 'MANAGER')
  );
$$;

-- Dirigeant de l'organisation. Seul habilité à gérer les membres et la
-- facturation côté client.
create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.organization_members m
     where m.organization_id = p_organization_id
       and m.user_id = (select auth.uid())
       and m.status = 'ACTIVE'
       and m.role = 'OWNER'
  );
$$;

-- Organisations de l'utilisateur courant.
-- Utile côté application (`select * from websites where organization_id in
-- (select current_org_ids())`) ; la RLS filtre de toute façon, mais restreindre
-- explicitement évite de balayer des lignes qui seront écartées.
create or replace function public.current_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.organization_id
    from public.organization_members m
   where m.user_id = (select auth.uid())
     and m.status = 'ACTIVE';
$$;

-- Deux utilisateurs partagent-ils une organisation ?
--
-- Nécessaire pour que les collaborateurs d'une même entreprise se voient dans
-- « Mon entreprise » (§15). Passer par une fonction SECURITY DEFINER, plutôt
-- que par un EXISTS dans la policy de `profiles`, évite que la lecture de
-- `organization_members` ne déclenche à son tour l'évaluation des policies
-- de cette table.
create or replace function public.shares_organization_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
     where mine.user_id = (select auth.uid())
       and mine.status = 'ACTIVE'
       and theirs.user_id = p_user_id
       and theirs.status = 'ACTIVE'
  );
$$;


-- -----------------------------------------------------------------------------
-- Privilèges d'exécution
-- -----------------------------------------------------------------------------
-- PostgreSQL accorde EXECUTE à PUBLIC par défaut sur toute fonction créée.
-- Sur des fonctions SECURITY DEFINER, ce défaut est trop large : on le retire
-- puis on accorde explicitement.
--
-- `anon` n'obtient rien : ces fonctions répondent toutes sur `auth.uid()`, qui
-- vaut NULL pour un visiteur non authentifié.
revoke execute on function
  public.current_platform_role(),
  public.is_platform_staff(),
  public.is_platform_admin(),
  public.is_platform_owner(),
  public.is_org_member(uuid),
  public.is_org_manager(uuid),
  public.is_org_owner(uuid),
  public.current_org_ids(),
  public.shares_organization_with(uuid),
  public.is_trusted_backend()
from public;

grant execute on function
  public.current_platform_role(),
  public.is_platform_staff(),
  public.is_platform_admin(),
  public.is_platform_owner(),
  public.is_org_member(uuid),
  public.is_org_manager(uuid),
  public.is_org_owner(uuid),
  public.current_org_ids(),
  public.shares_organization_with(uuid),
  public.is_trusted_backend()
to authenticated, service_role;


-- =============================================================================
-- TRIGGERS DE GARDE — ce que la RLS ne sait pas faire
-- =============================================================================
-- La RLS raisonne par LIGNE : elle autorise ou refuse l'accès à un
-- enregistrement entier. Elle ne sait pas dire « cette ligne est modifiable,
-- sauf cette colonne ».
--
-- Or les trois colonnes ci-dessous se trouvent sur des lignes que
-- l'utilisateur a parfaitement le droit de modifier. Sans garde au niveau
-- colonne, la RLS les laisse passer.
--
-- Ces triggers sont SECURITY INVOKER (défaut) : ils appellent
-- `is_trusted_backend()`, qui a besoin du `current_user` réel.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Garde 1 — profiles.platform_role
-- -----------------------------------------------------------------------------
-- LA faille à empêcher. Un client a le droit de modifier son propre profil
-- (changer son nom, son téléphone). La policy UPDATE l'autorise sur la ligne
-- `id = auth.uid()`. Rien, en RLS seule, ne l'empêche alors d'exécuter :
--
--     update profiles set platform_role = 'OWNER' where id = auth.uid();
--
-- Sa ligne, sa policy, requête acceptée — et il devient administrateur de
-- HBG Labs avec accès à toutes les données de tous les clients.
--
-- Seul un OWNER plateforme peut modifier cette colonne.
create or replace function public.guard_platform_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- IS NOT DISTINCT FROM, et non `=` : `=` renvoie NULL quand une des deux
  -- valeurs est NULL, ce qui est le cas courant ici (les clients ont
  -- platform_role NULL). Avec `=`, la condition ne serait jamais vraie et le
  -- trigger lèverait une exception à chaque modification de profil.
  if new.platform_role is not distinct from old.platform_role then
    return new;
  end if;

  if public.is_trusted_backend() or public.is_platform_owner() then
    return new;
  end if;

  raise exception
    'Modification de platform_role interdite : seul un OWNER plateforme peut attribuer un rôle.'
    using errcode = '42501';  -- insufficient_privilege
end;
$$;

create trigger profiles_guard_platform_role
  before update on public.profiles
  for each row execute function public.guard_platform_role();


-- -----------------------------------------------------------------------------
-- Garde 2 — organization_members : clés de rattachement immuables
-- -----------------------------------------------------------------------------
-- Un OWNER d'organisation peut légitimement modifier les lignes de membres de
-- SA structure. S'il pouvait aussi en changer `organization_id`, il déplacerait
-- son propre rattachement vers l'organisation d'un autre client — accès
-- inter-tenant immédiat.
--
-- La clause WITH CHECK de la policy bloque déjà ce cas (elle réévalue la ligne
-- APRÈS modification). Ce trigger est une seconde barrière : il rend le
-- déplacement impossible quelle que soit l'évolution future des policies. Sur
-- la charnière du multi-tenant, une seule défense ne suffit pas.
--
-- Pour changer de rattachement : révoquer l'adhésion, en créer une nouvelle.
create or replace function public.guard_membership_keys()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception
      'organization_id est immuable : révoquez l''adhésion et créez-en une nouvelle.'
      using errcode = '42501';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception
      'user_id est immuable : révoquez l''adhésion et créez-en une nouvelle.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger organization_members_guard_keys
  before update on public.organization_members
  for each row execute function public.guard_membership_keys();


-- -----------------------------------------------------------------------------
-- Garde 3 — organizations.stripe_customer_id
-- -----------------------------------------------------------------------------
-- Ce champ relie une organisation à son Customer Stripe. Le réassigner
-- rattacherait les abonnements et factures d'un client à un autre : fuite de
-- données financières dans un sens, facturation erronée dans l'autre.
--
-- Il n'est écrit que par le webhook Stripe (service_role). Aucun utilisateur,
-- pas même un OWNER plateforme, n'a de raison légitime de le modifier depuis
-- l'application (§20, §36).
create or replace function public.guard_stripe_customer_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.stripe_customer_id is not distinct from old.stripe_customer_id then
    return new;
  end if;

  if public.is_trusted_backend() then
    return new;
  end if;

  raise exception
    'stripe_customer_id est réservé au backend Stripe (service_role).'
    using errcode = '42501';
end;
$$;

create trigger organizations_guard_stripe_customer_id
  before update on public.organizations
  for each row execute function public.guard_stripe_customer_id();


-- -----------------------------------------------------------------------------
-- Garde 4 — une organisation conserve toujours un OWNER
-- -----------------------------------------------------------------------------
-- Intégrité des données (§57). Une organisation sans OWNER devient
-- ingérable : plus personne ne peut inviter de membre ni gérer l'abonnement,
-- et seule une intervention manuelle en base peut la réparer.
--
-- Couvre les deux voies d'y parvenir : rétrograder le dernier OWNER, ou
-- supprimer/révoquer son adhésion.
create or replace function public.guard_last_org_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid := old.organization_id;
  v_other_owners integer;
begin
  -- La ligne n'était pas un OWNER actif : sa disparition ne retire rien.
  if old.role <> 'OWNER' or old.status <> 'ACTIVE' then
    return null;
  end if;

  -- Sur DELETE, `new` n'est pas assigné : PL/pgSQL lève une erreur à la
  -- moindre référence, y compris dans une expression que l'on croirait
  -- court-circuitée. Le test est donc isolé dans une branche gardée par TG_OP.
  if tg_op = 'UPDATE' then
    if new.role = 'OWNER' and new.status = 'ACTIVE' then
      return null;  -- toujours OWNER actif : rien à protéger
    end if;
  end if;

  select count(*)
    into v_other_owners
    from public.organization_members m
   where m.organization_id = v_organization_id
     and m.id <> old.id
     and m.role = 'OWNER'
     and m.status = 'ACTIVE';

  if v_other_owners = 0 then
    -- La suppression en cascade d'une organisation supprime ses adhésions :
    -- ce n'est pas une perte d'OWNER, c'est la fin du tenant. Sans cette
    -- exception, `delete from organizations` échouerait systématiquement.
    if tg_op = 'DELETE'
       and not exists (select 1 from public.organizations o where o.id = v_organization_id)
    then
      return null;
    end if;

    raise exception
      'Une organisation doit conserver au moins un OWNER actif. Promouvez un autre membre au préalable.'
      using errcode = '23514';  -- check_violation
  end if;

  -- Trigger AFTER : la valeur de retour est ignorée par PostgreSQL.
  return null;
end;
$$;

-- AFTER, et non BEFORE : sur DELETE en cascade, la ligne `organizations` doit
-- déjà avoir disparu pour que l'exception ci-dessus soit reconnue.
create constraint trigger organization_members_guard_last_owner
  after update or delete on public.organization_members
  deferrable initially immediate
  for each row execute function public.guard_last_org_owner();


-- =============================================================================
-- ROW LEVEL SECURITY — tables d'identité
-- =============================================================================
-- Convention appliquée à TOUTES les tables du schéma :
--
--   * ENABLE  + FORCE row level security
--     FORCE soumet aussi le propriétaire de la table à ses propres policies.
--     service_role (BYPASSRLS) et postgres (SUPERUSER) restent au-dessus, ce
--     qui est voulu : le webhook Stripe et les migrations doivent écrire.
--
--   * Privilèges retirés à `anon` sur toute table contenant des données
--     clients. Supabase accorde par défaut tous les privilèges à `anon` et
--     `authenticated` sur les nouvelles tables de `public` ; seule la RLS s'y
--     oppose. Retirer le privilège en plus de la policy, c'est ne pas faire
--     dépendre l'isolation d'un unique mécanisme.
--
--   * Policies nommées `<table>_<opération>_<audience>`.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- RLS : profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;

-- Lecture de son propre profil.
create policy profiles_select_self
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

-- Lecture des collègues de la même organisation (§15 « Mon entreprise »).
-- Ne franchit aucune frontière de tenant : la fonction exige une organisation
-- commune.
create policy profiles_select_colleagues
  on public.profiles for select to authenticated
  using (public.shares_organization_with(id));

-- Le personnel HBG Labs lit tous les profils (§28 gestion des clients).
create policy profiles_select_staff
  on public.profiles for select to authenticated
  using (public.is_platform_staff());

-- Modification de son propre profil.
-- La colonne platform_role reste protégée par le trigger `guard_platform_role`.
create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_admin
  on public.profiles for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Aucune policy INSERT ni DELETE, volontairement.
--   INSERT : réservé au trigger `handle_new_user` (SECURITY DEFINER, hors RLS).
--            Un profil ne peut donc exister sans compte auth correspondant.
--   DELETE : la suppression se fait sur auth.users et se propage en cascade.


-- -----------------------------------------------------------------------------
-- RLS : organizations
-- -----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organizations force row level security;

revoke all on table public.organizations from anon;
grant select, insert, update on table public.organizations to authenticated;

create policy organizations_select_member
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

create policy organizations_select_staff
  on public.organizations for select to authenticated
  using (public.is_platform_staff());

-- Le dirigeant client tient à jour ses informations légales et ses
-- coordonnées. stripe_customer_id reste verrouillé par trigger.
create policy organizations_update_owner
  on public.organizations for update to authenticated
  using (public.is_org_owner(id))
  with check (public.is_org_owner(id));

create policy organizations_update_admin
  on public.organizations for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Création réservée à HBG Labs depuis l'interface d'administration.
-- Les clients passent par la fonction `create_organization` ci-dessous, qui
-- crée l'organisation ET l'adhésion OWNER dans la même transaction.
create policy organizations_insert_admin
  on public.organizations for insert to authenticated
  with check (public.is_platform_admin());

-- Aucune policy DELETE : un client se retire en passant au statut ARCHIVED.
-- Supprimer l'organisation emporterait en cascade ses factures et son
-- historique de paiements, que la loi impose de conserver.


-- -----------------------------------------------------------------------------
-- RLS : organization_members
-- -----------------------------------------------------------------------------
alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;

revoke all on table public.organization_members from anon;
grant select, insert, update, delete on table public.organization_members to authenticated;

-- Les membres d'une organisation se voient entre eux.
create policy organization_members_select_member
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));

create policy organization_members_select_staff
  on public.organization_members for select to authenticated
  using (public.is_platform_staff());

-- Invitation d'un membre par le dirigeant.
-- WITH CHECK porte sur la ligne CRÉÉE : impossible d'insérer une adhésion
-- dans une organisation dont on n'est pas OWNER.
create policy organization_members_insert_owner
  on public.organization_members for insert to authenticated
  with check (public.is_org_owner(organization_id));

create policy organization_members_insert_admin
  on public.organization_members for insert to authenticated
  with check (public.is_platform_admin());

-- USING contrôle la ligne AVANT modification, WITH CHECK la ligne APRÈS.
-- Les deux sont nécessaires : sans WITH CHECK, un OWNER pourrait réécrire
-- `organization_id` vers un autre tenant. Le trigger `guard_membership_keys`
-- couvre le même cas en second rideau.
create policy organization_members_update_owner
  on public.organization_members for update to authenticated
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

create policy organization_members_update_admin
  on public.organization_members for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy organization_members_delete_owner
  on public.organization_members for delete to authenticated
  using (public.is_org_owner(organization_id));

create policy organization_members_delete_admin
  on public.organization_members for delete to authenticated
  using (public.is_platform_admin());


-- -----------------------------------------------------------------------------
-- Création d'organisation par un client
-- -----------------------------------------------------------------------------
-- Créer une organisation et son adhésion OWNER doit être ATOMIQUE. En deux
-- appels depuis le client, un échec réseau entre les deux laisserait une
-- organisation orpheline, sans propriétaire, invisible de son créateur et
-- impossible à réparer sans intervention manuelle.
--
-- Cette fonction est le seul chemin par lequel un utilisateur non-staff crée
-- une organisation (la policy INSERT est réservée aux admins plateforme).
create or replace function public.create_organization(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_owned_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  -- Garde-fou anti-abus : un compte compromis ou un script pourrait créer des
  -- organisations en boucle. Le plafond est large pour un usage légitime
  -- (un client gérant plusieurs entités) et bas pour un abus.
  select count(*)
    into v_owned_count
    from public.organization_members m
   where m.user_id = v_user_id
     and m.role = 'OWNER'
     and m.status = 'ACTIVE';

  if v_owned_count >= 5 then
    raise exception
      'Limite de 5 organisations atteinte. Contactez HBG Labs pour en créer davantage.'
      using errcode = '54000';  -- program_limit_exceeded
  end if;

  insert into public.organizations (name, slug, created_by)
  values (trim(p_name), lower(trim(p_slug)), v_user_id)
  returning id into v_organization_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_organization_id, v_user_id, 'OWNER', 'ACTIVE');

  return v_organization_id;
end;
$$;

comment on function public.create_organization is
  'Crée une organisation et son adhésion OWNER de façon atomique. Seul chemin de création pour un utilisateur non-staff.';

revoke execute on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;
