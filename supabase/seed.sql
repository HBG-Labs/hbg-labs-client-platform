-- =============================================================================
-- SEED — Catalogue d'offres HBG Labs (§7)
-- =============================================================================
-- Ce fichier ne contient AUCUNE donnée de démonstration.
--
-- §57 : « Ne pas utiliser de données fictives dans les fonctionnalités
--         finales. » Il n'y a donc ici ni faux client, ni site d'exemple, ni
--         facture inventée — un tableau de bord affichant douze clients
--         imaginaires donne l'illusion d'un produit qui fonctionne et masque
--         tout ce qui ne fonctionne pas encore.
--
-- Ce qui suit est la GRILLE TARIFAIRE RÉELLE de HBG Labs, telle que §7 la
-- définit. C'est une donnée de production, pas un jeu d'essai : le site public
-- l'affiche, et le Checkout s'y adosse.
--
-- Les jeux de test multi-tenant (organisations A et B, utilisateurs A et B)
-- sont créés et détruits par la suite de tests, dans tests/rls/, jamais ici.
--
--
-- IDEMPOTENT
--
-- Rejouable sans effet de bord : ON CONFLICT met à jour plutôt que de
-- dupliquer. `supabase db reset` comme un simple réamorçage donnent le même
-- résultat.
--
--
-- LES IDENTIFIANTS STRIPE RESTENT NULS
--
-- `stripe_product_id` et `stripe_price_id` ne sont pas renseignés : le
-- catalogue Stripe n'existe pas encore (phase 8). Y écrire des valeurs
-- plausibles ferait échouer le Checkout au moment du paiement, avec une erreur
-- Stripe incompréhensible pour le client. Tant que ces colonnes sont NULLes,
-- l'interface présente l'offre et oriente vers le devis — comportement exact
-- attendu par §57.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Plans
-- -----------------------------------------------------------------------------
insert into public.plans (code, name, tagline, description, requires_quote, is_featured, sort_order)
values
  (
    'STARTER',
    'Starter',
    'Votre présence en ligne, simplement.',
    'Un site vitrine professionnel, rapide et responsive, avec l''hébergement inclus. '
    'Idéal pour une activité qui démarre ou une première présence sur le web.',
    false,
    false,
    10
  ),
  (
    'PRO',
    'Pro',
    'Votre site, entretenu au quotidien.',
    'Un site sur mesure, avec hébergement ET maintenance continue : mises à jour, '
    'sauvegardes, corrections et modifications de contenu prises en charge par HBG Labs.',
    false,
    true,
    20
  ),
  (
    'BUSINESS',
    'Business',
    'Un projet sur mesure, accompagné de bout en bout.',
    'Conception entièrement personnalisée, fonctionnalités spécifiques, accompagnement '
    'dédié. Le périmètre et le tarif de création sont établis après étude de votre projet.',
    true,
    false,
    30
  )
on conflict (code) do update
  set name           = excluded.name,
      tagline        = excluded.tagline,
      description    = excluded.description,
      requires_quote = excluded.requires_quote,
      is_featured    = excluded.is_featured,
      sort_order     = excluded.sort_order;


-- -----------------------------------------------------------------------------
-- Prix
-- -----------------------------------------------------------------------------
-- Montants EN CENTIMES. 19 €/mois → 1900.
--
-- Les frais de création sont marqués `is_starting_price` : §7 dit « à partir
-- de 590 € ». L'interface DOIT afficher la mention « à partir de » ; sans
-- elle, le devis contredirait le prix annoncé.
--
-- BUSINESS n'a pas de prix de création : il est sur devis. Il a bien un prix
-- d'abonnement, lui ferme (79 €/mois).

-- Upsert explicite en UPDATE puis INSERT du reliquat, plutôt qu'un ON
-- CONFLICT.
--
-- L'index qui protège l'unicité, `plan_prices_one_active_per_combination`, est
-- à la fois PARTIEL (`where is_active`) et porté par une EXPRESSION
-- (`coalesce(recurring_interval, 'month')`). L'inférence de conflit doit alors
-- reproduire l'expression au caractère près pour désigner le bon index, et
-- échoue à la moindre divergence de formulation — avec une erreur qui ne
-- pointe pas vers sa cause.
--
-- Le couple UPDATE/INSERT ci-dessous ne dépend d'aucune inférence : il énonce
-- la clé métier en toutes lettres. `is not distinct from` gère le cas NULL de
-- la périodicité, là où `=` renverrait NULL et ne rapprocherait jamais deux
-- prix ONE_TIME.
with target as (
  select
    p.id as plan_id,
    v.kind,
    v.recurring_interval,
    v.unit_amount_cents,
    v.is_starting_price
  from (values
    -- code,       nature,                        périodicité,                    montant, « à partir de »
    ('STARTER',  'ONE_TIME'::public.price_kind,  null::public.billing_interval,    59000, true),
    ('STARTER',  'RECURRING',                    'month',                           1900, false),
    ('PRO',      'ONE_TIME',                     null,                             89000, true),
    ('PRO',      'RECURRING',                    'month',                           4900, false),
    ('BUSINESS', 'RECURRING',                    'month',                           7900, false)
  ) as v(plan_code, kind, recurring_interval, unit_amount_cents, is_starting_price)
  join public.plans p on p.code = v.plan_code
),
updated as (
  update public.plan_prices pp
     set unit_amount_cents = t.unit_amount_cents,
         is_starting_price = t.is_starting_price
    from target t
   where pp.plan_id = t.plan_id
     and pp.kind = t.kind
     and pp.recurring_interval is not distinct from t.recurring_interval
     and pp.currency = 'EUR'
     and pp.is_active
  returning pp.plan_id, pp.kind, pp.recurring_interval
)
insert into public.plan_prices
  (plan_id, kind, recurring_interval, unit_amount_cents, currency, is_starting_price, is_active)
select t.plan_id, t.kind, t.recurring_interval, t.unit_amount_cents, 'EUR', t.is_starting_price, true
  from target t
 where not exists (
   select 1
     from updated u
    where u.plan_id = t.plan_id
      and u.kind = t.kind
      and u.recurring_interval is not distinct from t.recurring_interval
 );


-- -----------------------------------------------------------------------------
-- Caractéristiques des offres
-- -----------------------------------------------------------------------------
-- La grille comparative de la page /tarifs. `is_included = false` affiche la
-- ligne barrée plutôt que de l'omettre : le client voit ce que l'offre
-- supérieure lui apporterait.
insert into public.plan_features (plan_id, label, is_included, detail, sort_order)
select p.id, v.label, v.is_included, v.detail, v.sort_order
from (values
  -- ---- STARTER ----
  ('STARTER', 'Site vitrine responsive',            true,  'Affichage optimisé sur mobile, tablette et ordinateur.', 10),
  ('STARTER', 'Jusqu''à 5 pages',                   true,  null, 20),
  ('STARTER', 'Nom de domaine configuré',           true,  'Configuration DNS et raccordement au site.', 30),
  ('STARTER', 'Certificat SSL',                     true,  'Connexion chiffrée HTTPS, renouvellement automatique.', 40),
  ('STARTER', 'Hébergement infogéré',               true,  'Hébergement Vercel, supervision incluse.', 50),
  ('STARTER', 'Formulaire de contact',              true,  null, 60),
  ('STARTER', 'Optimisation SEO de base',           true,  'Titres, méta-descriptions, sitemap, robots.txt.', 70),
  ('STARTER', 'Modifications de contenu incluses',  false, 'Disponible à partir de l''offre Pro.', 80),
  ('STARTER', 'Support prioritaire',                false, 'Disponible à partir de l''offre Pro.', 90),

  -- ---- PRO ----
  ('PRO', 'Tout ce que comprend Starter',           true,  null, 10),
  ('PRO', 'Pages illimitées',                       true,  null, 20),
  ('PRO', 'Maintenance continue',                   true,  'Mises à jour techniques, sauvegardes et corrections.', 30),
  ('PRO', 'Modifications de contenu incluses',      true,  'Textes, photos, horaires : vous demandez, nous appliquons.', 40),
  ('PRO', 'Support prioritaire',                    true,  'Réponse sous 24 h ouvrées.', 50),
  ('PRO', 'Suivi de disponibilité',                 true,  'Supervision du site et alerte en cas d''indisponibilité.', 60),
  ('PRO', 'Optimisation des performances',          true,  'Images optimisées, chargement différé, mise en cache.', 70),
  ('PRO', 'Fonctionnalités sur mesure',             false, 'Disponible avec l''offre Business.', 80),

  -- ---- BUSINESS ----
  ('BUSINESS', 'Tout ce que comprend Pro',          true,  null, 10),
  ('BUSINESS', 'Conception entièrement sur mesure', true,  'Maquettes et développement spécifiques à votre activité.', 20),
  ('BUSINESS', 'Fonctionnalités spécifiques',       true,  'Réservation, espace client, catalogue, intégrations métier.', 30),
  ('BUSINESS', 'Accompagnement dédié',              true,  'Un interlocuteur unique tout au long du projet.', 40),
  ('BUSINESS', 'Intégrations tierces',              true,  'Outils de gestion, CRM, paiement en ligne.', 50),
  ('BUSINESS', 'Support prioritaire renforcé',      true,  'Réponse sous 4 h ouvrées.', 60)
) as v(plan_code, label, is_included, detail, sort_order)
join public.plans p on p.code = v.plan_code
on conflict (plan_id, label) do update
  set is_included = excluded.is_included,
      detail      = excluded.detail,
      sort_order  = excluded.sort_order;


-- -----------------------------------------------------------------------------
-- Contrôle de cohérence
-- -----------------------------------------------------------------------------
-- Un seed silencieusement incomplet est pire qu'un seed en échec : le site
-- afficherait une grille tarifaire partielle sans que rien ne le signale.
do $$
declare
  v_plans integer;
  v_prices integer;
  v_features integer;
begin
  select count(*) into v_plans    from public.plans;
  select count(*) into v_prices   from public.plan_prices where is_active;
  select count(*) into v_features from public.plan_features;

  if v_plans < 3 then
    raise exception 'Seed incomplet : % plan(s) au lieu de 3.', v_plans;
  end if;

  if v_prices < 5 then
    raise exception 'Seed incomplet : % prix actif(s) au lieu de 5.', v_prices;
  end if;

  raise notice 'Seed HBG Labs : % plans, % prix actifs, % caractéristiques.',
    v_plans, v_prices, v_features;
end;
$$;
