# Installation

Marche à suivre pour rendre le projet opérationnel sur une machine neuve.

Le projet Supabase **HBGLABS CLIENT PLATFORM** est déjà relié, le schéma y est
appliqué et la suite d'isolation y passe intégralement. Cette marche à suivre
sert à reproduire l'installation sur une autre machine, ou à repartir d'un
projet neuf.

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
npm run check:schema   # analyse statique des 16 migrations
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
3. **Région** : choisir la plus proche des utilisateurs. Le projet existant est
   en `eu-west-1` ; depuis la Martinique, `us-east-1` offrirait généralement une
   latence plus faible — à mesurer avant un éventuel changement, qui impose de
   recréer le projet.
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
npm run db:push                   # applique les 16 migrations
npm run db:seed                   # insère la grille tarifaire réelle (§7)
npm run db:types                  # régénère src/types/database.types.ts
```

`db:types` régénère `src/types/database.types.ts` depuis la base. Ce fichier
est **généré** : ne le modifiez jamais à la main, relancez la commande. Les
tests et l'application s'y typent, une colonne renommée dans une migration
casse donc la compilation plutôt que d'échouer à l'exécution.

### 3.4 Vérification de l'isolation multi-tenant

```bash
npm run test:rls
```

La suite crée deux organisations, quatre utilisateurs et un jeu complet de
données métier, exécute la matrice de §47 sur chaque table, puis détruit tout.
Compter deux à trois minutes selon la latence réseau.

Résultat attendu : **172 tests au vert**, 8 fichiers.

Enchaînez avec `npm run check:privileges`, qui compare les privilèges réels de
la base aux privilèges attendus. Les deux sont complémentaires : les tests
vérifient les policies, l'audit vérifie les privilèges — et un manque de
privilège rend une policy inopérante sans qu'aucun test ne l'indique.

La suite refuse de démarrer si `VITE_APP_ENV=production` : elle crée et
supprime des utilisateurs, et ne doit jamais toucher la base de production.

### 3.5 Configuration Auth du projet distant

`supabase/config.toml` est versionné mais ne s'applique qu'à une stack locale.
Un projet distant garde les valeurs par défaut de Supabase, quoi que dise le
fichier.

```bash
npm run auth:check   # signale les écarts sans rien modifier
npm run auth:sync    # aligne le projet sur le dépôt
```

Quatre réglages étaient en écart à la mise en place, tous conséquents :

| Réglage | Défaut Supabase | Attendu | Conséquence du défaut |
|---|---|---|---|
| `site_url` | `localhost:3000` | `localhost:5173` | liens de courriel vers un port mort |
| `uri_allow_list` | vide | origines locales | toute redirection refusée |
| `password_min_length` | 6 | 10 | politique annoncée non appliquée |
| `password_required_characters` | aucune | 3 classes | idem |

`auth:check` fait partie de `npm run verify` : une dérive de configuration
apparaît à la vérification suivante.

### 3.6 Limite d'envoi de courriels

Le serveur SMTP intégré de Supabase est plafonné à **2 courriels par heure**.
Cette limite suffit à peine pour tester une inscription, et ne convient pas à
un usage réel : une poignée de clients suffirait à la saturer.

Un serveur SMTP dédié est requis avant la mise en production. Resend figure
déjà dans la pile prévue (§26) et sera raccordé au lot 6.

À savoir également : le parcours d'inscription public vérifie que le domaine de
l'adresse possède un enregistrement MX. Les domaines de test (`.test`,
`example.com`) sont donc refusés. Pour créer un compte de test, utiliser une
adresse réelle ou l'API d'administration.

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

## 6. Accès à l'espace d'administration

L'accès repose sur une liste d'autorisation, `platform_access`, inaccessible
depuis l'application. Une adresse ne peut détenir un rôle plateforme que si
elle y figure, avec exactement ce rôle. La règle s'impose à tous, `service_role`
compris.

### 6.1 État actuel

Une seule adresse est autorisée : **hbglabs@gmail.com**, avec le rôle OWNER.

Le compte correspondant n'existe pas encore. Inscrivez-vous avec cette adresse
sur `/inscription` et confirmez le courriel reçu : le rôle est appliqué
automatiquement à la création du profil, et `/admin` devient accessible.

Aucune manipulation SQL n'est nécessaire.

### 6.2 Vérifier qui a accès

```bash
npm run check:access
```

Compare les rôles réellement détenus à la liste d'autorisation et signale toute
divergence. Ce contrôle fait partie de `npm run verify`.

### 6.3 Ajouter un collaborateur

Depuis le SQL Editor Supabase. L'opération est délibérément hors de portée de
l'application.

```sql
insert into public.platform_access (email, role, note)
values ('collegue@exemple.fr', 'SUPPORT', 'Support client');
```

Si la personne n'a pas encore de compte, le rôle s'appliquera à son inscription.
Si son compte existe déjà :

```sql
update public.profiles set platform_role = 'SUPPORT'
 where email = 'collegue@exemple.fr';
```

Rôles disponibles : OWNER, ADMIN, STAFF, SUPPORT. Un membre SUPPORT lit les
données clients sans pouvoir les modifier, la base le lui refuse.

### 6.4 Retirer un accès

Le retrait n'exige pas de toucher à la liste. Un verrou qui rendrait la
révocation aussi difficile que l'attribution se retournerait contre vous le jour
où il faut agir vite.

```sql
update public.profiles set platform_role = null
 where email = 'collegue@exemple.fr';

delete from public.platform_access where email = 'collegue@exemple.fr';
```

### 6.5 Ce que ce dispositif ne protège pas

Qui détient la clé `service_role` détient la base : il peut modifier la liste ou
supprimer le trigger. Aucune protection en base ne s'en prémunit.

Ce que le dispositif apporte reste réel : une promotion silencieuse depuis
l'application devient une intervention délibérée sur le schéma, qui demande un
accès distinct et laisse une trace. Traitez la clé `service_role` en
conséquence.

---

## 7. Déploiement

Le site est en ligne sur **https://hbg-labs-client-platform.vercel.app**.

### 7.1 Fonctionnement

Le dépôt GitHub est connecté au projet Vercel `hbz2/hbg-labs-client-platform`.
Chaque poussée sur `main` déclenche un déploiement en production, chaque branche
obtient une adresse de prévisualisation.

Aucune commande n'est donc nécessaire pour mettre en ligne : `git push` suffit.
Un déploiement manuel reste possible depuis la machine :

```bash
npx vercel --prod
```

### 7.2 Variables d'environnement

Quatre variables sont définies sur Vercel, en production et en prévisualisation.
Toutes sont publiques : elles sont inscrites en clair dans le bundle.

| Variable | Production | Prévisualisation |
|---|---|---|
| `VITE_SUPABASE_URL` | projet Supabase | idem |
| `VITE_SUPABASE_ANON_KEY` | clé anon | idem |
| `VITE_APP_ENV` | `production` | `staging` |
| `VITE_APP_URL` | adresse de production | idem |

Vercel refuse par défaut une valeur ressemblant à un secret dans une variable
publique. La clé `anon` déclenche cette protection, à tort : elle est publique
par conception, et son rôle JWT vaut bien `anon`. Le drapeau `--type config`
lève l'objection.

Aucun secret serveur n'est déposé sur Vercel : rien n'y tourne côté serveur pour
l'instant. Les fonctions Edge vivent chez Supabase.

### 7.3 Redirections d'authentification

Les liens envoyés par courriel ne fonctionnent que si leur origine figure dans
la liste d'autorisation Supabase. `npm run auth:sync` la maintient, et couvre à
la fois la production, les prévisualisations Vercel et le développement local.

`npm run auth:check` signale toute dérive, et fait partie de `npm run verify`.

### 7.4 Rattacher un domaine

```bash
npx vercel domains add hbg-labs.fr
```

Vercel indique les enregistrements DNS à créer chez votre bureau
d'enregistrement. Une fois le domaine actif, trois mises à jour suivent :

1. `VITE_APP_URL` sur Vercel, en production et en prévisualisation ;
2. `PRODUCTION_ORIGIN` dans `scripts/sync-auth-config.mjs`, puis
   `npm run auth:sync` ;
3. un redéploiement, pour que le sitemap et les balises canoniques portent la
   nouvelle adresse.

### 7.5 Un seul projet Supabase pour deux usages

**À traiter avant d'accueillir un vrai client.**

La production et le développement partagent aujourd'hui le même projet
Supabase. La suite `npm run test:rls` crée et supprime des utilisateurs dans la
base qui sert le site public.

Le garde-fou existant refuse l'exécution si `VITE_APP_ENV` vaut `production`,
mais en local cette variable vaut `development` tout en pointant vers la même
base. La protection ne joue donc pas.

C'est acceptable tant qu'aucun client n'est enregistré. Dès le premier, créez un
second projet Supabase pour la production, et réservez celui-ci au
développement (§48).

---


## 8. Résolution de problèmes

| Symptôme | Cause | Correction |
|---|---|---|
| Écran « Configuration requise » | `.env` absent ou incomplet | Étape 2 puis 3.2 |
| `npm run test:rls` : variables manquantes | `SUPABASE_SERVICE_ROLE_KEY` absente | Étape 3.2 |
| `test:rls` : « Lecture du plan PRO » échoue | Seed non appliqué | `npm run db:seed` |
| `db push` : mot de passe refusé | Mot de passe de base perdu | Dashboard → Settings → Database → Reset |
| `check:secrets` échoue | Un secret a atteint `dist/` | Ne pas déployer ; révoquer la clé, corriger le préfixe |
| Build : « clé Stripe LIVE hors production » | `sk_live_` avec `VITE_APP_ENV` ≠ production | Utiliser une clé de test (§48) |
