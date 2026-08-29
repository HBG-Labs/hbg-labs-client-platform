# 07 — Stripe Integration & Billing Architecture

Ce document définit les règles d'intégration, de sécurité et de gestion de la facturation avec **Stripe** sur **HBG Labs Client Platform**.

---

## 1. Stripe comme Source de Vérité Unique

- **Stripe est l'autorité absolue** sur l'état des abonnements, des factures, des paiements et des cartes bancaires.
- Les tables locales PostgreSQL (`subscriptions`, `invoices`, `payments`) sont des **miroirs en lecture seule**.
- **Aucune Policy d'Écriture Applicative** : Ni les clients ni le personnel HBG Labs (y compris `OWNER` plateforme) ne peuvent insérer, modifier ou supprimer directement des lignes dans ces tables.
- Seul le webhook Stripe, exécuté via une Edge Function avec la clé `service_role` (`BYPASSRLS`), a le droit d'écrire.

---

## 2. Frontière des Clés & Séparation Test / Live

- **Clés Secrètes Côté Serveur Exclusivement** : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` ne doivent jamais être importées, lues ou référencées dans `src/`.
- **Mode Test Hors Production** :
  - Tout environnement autre que `production` (`development`, `staging`, `preview`) utilise impérativement une clé de test (`sk_test_...`).
  - Le script `scripts/check-env.mjs` bloque immédiatement le build si une clé `sk_live_...` est détectée alors que `VITE_APP_ENV !== 'production'`.

---

## 3. Webhooks & Idempotence Obligatoire

Stripe garantit une distribution *at-least-once* (au moins une fois) : un même événement peut être envoyé plusieurs fois.

### Protocole de Traitement du Webhook (Edge Function) :

1. **Vérification de Signature** : Valider systématiquement l'en-tête `stripe-signature` avec `stripe.webhooks.constructEvent(...)` et le secret de webhook. En cas d'échec : renvoyer 400 immédiatement sans rien écrire.
2. **Enregistrement Préalable dans `stripe_webhook_events`** :
   - La clé primaire est `event_id` (identifiant Stripe `evt_...`).
   - Insérer la ligne **avant** de débuter le traitement métier.
   - En cas de conflit d'unicité sur `event_id` : l'événement a déjà été reçu et traité → renvoyer 200 immédiatement.
3. **Gestion du Désordre de Livraison (`stripe_event_at`)** :
   - Les événements Stripe peuvent arriver dans le désordre.
   - Comparer l'horodatage de l'événement avec `subscriptions.stripe_event_at`. Si l'événement reçu est antérieur au dernier état enregistré, l'ignorer pour éviter d'écraser un état récent par un état obsolète.
4. **Acquittement & Gestion des Erreurs** :
   - Marquer `processed = true` une fois les opérations en base terminées.
   - En cas d'erreur de traitement : enregistrer l'erreur, incrémenter `attempts` et renvoyer une réponse HTTP 500 pour inviter Stripe à retenter.

---

## 4. Catalogue Tarifaire & Données Financières

- **Grille Tarifaire en Base (`plans`, `plan_prices`, `plan_features`)** :
  - Les prix ne sont jamais codés en dur dans le frontend.
  - Les montants sont toujours des entiers en centimes (`amount_cents`).
  - Chaque prix actif pointe vers un `stripe_price_id` validé. Si `stripe_price_id` est NULL, l'offre n'est pas souscriptible en direct (afficher « Demander un devis »).
- **Calcul du MRR (`mrr_cents`)** :
  - `subscriptions.mrr_cents` est une colonne **générée automatiquement** par PostgreSQL selon la formule contractuelle (`active` et `past_due`, 1/12 pour la facturation annuelle).

---

## 5. Expérience Utilisateur Asynchrone

- Après redirection depuis Stripe Checkout, le webhook de confirmation peut mettre quelques secondes à s'exécuter.
- L'interface ne doit pas présumer du succès immédiat : afficher un état intermédiaire « En cours de confirmation » et laisser TanStack Query rafraîchir l'état dès l'arrivée du webhook.
