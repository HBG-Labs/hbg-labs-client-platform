# 05 — Security & Zero Trust Architecture

Ce document définit les exigences et protocoles de sécurité pour l'ensemble du système **HBG Labs Client Platform**.

---

## 1. Principe Fondamental : ZERO TRUST

**Tout ce qui provient du navigateur est considéré comme non fiable.**

L'agent IA et les développeurs ne doivent **jamais** faire confiance au frontend pour :
- L'identifiant utilisateur (`user_id` / `auth.uid()`) ;
- L'identifiant d'organisation (`organization_id`) ;
- Le rôle ou les autorisations (`platform_role`, `organization_members.role`) ;
- Le montant ou le prix d'un service ;
- Le statut d'un abonnement ou d'un paiement ;
- L'appartenance ou la propriété d'une ressource.

Toute décision d'autorisation et d'intégrité est obligatoirement validée côté serveur par PostgreSQL (RLS, contraintes, triggers) et les Edge Functions.

---

## 2. Frontière Stricte des Secrets

```text
NAVIGATEUR (Public — lisible en clair dans le bundle dist/)
├── VITE_SUPABASE_URL
├── VITE_SUPABASE_ANON_KEY (publique par conception, RLS assure la sécurité)
├── VITE_APP_ENV (development | staging | production)
├── VITE_APP_URL
└── VITE_SENTRY_DSN (optionnel)
────────────────────────────────────────────────────────────────────────
SERVEUR UNIQUEMENT (Edge Functions Supabase & Variables Vercel)
├── SUPABASE_SERVICE_ROLE_KEY (accès total sans RLS — JAMAIS côté client)
├── STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET
├── VERCEL_TOKEN & VERCEL_TEAM_ID
├── RESEND_API_KEY
└── SENTRY_AUTH_TOKEN
```

### Gardes Automatiques du Build :
- `scripts/check-env.mjs` : Vérifie qu'aucun secret ne porte le préfixe `VITE_` et bloque l'usage d'une clé Stripe `sk_live_` hors production.
- `scripts/check-bundle-secrets.mjs` : Scanne l'intégralité du répertoire `dist/` après build pour détecter tout motif de secret ou clé privée.

---

## 3. Données Bancaires & Conformité PCI-DSS

- **Aucune Donnée Bancaire Sensible en Base** :
  - Interdiction absolue de stocker un numéro de carte complet (PAN), un cryptogramme visuel (CVV/CVC), une date d'expiration ou un IBAN.
  - Seuls sont conservés `card_brand` (ex. `visa`, `mastercard`) et `card_last4` (strictement 4 chiffres imposés par contrainte CHECK).
  - Les moyens de paiement sont gérés exclusivement via les identifiants de jetons Stripe (`pm_...`).

---

## 4. Journalisation Sécurisée (`audit_logs`) & RGPD

1. **Table en Ajout Seul (Append-Only)** :
   - La table `audit_logs` ne dispose d'aucune policy INSERT, UPDATE ou DELETE pour les utilisateurs.
   - Les écritures se font exclusivement via la fonction de sécurité `log_audit_event()`.
   - L'auteur de l'action (`actor_user_id`) est extrait automatiquement depuis `auth.uid()`.
2. **Minimisation des Données & RGPD** :
   - L'adresse IP (`ip_address`) est une donnée personnelle : elle n'est enregistrée que lors d'événements de sécurité critiques et n'est jamais exposée aux utilisateurs clients.
   - Les formulaires publics de prospection (`quote_requests`, `contact_messages`) sont limités en débit (`guard_lead_rate_limit`) et ne permettent aucune lecture directe par `anon`.

---

## 5. Prévention des Vulnérabilités Web

- **Injections SQL** : Le client utilise le constructeur de requêtes PostgREST (`@supabase/supabase-js`) avec des paramètres typés et échappés. Dans les migrations et fonctions PL/pgSQL, toujours utiliser des requêtes statiques ou `format()` avec `%I` / `%L`.
- **Failles XSS (Cross-Site Scripting)** :
  - Échappement natif de React pour tout contenu dynamique.
  - Ne jamais utiliser `dangerouslySetInnerHTML` sans assainissement strict.
- **En-têtes de Sécurité HTTP** :
  - Définis dans [`vercel.json`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/vercel.json) : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`.
