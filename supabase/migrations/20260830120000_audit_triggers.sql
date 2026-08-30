-- =============================================================================
-- 19 — Alimentation du journal d'audit (§44)
-- =============================================================================
-- La migration 13 a créé `audit_logs`, sa fonction d'écriture et sa policy de
-- lecture. Personne ne l'appelait. Le dépôt annonçait un journal d'audit ; la
-- table était vide, et l'aurait été le jour où elle aurait servi.
--
--
-- POURQUOI DES TRIGGERS PLUTÔT QUE DES APPELS APPLICATIFS
--
-- Trois raisons, dont la troisième est décisive.
--
-- 1. Un appel applicatif s'oublie. Chaque nouvel écran devrait penser à
--    journaliser ; le jour où l'un ne le fait pas, l'absence de trace passe
--    inaperçue — c'est le propre d'une absence.
--
-- 2. Un appel applicatif se contourne. `log_audit_event` est accessible à
--    `authenticated` : rien n'oblige un client à l'appeler après avoir modifié
--    une ligne, et un journal qu'on peut choisir de ne pas écrire ne prouve
--    rien.
--
-- 3. Un trigger vit dans la MÊME TRANSACTION que le changement. Si l'écriture
--    du journal échoue, le changement échoue avec elle. Un appel applicatif
--    séparé peut réussir l'action et rater la trace : le système se retrouve
--    alors dans l'état exact que le journal était censé rendre impossible.
--
--
-- CE QUE CE JOURNAL NE CONTIENT PAS
--
-- Pas d'adresse IP. §44 la demande « si légalement approprié », et la colonne
-- existe. Mais un trigger PostgreSQL ne connaît pas l'adresse de l'appelant, et
-- la faire remonter par l'application reviendrait à journaliser une valeur
-- fournie par le navigateur — donc falsifiable. Une IP forgeable n'a aucune
-- valeur probante ; en écrire une donnerait au journal une autorité qu'il
-- n'aurait pas. Elle restera nulle tant qu'une passerelle de confiance ne la
-- fournira pas.
--
-- Pas de secret, pas de jeton, pas de donnée bancaire : chaque trigger énumère
-- explicitement les colonnes qu'il consigne. Aucune n'est reprise par défaut.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- write_audit_log — écriture interne, auteur explicite
-- -----------------------------------------------------------------------------
-- `log_audit_event` impose l'auteur depuis `auth.uid()`, et c'est ce qui fait sa
-- valeur : un paramètre `actor_id` permettrait d'attribuer une suppression à un
-- collègue.
--
-- Deux appelants ne peuvent pas s'en contenter :
--
--   - les triggers, qui journalisent parfois le retrait d'une adhésion. À
--     l'instant où le trigger s'exécute, l'auteur n'est plus membre de
--     l'organisation, et la vérification d'appartenance de `log_audit_event`
--     ferait échouer la suppression elle-même.
--   - le trigger de connexion, exécuté par GoTrue dans une transaction sans
--     revendication JWT : `auth.uid()` y vaut NULL, et la ligne serait anonyme.
--
-- D'où cette fonction interne, à auteur explicite. Elle n'affaiblit pas la
-- garantie de `log_audit_event` : EXECUTE en est révoqué pour TOUS les rôles
-- applicatifs, `service_role` compris. Seuls le propriétaire et les fonctions
-- qui s'exécutent sous son identité peuvent l'appeler.
create or replace function public.write_audit_log(
  p_actor_id uuid,
  p_organization_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
  v_role public.platform_role;
  v_log_id uuid;
begin
  -- Identité figée à l'instant de l'action : `actor_user_id` peut passer à NULL
  -- si le compte est supprimé, la ligne doit rester attribuable.
  if p_actor_id is not null then
    select p.email, p.platform_role
      into v_email, v_role
      from public.profiles p
     where p.id = p_actor_id;
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, actor_email, actor_platform_role,
    action, resource_type, resource_id, metadata
  )
  values (
    p_organization_id, p_actor_id, v_email, v_role,
    p_action, p_resource_type, left(p_resource_id, 200),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

comment on function public.write_audit_log is
  'Écriture interne du journal, auteur explicite. EXECUTE révoqué de tous les rôles applicatifs : réservée aux triggers.';

revoke execute on function
  public.write_audit_log(uuid, uuid, text, text, text, jsonb)
from public, anon, authenticated, service_role;


-- -----------------------------------------------------------------------------
-- log_audit_event — le contrat public ne change pas
-- -----------------------------------------------------------------------------
-- Même signature, mêmes garanties : l'auteur vient de `auth.uid()`, et un
-- client ne journalise pas dans le tenant d'un autre. Seule l'insertion est
-- déléguée, pour que le format d'une ligne n'ait qu'une définition.
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
begin
  if p_organization_id is not null
     and v_actor_id is not null
     and not public.is_platform_staff()
     and not public.is_org_member(p_organization_id)
  then
    raise exception
      'Journalisation refusée : l''organisation visée n''est pas la vôtre.'
      using errcode = '42501';
  end if;

  return public.write_audit_log(
    v_actor_id, p_organization_id, p_action,
    p_resource_type, p_resource_id, p_metadata
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- journal_change — un trigger générique, déclaratif au point de pose
-- -----------------------------------------------------------------------------
-- Arguments : type de ressource, verbe de l'action, puis les colonnes à
-- consigner. Ce sont les SEULES colonnes qui atteignent `metadata` : rien n'est
-- repris par défaut, ce qui évite qu'une colonne ajoutée demain se retrouve
-- journalisée sans qu'on l'ait voulu.
--
-- Sur UPDATE, la fonction compare les valeurs et ne journalise que si l'une a
-- réellement changé. `after update of colonne` se déclenche dès que la colonne
-- est MENTIONNÉE dans l'ordre SQL, même réécrite à l'identique : sans cette
-- comparaison, le journal se remplirait de changements qui n'en sont pas.
create or replace function public.journal_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_resource_type text := tg_argv[0];
  v_action text := tg_argv[1];
  v_watched text[] := tg_argv[2:];
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_metadata jsonb := '{}'::jsonb;
  v_col text;
  v_org uuid;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_row := v_old;
  elsif tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_row := v_new;
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
  end if;

  if tg_op = 'UPDATE' then
    foreach v_col in array coalesce(v_watched, array[]::text[]) loop
      if (v_old -> v_col) is distinct from (v_new -> v_col) then
        v_metadata := v_metadata || jsonb_build_object(
          v_col,
          jsonb_build_object('avant', v_old -> v_col, 'apres', v_new -> v_col)
        );
      end if;
    end loop;

    -- Rien n'a bougé : pas de ligne de journal.
    if v_metadata = '{}'::jsonb then
      return null;
    end if;
  else
    foreach v_col in array coalesce(v_watched, array[]::text[]) loop
      v_metadata := v_metadata || jsonb_build_object(v_col, v_row -> v_col);
    end loop;
  end if;

  v_org := nullif(v_row ->> 'organization_id', '')::uuid;

  -- Sur `organizations`, la ressource EST l'organisation : sans cela le
  -- journal d'un client ne contiendrait pas la création de son propre compte.
  if v_org is null and v_resource_type = 'organization' then
    v_org := nullif(v_row ->> 'id', '')::uuid;
  end if;

  -- SUPPRESSION EN CASCADE DEPUIS L'ORGANISATION
  --
  -- Supprimer une organisation fait tomber ses adhésions, ce qui déclenche
  -- MEMBER_REMOVED. La ligne de journal référencerait alors une organisation
  -- qui n'existe déjà plus, et `audit_logs_organization_id_fkey` ferait
  -- échouer la suppression entière.
  --
  -- Ce défaut a rendu toute suppression d'organisation impossible dès la pose
  -- des triggers. Le démontage des tests ne vérifiait pas le résultat de ses
  -- suppressions : quinze organisations se sont accumulées avant qu'un
  -- nettoyage attentif ne le révèle.
  --
  -- Le rattachement est donc retiré de la colonne et conservé dans `metadata`,
  -- où aucune contrainte ne le lie à une ligne vivante. L'information demeure ;
  -- c'est la référence qui disparaît.
  if v_org is not null
     and tg_op = 'DELETE'
     and not exists (select 1 from public.organizations o where o.id = v_org)
  then
    v_metadata := v_metadata || jsonb_build_object('organization_id', v_org);
    v_org := null;
  end if;

  perform public.write_audit_log(
    (select auth.uid()),
    v_org,
    v_action,
    v_resource_type,
    -- `platform_access` a pour clé son adresse, non un identifiant.
    coalesce(v_row ->> 'id', v_row ->> 'email'),
    v_metadata
  );

  -- Trigger AFTER : la valeur de retour est ignorée.
  return null;
end;
$$;

comment on function public.journal_change is
  'Trigger générique de journalisation. Arguments : type de ressource, action, colonnes à consigner.';

revoke execute on function public.journal_change() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- Connexions (§44 « connexion »)
-- -----------------------------------------------------------------------------
-- `auth.users.last_sign_in_at` ne retient que la DERNIÈRE connexion. Un journal
-- de sécurité a besoin de l'historique : « depuis quand cet accès est-il
-- utilisé ? » ne se répond pas avec une seule date.
--
-- GoTrue écrit dans une transaction sans revendication JWT : `auth.uid()` y vaut
-- NULL, d'où l'auteur pris sur `new.id`.
--
-- LE BLOC exception EST DÉLIBÉRÉ. Un trigger sur `auth.users` qui échoue
-- empêche de se connecter. Entre perdre une ligne de journal et verrouiller
-- tout le monde dehors, le choix est fait : la connexion l'emporte. Les autres
-- triggers de ce fichier n'ont pas ce filet, et ne doivent pas l'avoir — ailleurs,
-- l'échec du journal DOIT annuler l'action.
create or replace function public.journal_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at
     and new.last_sign_in_at is not null
  then
    begin
      perform public.write_audit_log(
        new.id,
        null,
        'USER_SIGNED_IN',
        'user',
        new.id::text,
        jsonb_build_object('connexion_a', new.last_sign_in_at)
      );
    exception when others then
      null;
    end;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_signed_in
  after update of last_sign_in_at on auth.users
  for each row execute function public.journal_sign_in();


-- -----------------------------------------------------------------------------
-- Accès à l'administration — les événements les plus sensibles du système
-- -----------------------------------------------------------------------------
-- Une adresse ajoutée à `platform_access`, un `platform_role` attribué : ce sont
-- les deux gestes qui donnent accès à l'ensemble des données de tous les
-- clients. S'il ne devait rester qu'une trace, ce serait celle-ci.
create trigger platform_access_journal_granted
  after insert on public.platform_access
  for each row execute function public.journal_change(
    'platform_access', 'PLATFORM_ACCESS_GRANTED', 'email', 'role', 'note');

create trigger platform_access_journal_revoked
  after delete on public.platform_access
  for each row execute function public.journal_change(
    'platform_access', 'PLATFORM_ACCESS_REVOKED', 'email', 'role');

create trigger profiles_journal_platform_role
  after update of platform_role on public.profiles
  for each row execute function public.journal_change(
    'profile', 'PLATFORM_ROLE_CHANGED', 'platform_role');


-- -----------------------------------------------------------------------------
-- Identité et appartenance
-- -----------------------------------------------------------------------------
create trigger profiles_journal_updated
  after update of full_name, phone, avatar_url, locale on public.profiles
  for each row execute function public.journal_change(
    'profile', 'PROFILE_UPDATED', 'full_name', 'phone', 'avatar_url', 'locale');

create trigger organizations_journal_created
  after insert on public.organizations
  for each row execute function public.journal_change(
    'organization', 'ORGANIZATION_CREATED', 'name', 'slug');

create trigger organizations_journal_updated
  after update on public.organizations
  for each row execute function public.journal_change(
    'organization', 'ORGANIZATION_UPDATED',
    'name', 'slug', 'legal_name', 'siret', 'vat_number', 'billing_email',
    'phone', 'address_line1', 'postal_code', 'city', 'country', 'status',
    'stripe_customer_id');

create trigger organization_members_journal_invited
  after insert on public.organization_members
  for each row execute function public.journal_change(
    'organization_member', 'MEMBER_INVITED', 'user_id', 'role', 'status');

create trigger organization_members_journal_role
  after update of role, status on public.organization_members
  for each row execute function public.journal_change(
    'organization_member', 'MEMBER_ROLE_CHANGED', 'role', 'status');

create trigger organization_members_journal_removed
  after delete on public.organization_members
  for each row execute function public.journal_change(
    'organization_member', 'MEMBER_REMOVED', 'user_id', 'role');


-- -----------------------------------------------------------------------------
-- Sites et domaines
-- -----------------------------------------------------------------------------
-- Statut séparé du reste : « le site est passé en ligne le 12 mars » est une
-- question d'exploitation, « qui a changé l'URL de production » une question
-- d'imputation. Les mélanger obligerait à fouiller le même flot pour les deux.
create trigger websites_journal_created
  after insert on public.websites
  for each row execute function public.journal_change(
    'website', 'WEBSITE_CREATED', 'name', 'slug', 'status', 'environment');

create trigger websites_journal_status
  after update of status on public.websites
  for each row execute function public.journal_change(
    'website', 'WEBSITE_STATUS_CHANGED', 'status');

create trigger websites_journal_updated
  after update of name, slug, production_url, repository_url, hosting_provider,
                  vercel_project_id, verification_source
    on public.websites
  for each row execute function public.journal_change(
    'website', 'WEBSITE_UPDATED',
    'name', 'slug', 'production_url', 'repository_url', 'hosting_provider',
    'vercel_project_id', 'verification_source');

create trigger domains_journal_created
  after insert on public.domains
  for each row execute function public.journal_change(
    'domain', 'DOMAIN_CREATED', 'domain', 'registrar', 'is_primary');

create trigger domains_journal_status
  after update of status, dns_status, ssl_status on public.domains
  for each row execute function public.journal_change(
    'domain', 'DOMAIN_STATUS_CHANGED', 'status', 'dns_status', 'ssl_status');

create trigger domains_journal_updated
  after update of domain, registrar, is_primary, website_id, auto_renew,
                  expires_at, nameservers, verification_source
    on public.domains
  for each row execute function public.journal_change(
    'domain', 'DOMAIN_UPDATED',
    'domain', 'registrar', 'is_primary', 'website_id', 'auto_renew',
    'expires_at', 'nameservers', 'verification_source');


-- -----------------------------------------------------------------------------
-- Demandes d'assistance
-- -----------------------------------------------------------------------------
-- Le contenu des messages n'est PAS journalisé. Le fil de conversation est
-- déjà conservé dans `support_messages`, et une note interne recopiée dans
-- `audit_logs` échapperait à la policy qui la protège.
create trigger support_tickets_journal_created
  after insert on public.support_tickets
  for each row execute function public.journal_change(
    'support_ticket', 'TICKET_CREATED', 'reference', 'type', 'category', 'priority');

create trigger support_tickets_journal_status
  after update of status on public.support_tickets
  for each row execute function public.journal_change(
    'support_ticket', 'TICKET_STATUS_CHANGED', 'status');

create trigger support_tickets_journal_assigned
  after update of assigned_to, priority on public.support_tickets
  for each row execute function public.journal_change(
    'support_ticket', 'TICKET_UPDATED', 'assigned_to', 'priority');


-- -----------------------------------------------------------------------------
-- Abonnements
-- -----------------------------------------------------------------------------
-- Ces triggers ne se déclencheront pas avant le raccordement de Stripe : la
-- table restera vide jusque-là. Ils sont posés maintenant pour que la première
-- écriture du webhook soit journalisée, plutôt qu'après avoir constaté que les
-- premières ne l'ont pas été.
--
-- L'auteur sera NULL : le webhook s'exécute sous `service_role`, sans session.
-- C'est exact, et c'est lisible ainsi dans le journal.
create trigger subscriptions_journal_created
  after insert on public.subscriptions
  for each row execute function public.journal_change(
    'subscription', 'SUBSCRIPTION_CHANGED',
    'stripe_subscription_id', 'status', 'plan_id', 'unit_amount_cents');

create trigger subscriptions_journal_updated
  after update of status, plan_id, unit_amount_cents, quantity,
                  cancel_at_period_end, canceled_at, ended_at
    on public.subscriptions
  for each row execute function public.journal_change(
    'subscription', 'SUBSCRIPTION_CHANGED',
    'status', 'plan_id', 'unit_amount_cents', 'quantity',
    'cancel_at_period_end', 'canceled_at', 'ended_at');
