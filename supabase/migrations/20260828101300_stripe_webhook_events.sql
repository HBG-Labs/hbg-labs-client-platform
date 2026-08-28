-- =============================================================================
-- 14 — stripe_webhook_events (§21)
-- =============================================================================
-- Registre des événements Stripe reçus. Sa raison d'être tient en un mot :
-- IDEMPOTENCE.
--
--
-- POURQUOI CETTE TABLE EXISTE
--
-- Stripe garantit une livraison AU MOINS une fois, jamais exactement une fois.
-- Un même `invoice.paid` peut donc arriver deux, trois, dix fois — parce que
-- notre réponse HTTP s'est perdue, parce qu'un délai d'attente a expiré, ou
-- parce que Stripe rejoue l'événement après un incident.
--
-- Sans registre, chaque relivraison rejoue le traitement : deux
-- enregistrements de paiement pour un seul encaissement, deux emails au
-- client, deux lignes dans son historique. La comptabilité diverge du réel, et
-- personne ne s'en aperçoit avant le rapprochement bancaire.
--
-- `event_id` en CLÉ PRIMAIRE fait porter la garantie à PostgreSQL : la seconde
-- insertion viole la clé primaire, la fonction Edge l'intercepte et répond 200
-- sans rien retraiter.
--
--
-- SÉQUENCE ATTENDUE DANS LA FONCTION EDGE (phase 10)
--
--   1. Vérifier la signature Stripe (`stripe-signature`). Sans signature
--      valide : 400, et RIEN n'est écrit. N'importe qui connaît l'URL du
--      webhook ; seule la signature distingue Stripe d'un tiers qui
--      s'annoncerait « facture payée ».
--   2. INSERT de l'événement. Conflit sur la clé primaire ⇒ déjà reçu ⇒ 200.
--   3. Traiter, puis passer `processed = true`.
--   4. En cas d'échec : renseigner `error`, incrémenter `attempts`, répondre
--      500 pour que Stripe rejoue.
--
-- La ligne est écrite AVANT le traitement, pas après : si le traitement fait
-- tomber la fonction, l'événement reste visible en base avec `processed =
-- false`. Un enregistrement après coup ne laisserait aucune trace des
-- événements qui échouent — les seuls qui méritent d'être examinés.
--
--
-- TABLE FERMÉE : NI LECTURE NI ÉCRITURE PAR L'APPLICATION
--
-- Elle contient la charge utile brute de Stripe : identifiants clients,
-- montants, empreintes de moyens de paiement, métadonnées internes. Aucun
-- utilisateur authentifié n'y accède, personnel plateforme compris.
-- L'inspection se fait dans le tableau de bord Stripe, ou en SQL avec les
-- droits d'administration.
-- =============================================================================

create table public.stripe_webhook_events (
  -- Identifiant Stripe (evt_...) EN CLÉ PRIMAIRE. C'est la clé d'idempotence :
  -- pas de colonne technique séparée, pour qu'aucun chemin d'écriture ne
  -- puisse contourner l'unicité.
  event_id text primary key
    constraint stripe_webhook_events_id_format check (event_id ~ '^evt_[A-Za-z0-9]+$'),

  -- 'checkout.session.completed', 'invoice.paid'… (§21)
  event_type text not null
    constraint stripe_webhook_events_type_format check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$'),

  -- Version d'API déclarée par l'événement. Consignée pour comprendre, plus
  -- tard, pourquoi la charge utile d'un événement ancien diffère.
  api_version text
    constraint stripe_webhook_events_api_version_length check (char_length(api_version) between 4 and 40),

  -- Mode test ou production (§48). Permet de vérifier qu'aucun événement LIVE
  -- n'a atteint un environnement de développement.
  livemode boolean not null default false,

  -- Charge utile complète. Conservée telle quelle : en cas d'incohérence, elle
  -- permet de rejouer le traitement sans redemander l'événement à Stripe.
  payload jsonb not null
    constraint stripe_webhook_events_payload_is_object check (jsonb_typeof(payload) = 'object'),

  -- Objet Stripe visé, extrait pour l'indexation.
  stripe_object_id text
    constraint stripe_webhook_events_object_id_length check (char_length(stripe_object_id) between 1 and 255),

  -- Organisation rattachée, quand elle a pu être résolue. NULL si le Customer
  -- Stripe ne correspond à aucune organisation connue — anomalie à examiner.
  organization_id uuid
    references public.organizations (id) on delete set null,

  -- ---- Traitement ----
  processed boolean not null default false,
  processed_at timestamptz,

  attempts integer not null default 0
    constraint stripe_webhook_events_attempts_positive check (attempts >= 0),

  error text
    constraint stripe_webhook_events_error_length check (char_length(error) between 1 and 4000),

  -- Horodatage porté par Stripe, distinct de la date de réception : il permet
  -- d'ordonner les événements malgré une livraison désordonnée.
  stripe_created_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stripe_webhook_events_processed_has_date check (
    (processed = false) or (processed_at is not null)
  )
);

comment on table public.stripe_webhook_events is
  'Registre d''idempotence des webhooks Stripe (§21). event_id en clé primaire : une relivraison viole la contrainte et n''est pas retraitée. Aucun accès applicatif.';
comment on column public.stripe_webhook_events.payload is
  'Charge utile brute Stripe. Contient des données financières : jamais exposée à un utilisateur authentifié.';

-- Reprise des événements en échec.
create index stripe_webhook_events_unprocessed_idx
  on public.stripe_webhook_events (created_at)
  where not processed;

-- « Quels événements ont touché cet abonnement ? »
create index stripe_webhook_events_object_idx
  on public.stripe_webhook_events (stripe_object_id, stripe_created_at desc)
  where stripe_object_id is not null;

create index stripe_webhook_events_type_created_idx
  on public.stripe_webhook_events (event_type, created_at desc);

create index stripe_webhook_events_organization_idx
  on public.stripe_webhook_events (organization_id, created_at desc)
  where organization_id is not null;

create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS : stripe_webhook_events — table fermée
-- -----------------------------------------------------------------------------
alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_webhook_events force row level security;

-- Aucun privilège, pour aucun rôle applicatif. Seul service_role (BYPASSRLS)
-- atteint cette table, depuis la fonction Edge du webhook.
revoke all on table public.stripe_webhook_events from anon, authenticated;

-- AUCUNE POLICY. RLS activée sans policy = refus de tout accès. C'est la
-- configuration voulue : la combinaison privilèges retirés + RLS sans policy
-- ferme la table par deux mécanismes indépendants.
