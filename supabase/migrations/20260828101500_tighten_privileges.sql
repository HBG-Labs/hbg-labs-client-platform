-- =============================================================================
-- 16 — Privilèges de table : retrait du surplus accordé par défaut
-- =============================================================================
-- CORRECTIF DE SÉCURITÉ, issu de l'audit des privilèges réels après le premier
-- déploiement.
--
--
-- CE QUI S'EST PASSÉ
--
-- Supabase pose, sur chaque projet :
--
--     alter default privileges in schema public
--       grant all on tables to postgres, anon, authenticated, service_role;
--
-- Toute table créée dans `public` naît donc avec SELECT, INSERT, UPDATE,
-- DELETE, TRUNCATE, REFERENCES et TRIGGER accordés à `anon` ET à
-- `authenticated`. Seule la RLS s'y oppose ensuite.
--
-- Les migrations 02 à 15 écrivaient `grant select on table X to authenticated`
-- en pensant DÉFINIR les privilèges. Un GRANT est additif : il n'a jamais
-- retiré le surplus. Le `revoke all ... from anon` était en revanche correct —
-- d'où un `anon` propre, et un `authenticated` doté de tout, partout.
--
--
-- POURQUOI C'EST UN PROBLÈME MALGRÉ LA RLS
--
-- Les tests d'isolation passent : la RLS filtre bien SELECT, INSERT, UPDATE et
-- DELETE, et aucune donnée n'a jamais été accessible.
--
-- Mais **TRUNCATE n'est pas soumis à la RLS**. C'est une commande de niveau
-- table : les policies ne s'y appliquent pas. Un rôle qui détient TRUNCATE vide
-- la table intégralement, quelles que soient les policies. `authenticated` le
-- détenait sur `invoices`, `payments` et `audit_logs`.
--
-- PostgREST n'émet jamais de TRUNCATE, le chemin n'était donc pas exploitable
-- depuis l'API. Mais « pas atteignable aujourd'hui » n'est pas une propriété de
-- sécurité : elle disparaît au premier RPC exécutant du SQL dynamique. Et
-- REFERENCES et TRIGGER n'ont, eux, aucune justification.
--
-- La documentation annonçait deux barrières indépendantes — policies ET
-- privilèges. Il n'y en avait qu'une. Cette migration rétablit la seconde.
--
--
-- MÉTHODE
--
-- 1. Retrait de TOUS les privilèges à `anon` et `authenticated` sur toutes les
--    tables de `public`, par balayage — une liste écrite à la main finirait par
--    oublier une table.
-- 2. Réattribution explicite du strict nécessaire, table par table, aligné sur
--    les policies existantes. Un privilège sans policy correspondante ne sert à
--    rien ; une policy sans privilège ne s'applique jamais.
-- 3. Changement des privilèges par défaut, pour que les tables futures ne
--    reproduisent pas le problème.
--
-- Les SÉQUENCES ne sont pas touchées : `support_tickets.reference` appelle
-- `nextval()` sous l'identité de l'appelant, qui a besoin d'USAGE.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Table rase
-- -----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  for v_table in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke all on table public.%I from anon, authenticated', v_table);
  end loop;
end;
$$;


-- -----------------------------------------------------------------------------
-- 2. Réattribution explicite
-- -----------------------------------------------------------------------------

-- ---- Catalogue : seule lecture publique du schéma (§7) ----
grant select                          on table public.plans         to anon, authenticated;
grant insert, update, delete          on table public.plans         to authenticated;

grant select                          on table public.plan_prices   to anon, authenticated;
grant insert, update, delete          on table public.plan_prices   to authenticated;

grant select                          on table public.plan_features to anon, authenticated;
grant insert, update, delete          on table public.plan_features to authenticated;

-- ---- Identité ----
-- profiles : ni INSERT (trigger handle_new_user), ni DELETE (cascade auth.users).
grant select, update                  on table public.profiles      to authenticated;
grant select, insert, update          on table public.organizations to authenticated;
grant select, insert, update, delete  on table public.organization_members to authenticated;

-- ---- Sites et domaines ----
grant select, insert, update, delete  on table public.websites      to authenticated;
grant select, insert, update, delete  on table public.domains       to authenticated;

-- ---- Facturation : LECTURE SEULE, sans exception (§20, §22) ----
-- Aucune policy d'écriture n'existe sur ces tables ; le privilège
-- correspondant ne doit pas exister non plus. Seul service_role écrit, via le
-- webhook Stripe.
grant select                          on table public.subscriptions to authenticated;
grant select                          on table public.invoices      to authenticated;
grant select                          on table public.payments      to authenticated;

-- ---- Support ----
-- support_messages : ni UPDATE ni DELETE — un message envoyé ne se réécrit pas.
grant select, insert, update          on table public.support_tickets     to authenticated;
grant select, insert                  on table public.support_messages    to authenticated;
grant select, insert, delete          on table public.ticket_attachments  to authenticated;

-- ---- Notifications ----
grant select, insert, update          on table public.notifications to authenticated;

-- ---- Journal d'audit : AJOUT SEUL (§44) ----
-- SELECT uniquement. L'écriture passe par log_audit_event(), en SECURITY
-- DEFINER, qui n'a pas besoin que l'appelant détienne INSERT.
grant select                          on table public.audit_logs    to authenticated;

-- ---- Formulaires publics (§4, §5) ----
grant insert                          on table public.quote_requests   to anon, authenticated;
grant select, update                  on table public.quote_requests   to authenticated;

grant insert                          on table public.contact_messages to anon, authenticated;
grant select, update                  on table public.contact_messages to authenticated;

-- ---- stripe_webhook_events : AUCUN privilège (§21) ----
-- Volontairement absente de cette liste. Table fermée : RLS sans policy ET
-- aucun privilège. Seul service_role (BYPASSRLS) l'atteint.


-- -----------------------------------------------------------------------------
-- 3. Empêcher la réapparition du problème
-- -----------------------------------------------------------------------------
-- Sans ceci, la prochaine table créée dans une migration renaîtrait avec tous
-- les privilèges pour anon et authenticated, et l'oubli se reproduirait
-- silencieusement.
--
-- Portée : les objets créés par `postgres`, le rôle qui exécute les migrations.
-- La conséquence est voulue — toute table future devra déclarer ses privilèges
-- explicitement, ce qui est déjà la convention du projet.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

comment on schema public is
  'Privilèges par défaut retirés à anon et authenticated (migration 16) : toute nouvelle table doit accorder explicitement ses privilèges.';
