# Schéma de données

19 tables, 22 types énumérés, 30 fonctions. Ordre d'application conforme à §45.

Ce document décrit les **intentions** ; les définitions font foi dans
`supabase/migrations/`. Les policies sont détaillées dans [RLS.md](./RLS.md).

---

## 1. Vue d'ensemble

```
                          organizations ──────── le tenant
                                │
        ┌───────────────┬───────┴───────┬────────────────┬──────────────┐
        │               │               │                │              │
 organization_    websites ── domains  subscriptions   support_    notifications
    members            │           │        │           tickets           │
        │              │           │     invoices          │              │
     profiles ─────────┴───────────┘        │        support_messages     │
        │                                payments          │              │
        └───────────────── audit_logs ───────┘      ticket_attachments ───┘

  plans ── plan_prices ── plan_features      stripe_webhook_events (fermée)
  quote_requests · contact_messages          (formulaires publics)
```

---

## 2. Conventions

**Identifiants** — `uuid` avec `gen_random_uuid()`. Intégré au cœur de
PostgreSQL depuis la version 13 ; aucune extension.

**Horodatages** — `timestamptz`, jamais `timestamp`. `updated_at` est tenu par
trigger : le maintenir depuis l'application est un pari perdu dès la première
correction manuelle en SQL.

**Montants** — `integer`, EN CENTIMES. Jamais de flottant sur de l'argent :
`0.1 + 0.2 ≠ 0.3` en binaire, et les écarts s'accumulent. C'est aussi la
représentation de Stripe, donc aucune conversion.

**Casse des énumérations**
- **minuscules** → valeur produite par Stripe, recopiée à l'identique
  (`subscription_status`, `invoice_status`, `payment_status`,
  `billing_interval`). Aucune couche de traduction, donc aucun point de dérive.
- **MAJUSCULES** → vocabulaire métier HBG Labs.

**Suppressions**
| Action | Usage |
|---|---|
| `CASCADE` | la donnée n'a aucun sens sans son parent (adhésions, messages) |
| `SET NULL` | la donnée survit à son parent (auteur d'un ticket, journal d'audit) |
| `RESTRICT` | la suppression doit échouer (factures, paiements : conservation légale) |

Conséquence assumée du `RESTRICT` : une organisation déjà facturée ne peut plus
être supprimée. Elle passe au statut `ARCHIVED` — comportement voulu.

---

## 3. Identité et tenant

### `profiles`
Extension applicative de `auth.users`, en 1-1, même clé primaire. Créée par le
trigger `handle_new_user`.

| Colonne | Note |
|---|---|
| `id` | = `auth.users.id`, cascade à la suppression du compte |
| `email` | copie dénormalisée : évite d'ouvrir le schéma `auth` aux clients |
| `platform_role` | **NULL = client.** Colonne la plus sensible du schéma |

`handle_new_user` ne lit que `full_name` dans les métadonnées d'inscription et
n'écrit **jamais** `platform_role` : `raw_user_meta_data` est entièrement
contrôlé par le client. Sans cette discipline, `signUp({ data: { platform_role:
'OWNER' } })` suffirait à devenir administrateur.

### `organizations`
Le tenant : une entreprise cliente. Toute donnée métier porte son
`organization_id`.

Informations légales toutes facultatives — une organisation est souvent créée à
la signature, avant réception du dossier administratif.

`stripe_customer_id` est unique et verrouillé par trigger : le réassigner
rattacherait les factures d'un client à un autre.

### `organization_members`
Table pivot interrogée par **chaque** policy du schéma. Un accès retiré passe à
`REVOKED` ; il n'est pas supprimé, pour que l'historique reste auditable. Seul
`ACTIVE` ouvre l'accès.

---

## 4. Catalogue (§7)

### `plans` · `plan_prices` · `plan_features`

Trois tables là où §45 en prévoyait une, parce que §7 exige « plans / prices /
features ».

**Pourquoi séparer le prix du plan.** Avec un `monthly_price_cents` porté par
`plans`, passer le tarif PRO de 49 € à 59 € réécrit la ligne : les clients déjà
abonnés à 49 € voient 59 € dans leur espace, et la page de facturation
contredit leur relevé bancaire. Une table de prix distincte permet de désactiver
l'ancien et d'en créer un nouveau. C'est aussi le modèle de Stripe.

Un index unique partiel garantit **un seul prix actif** par
(plan, nature, périodicité, devise).

`is_starting_price` porte la mention « à partir de » de §7 : le tarif de
création dépend du périmètre réel. L'interface **doit** l'afficher, sinon le
devis contredit le prix annoncé.

`recurring_interval`, et non `interval` : ce dernier est un nom de type
PostgreSQL, que l'analyseur traite comme tel dans une expression d'index.

Seules tables lisibles par `anon`, et uniquement sur les lignes publiques et
actives.

---

## 5. Sites et domaines

### `websites` (§16, §34)

Les champs de §34, plus ce que la page « Mon site » doit afficher.

**La règle du faux voyant, appliquée par contrainte.** §17 et §57 interdisent
d'annoncer « actif » sans vérification. Laisser cette règle au frontend, c'est
attendre qu'elle soit oubliée. Les contraintes CHECK rendent l'état incohérent
**impossible à écrire** :

```sql
(verification_source = 'NONE') = (checked_at is null)
verification_source <> 'NONE' or ssl_status = 'UNKNOWN'
```

Tant que la source vaut `NONE`, aucune donnée en base ne permet d'afficher un
voyant vert. Côté interface, `VerifiedStatusBadge` reçoit la source en propriété
obligatoire.

`uptime_percentage` reste NULL tant qu'aucune sonde n'existe : l'interface
masque la section, elle n'affiche pas 100 %.

Écriture réservée à HBG Labs. Le client consulte et passe par un ticket
`CHANGE_REQUEST` (§25) — ce qui supprime toute une classe de risques.

### `domains` (§17, §32)

Trois voyants distincts : `status`, `dns_status`, `ssl_status`, tous `UNKNOWN`
par défaut, tous soumis à la même contrainte de vérification.

`auto_renew` est **nullable** : NULL = réglage inconnu, distinct de `false` =
renouvellement désactivé. Un booléen non nullable écraserait cette différence et
afficherait « non » pour un domaine dont on ignore simplement le réglage.

Le domaine est unique à l'échelle de la plateforme : deux organisations
enregistrant le même nom traduiraient une erreur ou une tentative de
rattachement au domaine d'un autre client.

---

## 6. Facturation

### `subscriptions` (§18, §22, §30)

Miroir local de Stripe. **Aucune policy d'écriture, pour personne.**

`mrr_cents` est une colonne **générée** : le MRR ne peut pas diverger de
l'abonnement puisqu'il n'est jamais écrit. Périmètre retenu : `active` et
`past_due`.
- `trialing` exclu — aucun encaissement, l'inclure gonflerait le MRR d'essais qui
  ne se convertiront pas tous ;
- `past_due` inclus — le contrat court ; l'exclure ferait chuter le MRR au
  premier incident de paiement, avant même une relance.

Une facturation annuelle compte pour 1/12.

`stripe_event_at` sert à écarter les événements arrivés dans le désordre :
Stripe ne garantit pas l'ordre de livraison, et un `updated` ancien appliqué
après une annulation réactiverait l'abonnement.

### `invoices` (§23)

Le PDF **n'est pas stocké** : on conserve les URL Stripe. La facture reste
conforme si Stripe en corrige les mentions légales, aucune divergence n'est
possible, et il n'y a pas de document financier à sécuriser dans Storage.

FK vers `organizations` en `RESTRICT` : conservation légale de dix ans.

### `payments` (§23)

**Aucune donnée bancaire.** Ni PAN, ni cryptogramme (interdit par PCI-DSS y
compris chiffré), ni date d'expiration, ni nom du porteur, ni IBAN.

Seuls `card_brand` et `card_last4` — que PCI-DSS autorise et qui suffisent au
seul besoin réel : « Visa •••• 4242 ». Une contrainte impose exactement quatre
chiffres ; y glisser un PAN complet est refusé par la base.

Toute demande future d'ajout d'un champ bancaire doit être refusée. La réponse
est un identifiant de moyen de paiement Stripe (`pm_…`), qui désigne la carte
sans la contenir.

Les échecs sont conservés : sans trace, le support ne peut répondre à « mon
paiement ne passe pas » qu'en ouvrant Stripe.

---

## 7. Support (§24, §25)

### `support_tickets`

Assistance et demandes de modification sur une même table, distinguées par
`type` (`SUPPORT` / `CHANGE_REQUEST`) : même conversation, même RLS, même
historique.

`reference` — `HBG-000001`, généré par séquence. C'est ce que le client cite au
téléphone ; un UUID ne se dicte pas. Les trous sont normaux : une transaction
annulée consomme un numéro.

Seule table métier où le client écrit. L'écriture est bornée par
`guard_ticket_client_update` : il peut clore ou rouvrir sa demande, rien d'autre.
Sans cette garde, tous les tickets passeraient en URGENT.

Index partiel sur la file de traitement : les tickets clos en sont exclus,
l'index reste donc petit après des milliers de demandes traitées.

### `support_messages`

`is_internal_note` est **la colonne sensible du schéma**. La note vit sur la même
table qu'un message visible, dans un fil que le client a le droit de lire.
Double garantie : la policy de lecture exige `not is_internal_note`, la policy
d'insertion l'exige aussi.

`author_is_staff` est figé à l'insertion et déterminé côté serveur. Le recalculer
depuis `platform_role` ferait basculer les anciennes réponses d'un collaborateur
parti du côté « client », et le fil se relirait à l'envers.

Ni UPDATE ni DELETE : un fil réécrit a posteriori perd toute valeur en cas de
litige.

### `ticket_attachments`

`organization_id` dénormalisé et **recalculé par trigger** depuis le ticket : les
policies Storage ne voient que le chemin, dont il est le préfixe. Le trigger
vérifie aussi que `storage_path` commence bien par cet identifiant.

---

## 8. Notifications, audit, webhooks

### `notifications` (§26)

Une ligne **par canal**, non par événement : IN_APP et EMAIL ont chacun leur
cycle de vie. `group_key` les relie.

`type` est du texte, non une énumération — seule entorse du schéma. Les types
apparaissent au fil des fonctionnalités ; chaque ajout imposerait sinon une
migration pour un libellé.

Valeurs en usage : `PAYMENT_RECEIVED`, `INVOICE_AVAILABLE`, `TICKET_UPDATED`,
`TICKET_RESOLVED`, `MESSAGE_RECEIVED`, `MAINTENANCE_SCHEDULED`,
`INCIDENT_REPORTED`, `SUBSCRIPTION_CHANGED`, `PAYMENT_FAILED`.

`action_url` est un chemin interne, jamais une URL absolue : le domaine diffère
entre environnements.

### `audit_logs` (§44)

**Ajout seul.** Un journal modifiable ne prouve rien. Aucune policy INSERT,
UPDATE ni DELETE — OWNER plateforme compris.

`actor_email` et `actor_platform_role` sont figés au moment de l'action :
`actor_user_id` peut passer à NULL, et « qui était habilité à faire cela, à
cette date ? » ne se répond pas avec le rôle d'aujourd'hui.

Écriture par `log_audit_event()` uniquement, qui impose l'auteur depuis
`auth.uid()` — un paramètre `actor_id` permettrait d'attribuer une suppression à
un collègue.

`ip_address` est une donnée personnelle sous RGPD : nullable, renseignée
seulement pour les événements de sécurité, jamais exposée au client.

Actions en usage : `USER_SIGNED_IN`, `USER_SIGNED_OUT`, `PROFILE_UPDATED`,
`ORGANIZATION_UPDATED`, `MEMBER_INVITED`, `MEMBER_REMOVED`, `MEMBER_ROLE_CHANGED`,
`WEBSITE_CREATED`, `WEBSITE_UPDATED`, `DOMAIN_UPDATED`, `SUBSCRIPTION_CHANGED`,
`TICKET_CREATED`, `TICKET_STATUS_CHANGED`, `ADMIN_ACTION`.

### `stripe_webhook_events` (§21)

`event_id` en **clé primaire** : c'est la garantie d'idempotence. Stripe livre
au moins une fois, jamais exactement une fois. Sans registre, chaque relivraison
rejoue le traitement — deux enregistrements de paiement pour un encaissement,
deux emails, et une comptabilité qui diverge sans que personne ne s'en aperçoive
avant le rapprochement bancaire.

Séquence attendue de la fonction Edge (phase 10) :

1. **Vérifier la signature `stripe-signature`.** Sans signature valide : 400, et
   rien n'est écrit. N'importe qui connaît l'URL du webhook.
2. INSERT de l'événement. Conflit sur la clé primaire ⇒ déjà reçu ⇒ 200.
3. Traiter, puis `processed = true`.
4. En cas d'échec : renseigner `error`, incrémenter `attempts`, répondre 500 pour
   que Stripe rejoue.

La ligne est écrite **avant** le traitement : un enregistrement après coup ne
laisserait aucune trace des événements qui échouent — les seuls qui méritent
d'être examinés.

Table fermée : aucun accès applicatif, la charge utile contient des données
financières.

---

## 9. Formulaires publics

`quote_requests` (/devis) et `contact_messages` (/contact) — absentes de §45,
exigées par §4 et §5.

Seules tables où `anon` écrit. INSERT seulement, **jamais SELECT** : un
formulaire dont on peut relire les soumissions expose les coordonnées et les
projets de tous les prospects.

`guard_lead_rate_limit` : trois envois par email et par heure.

**Limite assumée** — sans adresse IP ni captcha, un robot déterminé passe en
changeant d'email. Le durcissement réel appartient à la phase 2, via une
fonction Edge ; la policy `anon` sera alors révoquée au profit de
`service_role`. Ce qui est en place bloque le spam opportuniste, pas une
campagne ciblée.

L'IP n'est pas collectée : un prospect n'est pas un utilisateur, il n'a accepté
aucune condition, et la conserver demanderait une base légale et une durée de
conservation que la V1 ne définit pas.

---

## 10. Étendre le schéma

Voir [RLS.md §7](./RLS.md#7-ajouter-une-table). En résumé : `organization_id`,
`enable` **et** `force row level security`, privilèges retirés à `anon`,
policies nommées, gardes par trigger pour les colonnes sensibles, mise à jour de
la matrice et des tests, puis `npm run check:schema`.
