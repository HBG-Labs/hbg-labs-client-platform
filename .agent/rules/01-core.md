# 01 — Core Engineering Standards

Ce document régit les standards généraux de qualité, de structure logicielle et d'écriture TypeScript sur **HBG Labs Client Platform**.

---

## 1. Principes Fondamentaux de Conception

- **KISS (Keep It Simple, Stupid)** : Privilégier la solution la plus simple, lisible et directe. Éviter toute sur-ingénierie ou abstraction prématurée.
- **DRY (Don't Repeat Yourself)** : Factoriser le code dupliqué au bon niveau d'abstraction (utilitaires partagés dans `src/lib/`, composants réutilisables dans `src/components/ui/`, hooks dans `src/features/`). Ne pas sur-factoriser deux logiques qui n'ont qu'une ressemblance fortuite.
- **YAGNI (You Aren't Gonna Need It)** : Ne pas développer de fonctionnalités spéculatives ou d'options d'extension non requises par la spécification actuelle.

---

## 2. Standards TypeScript Strict

Le projet est configuré en mode TypeScript strict (`tsconfig.app.json`).

### 2.1 Typage Strict & Zéro `any`
- **Interdiction du type `any`** : Tout type doit être explicitement défini.
- Si le type d'une donnée externe est inconnu, utiliser `unknown` combiné avec un schéma de validation Zod ou un *type predicate* TypeScript (`value is T`).
- Ne jamais désactiver les contrôles du compilateur avec `@ts-ignore` ou `as any`. Utiliser `@ts-expect-error` uniquement dans les tests de comportement négatif avec un commentaire explicatif.

```ts
// ✗ Interdit
function parsePayload(data: any) {
  return data.amount;
}

// ✓ Recommandé
function parsePayload(data: unknown): number {
  const result = paymentPayloadSchema.safeParse(data);
  if (!result.success) {
    throw new Error('Format de charge utile invalide');
  }
  return result.data.amount;
}
```

### 2.2 Utilisation des Types de Domaine & Types Générés
- Importer les énumérations et statuts métier depuis [`src/types/domain.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/domain.ts).
- Utiliser les types de tables et de vues générés depuis [`src/types/database.types.ts`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/src/types/database.types.ts) (`Tables<'nom_table'>`, `TablesInsert<'nom_table'>`, `TablesUpdate<'nom_table'>`).
- Ne jamais redéfinir localement une interface qui existe déjà dans les types générés ou de domaine.

---

## 3. Nommage & Lisibilité

- **Code & Identifiants** : Anglais technique strict pour les noms de variables, fonctions, classes, interfaces, fichiers et composants (`useOrganizationBilling`, `SupportTicketCard`, `fetchActiveWebsites`).
- **Textes d'Interface & Libellés Métier** : Français soigné, vouvoiement systématique, apostrophes typographiques (`’`), import des libellés centralisés depuis `domain.ts`.
- **Fonctions & Méthodes** : Noms verbeux et explicites décrivant l'action (`getPlanBySlug`, `verifyDomainOwnership`, `createSupportTicket`).
- **Booléens** : Préfixés par un auxiliaire (`isVerified`, `hasActiveSubscription`, `canManageBilling`).

---

## 4. Fonctions & Modularité

- **Responsabilité Unique (SRP)** : Chaque fonction doit accomplir une seule tâche bien délimitée.
- **Fonctions Courtes** : Viser des fonctions compactes (< 30-40 lignes en moyenne). Si une fonction devient trop longue, découper en sous-fonctions privées ou utilitaires purs.
- **Immutabilité** : Privilégier les structures immutables, les méthodes de tableau non mutatives (`map`, `filter`, `reduce`, `toSorted`) et les objets en lecture seule (`as const`, `Readonly<T>`).

---

## 5. Gestion Rigoureuse des Erreurs

- **Erreurs Typées & Explicites** : Ne jamais ignorer silencieusement une erreur (`catch (e) {}` vide est formellement proscrit).
- **Propagation Contrôlée** : Dans les services et hooks, transformer les erreurs techniques en messages compréhensibles ou laisser TanStack Query propager l'état d'erreur vers l'UI.
- **Codes d'Erreur Supabase / PostgreSQL** : Gérer explicitement les codes documentés :
  - `42501` : Droits insuffisants (RLS / privileges)
  - `23505` : Violation d'unicité
  - `23514` : Violation de contrainte CHECK
  - `PGRST116` : Aucun résultat sur requête unitaire (état vide, pas une erreur fatale)

---

## 6. Propreté de la Base de Code

- **Pas de Dead Code** : Supprimer tout code inutilisé, imports orphelins et variables mortes. ESLint et TypeScript sont configurés pour les détecter.
- **Pas de Code Commenté** : Ne pas laisser de blocs de code en commentaire dans le repository. L'historique Git conserve l'état antérieur.
- **Dépendances Maîtrisées** : Ne pas installer de nouvelles dépendances npm sans justification claire. Vérifier d'abord si les dépendances existantes (Radix UI, TanStack Query, Zod, Lucide, Tailwind) ne couvrent pas déjà le besoin.
