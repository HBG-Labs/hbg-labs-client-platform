-- =============================================================================
-- 18 — Notifications sur les demandes (§26)
-- =============================================================================
-- La table `notifications` existait depuis la migration 12, avec ses policies
-- et ses gardes. Rien ne l'alimentait.
--
-- Conséquence concrète : un client qui ouvrait une demande ne savait qu'une
-- réponse était arrivée qu'en revenant sur le site. Et HBG Labs ne savait
-- qu'une demande était arrivée qu'en consultant la file.
--
--
-- POURQUOI DES TRIGGERS PLUTÔT QUE DU CODE APPLICATIF
--
-- Une notification doit atteindre QUELQU'UN D'AUTRE que son émetteur. Or la
-- policy `notifications_insert_admin` réserve l'insertion aux administrateurs
-- plateforme : un client ne peut pas créer de notification pour HBG Labs, et
-- c'est exactement ce qu'on veut.
--
-- Les faire naître côté serveur, à partir de l'événement lui-même, résout la
-- question sans affaiblir la policy. Le déclenchement devient aussi impossible
-- à oublier : toute écriture dans `support_messages`, d'où qu'elle vienne,
-- produit sa notification.
--
--
-- CANAL IN_APP UNIQUEMENT
--
-- Le canal EMAIL existe dans le schéma mais n'est pas utilisé ici : aucun
-- service d'envoi n'est raccordé, et le serveur SMTP intégré de Supabase
-- plafonne à deux courriels par heure. Créer des lignes EMAIL en attente
-- laisserait croire à des envois qui n'auront pas lieu.
--
-- Le jour où Resend sera branché, ces triggers émettront une seconde ligne
-- par destinataire, avec `channel = 'EMAIL'` et `status = 'PENDING'`, qu'une
-- fonction Edge consommera.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Émission d'une notification
-- -----------------------------------------------------------------------------
-- Fonction d'appui, pour que les triggers ci-dessous restent lisibles.
--
-- IN_APP naît directement au statut SENT : la notification existe, donc elle
-- est disponible. Attendre un traitement qui n'existe pas la laisserait
-- indéfiniment en PENDING, invisible dans l'interface.
--
--
-- POURQUOI CET INSERT PASSE MALGRÉ LA RLS
--
-- `notifications` porte `force row level security`, et sa seule policy
-- d'insertion, `notifications_insert_admin`, s'adresse au rôle `authenticated`
-- et exige `is_platform_admin()`. Un client qui répond à une demande ne
-- satisfait ni l'un ni l'autre.
--
-- Ce qui fait passer l'écriture n'est donc pas une policy : c'est que
-- SECURITY DEFINER exécute la fonction sous son propriétaire, `postgres`, et
-- que ce rôle porte l'attribut BYPASSRLS sur les projets Supabase. FORCE RLS
-- soumet le propriétaire d'une table à ses policies ; BYPASSRLS l'en exempte à
-- nouveau, et l'emporte.
--
-- Cette combinaison — attribut de rôle, propriétaire de fonction, FORCE RLS —
-- ne se lit dans aucun fichier du dépôt, et elle est vitale : si elle
-- disparaissait, ce n'est pas seulement la notification qui manquerait, c'est
-- l'écriture du message lui-même qui échouerait, le trigger étant dans la même
-- transaction. `tests/rls/07-notifications.test.ts` la vérifie contre une vraie
-- base à chaque exécution de la suite.
create or replace function public.emit_notification(
  p_user_id uuid,
  p_organization_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_action_url text,
  p_resource_type text,
  p_resource_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (
    user_id, organization_id, type, channel, status, sent_at,
    title, body, action_url, resource_type, resource_id
  )
  values (
    p_user_id, p_organization_id, p_type, 'IN_APP', 'SENT', now(),
    p_title, left(p_body, 2000), p_action_url, p_resource_type, p_resource_id
  );
end;
$$;

comment on function public.emit_notification is
  'Crée une notification IN_APP au statut SENT. SECURITY DEFINER : les triggers émettent pour autrui, ce que les policies interdisent à l''application.';


-- -----------------------------------------------------------------------------
-- Un message ajouté au fil
-- -----------------------------------------------------------------------------
-- Le destinataire dépend de l'émetteur :
--
--   HBG Labs écrit  → les membres actifs de l'organisation cliente
--   le client écrit → le personnel plateforme
--
-- Une NOTE INTERNE ne notifie personne côté client. C'est le point à ne pas
-- manquer : le titre d'une notification apparaîtrait dans la cloche du client
-- et trahirait l'existence de la note, alors même que la policy en interdit la
-- lecture. La confidentialité se perdrait par un canal détourné.
create or replace function public.notify_ticket_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket record;
  v_recipient uuid;
  v_author_name text;
begin
  -- Une note interne ne notifie personne : ni le client, à qui elle est
  -- cachée, ni le personnel, qui vient de l'écrire.
  if new.is_internal_note then
    return new;
  end if;

  select t.id, t.organization_id, t.reference, t.subject
    into v_ticket
    from public.support_tickets t
   where t.id = new.ticket_id;

  if not found then
    return new;
  end if;

  select coalesce(p.full_name, 'HBG Labs')
    into v_author_name
    from public.profiles p
   where p.id = new.author_id;

  if new.author_is_staff then
    -- Vers le client : chaque membre actif de l'organisation, sauf l'auteur.
    for v_recipient in
      select m.user_id
        from public.organization_members m
       where m.organization_id = v_ticket.organization_id
         and m.status = 'ACTIVE'
         and m.user_id is distinct from new.author_id
    loop
      perform public.emit_notification(
        v_recipient,
        v_ticket.organization_id,
        'TICKET_REPLIED',
        format('Réponse à votre demande %s', v_ticket.reference),
        format('%s a répondu : %s', v_author_name, new.body),
        format('/dashboard/demandes/%s', v_ticket.id),
        'support_ticket',
        v_ticket.id
      );
    end loop;
  else
    -- Vers HBG Labs : tout le personnel, sauf l'auteur.
    for v_recipient in
      select p.id
        from public.profiles p
       where p.platform_role is not null
         and p.id is distinct from new.author_id
    loop
      perform public.emit_notification(
        v_recipient,
        v_ticket.organization_id,
        'TICKET_REPLIED',
        format('Nouveau message sur %s', v_ticket.reference),
        format('%s a écrit : %s', v_author_name, new.body),
        format('/admin/tickets/%s', v_ticket.id),
        'support_ticket',
        v_ticket.id
      );
    end loop;
  end if;

  return new;
end;
$$;

-- AFTER INSERT : la notification ne doit naître que si le message a bien été
-- enregistré. En BEFORE, un échec ultérieur laisserait une notification
-- renvoyant vers un message inexistant.
create trigger support_messages_notify
  after insert on public.support_messages
  for each row execute function public.notify_ticket_message();


-- -----------------------------------------------------------------------------
-- Une demande vient d'être ouverte
-- -----------------------------------------------------------------------------
create or replace function public.notify_ticket_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient uuid;
  v_organization text;
begin
  select o.name into v_organization
    from public.organizations o
   where o.id = new.organization_id;

  for v_recipient in
    select p.id
      from public.profiles p
     where p.platform_role is not null
       and p.id is distinct from new.created_by
  loop
    perform public.emit_notification(
      v_recipient,
      new.organization_id,
      'TICKET_CREATED',
      format('Nouvelle demande %s', new.reference),
      format('%s : %s', coalesce(v_organization, 'Client'), new.subject),
      format('/admin/tickets/%s', new.id),
      'support_ticket',
      new.id
    );
  end loop;

  return new;
end;
$$;

create trigger support_tickets_notify_created
  after insert on public.support_tickets
  for each row execute function public.notify_ticket_created();


-- -----------------------------------------------------------------------------
-- Le statut d'une demande a changé
-- -----------------------------------------------------------------------------
-- Seuls les changements opérés par HBG Labs notifient le client. Un client qui
-- clôt sa propre demande n'a pas besoin qu'on l'en informe.
create or replace function public.notify_ticket_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient uuid;
  v_label text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- `is_platform_staff()` répond sur l'appelant réel : les revendications JWT
  -- ne sont pas altérées par le contexte SECURITY DEFINER.
  if not public.is_platform_staff() then
    return new;
  end if;

  v_label := case new.status
    when 'IN_PROGRESS'    then 'est en cours de traitement'
    when 'WAITING_CLIENT' then 'attend votre réponse'
    when 'RESOLVED'       then 'a été résolue'
    when 'CLOSED'         then 'a été close'
    else 'a été rouverte'
  end;

  for v_recipient in
    select m.user_id
      from public.organization_members m
     where m.organization_id = new.organization_id
       and m.status = 'ACTIVE'
  loop
    perform public.emit_notification(
      v_recipient,
      new.organization_id,
      'TICKET_STATUS_CHANGED',
      format('Votre demande %s %s', new.reference, v_label),
      new.subject,
      format('/dashboard/demandes/%s', new.id),
      'support_ticket',
      new.id
    );
  end loop;

  return new;
end;
$$;

create trigger support_tickets_notify_status
  after update on public.support_tickets
  for each row execute function public.notify_ticket_status();


-- -----------------------------------------------------------------------------
-- Privilèges
-- -----------------------------------------------------------------------------
-- `emit_notification` insère pour autrui. Aucun rôle applicatif ne doit
-- pouvoir l'appeler directement : ce serait un moyen d'écrire dans la cloche
-- de n'importe qui.
revoke execute on function
  public.emit_notification(uuid, uuid, text, text, text, text, text, uuid)
from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- Lecture des notifications non lues
-- -----------------------------------------------------------------------------
-- L'index partiel de la migration 12 couvre déjà `user_id` avec `read_at is
-- null`. Rien à ajouter : la cloche interroge exactement ce chemin.
