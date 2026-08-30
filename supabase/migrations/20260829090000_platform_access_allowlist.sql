-- =============================================================================
-- 17 — Liste d'autorisation des accès plateforme
-- =============================================================================
-- DURCISSEMENT DEMANDÉ : un seul compte doit pouvoir atteindre l'administration.
--
--
-- CE QUI PROTÉGEAIT DÉJÀ
--
--   * `handle_new_user` n'écrit jamais `platform_role` : aucune inscription ne
--     peut s'attribuer un rôle, quelles que soient les métadonnées envoyées.
--   * `guard_platform_role` réserve l'écriture de cette colonne à un OWNER
--     plateforme.
--   * Toutes les lectures d'administration passent par `is_platform_staff()`.
--
-- Il restait un chemin : un OWNER, ou une session OWNER compromise, pouvait
-- promouvoir n'importe quelle adresse. La sécurité reposait donc sur la
-- discipline de la seule personne habilitée.
--
--
-- CE QUE CETTE MIGRATION AJOUTE
--
-- Une adresse ne peut recevoir un rôle plateforme que si elle figure dans
-- `platform_access`, avec exactement ce rôle. La table n'est accessible ni à
-- `anon` ni à `authenticated` : aucune requête venue du navigateur ne la lit ni
-- ne l'écrit, quelle que soit la session.
--
-- Conséquence voulue : accorder un accès devient un geste en deux temps, dont
-- le premier n'est pas réalisable depuis l'application.
--
--
-- LIMITE, ÉNONCÉE PLUTÔT QUE TUE
--
-- Qui détient la clé `service_role` détient la base : il peut modifier la liste,
-- ou supprimer ce trigger. Cette migration ne prétend pas s'en protéger, et
-- aucune ne le pourrait. Ce qu'elle apporte est réel malgré tout : elle
-- transforme une promotion silencieuse depuis l'application en une intervention
-- délibérée sur le schéma, qui laisse une trace et demande un accès distinct.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- platform_access
-- -----------------------------------------------------------------------------
create table public.platform_access (
  -- L'adresse, et non l'identifiant de compte : la liste doit pouvoir être
  -- constituée avant que la personne ne se soit inscrite. C'est le cas ici,
  -- l'adresse d'administration n'ayant pas encore de compte.
  email text primary key
    constraint platform_access_email_lowercase check (email = lower(email))
    constraint platform_access_email_format check (
      email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),

  -- Le rôle autorisé, exactement. Une adresse inscrite pour SUPPORT ne peut pas
  -- recevoir OWNER : la liste dit qui, et jusqu'où.
  role public.platform_role not null,

  -- Contexte de l'autorisation, pour qu'une relecture dans deux ans ait du sens.
  note text
    constraint platform_access_note_length check (char_length(note) between 2 and 500),

  created_at timestamptz not null default now()
);

comment on table public.platform_access is
  'Adresses autorisées à détenir un rôle plateforme. Inaccessible depuis l''application : seul service_role ou une connexion directe peut la modifier.';
comment on column public.platform_access.email is
  'Adresse autorisée. Peut être inscrite avant que le compte n''existe : le rôle est alors appliqué à la création du profil.';

alter table public.platform_access enable row level security;
alter table public.platform_access force row level security;

-- Aucun privilège, aucune policy. RLS activée sans policy refuse tout accès ;
-- le retrait des privilèges ferme la table par un second mécanisme, indépendant.
revoke all on table public.platform_access from anon, authenticated;


-- -----------------------------------------------------------------------------
-- Application automatique à la création du profil
-- -----------------------------------------------------------------------------
-- Sans ce trigger, l'adresse autorisée devrait être promue à la main après son
-- inscription, ce qui suppose un OWNER déjà en place. Or il n'y en a aucun :
-- l'amorçage serait impossible sans passer par le SQL.
--
-- BEFORE INSERT, et non une mise à jour ultérieure : le rôle est posé pendant
-- l'insertion, sans déclencher `guard_platform_role`, qui ne surveille que les
-- modifications.
--
-- La source du rôle est une table verrouillée, jamais les métadonnées
-- d'inscription. La distinction est essentielle : `raw_user_meta_data` est
-- rempli par le client, `platform_access` ne l'est que par un administrateur de
-- la base.
create or replace function public.apply_platform_access()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  select a.role
    into new.platform_role
    from public.platform_access a
   where a.email = lower(new.email);

  return new;
end;
$$;

comment on function public.apply_platform_access is
  'Applique le rôle autorisé à la création du profil. Source : la table verrouillée platform_access, jamais les métadonnées d''inscription.';

-- Nom préfixé `aa_` pour passer avant les autres triggers BEFORE INSERT :
-- PostgreSQL les exécute dans l'ordre alphabétique de leur nom.
create trigger aa_profiles_apply_platform_access
  before insert on public.profiles
  for each row execute function public.apply_platform_access();


-- -----------------------------------------------------------------------------
-- L'adresse du profil devient immuable
-- -----------------------------------------------------------------------------
-- `profiles.email` est une copie de `auth.users.email`. La policy
-- `profiles_update_self` laisse chacun modifier sa propre ligne, colonne email
-- comprise : un client pouvait donc y écrire l'adresse d'administration.
--
-- Cela ne lui accordait aucun rôle, la colonne `platform_role` restant
-- verrouillée. Mais la liste d'autorisation raisonne désormais sur cette
-- adresse, et une copie modifiable serait un maillon faible évident.
--
-- Le changement d'adresse passe par Supabase Auth, qui exige une confirmation
-- sur la nouvelle boîte, puis se propage par `service_role`.
create or replace function public.guard_profile_email()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.email is not distinct from old.email then
    return new;
  end if;

  if public.is_trusted_backend() then
    return new;
  end if;

  raise exception
    'L''adresse électronique se modifie depuis les paramètres du compte, pas directement sur le profil.'
    using errcode = '42501';
end;
$$;

create trigger profiles_guard_email
  before update on public.profiles
  for each row execute function public.guard_profile_email();


-- -----------------------------------------------------------------------------
-- Attribution d'un rôle : la liste fait foi
-- -----------------------------------------------------------------------------
-- Remplace la garde de la migration 03. Deux différences :
--
--   1. L'attribution exige désormais que l'adresse figure dans la liste avec
--      exactement le rôle demandé. Cette condition s'applique à TOUS, y compris
--      `service_role` : accorder un accès demande d'abord d'inscrire l'adresse.
--
--   2. Le RETRAIT reste ouvert à un OWNER et au backend, sans consulter la
--      liste. Révoquer un accès ne doit jamais être plus difficile que
--      l'accorder, surtout en situation d'incident.
create or replace function public.guard_platform_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- IS NOT DISTINCT FROM, et non `=` : `=` renvoie NULL dès qu'une des valeurs
  -- l'est, ce qui est le cas courant ici, et la garde bloquerait alors toute
  -- modification de profil.
  if new.platform_role is not distinct from old.platform_role then
    return new;
  end if;

  -- ---- Retrait d'un rôle ----
  if new.platform_role is null then
    if public.is_trusted_backend() or public.is_platform_owner() then
      return new;
    end if;

    raise exception
      'Le retrait d''un rôle plateforme est réservé à un OWNER.'
      using errcode = '42501';
  end if;

  -- ---- Attribution d'un rôle ----
  if not exists (
    select 1
      from public.platform_access a
     where a.email = lower(new.email)
       and a.role = new.platform_role
  ) then
    raise exception
      'Attribution refusée : % ne figure pas dans la liste d''accès plateforme pour le rôle %. Inscrivez d''abord cette adresse dans platform_access.',
      new.email, new.platform_role
      using errcode = '42501';
  end if;

  if public.is_trusted_backend() or public.is_platform_owner() then
    return new;
  end if;

  raise exception
    'Modification de platform_role interdite : seul un OWNER plateforme peut attribuer un rôle.'
    using errcode = '42501';
end;
$$;

comment on function public.guard_platform_role is
  'Un rôle plateforme ne s''attribue qu''à une adresse inscrite dans platform_access, avec ce rôle exact. Le retrait reste ouvert à un OWNER.';


-- -----------------------------------------------------------------------------
-- Amorçage
-- -----------------------------------------------------------------------------
-- L'unique adresse autorisée. Le compte correspondant n'existe pas encore : le
-- rôle sera appliqué automatiquement à son inscription.
--
-- Pour ajouter un collaborateur plus tard, une ligne depuis le SQL Editor
-- Supabase suffit :
--
--   insert into public.platform_access (email, role, note)
--   values ('collegue@exemple.fr', 'SUPPORT', 'Support client, embauche 2027');
--
-- Puis, si le compte existe déjà, lui appliquer le rôle :
--
--   update public.profiles set platform_role = 'SUPPORT'
--    where email = 'collegue@exemple.fr';
insert into public.platform_access (email, role, note)
values ('hbglabs@gmail.com', 'OWNER', 'Direction HBG Labs, seul accès plateforme')
on conflict (email) do update
  set role = excluded.role,
      note = excluded.note;
