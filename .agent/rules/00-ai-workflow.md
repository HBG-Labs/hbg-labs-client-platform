# 00 — AI Workflow & Operating Guidelines

Ce document définit le comportement et le protocole d'exécution obligatoires pour tout agent IA intervenant sur le repository **HBG Labs Client Platform**.

---

## 1. Cycle d'Exécution Obligatoire

Chaque tâche doit respecter la séquence stricte suivante :

```text
INSPECT
  ↓
UNDERSTAND
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

### Étape 1 : INSPECT (Inspection Préalable)
- Lire et inspecter les fichiers existants avant toute proposition de modification.
- Consulter [`src/types/domain.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/domain.ts), [`src/types/database.types.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/database.types.ts), et la documentation dans [`docs/`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/docs).
- Vérifier l'architecture des composants et services existants dans `src/`.
- Vérifier les migrations dans `supabase/migrations/`.

### Étape 2 : UNDERSTAND (Compréhension & Alignement)
- Identifier les objectifs métier réels et les contraintes techniques associées.
- Vérifier les règles d'isolation multi-tenant et de sécurité applicables à la tâche.
- Ne pas assumer : si une exigence est ambiguë ou sous-spécifiée, demander confirmation.

### Étape 3 : PLAN (Planification & Minimal Change)
- Élaborer un plan précis identifiant les fichiers à modifier ou à créer.
- Suivre le principe du **changement minimal** : modifier uniquement les lignes strictement requises pour accomplir l'objectif.
- Préserver tous les contrats d'interface, commentaires pertinents et signatures de fonctions existantes.

### Étape 4 : IMPLEMENT (Implémentation Rigoureuse)
- Écrire un code TypeScript propre, fortement typé, sans `any` implicite ni explicite non justifié.
- Utiliser les briques existantes (design system, utilitaires `lib/`, services `services/`).
- Ne jamais coder en dur des données devant provenir de la base de données ou de la configuration.

### Étape 5 : TEST (Validation par les Tests)
- Lancer les tests unitaires et d'intégration pertinents.
- Exécuter la suite d'isolation RLS (`npm run test:rls`) lorsque le schéma, les politiques ou les services sont modifiés.
- Créer des tests de non-régression pour tout bug résolu.

### Étape 6 : VERIFY (Audits Automatiques)
- Exécuter les commandes de contrôle statique :
  - `npm run check:schema`
  - `npm run check:privileges`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run check:secrets`
- S'assurer qu'aucun warning ou erreur n'est introduit.

### Étape 7 : REPORT (Rapport Concis & Transparent)
- Fournir un compte-rendu clair et structuré des actions menées.
- Résumer les tests exécutés et leurs résultats.
- Préciser les étapes restantes ou recommandations éventuelles.

---

## 2. Règles Anti-Hallucination & Intégrité

L'agent IA doit respecter les interdictions strictes suivantes :

| Interdiction | Règle / Conséquence |
|---|---|
| **Ne jamais inventer une table ou colonne** | Tout champ ou table doit exister dans `supabase/migrations/` et être typé dans `database.types.ts`. Si une table manque, stopper et signaler l'absence. |
| **Ne jamais inventer un statut ou rôle** | Tout statut, rôle ou catégorie doit provenir de `src/types/domain.ts` ou d'une migration existante. |
| **Ne jamais inventer une API REST ou endpoint** | Le frontend communique directement avec PostgREST ou des Edge Functions Supabase déclarées. |
| **Ne jamais inventer une variable d'environnement** | Seules les variables documentées dans `.env.example` et validées dans `src/lib/env.ts` sont autorisées. |
| **Ne jamais masquer une erreur avec des mocks / fake data** | Une erreur backend doit afficher un état d'erreur explicite (`ErrorState`), jamais des données factices générées pour faire illusion. |
| **Ne jamais contourner la sécurité RLS** | Ne jamais utiliser `service_role` dans le client web ni désactiver une policy de sécurité pour "corriger" un affichage. |

---

## 3. Protection du Travail Existant & Changements Destructifs

1. **Confirmation préalable requise** : Demander l'accord explicite de l'utilisateur avant toute opération destructive (suppression de table/colonne, `git reset --hard`, suppression massive de fichiers, `db reset` sur environnement partagé).
2. **Préservation du code existant** : Ne jamais supprimer ou écraser de logique métier sans analyse d'impact préalable.
3. **Respect des conventions établies** : Suivre la structure des dossiers et les choix techniques arrêtés (Tailwind CSS v4, Radix UI, TanStack Query, Zod).
