# 03 — Frontend & UI Engineering Guidelines

Ce document détaille les standards de développement pour l'interface utilisateur, les composants React, l'accessibilité et le design system de **HBG Labs Client Platform**.

---

## 1. Principes React 19 & Gestion d'État

- **Composants Fonctionnels Purs** : Utiliser des composants fonctionnels TypeScript avec des props typées explicitement (`interface ComponentProps`).
- **TanStack Query (React Query v5)** :
  - Utiliser TanStack Query pour toute donnée distante (lecture avec `useQuery`, écriture avec `useMutation`).
  - Définir des clés de cache stables et hiérarchisées dans `src/features/<domaine>/<domaine>.keys.ts`.
  - Invalider les requêtes dépendantes lors des mutations réussies (`onSuccess`).
- **Gestion des 4 États Obligatoires** :
  Chaque composant ou page consommant des données asynchrones doit gérer distinctement les quatre états :

```tsx
if (isPending) {
  return <LoadingState message="Chargement des informations…" />;
}

if (isError) {
  return <ErrorState error={error} onRetry={() => refetch()} />;
}

if (!data || data.length === 0) {
  return (
    <EmptyState
      title="Aucun site configuré"
      description="Vous n’avez pas encore de site web associé à votre organisation."
      action={<Button onClick={handleCreate}>Créer un site</Button>}
    />
  );
}

return <WebsiteGrid websites={data} />;
```

---

## 2. Design System & Intégration Tailwind CSS v4

- **Jetons & Utilitaires Tailwind 4** : Utiliser les variables et classes utilitaires configurées dans `src/index.css`.
- **Composants UI Partagés (`src/components/ui/`)** :
  - `Button` : Support des variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`) et tailles (`sm`, `md`, `lg`).
  - `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` : Structure standard des blocs.
  - `StatusBadge` & `VerifiedStatusBadge` : Badges d'état standardisés.
- **Helper `cn()`** : Utiliser systématiquement l'utilitaire `cn(...)` (`clsx` + `tailwind-merge`) pour combiner et surcharger les classes CSS conditionnelles.

---

## 3. Règle Non Négociable du Statut Vérifié (Le « Faux Voyant »)

Conformément aux exigences de fiabilité et d'intégrité de la plateforme :

1. **Aucun voyant vert sans vérification externe réelle** :
   - Les tables `websites` et `domains` portent `verification_source` et `checked_at`.
   - Tant que `verification_source` vaut `'NONE'`, l'interface doit obligatoirement afficher **« Vérification non configurée »** (`UNVERIFIED_LABEL`).
   - Il est formellement interdit d'afficher un voyant vert « En ligne » ou « Actif » par défaut.
2. **Utilisation du composant dédié** :

```tsx
import { VerifiedStatusBadge } from '@/components/ui/StatusBadge';
import { isVerified } from '@/types/domain';

<VerifiedStatusBadge
  source={site.verification_source}
  checkedAt={site.checked_at}
  label="En ligne"
  tone="success"
/>
```

---

## 4. Affichage des Prix & Données Financières

- **Montants en Centimes** : Les montants stockés en base sont des entiers en centimes (`integer`). Ne jamais manipuler de nombres à virgule flottante pour les valeurs monétaires.
- **Formatage Standardisé** : Utiliser l'utilitaire de formatage (ex. `formatAmount(4900)` → « 49,00 € »).
- **Mention « À partir de »** : Si `is_starting_price = true` sur un prix, l'interface doit impérativement afficher la mention « À partir de ».
- **Pas de Prix en Dur** : Aucun montant ne doit être inscrit en dur dans le code d'un composant React.

---

## 5. Formulaires & Validation Zod

- **Combinaison React Hook Form + Zod** :
  - Schémas Zod centralisés dans `src/schemas/`.
  - Intégration via `@hookform/resolvers/zod`.
  - Messages d'erreur en français, explicites et orientés utilisateur.
- **Gestion des Soumissions** :
  - Désactiver le bouton de soumission pendant l'envoi (`isSubmitting` / `isPending`).
  - Afficher les erreurs de champ sous l'input avec `aria-invalid="true"` et `aria-describedby`.
  - Afficher une notification toast en cas de succès ou d'erreur globale.

---

## 6. Accessibilité (a11y) & Responsive Design

- **Mobile-First** : Toute interface doit être testée et fluide sur mobile (320px+), tablette et grand écran (tableaux transformés en cartes sur mobile, tiroirs de navigation latéraux).
- **Cibles Tactiles** : Taille minimale de 44 × 44 px pour tout élément interactif (boutons, liens, sélecteurs).
- **Structure Sémantique des Titres** :
  - Un seul `<h1>` par page.
  - Hiérarchie continue (`<h2>`, `<h3>`) sans saut de niveau.
- **Attributs ARIA** :
  - Icônes purement décoratives avec `aria-hidden="true"`.
  - Régions de chargement avec `role="status"` et messages d'erreur critiques avec `role="alert"`.
  - Lien d'évitement (*skip link*) présent dans `RootLayout` préservé en premier élément focalisable.
- **Navigation Clavier & Focus** :
  - Ne jamais supprimer le contour de focus (`focus-visible:ring-2`).

---

## 7. Langue & Typographie

- **Français Intégral** : Toute l'interface client et administrative est rédigée en français.
- **Vouvoiement** : Utiliser systématiquement le vouvoiement dans les libellés, invites et notifications.
- **Apostrophes Typographiques** : Utiliser le caractère `’` (apostrophe courbe) pour tout texte affiché plutôt que `'` (apostrophe droite).

---

## 8. Directives Anti-IA & Style Rédactionnel Authentique

Tout texte produit pour la plateforme (copies UI, pages publiques, messages d'état, emails, documentation) doit respecter ces règles strictes :

1. **Zéro tiret cadratin** : Ne jamais utiliser le tiret cadratin (`—` ou `–`) dans les textes de l'interface. Utiliser des virgules, deux-points ou parenthèses.
2. **Aucune formule réflexe « ce n'est pas X, c'est Y »** : Supprimer l'opposition systématique négation/correction. Affirmer directement les faits.
3. **Aucun émoji décoratif** : Bannir les émojis en tête de puce, dans les boutons ou en ponctuation d'interface.
4. **Pas de gras décoratif** : Bannir le surlignage typographique excessif qui dilue l'information.
5. **Rompre les groupes de trois systématiques** : Deux éléments percutants suffisent, éviter le rythme ternaire mécanique.
6. **Supprimer les précautions inutiles** : Éliminer les conditionnels d'évitement (« il est possible que », « dans certains cas »). Affirmer avec assurance ou s'abstenir.
7. **Varier le rythme et la longueur des phrases** : Alterner phrases courtes et développements précis sans blocs symétriques artificiels.
8. **Pas de reformulation perroquet** : Attaquer directement le contenu sans répéter la consigne ou la question.
9. **Vocabulaire naturel** : Bannir les tics d'IA (*explorons*, *plongeons*, *il convient de noter*, *paysage* au figuré).
10. **Design et données authentiques** : Aucun faux chiffre, aucun faux avis, aucun faux voyant vert sans vérification active (`isVerified`).
