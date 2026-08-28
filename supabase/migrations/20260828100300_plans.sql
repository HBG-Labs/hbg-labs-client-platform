-- =============================================================================
-- 04 — Catalogue d'offres : plans, plan_prices, plan_features
-- =============================================================================
-- §7 est explicite : « Les prix doivent être stockés dans la base de données
-- et non codés en dur partout dans le frontend », et prévoit trois entités —
-- plans, prices, features.
--
--
-- POURQUOI SÉPARER LE PRIX DU PLAN
--
-- Avec un `monthly_price_cents` porté par `plans`, augmenter le tarif PRO de
-- 49 € à 59 € réécrit la ligne. Les clients déjà abonnés à 49 € voient alors
-- 59 € dans leur espace : leur historique est faussé, et la page de
-- facturation contredit leur relevé bancaire.
--
-- Une table de prix distincte permet de désactiver l'ancien prix et d'en créer
-- un nouveau. L'ancien reste référencé par les abonnements en cours, le
-- nouveau s'applique aux souscriptions à venir. C'est aussi le modèle de
-- Stripe (Product / Price), ce qui rend la synchronisation directe.
--
--
-- LES MONTANTS SONT EN CENTIMES, EN ENTIERS
--
-- Jamais de flottant sur de l'argent : 0.1 + 0.2 ≠ 0.3 en binaire, et les
-- écarts s'accumulent sur les totaux. `integer` en centimes est également la
-- représentation de Stripe — aucune conversion, donc aucune dérive possible.
--
--
-- SEULES TABLES LISIBLES PAR UN VISITEUR ANONYME
--
-- La page /tarifs doit afficher les offres sans authentification. Ce sont les
-- trois seules tables du schéma où `anon` obtient un droit de lecture, et
-- uniquement sur les lignes publiques et actives.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),

  -- Identifiant métier stable (STARTER, PRO, BUSINESS). Sert de référence dans
  -- le code et les URL, là où l'UUID serait illisible. Le nom commercial peut
  -- changer sans casser quoi que ce soit ; ce code, non.
  code text not null
    constraint plans_code_format check (code ~ '^[A-Z][A-Z0-9_]{1,30}$'),

  name text not null
    constraint plans_name_length check (char_length(trim(name)) between 2 and 60),

  -- Accroche courte affichée sous le nom sur la page /tarifs.
  tagline text
    constraint plans_tagline_length check (char_length(tagline) between 2 and 160),

  description text,

  -- Visible sur le site public. Un plan sur mesure négocié avec un client
  -- précis existe en base sans apparaître dans la grille tarifaire.
  is_public boolean not null default true,

  -- Souscriptible. Un plan retiré du catalogue passe à `false` : il n'est plus
  -- proposé, mais reste lisible pour les abonnements qui s'y rattachent encore.
  is_active boolean not null default true,

  -- BUSINESS est « Création sur mesure » (§7) : pas de prix d'amorçage affiché,
  -- l'appel à l'action mène au formulaire de devis et non au Checkout.
  requires_quote boolean not null default false,

  -- Mise en avant visuelle sur la grille tarifaire.
  is_featured boolean not null default false,

  sort_order integer not null default 0,

  -- Product Stripe (prod_...). NULL tant que le catalogue Stripe n'est pas
  -- créé : le site public affiche alors les offres, mais le Checkout reste
  -- indisponible (§57 — ne pas simuler une capacité absente).
  stripe_product_id text
    constraint plans_stripe_product_id_format check (stripe_product_id ~ '^prod_[A-Za-z0-9]+$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is
  'Catalogue d''offres HBG Labs. Lisible par anon si is_public et is_active.';

create unique index plans_code_key on public.plans (code);

create unique index plans_stripe_product_id_key
  on public.plans (stripe_product_id)
  where stripe_product_id is not null;

-- Sert le tri de la grille tarifaire publique sans tri en mémoire.
create index plans_public_sort_idx on public.plans (sort_order, code)
  where is_public and is_active;

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- plan_prices
-- -----------------------------------------------------------------------------
-- Un plan porte plusieurs prix : la création du site (paiement unique) et
-- l'hébergement/maintenance (mensuel). Voir §7 — « Création de site à partir
-- de 590 € » + « Hébergement 19 €/mois ».
create table public.plan_prices (
  id uuid primary key default gen_random_uuid(),

  plan_id uuid not null
    references public.plans (id) on delete cascade,

  -- RECURRING = abonnement ; ONE_TIME = frais de création.
  kind public.price_kind not null,

  -- Périodicité, uniquement pour un prix récurrent. La contrainte
  -- `plan_prices_interval_matches_kind` plus bas rend l'incohérence impossible.
  --
  -- Nommée `recurring_interval` et non `interval` : `interval` est un nom de
  -- type PostgreSQL, et l'analyseur syntaxique le traite comme tel dans
  -- certaines expressions (`interval '1 day'`). Une colonne ainsi nommée
  -- fonctionne dans un SELECT simple mais casse dans une expression d'index.
  recurring_interval public.billing_interval,

  -- En centimes. 19 €/mois → 1900.
  unit_amount_cents integer not null
    constraint plan_prices_amount_positive check (unit_amount_cents >= 0),

  -- ISO 4217. EUR pour la Martinique et la France métropolitaine.
  currency text not null default 'EUR'
    constraint plan_prices_currency_format check (currency ~ '^[A-Z]{3}$'),

  -- « À PARTIR DE » (§7). La création de site démarre à 590 € mais dépend du
  -- périmètre réel : le montant affiché est un point de départ, pas un tarif
  -- ferme. Sans ce drapeau, l'interface annoncerait un prix que le devis
  -- contredirait — exactement le genre d'information fausse que §57 proscrit.
  is_starting_price boolean not null default false,

  -- Price Stripe (price_...). NULL tant que le catalogue Stripe n'existe pas.
  stripe_price_id text
    constraint plan_prices_stripe_price_id_format check (stripe_price_id ~ '^price_[A-Za-z0-9]+$'),

  -- Un prix remplacé passe à `false` ; il n'est jamais supprimé, car les
  -- abonnements en cours le référencent.
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un prix récurrent a une périodicité, un paiement unique n'en a pas.
  constraint plan_prices_interval_matches_kind check (
    (kind = 'RECURRING' and recurring_interval is not null) or
    (kind = 'ONE_TIME'  and recurring_interval is null)
  )
);

comment on table public.plan_prices is
  'Prix d''un plan. Montants en centimes (entiers). Un prix remplacé est désactivé, jamais supprimé : les abonnements en cours le référencent.';
comment on column public.plan_prices.is_starting_price is
  'True = « à partir de ». L''interface DOIT afficher la mention ; le montant n''est pas ferme.';

create index plan_prices_plan_id_idx on public.plan_prices (plan_id);

create unique index plan_prices_stripe_price_id_key
  on public.plan_prices (stripe_price_id)
  where stripe_price_id is not null;

-- Un seul prix ACTIF par combinaison (plan, nature, périodicité, devise).
-- Sans cette contrainte, deux prix mensuels actifs coexisteraient et la page
-- /tarifs afficherait l'un ou l'autre selon l'ordre de tri — un bug
-- d'affichage de prix, silencieux et impossible à reproduire à la demande.
--
-- COALESCE sur la périodicité : NULL n'entre pas dans une contrainte
-- d'unicité, deux prix ONE_TIME actifs passeraient donc à travers.
create unique index plan_prices_one_active_per_combination
  on public.plan_prices (
    plan_id,
    kind,
    (coalesce(recurring_interval, 'month'::public.billing_interval)),
    currency
  )
  where is_active;

create trigger plan_prices_set_updated_at
  before update on public.plan_prices
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- plan_features
-- -----------------------------------------------------------------------------
-- Les lignes de la grille comparative (§7). En table plutôt qu'en JSONB :
-- HBG Labs doit pouvoir les réordonner depuis l'administration, et une
-- contrainte d'unicité empêche les doublons — deux garanties qu'un tableau
-- JSON n'offre pas.
create table public.plan_features (
  id uuid primary key default gen_random_uuid(),

  plan_id uuid not null
    references public.plans (id) on delete cascade,

  label text not null
    constraint plan_features_label_length check (char_length(trim(label)) between 2 and 160),

  -- Permet d'afficher une ligne barrée ou grisée (« Maintenance : non incluse »)
  -- plutôt que de l'omettre : le client voit ce que l'offre supérieure apporte.
  is_included boolean not null default true,

  -- Précision affichée en infobulle.
  detail text
    constraint plan_features_detail_length check (char_length(detail) between 2 and 400),

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint plan_features_unique_label unique (plan_id, label)
);

comment on table public.plan_features is
  'Lignes de la grille comparative d''une offre. Ordonnées par sort_order.';

create index plan_features_plan_id_sort_idx
  on public.plan_features (plan_id, sort_order);

create trigger plan_features_set_updated_at
  before update on public.plan_features
  for each row execute function public.set_updated_at();


-- =============================================================================
-- RLS — catalogue
-- =============================================================================
-- Seules tables du schéma lisibles sans authentification. Elles ne contiennent
-- aucune donnée client : uniquement le catalogue commercial, déjà destiné à
-- être public.
--
-- La lecture reste filtrée : un plan non public ou désactivé n'est jamais
-- exposé, même à un utilisateur connecté.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- RLS : plans
-- -----------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.plans force row level security;

grant select on table public.plans to anon, authenticated;
grant insert, update, delete on table public.plans to authenticated;

-- Grille tarifaire publique.
create policy plans_select_public
  on public.plans for select to anon, authenticated
  using (is_public and is_active);

-- Le personnel voit tout le catalogue, y compris les plans retirés et les
-- offres négociées hors grille.
create policy plans_select_staff
  on public.plans for select to authenticated
  using (public.is_platform_staff());

-- Écriture réservée à l'administration plateforme (§28).
create policy plans_insert_admin
  on public.plans for insert to authenticated
  with check (public.is_platform_admin());

create policy plans_update_admin
  on public.plans for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Suppression réservée au OWNER : supprimer un plan encore référencé par un
-- abonnement casserait l'affichage de la facturation du client concerné.
-- Le geste normal est la désactivation (is_active = false).
create policy plans_delete_owner
  on public.plans for delete to authenticated
  using (public.is_platform_owner());


-- -----------------------------------------------------------------------------
-- RLS : plan_prices
-- -----------------------------------------------------------------------------
alter table public.plan_prices enable row level security;
alter table public.plan_prices force row level security;

grant select on table public.plan_prices to anon, authenticated;
grant insert, update, delete on table public.plan_prices to authenticated;

-- Un prix n'est visible que si son plan l'est, et seulement s'il est actif.
-- La sous-requête est elle-même soumise à la RLS de `plans` : le filtrage se
-- fait donc à deux niveaux, sans risque de récursion (tables distinctes).
create policy plan_prices_select_public
  on public.plan_prices for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.plans p
       where p.id = plan_id and p.is_public and p.is_active
    )
  );

create policy plan_prices_select_staff
  on public.plan_prices for select to authenticated
  using (public.is_platform_staff());

create policy plan_prices_insert_admin
  on public.plan_prices for insert to authenticated
  with check (public.is_platform_admin());

create policy plan_prices_update_admin
  on public.plan_prices for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy plan_prices_delete_owner
  on public.plan_prices for delete to authenticated
  using (public.is_platform_owner());


-- -----------------------------------------------------------------------------
-- RLS : plan_features
-- -----------------------------------------------------------------------------
alter table public.plan_features enable row level security;
alter table public.plan_features force row level security;

grant select on table public.plan_features to anon, authenticated;
grant insert, update, delete on table public.plan_features to authenticated;

create policy plan_features_select_public
  on public.plan_features for select to anon, authenticated
  using (
    exists (
      select 1 from public.plans p
       where p.id = plan_id and p.is_public and p.is_active
    )
  );

create policy plan_features_select_staff
  on public.plan_features for select to authenticated
  using (public.is_platform_staff());

create policy plan_features_insert_admin
  on public.plan_features for insert to authenticated
  with check (public.is_platform_admin());

create policy plan_features_update_admin
  on public.plan_features for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy plan_features_delete_admin
  on public.plan_features for delete to authenticated
  using (public.is_platform_admin());
