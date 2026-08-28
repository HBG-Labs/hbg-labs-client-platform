# HBG Labs — Client Platform

Plateforme SaaS multi-tenant de HBG Labs : création de sites web, hébergement,
maintenance, gestion des domaines, abonnements, facturation et support client.

**Statut : lot 1 livré** — fondations du projet, schéma de base de données et
politiques d'isolation multi-tenant.

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
| `npm run verify` | schéma + lint + types + build + scan de secrets |
| `npm run test:rls` | isolation multi-tenant — **exige une base Supabase** |
| `npm run check:schema` | analyse statique des migrations, sans base |
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
- 15 migrations SQL : 19 tables, 22 types, 30 fonctions (§45)
- RLS activée **et forcée** sur toutes les tables, 11 gardes par trigger
- Suite de tests d'isolation multi-tenant (§47)
- Design system : jetons de couleur, `Button`, `Card`, `StatusBadge`, états
- Trois gardes automatiques contre l'exposition de secrets (§36)
- Grille tarifaire réelle en base, jamais codée en dur (§7)

## Ce qu'il ne contient pas

Landing page, authentification, espaces client et administrateur, Stripe,
intégration Vercel, notifications. Rien de tout cela n'est esquissé ni simulé :
conformément au §57, une fonctionnalité absente est déclarée absente plutôt que
maquettée.

---

## Vérification en attente

Les tests RLS sont écrits mais **n'ont pas encore été exécutés** : ils exigent
une base Supabase, et aucun projet n'existe à ce jour. Tant que
`npm run test:rls` n'a pas tourné, le statut est *« RLS écrite, non vérifiée »*.

Ce qui est vérifié à ce stade, sans aucun compte externe :

- 401 instructions SQL analysées par un parseur PostgreSQL 17 — syntaxe valide
- cohérence référentielle des 15 migrations : clés étrangères, fonctions, types,
  RLS présente et forcée sur les 19 tables
- `npm run verify` : lint, types, build de production, absence de secret dans le
  bundle

Voir [docs/SETUP.md §3.4](./docs/SETUP.md).
