# 02 — Application Architecture

Ce document définit les principes architecturaux, les flux de données et l'organisation des couches sur **HBG Labs Client Platform**.

---

## 1. Flux en Couches (Layered Flow)

L'architecture est structurée selon un flux unidirectionnel strict :

```text
UI (Pages, Layouts dans src/pages/, src/layouts/)
  ↓
Components (Design system dans src/components/ui/)
  ↓
Hooks & Logic (TanStack Query, custom hooks dans src/features/<domaine>/)
  ↓
Services (Fonctions d'accès aux données dans src/services/*.service.ts)
  ↓
Supabase Client (PostgREST, GoTrue, Storage, Edge Functions)
  ↓
PostgreSQL (Tables, RLS FORCE, Triggers de garde, Fonctions SECURITY DEFINER)
```

### Rôle de chaque couche :

1. **Pages & Layouts (`src/pages/`, `src/layouts/`)** :
   - Composition visuelle de l'écran, gestion de la mise en page responsive.
   - Assemblage des états (chargement, erreur, données vides, données chargées).
   - Pas de requêtes réseau directes : délégation exclusive aux hooks de fonctionnalités.

2. **Composants d'Interface (`src/components/ui/`)** :
   - Briques atomiques et moléculaires réutilisables du design system (`Button`, `Card`, `StatusBadge`, `Dialog`, etc.).
   - Composants purs ou contrôlés, agnostiques vis-à-vis du domaine métier (sauf badges spécialisés appliquant un contrat strict comme `VerifiedStatusBadge`).

3. **Logique Métier & Hooks (`src/features/<domaine>/`)** :
   - Organisation par domaine fonctionnel (`pricing/`, `websites/`, `billing/`, `tickets/`, `auth/`).
   - Hooks encapsulant TanStack Query (`useQuery`, `useMutation`), gestion fine du cache et des clés d'invalidation.

4. **Services de Données (`src/services/*.service.ts`)** :
   - Une fonction par requête ou opération de base de données.
   - Utilisation du client Supabase typé (`supabase.from(...)`).
   - Pas d'état local (fonctions pures ou asynchrones).

5. **Couche Base de Données (`supabase/`)** :
   - Garant unique et absolu de l'intégrité et de la sécurité des données.

---

## 2. Arborescence du Code Source (`src/`)

```text
src/
├── components/
│   └── ui/              # Design system réutilisable (Radix + Tailwind)
├── features/
│   └── <domaine>/       # Hooks TanStack Query, sous-composants métier
│       ├── useXxx.ts
│       └── xxx.keys.ts  # Définition centralisée des clés de cache
├── layouts/             # RootLayout, AppLayout, AuthLayout
├── lib/                 # env.ts, supabase.ts, queryClient.ts, utils.ts
├── pages/               # Composants de page routés
├── routes/              # Définition des routes React Router
├── schemas/             # Schémas de validation Zod (formulaires)
├── services/            # Couche d'accès PostgREST / Supabase
└── types/
    ├── domain.ts        # Vocabulaire métier et énumérations (manuel)
    └── database.types.ts# Typage généré depuis PostgreSQL (db:types)
```

---

## 3. Absence de Serveur Applicatif Intermédiaire

Le frontend communique directement avec PostgreSQL via PostgREST et le SDK `@supabase/supabase-js`.

- **Conséquence directe** : Le frontend ne possède aucune autorité en matière de sécurité.
- **La sécurité réside dans la base** : Les politiques RLS, triggers de garde et contraintes d'intégrité exécutés par PostgreSQL protègent chaque table.
- **Les Edge Functions** : Interviennent exclusivement là où un secret serveur est indispensable (ex. webhook Stripe, création de session Checkout, envoi d'emails transactionnels).

---

## 4. Règles Architecturales pour les Agents IA

1. **Rechercher avant de créer** : Avant d'ajouter un composant, un service ou un hook, inspecter les répertoires existants pour identifier d'éventuelles implémentations similaires.
2. **Éviter les doublons** : Ne pas recréer de client Supabase, de fonction de formatage ou de composant de bouton s'ils existent déjà dans `src/lib/` ou `src/components/ui/`.
3. **Préserver les contrats existants** : Ne pas modifier la signature d'un service ou la structure d'un type exporté sans mettre à jour l'ensemble des consommateurs et la documentation correspondante.
4. **Pas de réécritures massives** : Tout refactoring d'envergure doit être découpé, planifié et explicitement validé.
5. **Respect des clés de cache TanStack Query** : Structurer les clés de cache de manière hiérarchique pour permettre des invalidations ciblées lors des mutations.
