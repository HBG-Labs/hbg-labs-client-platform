-- =============================================================================
-- 13 — audit_logs (§44)
-- =============================================================================
-- Journal des actions sensibles : connexion, changement d'abonnement,
-- modification de profil, création et changement de statut de ticket, action
-- d'administration, modification de site.
--
--
-- APPEND-ONLY, SANS EXCEPTION
--
-- Un journal modifiable ne prouve rien. Si l'auteur d'une action peut
-- réécrire ou effacer sa trace, le journal ne sert plus qu'à enregistrer les
-- gestes de ceux qui n'ont rien à cacher.
--
-- Cette table n'a donc AUCUNE policy UPDATE ni DELETE, pour aucun rôle —
-- OWNER plateforme compris. Les privilèges correspondants sont retirés à
-- `authenticated` en plus de l'absence de policy.
--
-- Elle n'a pas non plus de policy INSERT. L'écriture passe exclusivement par
-- `public.log_audit_event()`, SECURITY DEFINER, qui impose l'auteur réel :
-- une insertion directe permettrait d'attribuer une action à quelqu'un
-- d'autre, ce qui est pire que pas de journal du tout.
--
--
-- L'ADRESSE IP EST UNE DONNÉE PERSONNELLE
--
-- §44 la mentionne « si légalement approprié ». Sous RGPD, elle est une donnée
-- personnelle : sa collecte suppose une base légale (ici l'intérêt légitime à
-- la sécurité) et une durée de conservation limitée.
--
-- La colonne est nullable et n'est renseignée que pour les événements de
-- sécurité — authentification, action d'administration. Elle n'est jamais
-- exposée au client : seul le personnel plateforme lit cette table.
-- =============================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  -- Contexte d'organisation. NULL pour une action hors tenant (connexion,
  -- opération d'administration transverse).
  --
  -- ON DELETE SET NULL, jamais CASCADE : la suppression d'une organisation ne
  -- doit pas emporter la trace des actions qui l'ont visée — c'est
  -- précisément le moment où le journal compte le plus.
  organization_id uuid
    references public.organizations (id) on delete set null,

  -- Auteur. SET NULL pour la même raison : un compte supprimé n'efface pas
  -- ses actions passées.
  actor_user_id uuid
    references public.profiles (id) on delete set null,

  -- Email de l'auteur, figé au moment de l'action. `actor_user_id` peut passer
  -- à NULL ; sans cette copie, la ligne deviendrait anonyme et le journal
  -- perdrait sa valeur probante.
  actor_email text,

  -- Rôle plateforme de l'auteur au moment de l'action. Figé également : la
  -- question « qui était habilité à faire cela, à cette date ? » ne se répond
  -- pas avec le rôle d'aujourd'hui.
  actor_platform_role public.platform_role,

  -- Verbe de l'action, en MAJUSCULES_SOULIGNÉES.
  -- USER_SIGNED_IN, SUBSCRIPTION_CHANGED, PROFILE_UPDATED, TICKET_CREATED,
  -- TICKET_STATUS_CHANGED, WEBSITE_UPDATED, MEMBER_INVITED… (docs/DATABASE.md)
  action text not null
    constraint audit_logs_action_format check (action ~ '^[A-Z][A-Z0-9_]{2,63}$'),

  -- Objet visé : 'website', 'subscription', 'support_ticket'…
  resource_type text
    constraint audit_logs_resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]{1,40}$'),

  -- Texte et non uuid : certaines ressources sont désignées par un
  -- identifiant Stripe (« sub_1A2b3C »), qui n'est pas un UUID.
  resource_id text
    constraint audit_logs_resource_id_length check (char_length(resource_id) between 1 and 200),

  -- Contexte libre : valeurs avant/après, motif, référence externe.
  -- NE JAMAIS Y ÉCRIRE de secret, de mot de passe, de jeton, ni de donnée
  -- bancaire — le journal est conservé longtemps et lu largement.
  metadata jsonb not null default '{}'::jsonb
    constraint audit_logs_metadata_is_object check (jsonb_typeof(metadata) = 'object'),

  -- Données personnelles : voir l'avertissement en tête de fichier.
  ip_address inet,

  user_agent text
    constraint audit_logs_user_agent_length check (char_length(user_agent) between 1 and 500),

  created_at timestamptz not null default now()

  -- Pas de `updated_at` : une ligne de journal ne se modifie pas.
);

comment on table public.audit_logs is
  'Journal append-only (§44). Aucune policy INSERT/UPDATE/DELETE : écriture par log_audit_event() uniquement, lecture réservée au personnel.';
comment on column public.audit_logs.actor_email is
  'Email figé au moment de l''action : actor_user_id peut devenir NULL, la ligne doit rester attribuable.';
comment on column public.audit_logs.metadata is
  'Contexte libre. Ne jamais y écrire de secret, jeton ou donnée bancaire.';

-- Consultation du journal d'une organisation, du plus récent au plus ancien.
create index audit_logs_organization_created_idx
  on public.audit_logs (organization_id, created_at desc)
  where organization_id is not null;

-- « Qu'a fait cet utilisateur ? »
create index audit_logs_actor_created_idx
  on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

-- « Que s'est-il passé sur cet objet ? »
create index audit_logs_resource_idx
  on public.audit_logs (resource_type, resource_id, created_at desc)
  where resource_type is not null;

create index audit_logs_action_created_idx
  on public.audit_logs (action, created_at desc);


-- -----------------------------------------------------------------------------
-- log_audit_event — seul chemin d'écriture
-- -----------------------------------------------------------------------------
-- L'appelant fournit CE QUI s'est passé. La fonction détermine QUI l'a fait,
-- depuis `auth.uid()`, et non depuis un paramètre.
--
-- C'est la différence entre un journal et un champ de saisie libre : un
-- paramètre `actor_id` permettrait d'attribuer une suppression à un collègue.
create or replace function public.log_audit_event(
  p_action text,
  p_resource_type text default null,
  p_resource_id text default null,
  p_organization_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor_email text;
  v_actor_role public.platform_role;
  v_log_id uuid;
begin
  -- Identité figée à l'instant de l'action.
  if v_actor_id is not null then
    select p.email, p.platform_role
      into v_actor_email, v_actor_role
      from public.profiles p
     where p.id = v_actor_id;
  end if;

  -- Un acteur ne journalise que dans une organisation dont il est membre —
  -- sauf s'il appartient au personnel, dont les actions sont par nature
  -- transverses. Sans cette vérification, un client pourrait polluer le
  -- journal d'un autre tenant.
  if p_organization_id is not null
     and v_actor_id is not null
     and not public.is_platform_staff()
     and not public.is_org_member(p_organization_id)
  then
    raise exception
      'Journalisation refusée : l''organisation visée n''est pas la vôtre.'
      using errcode = '42501';
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, actor_email, actor_platform_role,
    action, resource_type, resource_id, metadata
  )
  values (
    p_organization_id, v_actor_id, v_actor_email, v_actor_role,
    p_action, p_resource_type, p_resource_id, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

comment on function public.log_audit_event is
  'Seul chemin d''écriture du journal. L''auteur vient de auth.uid(), jamais d''un paramètre.';

revoke execute on function
  public.log_audit_event(text, text, text, uuid, jsonb) from public;
grant execute on function
  public.log_audit_event(text, text, text, uuid, jsonb) to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- RLS : audit_logs
-- -----------------------------------------------------------------------------
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

revoke all on table public.audit_logs from anon;

-- SELECT seul. Ni INSERT, ni UPDATE, ni DELETE : le caractère append-only
-- repose sur l'absence de policy ET sur l'absence de privilège.
grant select on table public.audit_logs to authenticated;

-- Lecture réservée au personnel plateforme.
--
-- Les clients n'y accèdent pas en V1 : le journal contient des adresses IP,
-- des rôles internes et le détail d'actions d'exploitation. Exposer un
-- journal d'audit client demande un modèle de filtrage propre, à traiter
-- comme une fonctionnalité à part entière plutôt qu'en effet de bord.
create policy audit_logs_select_staff
  on public.audit_logs for select to authenticated
  using (public.is_platform_staff());

-- AUCUNE policy INSERT / UPDATE / DELETE — délibérément, pour tous les rôles.
