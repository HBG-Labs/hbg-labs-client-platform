-- =============================================================================
-- SEED — Catalogue d'offres HBG Labs (§7)
-- =============================================================================
-- Ce fichier ne contient AUCUNE donnée de démonstration.
--
-- §57 : « Ne pas utiliser de données fictives dans les fonctionnalités
--         finales. » Il n'y a donc ici ni faux client, ni site d'exemple, ni
--         facture inventée.
--
-- Ce qui suit est la GRILLE TARIFAIRE RÉELLE de HBG Labs.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Plans
-- -----------------------------------------------------------------------------
insert into public.plans (code, name, tagline, description, requires_quote, is_featured, sort_order)
values
  (
    'STARTER',
    'Starter',
    'L’essentiel pour être visible sur le web.',
    'Site vitrine 1 à 3 pages, moderne, rapide et responsive. Idéal pour les indépendants et petites activités locales.',
    false,
    false,
    10
  ),
  (
    'PRO',
    'Business',
    'Un site professionnel pensé pour développer votre activité.',
    'Site 4 à 6 pages sur mesure avec animations, Google Maps, formulaires avancés et statistiques intégrées.',
    false,
    true,
    20
  ),
  (
    'BUSINESS',
    'Premium',
    'Une expérience web haut de gamme pour une entreprise ambitieuse.',
    'Site 7 à 10 pages sur mesure, design premium, animations avancées, SEO poussé et formation incluse.',
    false,
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
-- Montants EN CENTIMES.
-- STARTER : 490 € (Setup) + 29 € / mois (HBG Care)
-- BUSINESS : 890 € (Setup) + 49 € / mois (HBG Care Plus)
-- PREMIUM : 1 490 € (Setup) + 79 € / mois (HBG Care Pro)
with target as (
  select
    p.id as plan_id,
    v.kind,
    v.recurring_interval,
    v.unit_amount_cents,
    v.is_starting_price
  from (values
    -- code,       nature,                        périodicité,                    montant, « à partir de »
    ('STARTER',  'ONE_TIME'::public.price_kind,  null::public.billing_interval,    49000, true),
    ('STARTER',  'RECURRING',                    'month',                           2900, false),
    ('PRO',      'ONE_TIME',                     null,                             89000, true),
    ('PRO',      'RECURRING',                    'month',                           4900, false),
    ('BUSINESS', 'ONE_TIME',                     null,                            149000, true),
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
insert into public.plan_features (plan_id, label, is_included, detail, sort_order)
select p.id, v.label, v.is_included, v.detail, v.sort_order
from (values
  -- ---- STARTER ----
  ('STARTER', 'Site vitrine 1 à 3 pages',            true,  'Design moderne, responsive mobile, tablette et ordinateur.', 10),
  ('STARTER', 'Formulaire de contact & WhatsApp',    true,  'Bouton d''action directe et réseaux sociaux.', 20),
  ('STARTER', 'Nom de domaine & certificat SSL',     true,  'Connexion chiffrée HTTPS, configuration DNS incluse.', 30),
  ('STARTER', 'Hébergement infogéré',               true,  'Hébergement haute performance et supervision continue.', 40),
  ('STARTER', 'SEO technique de base',               true,  'Titres, méta-descriptions, indexation Google.', 50),
  ('STARTER', '1 série de modifications',            true,  'Ajustements avant mise en ligne définitive.', 60),
  ('STARTER', 'Délai indicatif : 5 à 7 jours',       true,  'Livraison rapide clé en main.', 70),
  ('STARTER', 'HBG Care : Hébergement (29 €/mois)',  true,  'Hébergement, sauvegardes et surveillance.', 80),
  ('STARTER', 'Modifications mensuelles incluses',   false, 'Disponible à partir de l''offre Business.', 90),

  -- ---- BUSINESS (PRO) ----
  ('PRO', 'Site 4 à 6 pages sur mesure',             true,  'Design entièrement personnalisé à votre identité.', 10),
  ('PRO', 'Animations & micro-interactions',         true,  'Expérience visuelle soignée et fluide.', 20),
  ('PRO', 'Formulaire de contact avancé & Devis',    true,  'Champs personnalisés et alertes directes.', 30),
  ('PRO', 'Google Maps & Réseaux sociaux',           true,  'Localisation interactive et liens vers vos profils.', 40),
  ('PRO', 'Optimisation des performances & SEO',     true,  'Chargement ultra-rapide et balisage optimisé.', 50),
  ('PRO', 'Google Analytics & Statistiques',         true,  'Suivi de fréquentation et tableau de bord.', 60),
  ('PRO', 'Jusqu''à 2 séries de modifications',      true,  'Affinement du design et des contenus.', 70),
  ('PRO', 'Délai indicatif : 7 à 14 jours',          true,  'Mise en ligne soignée et vérifiée.', 80),
  ('PRO', 'HBG Care Plus : Hébergement + 30 min modifs/mois (49 €/mois)', true, 'Hébergement + 30 min de modifications/mois incluses.', 90),
  ('PRO', 'Support prioritaire sous 24 h',           true,  'Assistance réactive.', 100),

  -- ---- PREMIUM (BUSINESS) ----
  ('BUSINESS', 'Site 7 à 10 pages sur mesure',       true,  'Expérience haut de gamme complète.', 10),
  ('BUSINESS', 'Animations avancées & UX sur mesure', true, 'Design exclusif pour maximiser l''impact.', 20),
  ('BUSINESS', 'Formulaires avancés & Outils externes', true, 'Intégration CRM, formulaires interactifs.', 30),
  ('BUSINESS', 'SEO technique avancé & Vitesse max', true,  'Optimisation poussée pour les moteurs de recherche.', 40),
  ('BUSINESS', 'Statistiques et suivi d''audience',  true,  'Rapports de consultation réguliers.', 50),
  ('BUSINESS', 'Jusqu''à 3 séries de modifications', true,  'Accompagnement et finitions pointues.', 60),
  ('BUSINESS', 'Formation rapide à la gestion du site', true, 'Prise en main guidée de vos outils.', 70),
  ('BUSINESS', 'Délai indicatif : 2 à 3 semaines',   true,  'Développement et tests complets.', 80),
  ('BUSINESS', 'HBG Care Pro : Hébergement + 1 h modifs/mois + rapport (79 €/mois)', true, 'Hébergement + 1 h de modifications/mois + rapport mensuel.', 90),
  ('BUSINESS', 'Support prioritaire direct',         true,  'Assistance dédiée.', 100)
) as v(plan_code, label, is_included, detail, sort_order)
join public.plans p on p.code = v.plan_code
on conflict (plan_id, label) do update
  set is_included = excluded.is_included,
      detail      = excluded.detail,
      sort_order  = excluded.sort_order;


-- -----------------------------------------------------------------------------
-- Contrôle de cohérence
-- -----------------------------------------------------------------------------
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

  if v_prices < 6 then
    raise exception 'Seed incomplet : % prix actif(s) au lieu de 6.', v_prices;
  end if;

  raise notice 'Seed HBG Labs : % plans, % prix actifs, % caractéristiques.',
    v_plans, v_prices, v_features;
end;
$$;
