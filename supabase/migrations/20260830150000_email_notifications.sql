-- =============================================================================
-- 20 — Courriels transactionnels : émission des lignes EMAIL (§26)
-- =============================================================================
-- La migration 18 a laissé le canal EMAIL délibérément inutilisé, et disait
-- pourquoi : « aucun service d'envoi n'est raccordé […] Créer des lignes EMAIL
-- en attente laisserait croire à des envois qui n'auront pas lieu. »
--
-- Resend est maintenant raccordé (fonction Edge `notifications-dispatch`).
-- Cette migration ouvre le canal — mais pas inconditionnellement.
--
--
-- POURQUOI UN INTERRUPTEUR EN BASE, ET NON UN SIMPLE `INSERT`
--
-- Appliquer les migrations et configurer Resend sont deux gestes distincts,
-- qui peuvent être séparés de plusieurs semaines. Entre les deux, des lignes
-- EMAIL s'accumuleraient en attente. Deux conséquences, aucune souhaitable :
--
--   * l'objection de la migration 18 reviendrait, à l'identique ;
--   * le jour où l'envoi démarre, tout l'arriéré part d'un coup. Un client
--     recevrait « vous avez un nouveau message » pour une demande close depuis
--     trois mois. Un courriel exact dans son contenu, faux dans son propos.
--
-- L'interrupteur fait de l'envoi un FAIT VÉRIFIABLE EN BASE, et non une
-- supposition sur l'état d'un secret déposé ailleurs. Tant qu'il est sur
-- « off », aucune ligne EMAIL n'existe : rien ne s'accumule, rien ne partira.
--
-- Il est dans une table plutôt que dans un paramètre de session (`GUC`) parce
-- qu'une table se lit, se teste et s'inspecte : `tests/rls/09-email-delivery`
-- bascule la valeur dans les deux sens et vérifie l'émission de part et
-- d'autre. Un GUC de session ne survivrait pas au pool de connexions de
-- PostgREST, et le comportement ne serait vérifiable qu'à la main.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- platform_settings
-- -----------------------------------------------------------------------------
-- Réglages d'exploitation de la plateforme. Pas de préférences utilisateur, pas
-- de configuration applicative : uniquement ce qui commande un comportement du
-- serveur et doit rester vérifiable après coup.
--
-- TABLE FERMÉE, comme `platform_access` et `stripe_webhook_events` : aucun
-- privilège pour `anon` ni pour `authenticated`, RLS activée sans policy. Deux
-- mécanismes indépendants, pour la même raison qu'ailleurs — un réglage
-- modifiable depuis l'application serait modifiable par qui prend la main sur
-- une session d'administrateur.
create table public.platform_settings (
  key text primary key
    constraint platform_settings_key_format check (key ~ '^[a-z][a-z0-9_]{2,49}$'),

  value text not null
    constraint platform_settings_value_length check (char_length(value) between 1 and 200),

  -- À quoi sert ce réglage, en une phrase. Un réglage dont personne ne sait
  -- ce qu'il commande ne se modifie plus, de peur de casser quelque chose.
  description text
    constraint platform_settings_description_length check (char_length(description) between 4 and 400),

  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is
  'Réglages d''exploitation. Table fermée : aucun accès applicatif, écriture réservée à service_role.';

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.platform_settings force row level security;

revoke all on table public.platform_settings from anon, authenticated;

-- AUCUNE POLICY. RLS activée sans policy = refus de tout accès.


-- La ligne existe dès la migration, à « off ». Un réglage absent se découvre
-- mal ; un réglage présent et explicite s'inspecte, et sa valeur par défaut
-- est visible sans lire ce fichier.
insert into public.platform_settings (key, value, description)
values (
  'email_delivery',
  'off',
  'on = les notifications produisent une ligne EMAIL que la fonction Edge notifications-dispatch envoie via Resend. off = canal IN_APP uniquement.'
)
on conflict (key) do nothing;


-- -----------------------------------------------------------------------------
-- email_delivery_enabled()
-- -----------------------------------------------------------------------------
-- Lue par `emit_notification`, qui s'exécute en SECURITY DEFINER sous
-- `postgres`. Le réglage absent vaut « off » : l'ouverture du canal doit être
-- un geste explicite, jamais le résultat d'une ligne manquante.
create or replace function public.email_delivery_enabled()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select s.value = 'on'
       from public.platform_settings s
      where s.key = 'email_delivery'),
    false
  );
$$;

comment on function public.email_delivery_enabled is
  'Le canal EMAIL est-il ouvert ? Absence de réglage = non. Lue par emit_notification.';

revoke execute on function public.email_delivery_enabled() from public;
grant execute on function public.email_delivery_enabled() to service_role;


-- -----------------------------------------------------------------------------
-- emit_notification — seconde ligne, canal EMAIL
-- -----------------------------------------------------------------------------
-- Le corps, le titre et le lien sont ceux de la notification en application :
-- une seule formulation, donc aucun risque qu'un courriel raconte autre chose
-- que la cloche.
--
-- Ce point vaut aussi pour la confidentialité. Les notes internes ne passent
-- pas par cette fonction — `notify_ticket_message` les écarte avant tout appel
-- — et le courriel hérite donc de la même garde, sans qu'elle ait à être
-- réécrite ici. Une seconde implémentation finirait par diverger, et la
-- divergence enverrait une note interne au client.
--
-- La ligne naît PENDING, sans `sent_at`. Elle ne passe à SENT que lorsque
-- Resend a accepté le message : c'est le seul moment où l'affirmation « envoyé »
-- devient vraie.
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

  if not public.email_delivery_enabled() then
    return;
  end if;

  insert into public.notifications (
    user_id, organization_id, type, channel, status,
    title, body, action_url, resource_type, resource_id
  )
  values (
    p_user_id, p_organization_id, p_type, 'EMAIL', 'PENDING',
    p_title, left(p_body, 2000), p_action_url, p_resource_type, p_resource_id
  );
end;
$$;

comment on function public.emit_notification is
  'Crée la notification IN_APP (SENT) et, si le canal est ouvert, sa jumelle EMAIL (PENDING). SECURITY DEFINER : les triggers émettent pour autrui, ce que les policies interdisent à l''application.';
