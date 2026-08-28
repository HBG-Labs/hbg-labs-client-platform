-- =============================================================================
-- 10 — support_tickets (§24, §25, §31)
-- =============================================================================
-- Demandes d'assistance ET demandes de modification du site, sur une même
-- table, distinguées par `type` :
--
--   SUPPORT        — §24 : « quelque chose ne fonctionne pas »
--   CHANGE_REQUEST — §25 : « changer un texte, ajouter une photo, modifier
--                    une section, ajouter une page… »
--
-- Deux flux de travail distincts côté HBG Labs, mais la même mécanique :
-- conversation, pièces jointes, statuts, RLS, historique. Deux tables
-- jumelles auraient dupliqué tout cela pour un seul champ de différence.
--
--
-- LA SEULE TABLE MÉTIER OÙ LE CLIENT ÉCRIT
--
-- Partout ailleurs le client consulte ; ici il crée. C'est le cœur de la
-- relation : §25 en fait la fonctionnalité principale de l'espace client.
--
-- L'écriture est donc soigneusement bornée :
--   * il crée un ticket dans SON organisation, en s'en déclarant l'auteur ;
--   * il ne peut modifier ni la priorité, ni la catégorie, ni l'affectation —
--     un trigger le vérifie, la RLS ne sachant pas filtrer par colonne ;
--   * il peut clore sa demande ou rouvrir une demande résolue, rien d'autre.
--
-- Sans le trigger, tout client passerait ses tickets en URGENT et l'ordre de
-- traitement de HBG Labs ne voudrait plus rien dire.
-- =============================================================================


-- Référence lisible : HBG-000001, HBG-000002…
-- C'est ce que le client cite au téléphone et ce qui figure en objet des
-- emails. Un UUID ne se dicte pas.
create sequence public.support_ticket_reference_seq
  as bigint
  start with 1
  increment by 1
  no cycle;

comment on sequence public.support_ticket_reference_seq is
  'Numérotation lisible des tickets (HBG-000001). Les trous sont normaux : une transaction annulée consomme un numéro.';


create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- Site concerné, si la demande en vise un. NULL pour une question de
  -- facturation ou une demande générale.
  website_id uuid
    references public.websites (id) on delete set null,

  -- Référence lisible, générée à l'insertion.
  reference text not null
    default 'HBG-' || lpad(nextval('public.support_ticket_reference_seq')::text, 6, '0')
    constraint support_tickets_reference_format check (reference ~ '^HBG-[0-9]{6,}$'),

  type public.ticket_type not null default 'SUPPORT',
  category public.ticket_category not null default 'AUTRE',
  priority public.ticket_priority not null default 'NORMAL',
  status public.ticket_status not null default 'OPEN',

  subject text not null
    constraint support_tickets_subject_length check (char_length(trim(subject)) between 3 and 200),

  -- Description initiale. La suite de l'échange vit dans `support_messages`.
  description text not null
    constraint support_tickets_description_length check (char_length(trim(description)) between 10 and 10000),

  -- Auteur. ON DELETE SET NULL : le départ d'un collaborateur ne doit pas
  -- effacer l'historique des demandes de l'entreprise.
  created_by uuid
    references public.profiles (id) on delete set null,

  -- Membre HBG Labs en charge (§31). NULL = non affecté.
  assigned_to uuid
    references public.profiles (id) on delete set null,

  -- ---- Jalons de traitement ----
  -- Premier message de HBG Labs. Permet de mesurer le délai de première
  -- réponse, l'indicateur de qualité de service le plus parlant.
  first_response_at timestamptz,

  resolved_at timestamptz,
  closed_at timestamptz,

  -- Dernière activité, tenue à jour par trigger — y compris depuis
  -- `support_messages` (migration 11). Sert au tri « dernière activité » (§31).
  last_activity_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un ticket résolu porte sa date de résolution, un ticket clos la sienne.
  constraint support_tickets_resolved_has_date check (
    status <> 'RESOLVED' or resolved_at is not null
  ),
  constraint support_tickets_closed_has_date check (
    status <> 'CLOSED' or closed_at is not null
  )
);

comment on table public.support_tickets is
  'Demandes d''assistance (SUPPORT) et de modification de site (CHANGE_REQUEST). Seule table métier où le client écrit.';
comment on column public.support_tickets.reference is
  'Référence lisible HBG-000001, citée par le client. Générée par séquence.';
comment on column public.support_tickets.first_response_at is
  'Premier message émis par HBG Labs. Base du délai de première réponse.';

create unique index support_tickets_reference_key on public.support_tickets (reference);

-- Liste « Mes demandes » côté client : activité la plus récente en tête.
create index support_tickets_organization_activity_idx
  on public.support_tickets (organization_id, last_activity_at desc);

-- File de traitement HBG Labs (§31) : les tickets clos et résolus en sont
-- exclus par l'index partiel, qui reste donc petit même après des milliers de
-- demandes traitées.
create index support_tickets_open_queue_idx
  on public.support_tickets (priority desc, last_activity_at)
  where status in ('OPEN', 'IN_PROGRESS', 'WAITING_CLIENT');

create index support_tickets_assigned_to_idx
  on public.support_tickets (assigned_to, last_activity_at desc)
  where assigned_to is not null;

create index support_tickets_website_id_idx
  on public.support_tickets (website_id)
  where website_id is not null;

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Cohérence du rattachement site ↔ ticket
-- -----------------------------------------------------------------------------
-- Même risque que pour les domaines : deux clés étrangères valides prises
-- séparément peuvent désigner deux tenants différents.
create or replace function public.guard_ticket_website_tenant()
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
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger support_tickets_guard_tenant
  before insert or update on public.support_tickets
  for each row execute function public.guard_ticket_website_tenant();


-- -----------------------------------------------------------------------------
-- Jalons automatiques
-- -----------------------------------------------------------------------------
-- Les dates de résolution et de clôture sont déduites du statut plutôt que
-- confiées à l'appelant : une interface qui oublie de renseigner `resolved_at`
-- produit un ticket résolu sans date, et fausse toute mesure de délai.
create or replace function public.sync_ticket_milestones()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    new.last_activity_at := now();

    if new.status = 'RESOLVED' and new.resolved_at is null then
      new.resolved_at := now();
    end if;

    if new.status = 'CLOSED' and new.closed_at is null then
      new.closed_at := now();
      -- Un ticket clos sans passer par RESOLVED (doublon, demande annulée)
      -- n'a pas été résolu : `resolved_at` reste NULL, à dessein.
    end if;

    -- Réouverture : les jalons précédents ne décrivent plus l'état courant.
    if new.status in ('OPEN', 'IN_PROGRESS', 'WAITING_CLIENT') then
      new.resolved_at := null;
      new.closed_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger support_tickets_sync_milestones
  before update on public.support_tickets
  for each row execute function public.sync_ticket_milestones();


-- -----------------------------------------------------------------------------
-- Périmètre de modification côté client
-- -----------------------------------------------------------------------------
-- La RLS autorise ou refuse une LIGNE entière. Sans ce trigger, un client
-- autorisé à modifier son ticket pourrait aussi bien passer sa demande en
-- URGENT, se l'affecter, ou antidater `first_response_at`.
--
-- Un client ne peut faire que deux choses sur un ticket existant :
--   * le clore, s'il n'a plus lieu d'être ;
--   * le rouvrir, si la résolution ne le satisfait pas.
--
-- Tout le reste — priorité, catégorie, affectation, jalons — appartient à
-- HBG Labs.
create or replace function public.guard_ticket_client_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Mise à jour émise par la plateforme elle-même, et non par un utilisateur.
  --
  -- `bump_ticket_activity` (migration 11) remonte `last_activity_at`,
  -- `first_response_at` et repasse un ticket WAITING_CLIENT en OPEN quand le
  -- client répond. Ce sont précisément des champs que cette garde interdit au
  -- client — la réponse d'un client à sa propre demande échouerait donc.
  --
  -- Le drapeau est posé en paramètre LOCAL à la transaction, juste avant la
  -- mise à jour interne, et retiré aussitôt après. Un client ne peut pas le
  -- poser lui-même : PostgREST n'expose que les paramètres `request.*` qu'il
  -- contrôle, et aucune fonction publiée ne permet d'appeler `set_config`.
  if coalesce(current_setting('app.internal_ticket_update', true), '') = 'on' then
    return new;
  end if;

  -- Le personnel et le backend disposent de tous les droits sur le ticket.
  if public.is_trusted_backend() or public.is_platform_staff() then
    return new;
  end if;

  -- Champs strictement réservés à HBG Labs.
  if new.priority is distinct from old.priority then
    raise exception 'La priorité est fixée par HBG Labs.' using errcode = '42501';
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    raise exception 'L''affectation est réservée à HBG Labs.' using errcode = '42501';
  end if;

  if new.first_response_at is distinct from old.first_response_at then
    raise exception 'first_response_at est géré automatiquement.' using errcode = '42501';
  end if;

  if new.reference is distinct from old.reference then
    raise exception 'La référence du ticket est immuable.' using errcode = '42501';
  end if;

  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id est immuable.' using errcode = '42501';
  end if;

  if new.type is distinct from old.type
     or new.category is distinct from old.category
     or new.subject is distinct from old.subject
     or new.description is distinct from old.description
  then
    raise exception
      'Le contenu d''une demande n''est pas modifiable après envoi : ajoutez un message au ticket.'
      using errcode = '42501';
  end if;

  -- Transitions de statut autorisées au client.
  if new.status is distinct from old.status then
    if new.status = 'CLOSED' then
      null;  -- clore sa propre demande : toujours permis
    elsif new.status = 'OPEN' and old.status in ('RESOLVED', 'CLOSED') then
      null;  -- rouvrir une demande résolue ou close
    else
      raise exception
        'Transition de statut réservée à HBG Labs : un client peut clore ou rouvrir sa demande.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Se déclenche APRÈS `sync_ticket_milestones` (ordre alphabétique des noms de
-- trigger sur un même événement) : les jalons calculés ne doivent pas être
-- interprétés comme une modification interdite du client.
create trigger support_tickets_zz_guard_client_update
  before update on public.support_tickets
  for each row execute function public.guard_ticket_client_update();


-- -----------------------------------------------------------------------------
-- RLS : support_tickets
-- -----------------------------------------------------------------------------
alter table public.support_tickets enable row level security;
alter table public.support_tickets force row level security;

revoke all on table public.support_tickets from anon;
grant select, insert, update on table public.support_tickets to authenticated;

create policy support_tickets_select_member
  on public.support_tickets for select to authenticated
  using (public.is_org_member(organization_id));

create policy support_tickets_select_staff
  on public.support_tickets for select to authenticated
  using (public.is_platform_staff());

-- Création par tout membre de l'organisation (§24, §25).
--
-- `created_by = auth.uid()` est imposé par WITH CHECK : sans cette condition,
-- un client pourrait attribuer sa demande à un collègue, et l'historique ne
-- refléterait plus qui a demandé quoi.
create policy support_tickets_insert_member
  on public.support_tickets for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = (select auth.uid())
  );

create policy support_tickets_insert_staff
  on public.support_tickets for insert to authenticated
  with check (public.is_platform_staff());

-- Modification par le client, bornée par `guard_ticket_client_update`.
create policy support_tickets_update_member
  on public.support_tickets for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy support_tickets_update_staff
  on public.support_tickets for update to authenticated
  using (public.is_platform_staff())
  with check (public.is_platform_staff());

-- Aucune policy DELETE : un ticket est une trace de la relation client.
-- Une demande sans objet se clôt, elle ne s'efface pas.
