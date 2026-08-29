# HBG Labs Client Platform — Guide & Règles des Agents IA

Bienvenue sur le projet **HBG Labs Client Platform**. Ce document constitue la référence centrale et la source d'autorité pour tout agent d'intelligence artificielle ou développeur intervenant sur ce dépôt.

---

## 1. Mission du Projet

**HBG Labs Client Platform** est une plateforme SaaS multi-tenant conçue pour HBG Labs, couvrant l'ensemble du cycle de vie des prestations digitales :
- Création et refonte de sites web ;
- Hébergement et maintenance continue ;
- Gestion des noms de domaine et de leurs configurations DNS / SSL ;
- Abonnements récurrents et facturation automatisée ;
- Support client, demandes de modification de site et ticketing opérationnel.

---

## 2. Stack Technique & Architecture

Le projet repose sur une architecture sans serveur applicatif intermédiaire (*backendless client-to-database*), où le client web interagit directement avec PostgreSQL via PostgREST et GoTrue.

| Couche | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript (mode strict), Vite 6+, Tailwind CSS v4 |
| **Composants & Formulaires** | Radix UI primitives, Lucide React, React Hook Form, Zod |
| **State & Cache Client** | TanStack Query v5 (React Query) |
| **Backend & Base de données** | Supabase (PostgreSQL 17, PostgREST, GoTrue Auth, Storage privé, Edge Functions) |
| **Sécurité Base** | Row Level Security (RLS) `ENABLE` + `FORCE`, triggers de garde, fonctions `SECURITY DEFINER` |
| **Paiements & Facturation** | Stripe (Checkout, Customer Portal, Webhooks idempotents, Catalogue d'offres) |
| **Hébergement & Déploiement** | Vercel (SPA, headers de sécurité stricts, rewrites) |
| **Tests & Qualité** | Vitest, TypeScript compiler (`tsc`), ESLint, scripts de contrôle de sécurité |

---

## 3. Sources de Vérité (Source of Truth)

Pour éviter toute incohérence ou hallucination, respectez strictement la hiérarchie des sources de vérité :

1. **Vocabulaire & Énumérations** : [`src/types/domain.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/domain.ts) — écrit à la main, commenté, fait foi sur les libellés et types métier.
2. **Forme des Tables & Lignes** : [`src/types/database.types.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/database.types.ts) — **généré automatiquement** depuis Supabase (`npm run db:types`). Ne jamais le modifier à la main.
3. **Schéma, Politiques RLS & Triggers** : [`supabase/migrations/`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/supabase/migrations) — migrations SQL horodatées et versionnées.
4. **Données Financières & Abonnements** : **Stripe** — source de vérité unique pour les statuts d'abonnement, factures et paiements (tables locales en miroir et en lecture seule).
5. **Documentation d'Architecture & Sécurité** : Dossier [`docs/`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs) ([`ARCHITECTURE.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs/ARCHITECTURE.md), [`DATABASE.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs/DATABASE.md), [`RLS.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs/RLS.md), [`CONTRACTS.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs/CONTRACTS.md), [`SETUP.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs/SETUP.md)).

---

## 4. Workflow Obligatoire de l'Agent IA

Chaque intervention d'un agent IA doit obligatoirement suivre cette séquence sans sauter d'étape :

```text
UNDERSTAND
   ↓
INSPECT
   ↓
 PLAN
   ↓
IMPLEMENT
   ↓
 TEST
   ↓
VERIFY
   ↓
REPORT
```

1. **UNDERSTAND** : Analyser la demande utilisateur, ses contraintes et le contexte métier.
2. **INSPECT** : Examiner le code existant, les migrations, les types et la documentation avant toute écriture.
3. **PLAN** : Structurer la démarche et identifier les impacts (minimal change principle).
4. **IMPLEMENT** : Coder la solution proprement en respectant les standards et conventions du projet.
5. **TEST** : Exécuter les suites de tests unitaires, d'intégration et d'isolation RLS.
6. **VERIFY** : Valider via les commandes d'audit (`npm run verify`, lint, typecheck, check-schema, check-privileges).
7. **REPORT** : Synthétiser clairement les actions effectuées et le statut des vérifications.

---

## 5. Les Règles Fondamentales Non Négociables

### 5.1 Sécurité & Zero Trust
- **Le navigateur est un client non fiable** : toute règle de sécurité et d'autorisation doit être appliquée au niveau de la base de données (RLS + Triggers).
- **Ne jamais contourner la RLS** : l'accès direct en `service_role` est formellement interdit dans le code client (`src/`).
- **Frontière stricte des secrets** :
  - Côté client (`VITE_*`) : uniquement les variables publiques (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV`, `VITE_APP_URL`, `VITE_SENTRY_DSN`).
  - Côté serveur : `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VERCEL_TOKEN`, `RESEND_API_KEY`.
- **Aucune donnée bancaire sensible** : interdiction de stocker PAN, CVV ou dates d'expiration en base (uniquement `card_brand` et `card_last4`).

### 5.2 Modèle Multi-Tenant & Deux Axes de Rôles
- **Isolation stricte des organisations** : `Organization A ≠ Organization B`. Les données privées de l'organisation A sont strictement inaccessibles aux membres de l'organisation B.
- **Séparation des deux axes de rôles** :
  - Rôles Plateforme HBG Labs (`profiles.platform_role`) : `OWNER`, `ADMIN`, `STAFF`, `SUPPORT` ou `NULL` (client).
  - Rôles Organisation Client (`organization_members.role`) : `OWNER`, `MANAGER`, `MEMBER`.
  - Ne jamais confondre ces deux populations.
- **Cloisonnement financier** : les factures et paiements sont réservés au dirigeant (`OWNER`) de l'organisation et au staff HBG Labs.

### 5.3 Intégrité & Pas de Données Simulées (No Fake Data)
- **Interdiction des fake sessions et faux utilisateurs** : l'authentification doit utiliser Supabase Auth réelle.
- **Interdiction de masquer des erreurs par des mocks** : si une donnée ou une table n'existe pas, l'interface doit afficher un état explicite d'erreur ou d'absence, jamais un bouchon factice.
- **Règle du voyant vert** : un site ou un domaine avec `verification_source = 'NONE'` doit afficher « Vérification non configurée » via `isVerified()` et `VerifiedStatusBadge`, jamais « En ligne » ou un point vert non vérifié.
- **Prix issus de la base** : aucun tarif codé en dur dans le frontend ; toujours en centimes (`integer`) et accompagnés de la mention « à partir de » si `is_starting_price = true`.

### 5.4 Minimal Change & Respect de l'Existant
- Ne jamais réécrire massivement un module fonctionnel sans justification validée.
- Conserver les contrats, signatures de fonctions et conventions existantes.
- Réutiliser les composants du design system (`src/components/ui/`) et les hooks de domaine (`src/features/`).

### 5.5 Style Rédactionnel Authentique & Directives Anti-IA
- **Zéro tiret cadratin** : Ne pas utiliser le tiret cadratin (`—`) dans les copies et l'interface.
- **Affirmation directe** : Bannir la formule réflexe « ce n'est pas X, c'est Y » et les tournures d'évitement.
- **Sobriété** : Aucun émoji décoratif, aucun gras superflu qui dilue l'information.
- **Rythme naturel** : Casser le rythme ternaire systématique (deux éléments suffisent), varier la longueur des phrases.
- **Vocabulaire direct** : Bannir les marqueurs d'IA (*explorons*, *plongeons dans*, *il convient de noter*, *paysage*).

---

## 6. Structure Détaillée des Règles (`.agent/rules/`)

Le système de règles modulaires est organisé dans `.agent/rules/` :

| Fichier | Domaine |
|---|---|
| [`00-ai-workflow.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/00-ai-workflow.md) | Comportement obligatoire de l'IA, cycle INSPECT → REPORT, anti-hallucination |
| [`01-core.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/01-core.md) | Standards de code, TypeScript strict, KISS, DRY, YAGNI, gestion d'erreurs |
| [`02-architecture.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/02-architecture.md) | Flux de données UI → Components → Hooks → Services → Supabase → PostgreSQL |
| [`03-frontend.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/03-frontend.md) | React 19, Tailwind CSS v4, accessibilité, 4 états UI, validation formulaires |
| [`04-supabase.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/04-supabase.md) | Migrations SQL, RLS FORCE, SECURITY DEFINER, triggers, Storage privé |
| [`05-security.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/05-security.md) | Zero Trust, gestion des secrets, audit_logs, RGPD, prévention XSS/injections |
| [`06-multi-tenant.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/06-multi-tenant.md) | Cloisonnement inter-tenant, matrice RBAC, intégrité des rattachements |
| [`07-stripe.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/07-stripe.md) | Webhooks idempotents, clés serveur, catalogue de prix, séparation test/live |
| [`08-testing.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/08-testing.md) | Commandes de vérification, tests RLS, tests de non-régression et contre-épreuves |
| [`09-git.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/09-git.md) | Commits conventionnels, revue de diff, gestion des branches et migrations |
| [`10-production.md`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/.agent/rules/10-production.md) | Environnements dev/staging/prod, checklist pré-déploiement, Vercel & Supabase |

---

## 7. Définition de « Terminé » (Definition of Done)

Une tâche ou fonctionnalité est considérée comme terminée uniquement lorsque :

1. **Code complet & typé** : Aucune erreur TypeScript (`npm run typecheck`), aucun avertissement ESLint non justifié (`npm run lint`).
2. **Cohérence de la base** : Les migrations sont appliquées et cohérentes (`npm run check:schema`), les privilèges sont vérifiés (`npm run check:privileges`).
3. **Sécurité validée** : La RLS est active sur toutes les tables concernées, aucun secret n'est exposé dans le bundle (`npm run check:secrets`).
4. **Tests au vert** : Tous les tests unitaires et la suite d'isolation RLS (`npm run test:rls`) passent à 100%.
5. **UI conforme** : Les 4 états (chargement, erreur, vide, succès) sont gérés, l'accessibilité et le responsive sont respectés, l'interface est en français soigné.
6. **Documentation à jour** : Les types de domaine et la documentation technique sont synchronisés.
