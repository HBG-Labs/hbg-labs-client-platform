-- =============================================================================
-- 21 — Correctif : fermer réellement email_delivery_enabled()
-- =============================================================================
-- La migration 20 termine par :
--
--     revoke execute on function public.email_delivery_enabled() from public;
--
-- L'intention était de réserver cette fonction au backend. Elle n'y parvient
-- pas, et le test l'a montré : un client connecté l'appelait encore.
--
--
-- POURQUOI `REVOKE ... FROM PUBLIC` NE SUFFIT PAS ICI
--
-- Une fonction fraîchement créée reçoit deux choses distinctes :
--
--   * le privilège implicite accordé au pseudo-rôle PUBLIC, que ce `revoke`
--     retire bien ;
--   * les privilèges accordés par les DEFAULT PRIVILEGES du projet Supabase,
--     qui portent un `grant all on functions to anon, authenticated,
--     service_role`. Ceux-là sont des grants NOMMÉS, et retirer PUBLIC ne les
--     touche pas.
--
-- Les migrations 02 et 19 ne tombaient pas dans le piège : elles révoquent
-- `from public, anon, authenticated`. La 20 s'en est écartée.
--
-- La leçon vaut au-delà de cette fonction : sur PostgreSQL, retirer un
-- privilège à PUBLIC ne retire rien à un rôle qui le détient nommément. Un
-- `revoke` qui ne révoque pas ne produit aucune erreur — c'est la raison pour
-- laquelle ce point se vérifie par un test contre la base, et non par
-- relecture.
--
--
-- POURQUOI UNE SECONDE MIGRATION PLUTÔT QU'UNE CORRECTION DE LA PREMIÈRE
--
-- La 20 est déjà appliquée à la base du projet. Réécrire un fichier déjà joué
-- ferait diverger le dépôt de la base sans que rien ne l'indique : une
-- installation neuve obtiendrait un schéma que personne n'a jamais exécuté
-- (§ règles Git, « migrations SQL immuables »).
-- =============================================================================

revoke execute on function public.email_delivery_enabled()
  from public, anon, authenticated;

-- `service_role` conserve l'exécution : les scripts d'exploitation la lisent.
grant execute on function public.email_delivery_enabled() to service_role;
