# Installation

Marche à suivre pour rendre le projet opérationnel sur une machine neuve.

Le lot 1 (fondations, base de données, RLS) est écrit et vérifié localement,
mais **les tests d'isolation multi-tenant ne peuvent pas s'exécuter sans une
base Supabase**. L'étape 3 ci-dessous est donc la porte à franchir pour que le
lot soit réellement validé.

---

## 1. Prérequis

| Outil | Version | Vérification |
|---|---|---|
| Node.js | ≥ 20.19 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Git | — | `git --version` |

Le CLI Supabase est installé en dépendance de développement : aucune
installation globale n'est nécessaire, `npx supabase` suffit.

Docker n'est **pas** requis. Il ne le deviendrait que pour faire tourner la
stack Supabase en local (`supabase start`), ce que la marche à suivre ci-dessous
évite en s'appuyant sur un projet distant gratuit.

---

## 2. Installation locale

```bash
npm install
cp .env.example .env      # PowerShell : Copy-Item .env.example .env
```

À ce stade, ces commandes fonctionnent déjà, sans aucun compte externe :

```bash
npm run check:schema   # analyse statique des 15 migrations
npm run lint
npm run typecheck
```

`npm run dev` démarre également, mais affichera l'écran **Configuration
requise** tant que `.env` n'est pas renseigné — c'est voulu : aucune donnée
n'est simulée en l'absence de base.

---

## 3. Projet Supabase

### 3.1 Création

1. Ouvrir [supabase.com/dashboard](https://supabase.com/dashboard) et créer un
   projet (offre gratuite).
2. **Nom** : `hbg-labs-dev` — un projet distinct de la future production.
3. **Région** : choisir la plus proche des utilisateurs. Depuis la Martinique,
   `us-east-1` offre généralement une latence plus faible que l'Europe.
4. Conserver le mot de passe de base de données généré : il est demandé lors du
   `db push` et n'est plus affichable ensuite.

### 3.2 Récupération des clés

Dashboard → **Project Settings → API** :

| Champ du dashboard | Variable de `.env` | Nature |
|---|---|---|
| Project URL | `VITE_SUPABASE_URL` | publique |
| `anon` / `public` | `VITE_SUPABASE_ANON_KEY` | publique |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` | **secrète** |
| Reference ID | `SUPABASE_PROJECT_REF` | publique |

> **La clé `service_role` contourne toutes les policies RLS.**
> Elle ne porte jamais le préfixe `VITE_`, ne figure jamais dans `src/`, et
> n'est jamais commitée. Compromise, elle donne un accès complet aux données de
> tous les clients. `scripts/check-env.mjs` refuse tout build qui l'exposerait.

### 3.3 Application du schéma

```bash
npx supabase login
npx supabase link                 # sélectionner le projet dans la liste
npm run db:push                   # applique les 15 migrations
npm run db:seed                   # insère la grille tarifaire réelle (§7)
npm run db:types                  # régénère src/types/database.types.ts
```

`db:types` remplace le fichier placeholder par les types réels des tables. Les
paramètres de type explicites présents dans `tests/rls/fixtures.ts` peuvent
alors être retirés.

### 3.4 Vérification de l'isolation multi-tenant

```bash
npm run test:rls
```

La suite crée deux organisations, quatre utilisateurs et un jeu complet de
données métier, exécute la matrice de §47 sur chaque table, puis détruit tout.
Compter deux à trois minutes selon la latence réseau.

**Tant que cette commande n'a pas été exécutée avec succès, le statut du lot 1
reste « RLS écrite, non vérifiée ».**

La suite refuse de démarrer si `VITE_APP_ENV=production` : elle crée et
supprime des utilisateurs, et ne doit jamais toucher la base de production.

### 3.5 Politique de mot de passe

`supabase/config.toml` impose 10 caractères et trois classes. Cette
configuration ne s'applique automatiquement qu'à une stack locale. Sur un projet
distant, la reporter à la main : Dashboard → **Authentication → Policies**.

---

## 4. Réamorçage complet

```bash
npm run db:reset && npm run db:push && npm run db:seed
```

`db:reset` **supprime toutes les données** du projet lié. À réserver au projet
de développement.

---

## 5. Comptes restant à créer

Aucun n'est nécessaire au lot 1.

| Service | Utilité | Lot |
|---|---|---|
| **Stripe** (test mode) | Checkout, abonnements, webhooks (§19-23) | 5 |
| **Vercel** | Hébergement de la plateforme et des sites clients (§33) | 2 puis 7 |
| **GitHub** | Dépôt et déploiement continu | 2 |
| **Resend** | Emails transactionnels (§26) | 6 |
| **Sentry** | Supervision (§17) | 7 |

Lors de la création du compte Stripe : rester en **mode test** (`sk_test_…`).
`scripts/check-env.mjs` échoue si une clé `sk_live_` est présente hors
production (§48).

---

## 6. Promotion d'un compte au rang de personnel HBG Labs

Aucun compte ne naît administrateur : le trigger `handle_new_user` ignore
délibérément les métadonnées d'inscription, qui sont contrôlées par le client.

Le premier OWNER se crée donc depuis le dashboard Supabase → **SQL Editor** :

```sql
update public.profiles
   set platform_role = 'OWNER'
 where email = 'votre.email@exemple.fr';
```

Cette requête s'exécute avec les droits d'administration, seuls capables de
franchir le trigger `guard_platform_role`. Une fois ce premier OWNER en place,
il promeut les suivants depuis l'application.

---

## 7. Résolution de problèmes

| Symptôme | Cause | Correction |
|---|---|---|
| Écran « Configuration requise » | `.env` absent ou incomplet | Étape 2 puis 3.2 |
| `npm run test:rls` : variables manquantes | `SUPABASE_SERVICE_ROLE_KEY` absente | Étape 3.2 |
| `test:rls` : « Lecture du plan PRO » échoue | Seed non appliqué | `npm run db:seed` |
| `db push` : mot de passe refusé | Mot de passe de base perdu | Dashboard → Settings → Database → Reset |
| `check:secrets` échoue | Un secret a atteint `dist/` | Ne pas déployer ; révoquer la clé, corriger le préfixe |
| Build : « clé Stripe LIVE hors production » | `sk_live_` avec `VITE_APP_ENV` ≠ production | Utiliser une clé de test (§48) |
