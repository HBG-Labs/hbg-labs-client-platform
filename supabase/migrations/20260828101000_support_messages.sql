-- =============================================================================
-- 11 — support_messages, ticket_attachments (§24)
-- =============================================================================
-- La conversation attachée à un ticket, et les pièces jointes.
--
--
-- LA NOTE INTERNE — LE POINT DE VIGILANCE DE CETTE MIGRATION
--
-- HBG Labs a besoin d'écrire sur un ticket sans que le client le lise :
-- « client déjà relancé deux fois », « attendre le paiement de la facture
-- d'avril avant d'intervenir », un diagnostic technique brut.
--
-- Ces notes vivent sur la MÊME table que les messages visibles, distinguées
-- par `is_internal_note`. C'est le bon modèle — une note se situe dans le fil,
-- à sa place chronologique — mais il fait reposer la confidentialité sur une
-- seule condition de policy.
--
-- Deux garanties, donc :
--   1. la policy de lecture client exige `is_internal_note = false` ;
--   2. la policy d'insertion client exige `is_internal_note = false`, pour que
--      la valeur ne puisse pas être posée depuis un contexte non-staff.
--
-- La suite de tests RLS vérifie explicitement qu'un client ne voit jamais une
-- note interne : c'est le scénario de fuite le plus plausible de tout le
-- schéma, parce que la donnée est légitimement présente dans une ligne que le
-- client a par ailleurs le droit de lire.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Accès à un ticket — fonctions d'appui
-- -----------------------------------------------------------------------------
-- Les policies des messages et des pièces jointes doivent répondre à « ce
-- ticket est-il accessible ? ». Passer par une fonction SECURITY DEFINER
-- évite que la sous-requête sur `support_tickets` ne déclenche l'évaluation
-- des policies de cette table pour chaque message lu.

create or replace function public.can_read_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.support_tickets t
     where t.id = p_ticket_id
       and (public.is_org_member(t.organization_id) or public.is_platform_staff())
  );
$$;

-- Organisation propriétaire d'un ticket. Sert à vérifier la cohérence de
-- tenant des pièces jointes.
create or replace function public.ticket_organization_id(p_ticket_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.organization_id
    from public.support_tickets t
   where t.id = p_ticket_id;
$$;

revoke execute on function
  public.can_read_ticket(uuid),
  public.ticket_organization_id(uuid)
from public;

grant execute on function
  public.can_read_ticket(uuid),
  public.ticket_organization_id(uuid)
to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- support_messages
-- -----------------------------------------------------------------------------
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid not null
    references public.support_tickets (id) on delete cascade,

  -- ON DELETE SET NULL : un message reste dans le fil même si son auteur
  -- quitte l'entreprise. Le supprimer trouerait la conversation.
  author_id uuid
    references public.profiles (id) on delete set null,

  body text not null
    constraint support_messages_body_length check (char_length(trim(body)) between 1 and 10000),

  -- NOTE INTERNE — invisible du client. Voir l'avertissement en tête de
  -- fichier : c'est la colonne la plus sensible de cette table.
  is_internal_note boolean not null default false,

  -- L'auteur écrivait-il au titre de HBG Labs ?
  --
  -- Figé à l'insertion par trigger plutôt que recalculé depuis
  -- `profiles.platform_role`. Un collaborateur qui quitte HBG Labs voit son
  -- rôle passer à NULL ; ses anciennes réponses deviendraient alors des
  -- messages « client », et le fil se relirait à l'envers.
  author_is_staff boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Une note interne est nécessairement écrite par HBG Labs. La contrainte
  -- rend la combinaison incohérente impossible, indépendamment des policies.
  constraint support_messages_internal_note_is_staff check (
    not is_internal_note or author_is_staff
  )
);

comment on table public.support_messages is
  'Fil de conversation d''un ticket. is_internal_note = true est invisible du client (policy + contrainte).';
comment on column public.support_messages.is_internal_note is
  'Note interne HBG Labs. JAMAIS lisible par un membre d''organisation : la policy client exige is_internal_note = false.';
comment on column public.support_messages.author_is_staff is
  'Figé à l''insertion. Ne pas recalculer depuis platform_role : un départ réécrirait l''historique du fil.';

-- Affichage d'un fil, dans l'ordre chronologique.
create index support_messages_ticket_created_idx
  on public.support_messages (ticket_id, created_at);

-- Variante client : écarte les notes internes dès l'index, plutôt que de les
-- lire pour les filtrer ensuite.
create index support_messages_ticket_public_idx
  on public.support_messages (ticket_id, created_at)
  where not is_internal_note;

create trigger support_messages_set_updated_at
  before update on public.support_messages
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- Qualification de l'auteur et remontée d'activité
-- -----------------------------------------------------------------------------
-- `author_is_staff` est déterminé côté serveur, jamais transmis par le client :
-- sinon n'importe quel utilisateur ferait passer son message pour une réponse
-- officielle de HBG Labs (§36 — ne pas faire confiance au rôle envoyé par le
-- frontend).
create or replace function public.stamp_message_author_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.author_is_staff := exists (
    select 1
      from public.profiles p
     where p.id = new.author_id
       and p.platform_role is not null
  );

  -- Une note interne écrite par un non-staff n'a pas de sens : on la ramène à
  -- un message ordinaire plutôt que de rejeter l'insertion. La policy
  -- d'insertion client impose déjà `false` ; ceci couvre le cas d'une écriture
  -- par service_role, qui échappe aux policies.
  if not new.author_is_staff then
    new.is_internal_note := false;
  end if;

  return new;
end;
$$;

create trigger support_messages_stamp_author_role
  before insert on public.support_messages
  for each row execute function public.stamp_message_author_role();


-- Remonte l'activité sur le ticket parent.
--
-- Sans cela, la file de traitement (§31) trierait sur `last_activity_at` sans
-- jamais voir les réponses : un ticket très actif paraîtrait dormant.
--
-- SECURITY DEFINER : l'auteur du message n'a pas nécessairement le droit de
-- modifier la ligne du ticket — un client ne peut pas toucher à
-- `first_response_at`. La mise à jour est donc faite par la fonction, sous
-- l'identité de son propriétaire.
create or replace function public.bump_ticket_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Signale à `guard_ticket_client_update` (migration 10) que la mise à jour
  -- qui suit vient de la plateforme, non de l'utilisateur. Sans ce drapeau, la
  -- garde refuserait la remontée d'activité : elle touche `first_response_at`
  -- et le statut, deux champs interdits au client.
  --
  -- Troisième argument `true` = portée transaction, remise à zéro au COMMIT
  -- comme au ROLLBACK.
  perform set_config('app.internal_ticket_update', 'on', true);

  update public.support_tickets t
     set last_activity_at = now(),
         -- Première réponse de HBG Labs, hors note interne : une note n'est
         -- pas une réponse au client.
         first_response_at = case
           when t.first_response_at is null
                and new.author_is_staff
                and not new.is_internal_note
             then now()
           else t.first_response_at
         end,
         -- Un client qui répond à un ticket en attente de sa réponse le
         -- remet dans la file de HBG Labs.
         status = case
           when t.status = 'WAITING_CLIENT' and not new.author_is_staff
             then 'OPEN'::public.ticket_status
           else t.status
         end
   where t.id = new.ticket_id;

  -- Le drapeau est retiré immédiatement : il ne doit couvrir que la mise à
  -- jour ci-dessus, pas le reste de la transaction — au cours de laquelle le
  -- client pourrait par ailleurs modifier le ticket directement.
  perform set_config('app.internal_ticket_update', 'off', true);

  return new;
end;
$$;

create trigger support_messages_bump_ticket_activity
  after insert on public.support_messages
  for each row execute function public.bump_ticket_activity();


-- -----------------------------------------------------------------------------
-- RLS : support_messages
-- -----------------------------------------------------------------------------
alter table public.support_messages enable row level security;
alter table public.support_messages force row level security;

revoke all on table public.support_messages from anon;
grant select, insert on table public.support_messages to authenticated;

-- LECTURE CLIENT — la condition `not is_internal_note` est la garantie de
-- confidentialité des notes internes. Ne jamais la retirer.
create policy support_messages_select_member
  on public.support_messages for select to authenticated
  using (
    not is_internal_note
    and public.can_read_ticket(ticket_id)
  );

create policy support_messages_select_staff
  on public.support_messages for select to authenticated
  using (public.is_platform_staff());

-- ÉCRITURE CLIENT — auteur imposé, note interne interdite.
create policy support_messages_insert_member
  on public.support_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not is_internal_note
    and public.can_read_ticket(ticket_id)
  );

create policy support_messages_insert_staff
  on public.support_messages for insert to authenticated
  with check (
    public.is_platform_staff()
    and author_id = (select auth.uid())
  );

-- Aucune policy UPDATE ni DELETE : un message envoyé ne se réécrit pas.
-- Un fil de support modifiable a posteriori n'a plus valeur de preuve en cas
-- de litige. Une correction s'apporte par un nouveau message.


-- -----------------------------------------------------------------------------
-- ticket_attachments (§24 « pièce jointe », §35)
-- -----------------------------------------------------------------------------
-- Métadonnées des fichiers ; les octets vivent dans le bucket privé
-- `ticket-attachments` (migration 15).
--
-- Une table dédiée plutôt qu'un tableau JSONB sur le message : les policies
-- Storage s'appuient sur le chemin du fichier, et ce chemin doit être une
-- donnée contrainte et indexée, pas un champ libre au fond d'un JSON.
create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid not null
    references public.support_tickets (id) on delete cascade,

  -- Message auquel le fichier est joint. NULL = joint à la demande initiale.
  message_id uuid
    references public.support_messages (id) on delete cascade,

  -- Dénormalisé depuis le ticket, et vérifié par trigger.
  --
  -- Nécessaire ici : le chemin de stockage commence par l'identifiant
  -- d'organisation, et les policies Storage comparent ce préfixe. Elles ne
  -- peuvent pas remonter jusqu'au ticket — Storage ne connaît que le chemin.
  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- Chemin dans le bucket : {organization_id}/{ticket_id}/{uuid}-{nom}
  -- Le préfixe d'organisation est ce qui rend l'isolation Storage possible.
  storage_path text not null
    constraint ticket_attachments_path_length check (char_length(storage_path) between 8 and 512),

  file_name text not null
    constraint ticket_attachments_file_name_length check (char_length(trim(file_name)) between 1 and 255),

  mime_type text not null
    constraint ticket_attachments_mime_format check (mime_type ~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'),

  -- Plafond à 25 Mio, aligné sur la limite du bucket (migration 15). Deux
  -- limites redondantes : un fichier accepté ici mais refusé par Storage
  -- laisserait une ligne pointant vers un objet inexistant.
  size_bytes bigint not null
    constraint ticket_attachments_size_range check (size_bytes between 1 and 26214400),

  uploaded_by uuid
    references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),

  constraint ticket_attachments_storage_path_key unique (storage_path)
);

comment on table public.ticket_attachments is
  'Métadonnées des pièces jointes. Octets dans le bucket privé ticket-attachments, accessibles par URL signée uniquement (§35).';
comment on column public.ticket_attachments.organization_id is
  'Dénormalisé depuis le ticket et vérifié par trigger. Indispensable : les policies Storage ne voient que le chemin, dont il est le préfixe.';

create index ticket_attachments_ticket_id_idx on public.ticket_attachments (ticket_id);
create index ticket_attachments_message_id_idx on public.ticket_attachments (message_id)
  where message_id is not null;


-- La dénormalisation de `organization_id` ne vaut que si elle ne peut pas
-- diverger. Ce trigger la recalcule systématiquement depuis le ticket, au lieu
-- de faire confiance à la valeur transmise : un client indiquant
-- l'organisation d'un autre obtiendrait sinon un chemin Storage hors de son
-- périmètre.
create or replace function public.stamp_attachment_organization()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid := public.ticket_organization_id(new.ticket_id);
begin
  if v_org is null then
    raise exception 'Ticket introuvable.' using errcode = '23503';
  end if;

  new.organization_id := v_org;

  -- Le chemin doit commencer par l'identifiant d'organisation : c'est
  -- l'invariant sur lequel repose l'isolation Storage.
  if new.storage_path not like v_org::text || '/%' then
    raise exception
      'storage_path doit commencer par « %/ ».', v_org
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger ticket_attachments_stamp_organization
  before insert or update on public.ticket_attachments
  for each row execute function public.stamp_attachment_organization();


alter table public.ticket_attachments enable row level security;
alter table public.ticket_attachments force row level security;

revoke all on table public.ticket_attachments from anon;
grant select, insert on table public.ticket_attachments to authenticated;

create policy ticket_attachments_select_member
  on public.ticket_attachments for select to authenticated
  using (public.can_read_ticket(ticket_id));

create policy ticket_attachments_select_staff
  on public.ticket_attachments for select to authenticated
  using (public.is_platform_staff());

create policy ticket_attachments_insert_member
  on public.ticket_attachments for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and public.can_read_ticket(ticket_id)
  );

create policy ticket_attachments_insert_staff
  on public.ticket_attachments for insert to authenticated
  with check (public.is_platform_staff());

-- Suppression réservée à HBG Labs : la ligne et l'objet Storage doivent
-- disparaître ensemble, ce que seule une opération serveur peut garantir.
create policy ticket_attachments_delete_staff
  on public.ticket_attachments for delete to authenticated
  using (public.is_platform_admin());

grant delete on table public.ticket_attachments to authenticated;
