# HBG Labs — Client Platform

Plateforme SaaS multi-tenant de HBG Labs : création de sites web, hébergement,
maintenance, gestion des domaines, abonnements, facturation et support client.

**En ligne : https://hbg-labs-client-platform.vercel.app**

**Statut : lots 1 à 4 livrés, plateforme déployée.** Schéma multi-tenant vérifié sur Supabase, site
public complet, authentification réelle, espace d'administration permettant de
créer un client de bout en bout et espace client affichant site et domaine.

---

## Démarrage

```bash
npm install
cp .env.example .env     # PowerShell : Copy-Item .env.example .env
npm run dev
```

Sans projet Supabase configuré, l'application affiche un écran **Configuration
requise** plutôt qu'une interface peuplée de données fictives.

Marche à suivre complète : [docs/SETUP.md](./docs/SETUP.md).

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run verify` | schéma, privilèges, lint, types, tests, build, scan de secrets |
| `npm test` | tests de rendu des pages publiques |
| `npm run test:rls` | isolation multi-tenant, 147 tests (exige une base Supabase) |
| `npm run check:schema` | analyse statique des migrations, sans base |
| `npm run check:privileges` | privilèges réels de la base vs. attendus |
| `npm run db:push` | applique les migrations au projet lié |
| `npm run db:seed` | insère la grille tarifaire |
| `npm run db:types` | régénère les types TypeScript depuis la base |
| `npm run check:access` | qui peut atteindre l'administration |
| `npm run auth:check` | écarts de configuration Auth du projet distant |
| `npm run auth:sync` | aligne la configuration Auth sur le dépôt |

---

## Documentation

| Document | Contenu |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | vue d'ensemble, décisions structurantes, feuille de route |
| [DATABASE.md](./docs/DATABASE.md) | les 19 tables, leurs contraintes et le pourquoi |
| [RLS.md](./docs/RLS.md) | modèle d'autorisation, matrice d'accès, gardes |
| [CONTRACTS.md](./docs/CONTRACTS.md) | contrat backend ↔ frontend — **à lire avant de développer un écran** |
| [SETUP.md](./docs/SETUP.md) | installation, accès administrateur, déploiement, dépannage |

---

## Accès à l'administration

Une seule adresse est autorisée : **hbglabs@gmail.com**. Elle est inscrite dans
`platform_access`, table verrouillée et inaccessible depuis l'application.

Un rôle plateforme ne s'attribue qu'à une adresse figurant dans cette liste,
avec exactement ce rôle. La règle s'impose à tous, `service_role` compris : même
une session OWNER compromise ne peut promouvoir personne.

Le compte n'existe pas encore. Inscrivez-vous avec cette adresse et le rôle
s'appliquera automatiquement. Détail dans [SETUP.md §6](./docs/SETUP.md).

## Ce que contient le lot 4

Espace d'administration (§27 à §32) et premiers écrans client (§16, §17) :

- Vue globale avec compteurs réels, et mention explicite là où un zéro traduit
  l'absence de Stripe plutôt qu'une absence de clients
- Clients : création, fiche détaillée, rattachement d'utilisateurs par adresse
- Sites et domaines : création et modification, avec sélection des sites
  restreinte au client concerné pour éviter tout rattachement inter-tenant
- Demandes reçues : les formulaires publics étaient jusqu'ici lisibles
  uniquement en SQL, cet écran les expose enfin
- Côté client, « Mon site » et « Domaine », où aucun voyant ne passe au vert
  sans vérification réelle
- Tableaux transformés en cartes sous 768 pixels (§40)

Le parcours complet est vérifié contre la base : un administrateur crée une
organisation, y rattache un utilisateur, ajoute un site et un domaine ; le
client les voit, un autre client ne les voit pas.

## Ce que contient le lot 3

Authentification Supabase (§9), sans aucune session simulée :

- Inscription avec confirmation d'adresse, connexion, déconnexion
- Mot de passe oublié, réinitialisation par lien, changement depuis les paramètres
- Session persistante alimentée par `onAuthStateChange`, cache vidé à la déconnexion
- Gardes de route `RequireAuth` et `RequireGuest`, distinguant « session en
  cours de résolution » de « non connecté »
- Tableau de bord affichant le profil et les rattachements réels, sans tuile fictive
- `sync-auth-config.mjs` : la configuration Auth du projet distant devient
  vérifiable, et sa dérive détectable

Deux règles de confidentialité sont appliquées et testées : le message d'échec
de connexion ne révèle jamais si un compte existe, et la demande de
réinitialisation répond la même chose pour une adresse inconnue.

## Ce que contient le lot 2

Site public complet (§5, §6, §41) :

- Landing page, pages services, création, hébergement, maintenance et tarifs
- Formulaires de devis et de contact **réellement fonctionnels**, écrivant dans
  Supabase par les policies vérifiées au lot 1
- Mentions légales, politique de confidentialité et conditions générales
- Navigation avec tiroir mobile, pied de page, 4 états UI sur chaque écran
- Référencement : titres, descriptions, Open Graph, canoniques, données
  structurées schema.org, sitemap et robots.txt générés au build
- Chargement paresseux par page : l'accueil ne télécharge pas les CGV

Deux écarts assumés par rapport au §6, détaillés plus bas : pas de section
témoignages, et mentions légales en attente de vos informations d'entreprise.

## Ce que contient le lot 1

- Projet Vite · React 19 · TypeScript · Tailwind 4, arborescence modulaire (§38)
- 16 migrations SQL : 19 tables, 22 types, 30 fonctions (§45)
- RLS activée **et forcée** sur toutes les tables, 11 gardes par trigger
- Suite de 136 tests d'isolation multi-tenant (§47), tous au vert
- Design system : jetons de couleur, `Button`, `Card`, `StatusBadge`, états
- Quatre gardes automatiques : secrets, environnement, schéma, privilèges (§36)
- Grille tarifaire réelle en base, jamais codée en dur (§7)

## Ce qu'il ne contient pas

Abonnements et facturation (Stripe), tickets de support, intégration Vercel,
notifications. Rien de tout cela n'est esquissé ni simulé : conformément au §57,
une fonctionnalité absente est déclarée absente plutôt que maquettée.

## Trois points en attente de votre part

**Serveur SMTP.** Le service intégré de Supabase plafonne à deux courriels par
heure. Suffisant pour tester, insuffisant dès les premiers clients : chaque
inscription et chaque réinitialisation en consomme un. Resend est prévu au
lot 6, mais la limite s'applique dès maintenant.

**Informations d'entreprise.** `src/config/site.ts` attend la dénomination
sociale, la forme juridique, le SIRET, l'adresse du siège, le directeur de la
publication et l'adresse de contact. Tant qu'ils manquent, les pages légales
affichent un avertissement de publication incomplète au lieu d'informations
inventées. Ces mentions sont obligatoires avant toute mise en ligne publique.

**Section témoignages.** Le §6 la prévoit, elle n'existe pas : aucun avis client
réel n'est disponible, et en fabriquer contreviendrait au §57. La section
« Nos engagements » occupe cette place. Un test empêche qu'un faux témoignage
soit réintroduit par inadvertance.

---

## Vérification

Le schéma est appliqué sur le projet Supabase **HBGLABS CLIENT PLATFORM**
(PostgreSQL 17, eu-west-1) et la suite d'isolation y a été exécutée.

| Contrôle | Résultat |
|---|---|
| Application des 16 migrations sur base vierge | sans erreur |
| `npm run test:rls` : 136 tests, 5 fichiers | tous au vert |
| `npm test` : 39 tests de rendu, de gardes et de la règle du voyant | tous au vert |
| Écriture des formulaires depuis la clé anon | vérifiée contre la base réelle |
| Parcours d'authentification, 13 contrôles | vérifié contre la base réelle |
| Parcours administrateur, 19 contrôles | vérifié contre la base réelle |
| Verrou d'accès à l'administration, 11 tests | vérifié contre la base réelle |
| `npm run auth:check` | configuration Auth conforme |
| `npm run check:privileges` | conforme, aucun surplus ni manque |
| `npm run check:schema` | RLS activée et forcée sur 19/19 tables |
| `npm run verify` | lint, types, build, aucun secret dans le bundle |

### Un défaut trouvé et corrigé

L'audit des privilèges réels a révélé que `authenticated` détenait INSERT,
UPDATE, DELETE, TRUNCATE, REFERENCES et TRIGGER sur toutes les tables —
y compris celles documentées en lecture seule. Cause : Supabase accorde tout
par défaut, et un `GRANT` est additif, il ne retire rien.

Aucune donnée n'a jamais été exposée : la RLS bloquait les effets, ce que les
133 tests d'alors confirmaient. Mais **TRUNCATE échappe à la RLS**, et il n'y
avait donc qu'une barrière là où la documentation en annonçait deux.

Corrigé par la migration 16, et désormais surveillé en continu par
`npm run check:privileges`. Détail dans [RLS.md §4bis](./docs/RLS.md).
