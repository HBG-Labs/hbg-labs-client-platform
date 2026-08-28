-- =============================================================================
-- 09 — payments (§23)
-- =============================================================================
-- Historique des encaissements et des échecs de paiement.
--
--
-- AUCUNE DONNÉE BANCAIRE — §23 : « Ne jamais stocker les données bancaires. »
--
-- Cette table ne contient, et ne devra jamais contenir :
--   * de numéro de carte (PAN), même partiel au-delà des quatre derniers
--     chiffres ;
--   * de cryptogramme (CVV/CVC) — son stockage est interdit par PCI-DSS, y
--     compris chiffré, y compris temporairement ;
--   * de date d'expiration ;
--   * de nom du porteur ;
--   * d'IBAN ou de BIC.
--
-- Seuls la marque et les QUATRE DERNIERS CHIFFRES sont conservés. PCI-DSS les
-- autorise explicitement, et ils suffisent au seul besoin réel : permettre au
-- client de reconnaître son moyen de paiement (« Visa •••• 4242 »).
--
-- Une contrainte CHECK impose exactement quatre chiffres à `card_last4` : y
-- glisser un PAN complet est refusé par la base.
--
-- Toute demande future d'ajout d'un champ bancaire doit être refusée. La
-- réponse est un identifiant de moyen de paiement Stripe (`pm_...`), qui
-- désigne la carte sans la contenir.
--
--
-- POURQUOI CONSERVER LES ÉCHECS
--
-- `invoice.payment_failed` (§21) est un événement à part entière. Sans trace,
-- le support ne peut pas répondre à « mon paiement ne passe pas » autrement
-- qu'en ouvrant Stripe. `failure_code` et `failure_message` viennent de Stripe
-- et donnent la raison exacte.
-- =============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  -- RESTRICT, comme pour les factures : l'historique des encaissements est une
  -- pièce comptable.
  organization_id uuid not null
    references public.organizations (id) on delete restrict,

  invoice_id uuid
    references public.invoices (id) on delete set null,

  -- ---- Identifiants Stripe ----
  stripe_payment_intent_id text
    constraint payments_stripe_pi_format check (stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$'),

  stripe_charge_id text
    constraint payments_stripe_charge_format check (stripe_charge_id ~ '^(ch|py)_[A-Za-z0-9]+$'),

  -- ---- Montant ----
  amount_cents integer not null
    constraint payments_amount_positive check (amount_cents >= 0),

  currency text not null default 'EUR'
    constraint payments_currency_format check (currency ~ '^[A-Z]{3}$'),

  status public.payment_status not null,

  -- Montant remboursé, cumulé. Distingue un remboursement partiel d'un total.
  refunded_amount_cents integer not null default 0
    constraint payments_refunded_positive check (refunded_amount_cents >= 0),

  -- ---- Moyen de paiement : identification, jamais reconstitution ----
  -- 'card', 'sepa_debit', 'link'… tel que fourni par Stripe.
  payment_method_type text
    constraint payments_method_type_length check (char_length(payment_method_type) between 2 and 40),

  -- 'visa', 'mastercard', 'amex'…
  card_brand text
    constraint payments_card_brand_length check (char_length(card_brand) between 2 and 30),

  -- EXACTEMENT quatre chiffres. La contrainte est la barrière technique qui
  -- empêche d'y écrire un numéro de carte complet.
  card_last4 text
    constraint payments_card_last4_format check (card_last4 ~ '^[0-9]{4}$'),

  -- ---- Échec ----
  failure_code text
    constraint payments_failure_code_length check (char_length(failure_code) between 1 and 80),

  failure_message text
    constraint payments_failure_message_length check (char_length(failure_message) between 1 and 500),

  paid_at timestamptz,

  -- ---- Synchronisation ----
  stripe_created_at timestamptz,
  stripe_event_at timestamptz,
  synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un paiement se rattache à au moins un objet Stripe : sans identifiant, la
  -- ligne n'est rapprochable de rien.
  constraint payments_has_stripe_reference check (
    stripe_payment_intent_id is not null or stripe_charge_id is not null
  ),

  -- On ne rembourse pas plus que le montant encaissé.
  constraint payments_refund_within_amount check (
    refunded_amount_cents <= amount_cents
  ),

  -- Cohérence entre le statut de remboursement et le montant remboursé.
  constraint payments_refund_status_matches check (
    (status = 'refunded' and refunded_amount_cents = amount_cents)
    or (status = 'partially_refunded' and refunded_amount_cents > 0
        and refunded_amount_cents < amount_cents)
    or (status not in ('refunded', 'partially_refunded') and refunded_amount_cents = 0)
  ),

  -- Un paiement réussi porte sa date.
  constraint payments_succeeded_has_date check (
    status <> 'succeeded' or paid_at is not null
  ),

  -- Un échec porte son motif : c'est toute l'utilité de conserver la ligne.
  constraint payments_failed_has_reason check (
    status <> 'failed' or failure_code is not null
  )
);

comment on table public.payments is
  'Encaissements et échecs Stripe. AUCUNE donnée bancaire : marque et 4 derniers chiffres uniquement (§23). Lecture seule.';
comment on column public.payments.card_last4 is
  'Quatre derniers chiffres, seule donnée de carte autorisée avec la marque. La contrainte de format interdit d''y écrire un PAN.';

-- Idempotence du webhook.
create unique index payments_stripe_payment_intent_id_key
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index payments_stripe_charge_id_key
  on public.payments (stripe_charge_id)
  where stripe_charge_id is not null;

-- Historique des paiements d'une organisation (§23).
create index payments_organization_created_idx
  on public.payments (organization_id, created_at desc);

create index payments_invoice_id_idx on public.payments (invoice_id)
  where invoice_id is not null;

-- Écrans de recouvrement : les échecs récents en tête (§31).
create index payments_failed_idx
  on public.payments (organization_id, created_at desc)
  where status = 'failed';

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS : payments — lecture seule, réservée au dirigeant
-- -----------------------------------------------------------------------------
alter table public.payments enable row level security;
alter table public.payments force row level security;

revoke all on table public.payments from anon;
grant select on table public.payments to authenticated;

-- Même restriction que pour les factures : donnée financière, réservée au
-- OWNER de l'organisation.
create policy payments_select_org_owner
  on public.payments for select to authenticated
  using (public.is_org_owner(organization_id));

create policy payments_select_staff
  on public.payments for select to authenticated
  using (public.is_platform_staff());

-- AUCUNE POLICY D'ÉCRITURE : un encaissement est constaté par Stripe.
