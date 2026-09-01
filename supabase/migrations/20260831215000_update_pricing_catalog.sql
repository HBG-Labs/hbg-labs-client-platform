-- =============================================================================
-- Migration : Mise à jour de la grille tarifaire HBG Labs
-- =============================================================================
-- Starter : 490 € (création dès) + 29 € / mois (HBG Care)
-- Business (anciennement Pro) : 890 € (création dès) + 49 € / mois (HBG Care Plus)
-- Premium (anciennement Business) : 1 490 € (création dès) + 79 € / mois (HBG Care Pro)

-- 1. Mise à jour des offres
UPDATE public.plans
SET name = 'Starter',
    tagline = 'L’essentiel pour être visible sur le web.',
    description = 'Site vitrine 1 à 3 pages, moderne, rapide et responsive. Idéal pour les indépendants et petites activités locales.',
    requires_quote = false,
    is_featured = false,
    sort_order = 10
WHERE code = 'STARTER';

UPDATE public.plans
SET name = 'Business',
    tagline = 'Un site professionnel pensé pour développer votre activité.',
    description = 'Site 4 à 6 pages sur mesure avec animations, Google Maps, formulaires avancés et statistiques intégrées.',
    requires_quote = false,
    is_featured = true,
    sort_order = 20
WHERE code = 'PRO';

UPDATE public.plans
SET name = 'Premium',
    tagline = 'Une expérience web haut de gamme pour une entreprise ambitieuse.',
    description = 'Site 7 à 10 pages sur mesure, design premium, animations avancées, SEO poussé et formation incluse.',
    requires_quote = false,
    is_featured = false,
    sort_order = 30
WHERE code = 'BUSINESS';

-- 2. Mise à jour des prix
-- STARTER
UPDATE public.plan_prices
SET unit_amount_cents = 58000, is_starting_price = true
WHERE plan_id = (SELECT id FROM public.plans WHERE code = 'STARTER') AND kind = 'ONE_TIME';

UPDATE public.plan_prices
SET unit_amount_cents = 2900, is_starting_price = false
WHERE plan_id = (SELECT id FROM public.plans WHERE code = 'STARTER') AND kind = 'RECURRING';

-- BUSINESS (code PRO)
UPDATE public.plan_prices
SET unit_amount_cents = 89000, is_starting_price = true
WHERE plan_id = (SELECT id FROM public.plans WHERE code = 'PRO') AND kind = 'ONE_TIME';

UPDATE public.plan_prices
SET unit_amount_cents = 4900, is_starting_price = false
WHERE plan_id = (SELECT id FROM public.plans WHERE code = 'PRO') AND kind = 'RECURRING';

-- PREMIUM (code BUSINESS)
INSERT INTO public.plan_prices (plan_id, kind, recurring_interval, unit_amount_cents, currency, is_starting_price, is_active)
SELECT id, 'ONE_TIME', null, 149000, 'EUR', true, true
FROM public.plans WHERE code = 'BUSINESS'
ON CONFLICT (plan_id, kind, (coalesce(recurring_interval, 'month'::public.billing_interval)), currency) WHERE is_active
DO UPDATE SET unit_amount_cents = 149000, is_starting_price = true;

UPDATE public.plan_prices
SET unit_amount_cents = 7900, is_starting_price = false
WHERE plan_id = (SELECT id FROM public.plans WHERE code = 'BUSINESS') AND kind = 'RECURRING';

-- 3. Mise à jour des caractéristiques
DELETE FROM public.plan_features;

INSERT INTO public.plan_features (plan_id, label, is_included, detail, sort_order)
SELECT p.id, v.label, v.is_included, v.detail, v.sort_order
FROM (VALUES
  ('STARTER', 'Site vitrine 1 à 3 pages', true, 'Design moderne, responsive mobile, tablette et ordinateur.', 10),
  ('STARTER', 'Formulaire de contact & WhatsApp', true, 'Bouton d''action directe et réseaux sociaux.', 20),
  ('STARTER', 'Nom de domaine & certificat SSL', true, 'Connexion chiffrée HTTPS, configuration DNS incluse.', 30),
  ('STARTER', 'Hébergement infogéré', true, 'Hébergement haute performance et supervision continue.', 40),
  ('STARTER', 'SEO technique de base', true, 'Titres, méta-descriptions, indexation Google.', 50),
  ('STARTER', '1 série de modifications', true, 'Ajustements avant mise en ligne définitive.', 60),
  ('STARTER', 'Délai indicatif : 5 à 7 jours', true, 'Livraison rapide clé en main.', 70),
  ('STARTER', 'HBG Care : Hébergement (29 €/mois)', true, 'Hébergement, sauvegardes et surveillance.', 80),
  ('STARTER', 'Modifications mensuelles incluses', false, 'Disponible à partir de l''offre Business.', 90),

  ('PRO', 'Site 4 à 6 pages sur mesure', true, 'Design entièrement personnalisé à votre identité.', 10),
  ('PRO', 'Animations & micro-interactions', true, 'Expérience visuelle soignée et fluide.', 20),
  ('PRO', 'Formulaire de contact avancé & Devis', true, 'Champs personnalisés et alertes directes.', 30),
  ('PRO', 'Google Maps & Réseaux sociaux', true, 'Localisation interactive et liens vers vos profils.', 40),
  ('PRO', 'Optimisation des performances & SEO', true, 'Chargement ultra-rapide et balisage optimisé.', 50),
  ('PRO', 'Google Analytics & Statistiques', true, 'Suivi de fréquentation et tableau de bord.', 60),
  ('PRO', 'Jusqu''à 2 séries de modifications', true, 'Affinement du design et des contenus.', 70),
  ('PRO', 'Délai indicatif : 7 à 14 jours', true, 'Mise en ligne soignée et vérifiée.', 80),
  ('PRO', 'HBG Care Plus : Hébergement + 30 min modifs/mois (49 €/mois)', true, 'Hébergement + 30 min de modifications/mois incluses.', 90),
  ('PRO', 'Support prioritaire sous 24 h', true, 'Assistance réactive.', 100),

  ('BUSINESS', 'Site 7 à 10 pages sur mesure', true, 'Expérience haut de gamme complète.', 10),
  ('BUSINESS', 'Animations avancées & UX sur mesure', true, 'Design exclusif pour maximiser l''impact.', 20),
  ('BUSINESS', 'Formulaires avancés & Outils externes', true, 'Intégration CRM, formulaires interactifs.', 30),
  ('BUSINESS', 'SEO technique avancé & Vitesse max', true, 'Optimisation poussée pour les moteurs de recherche.', 40),
  ('BUSINESS', 'Statistiques et suivi d''audience', true, 'Rapports de consultation réguliers.', 50),
  ('BUSINESS', 'Jusqu''à 3 séries de modifications', true, 'Accompagnement et finitions pointues.', 60),
  ('BUSINESS', 'Formation rapide à la gestion du site', true, 'Prise en main guidée de vos outils.', 70),
  ('BUSINESS', 'Délai indicatif : 2 à 3 semaines', true, 'Développement et tests complets.', 80),
  ('BUSINESS', 'HBG Care Pro : Hébergement + 1 h modifs/mois + rapport (79 €/mois)', true, 'Hébergement + 1 h de modifications/mois + rapport mensuel.', 90),
  ('BUSINESS', 'Support prioritaire direct', true, 'Assistance dédiée.', 100)
) AS v(plan_code, label, is_included, detail, sort_order)
JOIN public.plans p ON p.code = v.plan_code;
