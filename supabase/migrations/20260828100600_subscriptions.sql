-- =============================================================================
-- 07 — subscriptions (§18, §22, §30)
-- =============================================================================
-- MIROIR LOCAL DE STRIPE — ET RIEN D'AUTRE
--
-- §22 : « Le statut Stripe est la source de vérité. »
-- §20 : « Le frontend ne doit jamais décider lui-même qu'un abonnement est
--         actif. »
--
-- Cette table ne DÉCIDE de rien. Elle recopie l'état que Stripe a établi, pour
-- que l'application puisse l'afficher et le joindre sans appeler l'API Stripe
-- à chaque rendu de page.
--
--
-- CONSÉQUENCE : AUCUNE POLICY D'ÉCRITURE. POUR PERSONNE.
--
-- Ni le client, ni le personnel, ni même un OWNER plateforme n'obtient de
-- policy INSERT, UPDATE ou DELETE. Seul `service_role` écrit ici — il porte
-- BYPASSRLS et n'est atteint que par la fonction Edge du webhook Stripe (§21).
--
-- Ce n'est pas une précaution excessive. Un abonnement passé à `active` à la
-- main dans l'administration produit un client qui accède au service sans que
-- Stripe ne prélève quoi que ce soit : la divergence ne se voit nulle part, et
-- se découvre au rapprochement comptable, des mois plus tard.
--
-- Pour corriger un abonnement, on agit dans Stripe. Le webhook propage.
--
--
-- LES WEBHOOKS ARRIVENT DANS LE DÉSORDRE
--
-- Stripe ne garantit pas l'ordre de livraison. `customer.subscription.updated`
-- (annulation) peut précéder un `...updated` antérieur (changement de
-- quantité) : appliqué naïvement, le second réécrit le premier et
-- l'abonnement redevient actif alors qu'il est annulé.
--
-- `stripe_event_at` porte l'horodatage de l'objet Stripe. Le webhook (phase 10)
-- ignore tout événement dont l'horodatage est antérieur à celui déjà
-- enregistré. La colonne existe dès maintenant pour que cette logique n'ait
-- pas à être ajoutée après coup, sur des données déjà incohérentes.
-- =============================================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete cascade,

  -- ON DELETE RESTRICT : supprimer un plan encore souscrit rendrait
  -- l'abonnement illisible. Le geste correct est `is_active = false`.
  plan_id uuid
    references public.plans (id) on delete restrict,

  -- ---- Identifiants Stripe ----
  stripe_subscription_id text not null
    constraint subscriptions_stripe_id_format check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),

  stripe_customer_id text not null
    constraint subscriptions_stripe_customer_format check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),

  stripe_price_id text
    constraint subscriptions_stripe_price_format check (stripe_price_id ~ '^price_[A-Za-z0-9]+$'),

  -- ---- État ----
  -- Recopié tel quel depuis Stripe (§22).
  status public.subscription_status not null,

  quantity integer not null default 1
    constraint subscriptions_quantity_positive check (quantity > 0),

  -- Montant unitaire en centimes, à la date de souscription. Dupliqué depuis
  -- Stripe volontairement : si le tarif change, l'abonnement en cours conserve
  -- le sien, et la facturation affichée reste conforme au prélèvement réel.
  unit_amount_cents integer
    constraint subscriptions_amount_positive check (unit_amount_cents >= 0),

  currency text not null default 'EUR'
    constraint subscriptions_currency_format check (currency ~ '^[A-Z]{3}$'),

  recurring_interval public.billing_interval,

  -- ---- Période en cours (§18 « prochaine échéance ») ----
  current_period_start timestamptz,
  current_period_end timestamptz,

  -- ---- Cycle de vie ----
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,

  trial_start timestamptz,
  trial_end timestamptz,

  started_at timestamptz,

  -- ---- Synchronisation ----
  -- Horodatage de l'objet Stripe ayant produit cette version de la ligne.
  -- Sert à écarter les événements arrivés dans le désordre.
  stripe_event_at timestamptz,

  -- Dernière synchronisation réussie, quelle qu'en soit l'issue.
  synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ---- Revenu mensuel récurrent (§30) ----
  -- Colonne générée : le MRR ne peut pas diverger de l'abonnement, puisqu'il
  -- n'est jamais écrit. Le tableau de bord admin somme cette colonne.
  --
  -- Périmètre retenu : `active` et `past_due`.
  --   * `trialing` est exclu — aucun encaissement n'a eu lieu ; l'inclure
  --     gonflerait le MRR d'essais qui ne se convertiront pas tous.
  --   * `past_due` est inclus — le contrat court, le recouvrement est en
  --     cours ; l'exclure ferait chuter le MRR au premier incident de
  --     paiement, avant même une relance.
  --
  -- Normalisation mensuelle : une facturation annuelle compte pour 1/12.
  mrr_cents integer generated always as (
    case
      when status not in ('active', 'past_due') then 0
      when unit_amount_cents is null then 0
      when recurring_interval = 'month' then unit_amount_cents * quantity
      when recurring_interval = 'year'
        then round((unit_amount_cents * quantity)::numeric / 12)::integer
      when recurring_interval = 'week'
        then round((unit_amount_cents * quantity)::numeric * 52 / 12)::integer
      when recurring_interval = 'day'
        then round((unit_amount_cents * quantity)::numeric * 365 / 12)::integer
      else 0
    end
  ) stored,

  -- Une période a un début et une fin, ou ni l'un ni l'autre.
  constraint subscriptions_period_complete check (
    (current_period_start is null) = (current_period_end is null)
  ),

  constraint subscriptions_period_ordered check (
    current_period_start is null
    or current_period_end is null
    or current_period_end >= current_period_start
  ),

  constraint subscriptions_trial_complete check (
    (trial_start is null) = (trial_end is null)
  ),

  -- Un abonnement récurrent a une périodicité.
  constraint subscriptions_interval_present check (
    unit_amount_cents is null or recurring_interval is not null
  )
);

comment on table public.subscriptions is
  'Miroir local des abonnements Stripe. AUCUNE policy d''écriture : seul service_role (webhook Stripe) écrit. Stripe est la source de vérité (§22).';
comment on column public.subscriptions.mrr_cents is
  'Colonne générée. MRR normalisé au mois, comptant les statuts active et past_due. Jamais écrite : ne peut pas diverger.';
comment on column public.subscriptions.stripe_event_at is
  'Horodatage de l''objet Stripe source. Le webhook rejette tout événement antérieur : Stripe ne garantit pas l''ordre de livraison.';

-- Un abonnement Stripe ne peut être reflété que par une seule ligne.
-- C'est la clé d'idempotence du webhook : un événement rejoué met à jour la
-- ligne existante au lieu d'en créer un doublon.
create unique index subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id);

create index subscriptions_organization_id_idx on public.subscriptions (organization_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);

-- Alimente le calcul du MRR et le tableau /admin/subscriptions (§30) sans
-- balayer les abonnements terminés.
create index subscriptions_active_mrr_idx
  on public.subscriptions (organization_id)
  where status in ('active', 'past_due');

-- Échéances à venir (§14 « prochaine échéance »).
create index subscriptions_current_period_end_idx
  on public.subscriptions (current_period_end)
  where current_period_end is not null;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS : subscriptions — LECTURE SEULE, SANS EXCEPTION
-- -----------------------------------------------------------------------------
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

revoke all on table public.subscriptions from anon;

-- SELECT uniquement. Ni INSERT, ni UPDATE, ni DELETE ne sont accordés à
-- `authenticated` : même en l'absence de policy, retirer le privilège est une
-- seconde barrière indépendante.
grant select on table public.subscriptions to authenticated;

-- Tout membre voit l'abonnement de son organisation : le tableau de bord (§14)
-- affiche l'offre et la prochaine échéance à chaque connexion.
create policy subscriptions_select_member
  on public.subscriptions for select to authenticated
  using (public.is_org_member(organization_id));

create policy subscriptions_select_staff
  on public.subscriptions for select to authenticated
  using (public.is_platform_staff());

-- AUCUNE POLICY D'ÉCRITURE — c'est délibéré et central.
-- Toute modification passe par Stripe, puis par le webhook (service_role).
-- Ajouter ici une policy d'écriture romprait la garantie de §20/§22.
