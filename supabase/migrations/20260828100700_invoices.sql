-- =============================================================================
-- 08 — invoices (§23)
-- =============================================================================
-- Miroir local des factures Stripe. Même discipline que `subscriptions` :
-- lecture seule pour tout le monde, écriture réservée au webhook.
--
--
-- LE PDF N'EST PAS STOCKÉ
--
-- §23 demande le téléchargement des factures. On conserve les URL fournies par
-- Stripe (`hosted_invoice_url`, `invoice_pdf`) plutôt que le document lui-même :
--
--   * la facture reste conforme même si Stripe en corrige la présentation ou
--     les mentions légales ;
--   * aucune divergence possible entre le PDF servi et la facture de
--     référence ;
--   * pas de document financier à sécuriser dans Storage.
--
-- Ces URL sont signées et expirent : elles se relisent depuis cette table,
-- jamais depuis un cache applicatif.
--
--
-- CONSERVATION LÉGALE — ON DELETE RESTRICT
--
-- La clé étrangère vers `organizations` est en RESTRICT, non en CASCADE. Une
-- pièce comptable doit être conservée dix ans en France ; une suppression
-- d'organisation qui emporterait les factures serait une perte de données
-- réglementaires, irréversible et silencieuse.
--
-- Conséquence assumée : une organisation ayant été facturée ne peut plus être
-- supprimée. Elle passe au statut ARCHIVED — ce qui est le comportement voulu.
-- =============================================================================

create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations (id) on delete restrict,

  -- ON DELETE SET NULL : l'abonnement peut disparaître du miroir local, la
  -- facture émise demeure. Une facture n'est jamais orpheline de son client,
  -- mais elle peut l'être de son abonnement.
  subscription_id uuid
    references public.subscriptions (id) on delete set null,

  -- ---- Identifiants Stripe ----
  stripe_invoice_id text not null
    constraint invoices_stripe_id_format check (stripe_invoice_id ~ '^in_[A-Za-z0-9]+$'),

  stripe_customer_id text
    constraint invoices_stripe_customer_format check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),

  -- Numéro lisible attribué par Stripe (« HBG-0042 »). C'est la référence que
  -- le client cite au support et que porte sa comptabilité — pas l'UUID.
  number text
    constraint invoices_number_length check (char_length(trim(number)) between 1 and 60),

  status public.invoice_status not null,

  -- ---- Montants, en centimes ----
  -- Décomposition conservée telle que Stripe la fournit. Recalculer le HT à
  -- partir du TTC et d'un taux introduirait des écarts d'arrondi entre la
  -- facture affichée et la facture émise.
  subtotal_cents integer
    constraint invoices_subtotal_positive check (subtotal_cents >= 0),

  tax_cents integer
    constraint invoices_tax_positive check (tax_cents >= 0),

  total_cents integer
    constraint invoices_total_positive check (total_cents >= 0),

  amount_due_cents integer not null default 0
    constraint invoices_amount_due_positive check (amount_due_cents >= 0),

  amount_paid_cents integer not null default 0
    constraint invoices_amount_paid_positive check (amount_paid_cents >= 0),

  amount_remaining_cents integer
    constraint invoices_amount_remaining_positive check (amount_remaining_cents >= 0),

  currency text not null default 'EUR'
    constraint invoices_currency_format check (currency ~ '^[A-Z]{3}$'),

  -- ---- Documents ----
  -- Pages hébergées par Stripe. HTTPS imposé.
  hosted_invoice_url text
    constraint invoices_hosted_url_https check (hosted_invoice_url ~ '^https://[^[:space:]]+$'),

  invoice_pdf_url text
    constraint invoices_pdf_url_https check (invoice_pdf_url ~ '^https://[^[:space:]]+$'),

  -- ---- Période facturée ----
  period_start timestamptz,
  period_end timestamptz,

  due_date timestamptz,
  paid_at timestamptz,

  -- ---- Synchronisation ----
  stripe_created_at timestamptz,
  stripe_event_at timestamptz,
  synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoices_period_complete check (
    (period_start is null) = (period_end is null)
  ),

  constraint invoices_period_ordered check (
    period_start is null or period_end is null or period_end >= period_start
  ),

  -- Une facture payée porte sa date de paiement. Sans cette contrainte, la
  -- page de facturation afficherait « Payée » sans date, et l'historique des
  -- paiements (§23) serait intriable.
  constraint invoices_paid_has_date check (
    status <> 'paid' or paid_at is not null
  )
);

comment on table public.invoices is
  'Miroir local des factures Stripe. Lecture seule ; écriture réservée au webhook (service_role). FK organizations en RESTRICT : conservation légale.';
comment on column public.invoices.invoice_pdf_url is
  'URL Stripe du PDF. Le document n''est pas copié : Stripe reste l''émetteur de référence.';

-- Clé d'idempotence du webhook : un événement rejoué met à jour la ligne.
create unique index invoices_stripe_invoice_id_key
  on public.invoices (stripe_invoice_id);

-- Le numéro de facture est unique lorsqu'il est attribué (les brouillons
-- Stripe n'en ont pas encore).
create unique index invoices_number_key
  on public.invoices (number)
  where number is not null;

-- Page /dashboard/billing : factures d'une organisation, plus récentes d'abord.
create index invoices_organization_created_idx
  on public.invoices (organization_id, created_at desc);

create index invoices_subscription_id_idx on public.invoices (subscription_id)
  where subscription_id is not null;

-- Suivi des impayés (§30 churn, §31 relances).
create index invoices_unpaid_idx
  on public.invoices (organization_id, due_date)
  where status in ('open', 'uncollectible');

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS : invoices — lecture seule, réservée au dirigeant
-- -----------------------------------------------------------------------------
alter table public.invoices enable row level security;
alter table public.invoices force row level security;

revoke all on table public.invoices from anon;
grant select on table public.invoices to authenticated;

-- LECTURE RESTREINTE AU OWNER DE L'ORGANISATION, pas à tous ses membres.
--
-- Une facture révèle le chiffre engagé par l'entreprise auprès de HBG Labs.
-- Un collaborateur invité pour suivre l'avancement de son site n'a pas à y
-- accéder. C'est la lecture retenue de §12 : la liste des interdits y vise les
-- données d'un AUTRE client (« voir un autre client, modifier les données d'un
-- autre client, consulter SES factures… »), et §23 donne bien au client une
-- page de facturation pour les siennes.
--
-- MANAGER en est également exclu : « gestion opérationnelle, sans accès à la
-- facturation » (migration 01).
create policy invoices_select_org_owner
  on public.invoices for select to authenticated
  using (public.is_org_owner(organization_id));

create policy invoices_select_staff
  on public.invoices for select to authenticated
  using (public.is_platform_staff());

-- AUCUNE POLICY D'ÉCRITURE. Une facture est émise par Stripe, jamais par
-- l'application. La marquer « payée » à la main créerait un écart comptable
-- invisible.
