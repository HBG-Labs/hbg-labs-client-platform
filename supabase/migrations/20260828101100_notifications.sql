-- =============================================================================
-- 12 — notifications (§26)
-- =============================================================================
-- Notifications destinées à un utilisateur : paiement reçu, facture
-- disponible, demande mise à jour, message HBG Labs, maintenance, incident.
--
--
-- UNE LIGNE PAR CANAL, PAS UNE LIGNE PAR ÉVÉNEMENT
--
-- §26 demande deux canaux : IN_APP et EMAIL. Une seule ligne portant deux
-- drapeaux obligerait à suivre deux cycles de vie sur le même enregistrement —
-- lue dans l'application, en échec côté email, à réémettre pour l'un et pas
-- pour l'autre.
--
-- Une ligne par canal donne à chaque envoi son propre statut. Le
-- regroupement, quand il est utile, se fait par `group_key`.
--
--
-- LE TYPE EST DU TEXTE, PAS UNE ÉNUMÉRATION
--
-- Seule entorse à la règle du schéma. Les types de notification apparaissent
-- au fil des fonctionnalités : chaque ajout imposerait sinon un ALTER TYPE,
-- donc une migration, pour un libellé. La contrainte de format garantit la
-- convention (MAJUSCULES_SOULIGNÉES) ; les valeurs connues sont documentées
-- dans docs/DATABASE.md.
-- =============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  -- Destinataire. CASCADE : les notifications d'un compte supprimé n'ont plus
  -- de destinataire, elles n'ont aucune valeur d'archive.
  user_id uuid not null
    references public.profiles (id) on delete cascade,

  -- Contexte d'organisation. NULL pour une notification de compte
  -- (changement de mot de passe, par exemple).
  organization_id uuid
    references public.organizations (id) on delete cascade,

  -- PAYMENT_RECEIVED, INVOICE_AVAILABLE, TICKET_UPDATED, MESSAGE_RECEIVED,
  -- MAINTENANCE_SCHEDULED, INCIDENT_REPORTED… (voir docs/DATABASE.md)
  type text not null
    constraint notifications_type_format check (type ~ '^[A-Z][A-Z0-9_]{2,49}$'),

  channel public.notification_channel not null default 'IN_APP',

  -- IN_APP est 'SENT' dès l'insertion : la notification existe, donc elle est
  -- disponible. EMAIL traverse réellement PENDING → SENT | FAILED.
  status public.notification_status not null default 'PENDING',

  title text not null
    constraint notifications_title_length check (char_length(trim(title)) between 2 and 160),

  body text
    constraint notifications_body_length check (char_length(trim(body)) between 1 and 2000),

  -- Destination du clic. Chemin interne (« /dashboard/billing ») plutôt
  -- qu'URL absolue : le domaine change entre développement, préproduction et
  -- production, et une URL figée renverrait vers le mauvais environnement.
  action_url text
    constraint notifications_action_url_relative check (action_url ~ '^/[^[:space:]]*$'),

  action_label text
    constraint notifications_action_label_length check (char_length(trim(action_label)) between 2 and 40),

  -- Objet concerné, pour la navigation et le dédoublonnage.
  resource_type text
    constraint notifications_resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]{1,40}$'),
  resource_id uuid,

  -- Relie les déclinaisons d'un même événement sur plusieurs canaux.
  group_key text
    constraint notifications_group_key_length check (char_length(group_key) between 4 and 120),

  read_at timestamptz,
  sent_at timestamptz,

  -- Motif d'échec d'envoi (retour Resend, §26).
  failure_reason text
    constraint notifications_failure_reason_length check (char_length(failure_reason) between 1 and 500),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notifications_sent_has_date check (
    status <> 'SENT' or sent_at is not null
  ),

  constraint notifications_failed_has_reason check (
    status <> 'FAILED' or failure_reason is not null
  ),

  -- Une notification non délivrée ne peut pas avoir été lue.
  constraint notifications_read_requires_sent check (
    read_at is null or sent_at is not null
  ),

  -- L'objet concerné se désigne par un type ET un identifiant, ou pas du tout.
  constraint notifications_resource_complete check (
    (resource_type is null) = (resource_id is null)
  )
);

comment on table public.notifications is
  'Notifications utilisateur. Une ligne par canal (IN_APP, EMAIL) : chaque envoi suit son propre cycle de vie.';
comment on column public.notifications.action_url is
  'Chemin interne, jamais une URL absolue : le domaine diffère entre environnements.';

-- Cloche de notifications : les non lues d'un utilisateur, plus récentes en
-- tête. L'index partiel reste petit — les notifications lues en sortent.
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null and channel = 'IN_APP';

-- Historique complet.
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- File d'envoi des emails, traitée par la fonction Edge (§26).
create index notifications_pending_email_idx
  on public.notifications (created_at)
  where channel = 'EMAIL' and status = 'PENDING';

create index notifications_organization_id_idx
  on public.notifications (organization_id)
  where organization_id is not null;

create trigger notifications_set_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Périmètre de modification côté destinataire
-- -----------------------------------------------------------------------------
-- Le destinataire n'a qu'une action légitime : marquer comme lu. Il n'a pas à
-- réécrire le titre d'une notification, ni à la faire passer de FAILED à SENT.
--
-- Sans ce trigger, la policy UPDATE — qui autorise la ligne entière — le
-- permettrait, et l'historique des notifications deviendrait un champ libre.
create or replace function public.guard_notification_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_backend() or public.is_platform_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.organization_id is distinct from old.organization_id
     or new.type is distinct from old.type
     or new.channel is distinct from old.channel
     or new.status is distinct from old.status
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.action_url is distinct from old.action_url
     or new.action_label is distinct from old.action_label
     or new.resource_type is distinct from old.resource_type
     or new.resource_id is distinct from old.resource_id
     or new.group_key is distinct from old.group_key
     or new.sent_at is distinct from old.sent_at
     or new.failure_reason is distinct from old.failure_reason
  then
    raise exception
      'Seul read_at est modifiable sur une notification.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger notifications_guard_update
  before update on public.notifications
  for each row execute function public.guard_notification_update();


-- -----------------------------------------------------------------------------
-- RLS : notifications
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notifications force row level security;

revoke all on table public.notifications from anon;
grant select, update on table public.notifications to authenticated;
grant insert on table public.notifications to authenticated;

-- Chacun ne voit que les siennes — y compris le personnel HBG Labs, qui n'a
-- aucune raison de lire les notifications d'un client.
create policy notifications_select_own
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

-- Marquage « lu », borné par `guard_notification_update`.
create policy notifications_update_own
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Création réservée à l'administration plateforme (§26 « message HBG Labs »).
-- Les notifications automatiques sont émises par service_role, hors RLS.
create policy notifications_insert_admin
  on public.notifications for insert to authenticated
  with check (public.is_platform_admin());

-- Aucune policy DELETE : une notification lue disparaît de l'affichage,
-- pas de la base. Une purge par ancienneté relève d'une tâche planifiée
-- exécutée par service_role.
