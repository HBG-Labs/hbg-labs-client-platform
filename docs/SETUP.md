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
| **Stripe** (test mode) | Checkout, abonnements, webhooks (§19-23) | 8 — voir §8 |
| **Vercel** | Hébergement de la plateforme et des sites clients (§33) | 2 puis 9 |
| **GitHub** | Dépôt et déploiement continu | 2 |
| **Resend** | Emails transactionnels (§26) | 9 — voir §9 |
| **Sentry** | Supervision (§17) | 9 |

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

C'est acceptable tant qu'aucun client n'est enregistré. Dès le premier, créez un
second projet Supabase pour la production, et réservez celui-ci au
développement (§48).

**Deux garde-fous, et pourquoi il en faut deux.** Le premier refuse l'exécution
si `VITE_APP_ENV` vaut `production`. Il ne suffit pas : cette variable décrit
l'intention du poste de travail, pas l'identité de la base visée. Copier l'URL
et la clé de service de la production dans un `.env` resté en `development`
passerait à travers, et la suite balaierait la production.

Le second garde-fou est posé **dans la base** et voyage avec elle. Sur le projet
de production, à exécuter une fois :

```sql
update platform_settings set value = 'production' where key = 'environment';
```

Quelle que soit la machine, quel que soit le `.env`, `npm run test:rls` refuse
alors de démarrer contre cette base. `npm run preflight` signale par ailleurs
toute incohérence entre le marqueur et l'environnement visé.

---


## 8. Stripe

Le lot 8 apporte le Checkout, le portail de facturation et le webhook. Tant que
les clés ci-dessous sont absentes, la plateforme fonctionne : aucune offre n'est
souscriptible, et les écrans le disent au lieu de proposer un bouton qui
échouerait.

### 8.1 Clés

Tableau de bord Stripe, **en mode test** (l'interrupteur en haut à droite) :

| Clé | Où la lire | Où la mettre |
|---|---|---|
| `STRIPE_SECRET_KEY` (`sk_test_…`) | Developers → API keys | `.env` local, secrets Supabase |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | créé en §8.3 | secrets Supabase |

Ces deux valeurs sont des **secrets serveur**. Elles ne portent jamais le
préfixe `VITE_` et n'apparaissent pas dans `src/` : `check-env.mjs` refuse le
build si l'une d'elles est exposée, et `check-bundle-secrets.mjs` inspecte le
bundle produit.

### 8.2 Déploiement des fonctions Edge

Trois fonctions : `stripe-checkout`, `stripe-portal`, `stripe-webhook`.

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set APP_URL=https://hbg-labs-client-platform.vercel.app

npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-portal
npx supabase functions deploy stripe-webhook
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies
automatiquement au runtime : ne les redéfinissez pas.

`stripe-webhook` est déployée avec `verify_jwt = false`
(`supabase/config.toml`) : Stripe n'a pas de session Supabase, et
l'authentification repose ici sur la signature `stripe-signature`.

### 8.3 Point d'entrée du webhook

Stripe → Developers → Webhooks → **Add endpoint**.

URL : `https://<ref>.supabase.co/functions/v1/stripe-webhook`

Événements à cocher :

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
invoice.created
invoice.finalized
invoice.updated
invoice.paid
invoice.payment_failed
invoice.marked_uncollectible
invoice.voided
payment_intent.succeeded
payment_intent.processing
payment_intent.canceled
payment_intent.payment_failed
charge.refunded
```

Stripe affiche alors un **signing secret** (`whsec_…`) :

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase functions deploy stripe-webhook
```

Un événement non coché n'est pas une erreur : il est acquitté et consigné dans
`stripe_webhook_events` avec la mention « type non traité ».

### 8.4 Portail de facturation

Stripe → Settings → Billing → **Customer portal** → activer la configuration par
défaut. Sans elle, l'API refuse de créer une session et le bouton « Gérer mon
abonnement » affiche « momentanément indisponible ».

Cochez au minimum : mise à jour du moyen de paiement, historique des factures,
et résiliation si vous l'autorisez.

### 8.5 Publier le catalogue

Les offres vivent en base (§7). Stripe ne sait facturer que ses propres objets :

```bash
npm run stripe:check    # écarts, sans rien écrire
npm run stripe:sync     # crée Products et Prices, écrit les identifiants en base
```

Le script ne publie ni les offres `requires_quote`, ni les prix « à partir de » :
ce sont des montants non fermes, et un Price Stripe est toujours ferme.

Tant qu'un `stripe_price_id` est NULL, `isPurchasable` renvoie `false` et
l'interface propose « Demander un devis ».

### 8.6 Vérifier de bout en bout

1. Connectez-vous comme dirigeant d'une entreprise cliente ;
2. `/dashboard/facturation` → **Souscrire** ;
3. carte de test `4242 4242 4242 4242`, date future, CVC quelconque ;
4. au retour, l'écran affiche « Confirmation en cours » — c'est le comportement
   attendu, le webhook n'est pas encore arrivé ;
5. quelques secondes plus tard, l'abonnement apparaît.

S'il n'apparaît pas : Stripe → Webhooks → l'endpoint → onglet des livraisons.
Une réponse 400 signale une signature invalide (mauvais `whsec_`), une 500 un
échec de traitement dont le motif est consigné dans
`stripe_webhook_events.error`.

```sql
select event_type, processed, attempts, error, created_at
  from stripe_webhook_events
 order by created_at desc
 limit 20;
```

Carte refusée pour tester un échec : `4000 0000 0000 0002`.

---


## 9. Courriels transactionnels

Les notifications en application fonctionnent sans rien de tout ceci (lot 6).
Cette section ajoute le second canal : le courriel.

Le canal est **fermé par défaut**, et il le reste tant que vous ne l'ouvrez pas
explicitement à l'étape 9.4. Fermé, aucune ligne EMAIL n'est créée : rien ne
s'accumule en attente d'un service qui n'est pas raccordé, et l'ouverture ne
déclenche pas l'envoi d'un arriéré de messages périmés.

### 9.1 Compte Resend

1. Créez un compte sur resend.com ;
2. **Vérifiez un domaine** (Domains → Add domain, puis les enregistrements DNS
   qu'il indique). Sans domaine vérifié, Resend n'accepte d'envoyer qu'à votre
   propre adresse, depuis `onboarding@resend.dev` : de quoi tester, pas de quoi
   écrire à un client ;
3. Créez une clé d'API (`re_…`).

### 9.2 Secrets et déploiement

```bash
npx supabase secrets set RESEND_API_KEY=re_...
npx supabase secrets set EMAIL_FROM="HBG Labs <notifications@votre-domaine.fr>"
npx supabase secrets set APP_URL=https://hbg-labs-client-platform.vercel.app

npx supabase functions deploy notifications-dispatch
```

`EMAIL_FROM` doit appartenir au domaine vérifié à l'étape précédente. `APP_URL`
sert à construire les liens des courriels : les notifications ne stockent qu'un
chemin (`/dashboard/demandes/…`), la contrainte
`notifications_action_url_relative` interdisant une URL absolue en base — le
domaine change d'un environnement à l'autre.

### 9.3 Ordonnancement

La fonction vide la file ; encore faut-il l'appeler. `pg_cron` s'en charge,
depuis Supabase, sans service tiers. À exécuter une fois dans le SQL Editor :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- La clé service_role est déposée dans Vault, jamais écrite en clair dans une
-- tâche : `cron.job` est lisible par tout rôle capable d'interroger le schéma.
select vault.create_secret(
  '<SUPABASE_SERVICE_ROLE_KEY>',
  'service_role_key',
  'Appel des fonctions Edge par pg_cron'
);

select cron.schedule(
  'notifications-dispatch',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/notifications-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
         where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $job$
);
```

Remplacez `<ref>` par la référence du projet (`SUPABASE_PROJECT_REF` dans
`.env`).

La fonction exige que l'appelant soit `service_role` : un utilisateur connecté
qui atteindrait l'URL obtiendrait un 403. Vider une file d'envoi n'est pas un
geste d'utilisateur.

Pour arrêter la tâche : `select cron.unschedule('notifications-dispatch');`

### 9.4 Ouvrir le canal

```bash
npm run email:status    # état, file d'attente, derniers motifs d'échec
npm run email:on        # les notifications produisent désormais un courriel
npm run email:off
```

L'interrupteur vit dans `platform_settings`, table fermée : ni `anon` ni
`authenticated` n'y ont le moindre privilège, et aucune policy n'existe. Un
réglage qui commande des envois vers des adresses réelles n'a pas à être
basculable depuis une session de navigateur, fût-elle celle d'un administrateur.

### 9.5 Vérifier

1. `npm run email:on` ;
2. répondez à une demande depuis `/admin/tickets/…` ;
3. `npm run email:status` : une ligne apparaît « en file » ;
4. moins d'une minute plus tard, elle passe dans « envoyés » et le courriel
   arrive.

Si la file ne se vide pas :

```bash
npx supabase functions logs notifications-dispatch
```

```sql
select id, title, status, failure_reason, created_at
  from notifications
 where channel = 'EMAIL'
 order by created_at desc
 limit 20;
```

Un message resté plus de vingt-quatre heures en file passe à `FAILED` sans être
envoyé : passé ce délai, « vous avez un nouveau message » désigne une demande
souvent déjà close.

---


## 10. Supervision

`VITE_SENTRY_DSN` vide — le cas par défaut — et **rien ne se charge** : le SDK
n'est pas téléchargé, aucune requête ne part. La supervision est absente, et
l'application ne prétend pas le contraire.

### 10.1 Activer

1. Créez un projet Sentry de type **React** ;
2. copiez le DSN (`https://…@…ingest.sentry.io/…`) ;
3. renseignez-le dans `.env`, puis sur Vercel :

```bash
npx vercel env add VITE_SENTRY_DSN production
npx vercel env add VITE_SENTRY_DSN preview
```

Le DSN est **public par conception**, comme la clé `anon` : il désigne le projet
qui reçoit, il n'ouvre aucun accès en lecture. Le préfixe `VITE_` est donc
correct ici.

### 10.2 Ce qui est envoyé, et ce qui ne l'est pas

| Envoyé | Non envoyé |
|---|---|
| Type et message de l'erreur | Identifiant ou adresse de l'utilisateur |
| Pile d'appels et pile de composants | Adresse IP (`sendDefaultPii: false`) |
| Chemin de l'URL | Chaîne de requête, remplacée par `?…` |
| Environnement (`development`, `staging`, `production`) | Contenu des formulaires |

La chaîne de requête est retirée pour une raison précise : PostgREST porte ses
filtres dans l'URL. `profiles?email=eq.…` suffirait à faire sortir une adresse
client vers un prestataire américain, sans que personne ne l'ait décidé.

Sentry figure dans la liste des sous-traitants publiée sur
`/politique-confidentialite`. Une supervision active absente de cette liste
rendrait la politique fausse.

### 10.3 Poids

Le SDK est chargé **à la demande**, dans un morceau de code séparé
(≈ 155 Kio compressés). Le bundle initial n'augmente que de deux kilo-octets,
et ce morceau n'est jamais téléchargé sans DSN.

Contrepartie assumée : une erreur survenant dans les premières centaines de
millisecondes, avant la fin du chargement du SDK, n'est pas remontée. Le
chargement est lancé avant le premier rendu pour réduire cette fenêtre.

### 10.4 Sans Sentry

Deux écrans rattrapent les erreurs, DSN ou pas :

- `AppErrorBoundary` remplace la page blanche d'un rendu échoué par un message
  et un bouton de rechargement ;
- `RouteErrorPage` distingue l'adresse inconnue de l'échec de chargement. Ce
  second cas est le plus fréquent : après un déploiement, un onglet resté
  ouvert demande un morceau de code qui n'existe plus. Annoncer « page
  introuvable » enverrait à l'opposé du geste utile.

`reportError` retombe alors sur la console du navigateur.

---


## 11. État réel des sites clients

Sans cette intégration, `verification_source` vaut `NONE` partout et l'espace
client affiche « Vérification non configurée ». Ce n'est pas une lacune
d'affichage : les contraintes de la base imposent alors des statuts `UNKNOWN`,
parce que c'est le seul état vrai.

### 11.1 Jeton Vercel

Vercel → Account Settings → Tokens → **Create Token**, portée limitée à
l'équipe qui héberge les sites clients.

```bash
npx supabase secrets set VERCEL_TOKEN=...
npx supabase secrets set VERCEL_TEAM_ID=team_...   # si les projets sont dans une équipe

npx supabase functions deploy vercel-refresh
```

Le jeton donne aussi le droit de **supprimer** un projet. La fonction ne fait
que lire — aucune méthode d'écriture n'est exposée dans `_shared/vercel.ts` —
mais le secret, lui, ne doit vivre que côté Supabase.

### 11.2 Rattacher un site à son projet

Renseignez `websites.vercel_project_id` (et `vercel_team_id` si l'équipe diffère
de celle par défaut) depuis `/admin/sites`. Un site sans identifiant de projet
est ignoré par la fonction, et son affichage reste « non configuré ».

### 11.3 Ordonnancement

```sql
select cron.schedule(
  'vercel-refresh',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/vercel-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
         where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
```

Un déploiement ou un certificat changent rarement : un quart d'heure suffit.
Vingt-cinq sites sont traités par exécution, les moins récemment vérifiés
d'abord.

Le secret Vault `service_role_key` est celui créé au §9.3 ; inutile de le
recréer.

### 11.4 Ce qui est écrit, et ce qui ne l'est pas

| Écrit depuis Vercel | Laissé intact |
|---|---|
| `last_deployment_id`, `last_deployed_at` | `websites.status`, déclaré par HBG Labs |
| `websites.ssl_status` | `production_url`, saisi par un opérateur |
| `domains.dns_status`, `domains.ssl_status` | `domains.status` d'un domaine acheté ailleurs |
| `verification_source`, `checked_at` | `expires_at`, `auto_renew` hors registrar Vercel |

`EXPIRING` et `EXPIRED` ne sont jamais écrits pour un certificat : l'API ne
donne pas sa date d'expiration, et Vercel le renouvelle seul. Les affirmer
demanderait une information dont on ne dispose pas.

Une date d'expiration de domaine n'est écrite que si **Vercel est le
registrar** : lui seul la connaît alors. Pour un domaine acheté ailleurs,
`expires_at` reste `NULL`, et l'interface n'affiche rien plutôt qu'une
estimation.

### 11.5 Quand l'API échoue

La ligne n'est pas touchée, et l'échec est journalisé. Écrire `ssl_status =
ERROR` parce que NOTRE appel a échoué afficherait une alerte rouge sur le site
d'un client dont le certificat va très bien.

```bash
npx supabase functions logs vercel-refresh
```

---


## 12. Résolution de problèmes

| Symptôme | Cause | Correction |
|---|---|---|
| Écran « Configuration requise » | `.env` absent ou incomplet | Étape 2 puis 3.2 |
| `npm run test:rls` : variables manquantes | `SUPABASE_SERVICE_ROLE_KEY` absente | Étape 3.2 |
| `test:rls` : « Lecture du plan PRO » échoue | Seed non appliqué | `npm run db:seed` |
| `db push` : mot de passe refusé | Mot de passe de base perdu | Dashboard → Settings → Database → Reset |
| `check:secrets` échoue | Un secret a atteint `dist/` | Ne pas déployer ; révoquer la clé, corriger le préfixe |
| Build : « clé Stripe LIVE hors production » | `sk_live_` avec `VITE_APP_ENV` ≠ production | Utiliser une clé de test (§48) |
| « Souscription en ligne indisponible » | `stripe_price_id` NULL en base | `npm run stripe:sync` (§8.5) |
| Webhook en 400 chez Stripe | `STRIPE_WEBHOOK_SECRET` erroné | Redéfinir le secret, redéployer (§8.3) |
| « La confirmation tarde » sur la facturation | Webhook non livré ou en échec | Journal des livraisons Stripe, puis `stripe_webhook_events` (§8.6) |
| Portail « momentanément indisponible » | Customer portal non configuré | Activer la configuration par défaut (§8.4) |
| Aucun courriel, file vide | Canal fermé | `npm run email:on` (§9.4) |
| File qui grossit sans envoi | Tâche pg_cron absente ou en échec | Rejouer §9.3, puis `supabase functions logs` |
| Courriels `FAILED` : « domain is not verified » | `EMAIL_FROM` hors du domaine vérifié | Vérifier le domaine dans Resend (§9.1) |
| Site toujours « Vérification non configurée » | `vercel_project_id` non renseigné | Le saisir depuis `/admin/sites` (§11.2) |
| Journaux : « Projet Vercel introuvable » | Identifiant erroné, ou projet dans une autre équipe | Corriger l'identifiant ou `vercel_team_id` (§11.2) |
