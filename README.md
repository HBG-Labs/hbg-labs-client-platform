# HBG Labs — Client Platform

Plateforme SaaS multi-tenant de HBG Labs : création de sites web, hébergement,
maintenance, gestion des domaines, abonnements, facturation et support client.

**Statut : lot 1 livré et vérifié** — fondations du projet, schéma de base de
données et politiques d'isolation multi-tenant, appliqués sur le projet
Supabase et validés par 136 tests.

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
| `npm run verify` | schéma + privilèges + lint + types + build + scan de secrets |
| `npm run test:rls` | isolation multi-tenant — **exige une base Supabase** |
| `npm run check:schema` | analyse statique des migrations, sans base |
| `npm run check:privileges` | privilèges réels de la base vs. attendus |
| `npm run db:push` | applique les migrations au projet lié |
| `npm run db:seed` | insère la grille tarifaire |
| `npm run db:types` | régénère les types TypeScript depuis la base |

---

## Documentation

| Document | Contenu |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | vue d'ensemble, décisions structurantes, feuille de route |
| [DATABASE.md](./docs/DATABASE.md) | les 19 tables, leurs contraintes et le pourquoi |
| [RLS.md](./docs/RLS.md) | modèle d'autorisation, matrice d'accès, gardes |
| [CONTRACTS.md](./docs/CONTRACTS.md) | contrat backend ↔ frontend — **à lire avant de développer un écran** |
| [SETUP.md](./docs/SETUP.md) | installation, comptes externes, dépannage |

---

## Ce que contient le lot 1

- Projet Vite · React 19 · TypeScript · Tailwind 4, arborescence modulaire (§38)
- 16 migrations SQL : 19 tables, 22 types, 30 fonctions (§45)
- RLS activée **et forcée** sur toutes les tables, 11 gardes par trigger
- Suite de 136 tests d'isolation multi-tenant (§47), tous au vert
- Design system : jetons de couleur, `Button`, `Card`, `StatusBadge`, états
- Quatre gardes automatiques : secrets, environnement, schéma, privilèges (§36)
- Grille tarifaire réelle en base, jamais codée en dur (§7)

## Ce qu'il ne contient pas

Landing page, authentification, espaces client et administrateur, Stripe,
intégration Vercel, notifications. Rien de tout cela n'est esquissé ni simulé :
conformément au §57, une fonctionnalité absente est déclarée absente plutôt que
maquettée.

---

## Vérification

Le schéma est appliqué sur le projet Supabase **HBGLABS CLIENT PLATFORM**
(PostgreSQL 17, eu-west-1) et la suite d'isolation y a été exécutée.

| Contrôle | Résultat |
|---|---|
| Application des 16 migrations sur base vierge | sans erreur |
| `npm run test:rls` — 136 tests, 5 fichiers | tous au vert |
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
