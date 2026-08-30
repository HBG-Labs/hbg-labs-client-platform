# Contrat backend ↔ frontend

Document destiné à **Gemini** (§51) et à toute personne développant l'interface.

> §51 — « Ne pas inventer : tables, colonnes, endpoints, statuts, données
> Stripe. Si une donnée backend manque : STOPPER l'implémentation de cette
> partie et signaler clairement ce qui manque. »

---

## 1. Où trouver la vérité

| Question | Source |
|---|---|
| Quels statuts, rôles, catégories existent ? | `src/types/domain.ts` — écrit à la main, commenté |
| Quelles colonnes a cette table ? | `src/types/database.types.ts` — **généré**, `npm run db:types` |
| Qui a le droit de lire quoi ? | [RLS.md](./RLS.md) |
| Pourquoi cette table est faite ainsi ? | [DATABASE.md](./DATABASE.md) |
| Comment interroger la base ? | `src/services/*.service.ts` |

`domain.ts` fait autorité sur le **vocabulaire**, `database.types.ts` sur la
**forme des lignes**. Ne recopiez jamais une valeur de statut à la main : importez
le type.

```ts
// ✗ Non
const status: string = 'ACTIVE';

// ✓ Oui
import type { SubscriptionStatus } from '@/types/domain';
const status: SubscriptionStatus = 'active'; // minuscule : casse Stripe
```

---

## 2. Il n'y a pas d'API REST à écrire

Le frontend parle **directement à PostgREST** via `supabase-js`. La sécurité
n'est pas dans un contrôleur : elle est dans les policies RLS.

Conséquence pratique : **ne filtrez pas par `organization_id` pour des raisons de
sécurité.** La base le fait déjà, et le dupliquer donne l'impression que
l'isolation dépend de votre requête. Filtrez pour la pertinence, jamais pour la
protection.

```ts
// ✗ Faux sentiment de sécurité — et faux tout court : orgId vient du client
await supabase.from('websites').select('*').eq('organization_id', orgId);

// ✓ La RLS ne renvoie que ce à quoi l'utilisateur a droit
await supabase.from('websites').select('*');
```

---

## 3. Les cinq règles qui ne se négocient pas

### 3.1 Aucun voyant vert sans vérification (§17, §57)

Sites et domaines portent `verification_source` et `checked_at`. Tant que la
source vaut `'NONE'`, l'interface affiche **« Vérification non configurée »** —
jamais « actif », jamais un point vert.

Utilisez le composant, il applique la règle :

```tsx
import { VerifiedStatusBadge } from '@/components/ui/StatusBadge';

<VerifiedStatusBadge
  source={site.verification_source}   // propriété OBLIGATOIRE
  checkedAt={site.checked_at}
  label="En ligne"
  tone="success"
/>
```

Pour un état interne (ticket, abonnement), `StatusBadge` suffit — il n'est
soumis à aucune vérification externe.

### 3.2 Les prix viennent de la base (§7)

Aucun montant en dur dans un composant. Un tarif figé dans le JavaScript
continuerait d'annoncer l'ancien prix longtemps après un changement, et le
Checkout facturerait autre chose que ce que le client a lu.

Montants **en centimes**, entiers. `formatAmount(4900)` → « 49,00 € ».

`is_starting_price` impose la mention « à partir de ».

### 3.3 Le frontend ne décide pas d'un paiement (§20)

Ni « le paiement a réussi », ni « l'abonnement est actif », ni « la facture est
payée ». Ces états viennent de Stripe, par le webhook. Les tables
correspondantes sont en lecture seule — une écriture serait refusée.

Après un retour de Checkout, l'abonnement peut ne pas encore être `active` : le
webhook arrive de façon asynchrone. Afficher « en cours de confirmation » et
laisser TanStack Query rafraîchir.

### 3.4 Une erreur s'affiche (§57)

« Ne pas masquer une erreur backend avec des données de démonstration. »

Trois états, jamais un seul :

```tsx
if (isPending) return <LoadingState />;
if (isError)   return <ErrorState error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState title="…" />;
```

Un tableau vide et une requête en échec ne se ressemblent pas et ne s'affichent
pas pareil.

### 3.5 Aucun secret côté client (§36)

Seules les variables `VITE_` existent dans le navigateur, et elles sont
**publiques**. La clé `anon` en fait partie : c'est normal, la RLS protège les
données, pas le secret de cette clé.

Ne cherchez jamais à lire `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`VERCEL_TOKEN` ou `RESEND_API_KEY` depuis `src/`. Le build échouerait —
`scripts/check-env.mjs` et `scripts/check-bundle-secrets.mjs` y veillent.

---

## 4. Ce qui n'existe pas encore

Signalez plutôt que d'inventer (§51). État après le lot 2 :

| Besoin | État | Lot |
|---|---|---|
| Site public, formulaires devis et contact | **livré** | 2 |
| Authentification, session, garde de routes | **livré** | 3 |
| Espace d'administration, écrans site et domaine | **livré** | 4 |
| Demandes d'assistance et de modification | **livré** | 5 |
| Abonnement et facturation côté client | **absent** | 5 |
| Checkout Stripe, Customer Portal | **absent** | 5 |
| Webhook Stripe | **absent** | 5 |
| Envoi d'emails (Resend) | **absent** | 6 |
| Intégration Vercel (statut réel des sites) | **absent** | 7 |
| Upload de pièces jointes | schéma et buckets prêts, pas de composant | 4 |
| Catalogue Stripe (`stripe_price_id`) | **NULL en base** | 5 |

**Conséquence immédiate du dernier point :** aucune offre n'est souscriptible en
ligne aujourd'hui. `isPurchasable(plan)` renvoie `false` partout. Un bouton
« Souscrire » mènerait à une erreur Stripe. Afficher « Demander un devis » tant
que la fonction renvoie `false`.

---

## 4bis. Ce que le lot 2 met à disposition

Réutilisez ces briques plutôt que d'en écrire de nouvelles.

| Brique | Emplacement | Usage |
|---|---|---|
| `Container`, `Section`, `SectionHeading` | `components/ui/Layout` | rythme et largeurs de page |
| `Field` + `Input`, `Textarea`, `Select` | `components/ui/` | champs de formulaire câblés ARIA |
| `Alert` | `components/ui/Alert` | message contextuel, `role` adapté au ton |
| `Accordion`, `AccordionItem` | `components/ui/Accordion` | repli natif `details`, indexable |
| `Seo` | `components/Seo` | titre, description, canonique, Open Graph |
| `localBusinessSchema`, `faqSchema` | `lib/structured-data` | données structurées schema.org |
| `site`, `missingLegalFields` | `config/site` | identité et mentions légales |
| `mainNav`, `footerNav` | `config/navigation` | structure de navigation |
| `DataTable` et ses cellules | `components/ui/Table` | tableau devenant cartes sous 768 px |
| `Dialog`, `DialogContent` | `components/ui/Dialog` | modale Radix, focus piégé |
| `AdminPageHeader` | `layouts/AdminLayout` | en-tête d'écran d'administration |
| `TicketConversation` | `components/tickets/` | fil de demande, client et admin |
| `NotificationBell` | `components/notifications/` | cloche, compteur et panneau |

### Un service, deux publics

`tickets.service.ts` sert l'espace client et l'administration avec les mêmes
requêtes. La RLS décide de ce que chacun reçoit : le client ne reçoit pas les
notes internes parce que `support_messages_select_member` impose
`not is_internal_note`, pas parce qu'un filtre applicatif les écarte.

Reprenez ce modèle. Écrire deux services aurait dupliqué la logique et créé un
endroit où l'oubli d'un filtre exposerait une note interne.

### Notifications : l'application lit, elle n'écrit pas

`notifications.service.ts` expose la lecture, le compteur de non lues et le
marquage « lu ». Il n'y a **pas de fonction d'émission**, et il ne doit pas y
en avoir : les notifications naissent de triggers PostgreSQL, à partir de
l'événement lui-même.

Deux raisons. La policy d'insertion réserve l'écriture aux administrateurs
plateforme, ce qui interdit à un client de notifier HBG Labs. Et un
déclenchement côté serveur ne s'oublie pas : toute écriture dans
`support_messages`, d'où qu'elle vienne, produit sa notification.

Pour notifier sur une nouvelle ressource, ajoutez un trigger dans une
migration. N'appelez jamais `emit_notification` depuis le navigateur :
`EXECUTE` en est révoqué, l'appel échouera.

Le canal EMAIL existe dans le schéma mais reste inutilisé tant qu'aucun service
d'envoi n'est raccordé. `fetchNotifications` filtre donc sur `IN_APP` : afficher
une ligne EMAIL en attente laisserait croire à un envoi qui n'aura pas lieu.

### Formulaires : le piège de la chaîne vide

Un champ non rempli est enregistré par React Hook Form comme `''`, jamais
comme `undefined`. Envoyée telle quelle, cette chaîne vide viole les
contraintes de longueur minimale des colonnes facultatives et fait échouer
l'insertion.

`optionalText()` dans `src/schemas/lead.schema.ts` normalise le vide en
`undefined` avant validation. Reprenez ce helper pour tout champ facultatif.

Les messages d'erreur doivent être écrits pour le cas du champ vide : c'est
`min()` qui se déclenche alors, jamais `required_error`.

---

## 4ter. Session et autorisation

```ts
import { useAuth } from '@/features/auth/auth-context';
import { useProfile, useMyOrganizations } from '@/features/auth/useProfile';

const { user, isLoading, signOut } = useAuth();   // identité GoTrue
const { data: profile } = useProfile();           // profil métier, platform_role
const { data: memberships } = useMyOrganizations();
```

**Traitez toujours `isLoading` séparément de « non connecté ».** Une garde qui
confond les deux éjecte l'utilisateur vers la connexion à chaque rechargement,
avant que la session stockée n'ait été relue.

**`RequireAuth` et `RequireGuest` règlent l'affichage, pas l'autorisation.**
Elles évitent un écran vide, rien de plus, et se contournent en modifiant le
JavaScript de la page. La protection réelle vient des policies RLS : sans
session valide, PostgREST ne renvoie aucune ligne.

Corollaire : `useIsPlatformStaff()` sert à masquer une entrée de menu, jamais à
décider d'un accès.

**Ne jamais fabriquer de session.** Aucun contournement de développement
n'existe dans ce dépôt, et il ne doit pas en apparaître (§9).

---

## 5. Modèle de service

Les composants n'écrivent pas de requêtes Supabase. Elles vivent dans
`src/services/`, les hooks dans `src/features/<domaine>/`.

Voir `src/services/plans.service.ts` et `src/features/pricing/usePublicPlans.ts`
comme référence.

```
src/services/xxx.service.ts     requêtes + types de retour + aides métier
src/features/xxx/useXxx.ts      hook TanStack Query, clés de cache
src/pages/XxxPage.tsx           composition, états, mise en page
```

Clés de cache regroupées par domaine, pour rester invalidables :

```ts
export const pricingKeys = {
  all: ['pricing'] as const,
  publicPlans: () => [...pricingKeys.all, 'public-plans'] as const,
};
```

---

## 6. Codes d'erreur

| Code | Sens | Affichage attendu |
|---|---|---|
| `42501` | policy ou garde a refusé | « Vous n'avez pas les droits nécessaires » |
| `23514` | contrainte CHECK violée | message métier — souvent une incohérence de saisie |
| `23505` | unicité violée | « Cette valeur existe déjà » |
| `54000` | limite de débit | « Trop de demandes, réessayez plus tard » |
| `PGRST116` | aucune ligne sur `.single()` | état vide, pas une erreur |

Une lecture refusée par la RLS ne produit **pas** d'erreur : elle renvoie un
tableau vide. Ne concluez pas d'un `[]` que la donnée n'existe pas — elle peut
exister sans vous être accessible.

`ErrorState` traduit déjà `42501`.

---

## 7. Accessibilité et responsive (§40, §43)

- Mobile d'abord. Barre latérale → tiroir, tableaux → cartes.
- Cibles tactiles ≥ 44 px : `size="md"` sur `Button` y pourvoit.
- Un seul `<h1>` par page, hiérarchie de titres continue (`CardTitle` accepte
  `as="h2" | "h3" | "h4"`).
- Toute icône décorative porte `aria-hidden="true"`.
- Tout état de chargement porte `role="status"`, toute erreur `role="alert"`.
- Le lien d'évitement existe déjà dans `RootLayout` : ne pas le déplacer, il doit
  rester le premier élément focalisable.
- Ne jamais supprimer l'anneau de focus. `:focus-visible` le réserve déjà à la
  navigation clavier.

---

## 8. Textes

Interface entièrement en **français**. Vouvoiement. Apostrophes typographiques
(`’`) dans les textes affichés.

Les libellés de statut sont dans `domain.ts` — ne les réécrivez pas :

```ts
import { TICKET_STATUS_LABELS } from '@/types/domain';
TICKET_STATUS_LABELS[ticket.status];  // « En attente de votre réponse »
```
