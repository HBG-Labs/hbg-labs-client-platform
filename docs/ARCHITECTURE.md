# Architecture

Vue d'ensemble technique de HBG Labs Client Platform.

---

## 1. Composition

```
                          Navigateur
                        React · Vite · TS
                               │
                        clé anon (publique)
                               │
                    ┌──────────┴──────────┐
                    │      Supabase       │
                    ├─────────────────────┤
                    │ PostgREST  ← RLS    │  ← toute la sécurité est ici
                    │ Auth (GoTrue)       │
                    │ Storage (privé)     │
                    │ Edge Functions      │
                    └──────────┬──────────┘
                               │  service_role (secret, serveur uniquement)
                    ┌──────────┴──────────┐
                    │  Stripe   Vercel    │
                    │  Resend   Sentry    │
                    └─────────────────────┘
```

**Il n'y a pas de serveur applicatif intermédiaire.** Le navigateur parle
directement à PostgREST, et l'autorisation est appliquée par PostgreSQL à
chaque ligne. Ce qui n'existe pas dans une policy n'existe pas pour
l'utilisateur.

Ce choix a une conséquence directe : **le frontend est un client non fiable**
(§2), et cela ne pose aucun problème, puisqu'il ne détient aucune autorité.
Toute règle de sécurité vit dans la base — policies, contraintes, triggers — et
non dans le code React, que n'importe qui peut lire et modifier.

Les fonctions Edge n'interviennent que là où un secret est indispensable :
webhook Stripe, création de session Checkout, envoi d'emails.

---

## 2. Structure du dépôt

```
docs/                    architecture, base, RLS, contrats, installation
scripts/                 gardes exécutées au build et en CI
supabase/
  migrations/            16 fichiers, ordre §45
  seed.sql               grille tarifaire réelle — aucune donnée fictive
  config.toml
tests/rls/               suite d'isolation multi-tenant (§47)
src/
  components/ui/         design system (§39)
  features/<domaine>/    hooks TanStack Query, logique d'écran
  services/              accès aux données, une fonction par requête
  pages/  layouts/  routes/
  lib/                   env, client Supabase, query client, utilitaires
  types/                 domain.ts (manuel) · database.types.ts (généré)
  schemas/               schémas Zod des formulaires
```

`App.tsx` reste mince (§38) : il assemble les fournisseurs de contexte et
délègue. Le routage vit dans `src/routes/`.

---

## 3. Décisions structurantes

### 3.1 Deux axes de rôles

`profiles.platform_role` (équipe HBG Labs) et `organization_members.role`
(utilisateurs clients) décrivent deux populations disjointes. Les confondre est
la première cause de faille d'autorisation en multi-tenant. Détail dans
[RLS.md](./RLS.md).

### 3.2 Les fonctions de sécurité en SECURITY DEFINER

Sans elles, une policy sur `organization_members` qui interroge
`organization_members` boucle à l'infini. Détail dans [RLS.md §2](./RLS.md).

Corollaire à connaître : dans une fonction `SECURITY DEFINER`, `current_user`
vaut le propriétaire. Toute garde devant identifier le rôle réel lit les
revendications du JWT.

### 3.3 Les triggers complètent la RLS

La RLS raisonne par ligne, jamais par colonne. Onze gardes couvrent ce que les
policies laissent passer — escalade de rôle, détournement de rattachement,
falsification d'auteur. Liste dans [RLS.md §4](./RLS.md).

### 3.4 Stripe est la source de vérité

`subscriptions`, `invoices`, `payments` n'ont **aucune policy d'écriture**, pour
aucun rôle. Seul le webhook écrit, sous `service_role`. Corriger un abonnement
se fait dans Stripe (§20, §22).

### 3.5 L'ignorance est explicite en base

`verification_source` et les statuts `UNKNOWN` rendent l'absence de vérification
visible et contrainte, plutôt que de compter sur le frontend pour s'en souvenir
(§17, §57).

---

## 4. Sécurité — barrières

| Barrière | Rôle |
|---|---|
| RLS `ENABLE` + `FORCE` sur les 19 tables | isolation par ligne |
| Privilèges retirés à `anon` | seconde barrière, indépendante des policies |
| Triggers de garde | protection au niveau colonne |
| Contraintes CHECK | cohérence — y compris contre `service_role` |
| Validation Zod | formulaires et configuration |
| `check-env.mjs` | aucun secret sous préfixe `VITE_` |
| `check-bundle-secrets.mjs` | aucun secret dans `dist/` |
| `check-schema-coherence.mjs` | aucune table sans RLS |
| `audit-privileges.mjs` | privilèges réels conformes à l'intention |
| `sync-auth-config.mjs` | configuration Auth distante alignée sur le dépôt |
| `tests/rls/` | vérification comportementale contre une base réelle |

Aucune de ces barrières ne suffit seule. Une table dont on oublie la RLS est
lisible par Internet sans que rien, dans le comportement de l'application, ne le
signale — d'où le contrôle automatique.

---

## 5. Frontière des secrets

```
NAVIGATEUR — public, inscrit en clair dans le bundle
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY        ← publique par conception, la RLS protège
  VITE_APP_ENV · VITE_APP_URL · VITE_SENTRY_DSN
─────────────────────────────────────────────────────────────────────
SERVEUR — Edge Functions, variables Vercel
  SUPABASE_SERVICE_ROLE_KEY     ← contourne TOUTE la RLS
  STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET
  VERCEL_TOKEN · VERCEL_TEAM_ID
  RESEND_API_KEY · SENTRY_DSN
```

Un secret déployé dans un bundle doit être considéré comme compromis :
révoquez-le, ne vous contentez pas de le retirer.

---

## 6. Vérification

```bash
npm run verify      # schéma, privilèges, lint, types, tests, build, secrets
npm run test:rls    # isolation multi-tenant (exige une base Supabase)
```

`verify` tourne sans aucun compte externe, hormis l'audit de privilèges qui
s'abstient proprement en l'absence de jeton. `test:rls` exige une base
Supabase reliée.

---

## 7. Déploiement (§50)

```
GitHub ──► Vercel ──► Production · Preview
                          │
              Supabase (base, auth, storage, edge)
                          │
              Stripe (checkout, billing, webhooks)
```

En ligne sur **hbg-labs-client-platform.vercel.app**. Le dépôt GitHub est
connecté : chaque poussée sur `main` déploie en production, chaque branche
obtient une prévisualisation.

Trois environnements applicatifs (§48) : `development`, `staging`, `production`.
Stripe restera en **mode test** hors production, `check-env.mjs` échouant sur une
clé `sk_live_` avec `VITE_APP_ENV` différent de `production`.

**Réserve** : un seul projet Supabase sert aujourd'hui le développement et la
production. À séparer avant le premier client réel, la suite de tests créant et
supprimant des utilisateurs dans la base qui sert le site public. Détail dans
[SETUP.md §7.5](./SETUP.md).

Le SPA est réécrit vers `index.html` (`vercel.json`), avec en-têtes de sécurité
et cache long sur les assets versionnés.

---

## 8. Feuille de route

| Lot | Contenu | Phases §54 |
|---|---|---|
| **1, livré** | fondations, schéma, RLS, tests d'isolation | 1, 4, 5 |
| **2, livré** | site public, référencement, formulaires devis et contact | 2 |
| **3, livré** | authentification Supabase, gardes de route, changement de mot de passe | 3 |
| **4, livré** | espace d'administration, écrans client site et domaine | 6, 7 |
| 5 | Stripe : Checkout, webhooks, abonnements, facturation | 8-12 |
| 6 | tickets, notifications, emails | 13, 16 |
| 7 | intégration Vercel, supervision | 15, 17 |
| 8 | audit complet, préparation production | 18, 19 |
