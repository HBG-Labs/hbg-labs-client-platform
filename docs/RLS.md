# Row Level Security — modèle d'autorisation

Document de référence des politiques d'accès (§12, §36, §47).

**Règle de fond : ne jamais retirer une sécurité pour faire fonctionner le
frontend (§52).** Si un écran n'obtient pas ses données, la cause est dans la
requête ou dans le rôle de l'utilisateur — pas dans la policy.

---

## 1. Les deux axes de rôles

§13 énumère OWNER, ADMIN, CLIENT sans distinguer deux populations qui n'ont rien
de commun. Le schéma les sépare : c'est la décision qui structure toute
l'autorisation.

```
profiles.platform_role                organization_members.role
── équipe HBG Labs ──                 ── utilisateurs clients ──
  NULL     client, aucun accès          OWNER    dirigeant : membres +
           transversal                           facturation
  SUPPORT  tickets et messages          MANAGER  gestion opérationnelle,
  STAFF    exploitation : sites,                 sans facturation
           domaines, déploiements       MEMBER   consultation, création de
  ADMIN    administration complète               demandes
  OWNER    direction : seul à pouvoir
           attribuer un platform_role
```

Un client n'a **jamais** de `platform_role`. Un membre HBG Labs n'est **jamais**
rattaché à une organisation cliente : son accès passe par des policies
`is_platform_staff()` distinctes.

Sans cette séparation, « OWNER » désignerait à la fois le dirigeant d'une
boulangerie et la direction de HBG Labs — et la moindre confusion ouvrirait
l'ensemble des tenants.

---

## 2. Fonctions de sécurité

Définies dans `20260828100200_security_helpers.sql`. Toutes en `SECURITY
DEFINER` sauf mention contraire, avec `search_path` verrouillé.

| Fonction | Réponse |
|---|---|
| `is_org_member(uuid)` | membre actif de cette organisation |
| `is_org_manager(uuid)` | OWNER ou MANAGER de cette organisation |
| `is_org_owner(uuid)` | OWNER de cette organisation |
| `current_org_ids()` | organisations de l'utilisateur courant |
| `shares_organization_with(uuid)` | les deux utilisateurs ont une organisation commune |
| `is_platform_staff()` | appartient à l'équipe HBG Labs |
| `is_platform_admin()` | OWNER ou ADMIN plateforme |
| `is_platform_owner()` | OWNER plateforme |
| `current_platform_role()` | rôle plateforme, NULL si client |
| `is_trusted_backend()` | **INVOKER** — service_role ou connexion directe |

### Pourquoi SECURITY DEFINER

Une policy sur `organization_members` qui interroge `organization_members`
boucle : la sous-requête déclenche l'évaluation de la policy, qui relance la
sous-requête. PostgreSQL rend alors la table inutilisable
(`infinite recursion detected in policy`).

Ces fonctions s'exécutant avec les droits de leur propriétaire — superutilisateur,
non soumis à la RLS — la lecture interne ne redéclenche aucune policy.

### Le piège de `current_user`

Dans une fonction `SECURITY DEFINER`, `current_user` vaut le **propriétaire**,
pas l'appelant. Une garde qui s'y fierait considérerait n'importe quel client
comme un backend de confiance dès lors qu'elle serait appelée depuis un contexte
DEFINER.

`is_trusted_backend()` lit donc le rôle dans les revendications du JWT
(`request.jwt.claims`), qu'aucun changement de contexte de sécurité n'altère.

---

## 3. Matrice d'accès

Légende : **✓** autorisé · **—** aucun accès · **∅** aucune policy, pour personne

| Table | anon | MEMBER | MANAGER | org OWNER | SUPPORT/STAFF | ADMIN/OWNER plateforme |
|---|---|---|---|---|---|---|
| `plans` · `plan_prices` · `plan_features` | lecture publique | lecture | lecture | lecture | lecture totale | lecture + écriture |
| `profiles` | — | soi + collègues | soi + collègues | soi + collègues | lecture | lecture + écriture |
| `organizations` | — | lecture | lecture | lecture + écriture | lecture | lecture + écriture |
| `organization_members` | — | lecture | lecture | complet | lecture | complet |
| `websites` | — | lecture | lecture | lecture | lecture | lecture + écriture |
| `domains` | — | lecture | lecture | lecture | lecture | lecture + écriture |
| `subscriptions` | — | lecture | lecture | lecture | lecture | **lecture seule** |
| `invoices` | — | — | — | lecture | lecture | **lecture seule** |
| `payments` | — | — | — | lecture | lecture | **lecture seule** |
| `support_tickets` | — | lecture + création | idem | idem | complet | complet |
| `support_messages` | — | hors notes internes | idem | idem | complet | complet |
| `ticket_attachments` | — | lecture + ajout | idem | idem | complet | complet |
| `notifications` | — | les siennes | les siennes | les siennes | les siennes | + création |
| `audit_logs` | — | — | — | — | lecture | lecture |
| `stripe_webhook_events` | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ |
| `quote_requests` · `contact_messages` | **création seule** | — | — | — | lecture + suivi | lecture + suivi |

### Points à retenir

**Facturation réservée au dirigeant.** `invoices` et `payments` ne sont pas
lisibles par un MEMBER ni par un MANAGER : une facture révèle le chiffre engagé
par l'entreprise. `subscriptions` reste visible de tous — le tableau de bord
(§14) affiche l'offre et l'échéance.

**Tables financières en lecture seule pour tous.** Aucune policy d'écriture sur
`subscriptions`, `invoices`, `payments` — OWNER plateforme compris. Seul le
webhook Stripe (`service_role`, BYPASSRLS) écrit (§20, §22).

**`stripe_webhook_events` est fermée.** RLS activée sans aucune policy = refus
total, doublé du retrait des privilèges à `anon` et `authenticated`.

**`audit_logs` est en ajout seul.** Aucune policy INSERT/UPDATE/DELETE. L'écriture
passe par `log_audit_event()`, qui impose l'auteur réel depuis `auth.uid()`.

**`anon` écrit dans deux tables, sans jamais les relire.** Les formulaires
publics acceptent une insertion ; le fichier prospects reste invisible.

---

## 4. Ce que la RLS ne sait pas faire

La RLS raisonne par **ligne**. Elle ne dit pas « cette ligne est modifiable,
sauf cette colonne ». Les gardes ci-dessous couvrent ce que les policies
laissent passer — chacune porte sur une ligne que l'utilisateur a le droit de
modifier.

| Garde | Empêche |
|---|---|
| `guard_platform_role` | toute attribution hors `platform_access`, y compris par service_role |
| `guard_profile_email` | réécrire son adresse de profil pour viser la liste d'autorisation |
| `apply_platform_access` | (applique le rôle listé à l'inscription, source verrouillée) |
| `guard_membership_keys` | déplacer son adhésion vers un autre tenant |
| `guard_last_org_owner` | laisser une organisation sans OWNER, donc ingérable |
| `guard_stripe_customer_id` | rattacher les factures d'un client à un autre |
| `guard_ticket_client_update` | se donner la priorité URGENT, s'affecter un ticket, réécrire sa demande |
| `guard_notification_update` | modifier autre chose que `read_at` |
| `guard_domain_website_tenant` | rattacher un domaine au site d'une autre organisation |
| `guard_ticket_website_tenant` | idem pour un ticket |
| `stamp_message_author_role` | faire passer un message client pour une réponse HBG Labs |
| `stamp_attachment_organization` | écrire une pièce jointe hors de son préfixe Storage |
| `guard_lead_rate_limit` | plus de 3 envois par email et par heure sur les formulaires publics |

### Le drapeau `app.internal_ticket_update`

`bump_ticket_activity` remonte `last_activity_at`, `first_response_at` et
repasse un ticket `WAITING_CLIENT` en `OPEN` quand le client répond — trois
champs que `guard_ticket_client_update` interdit au client.

Un paramètre local à la transaction est posé juste avant cette mise à jour et
retiré aussitôt après. Un client ne peut pas le poser lui-même : PostgREST
n'expose que les paramètres `request.*` qu'il contrôle, et aucune fonction
publiée n'appelle `set_config`.

---

## 3bis. Qui peut atteindre l'administration

Un rôle plateforme ne s'attribue qu'à une adresse inscrite dans
`platform_access`, avec exactement ce rôle. Cette condition s'applique à
**tous**, y compris `service_role`.

| Mécanisme | Effet |
|---|---|
| `platform_access` | table sans policy ni privilège : invisible et inaccessible depuis l'application |
| `apply_platform_access` | applique le rôle autorisé à la création du profil, source verrouillée |
| `guard_platform_role` | refuse toute attribution hors liste ; le retrait reste ouvert à un OWNER |
| `guard_profile_email` | `profiles.email` devient immuable pour son porteur |

**Pourquoi le retrait échappe à la liste.** Un verrou qui rend la révocation
aussi difficile que l'attribution se retourne contre son propriétaire le jour
où il faut agir vite. Retirer un rôle reste donc ouvert à un OWNER et au
backend.

**Pourquoi l'adresse du profil est devenue immuable.** La liste raisonne sur
`profiles.email`, copie de `auth.users.email`. La policy `profiles_update_self`
laissait chacun réécrire sa propre ligne : cette copie serait devenue le maillon
faible du dispositif.

**Limite énoncée.** Qui détient `service_role` détient la base : il peut
modifier la liste ou supprimer le trigger. Aucune protection en base ne s'en
prémunit. Ce que ce dispositif apporte reste réel : une promotion silencieuse
depuis l'application devient une intervention délibérée sur le schéma.

Ajouter un collaborateur, depuis le SQL Editor Supabase :

```sql
insert into public.platform_access (email, role, note)
values ('collegue@exemple.fr', 'SUPPORT', 'Support client');

-- Si le compte existe déjà. Sinon, le rôle s'applique à l'inscription.
update public.profiles set platform_role = 'SUPPORT'
 where email = 'collegue@exemple.fr';
```

`npm run check:access` compare à tout moment les rôles détenus et les
autorisations.

---

## 4bis. Privilèges de table — la seconde barrière

Les policies décident QUELLES LIGNES un rôle atteint. Les privilèges décident
s'il peut émettre l'opération. Les deux sont nécessaires, et ils ne se
remplacent pas.

**Défaut trouvé après le premier déploiement.** Supabase pose
`alter default privileges ... grant all on tables to anon, authenticated` :
toute table naît avec tous les privilèges accordés aux deux rôles. Les
migrations 02 à 15 écrivaient `grant select ...` en croyant définir les
privilèges — un GRANT est additif, le surplus est resté. `authenticated`
détenait INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES et TRIGGER sur toutes
les tables, y compris `invoices`, `payments` et `audit_logs`.

Les 133 tests d'isolation passaient : la RLS bloquait bien les effets, et
aucune donnée n'a jamais été accessible. Mais **TRUNCATE n'est pas soumis à la
RLS** — c'est une commande de niveau table. Il n'y avait qu'une barrière là où
ce document en annonçait deux.

La migration 16 retire tout à `anon` et `authenticated` sur l'ensemble des
tables, réattribue explicitement le strict nécessaire, et modifie les
privilèges par défaut pour que les tables futures ne reproduisent pas le
problème.

`npm run check:privileges` interroge la base réelle et compare aux privilèges
attendus, dans les deux sens : un surplus (danger) comme un manque (une policy
qui ne s'appliquera jamais). Une analyse statique ne pouvait pas voir ce
défaut — il ne venait pas de ce que les migrations écrivent, mais de ce
qu'elles n'écrivent pas.

---

## 5. Storage

Trois buckets, tous **privés**. L'isolation repose sur le premier segment du
chemin — Storage ne connaît ni `organization_id`, ni RLS applicative.

```
org-logos/{organization_id}/logo-{uuid}.{ext}
ticket-attachments/{organization_id}/{ticket_id}/{uuid}-{nom}
avatars/{user_id}/avatar-{uuid}.{ext}
```

Les policies extraient ce segment et le confrontent à `is_org_member()`.
`safe_uuid()` renvoie NULL sur un chemin mal formé plutôt que de lever une
erreur : sans elle, un seul objet mal nommé rendrait le bucket entier illisible.

| Bucket | Lecture | Écriture | Limite |
|---|---|---|---|
| `org-logos` | membres, staff | org OWNER, admin | 2 Mio |
| `ticket-attachments` | membres, staff | membres, staff | 25 Mio |
| `avatars` | soi, collègues, staff | soi | 1 Mio |

Les fichiers se servent par **URL signée**, jamais par URL publique (§35).

---

## 6. Vérification

`npm run test:rls` — 6 fichiers, **147 tests**, exécutés contre une base réelle.
Tous passent sur le projet HBGLABS CLIENT PLATFORM.

| Fichier | Objet |
|---|---|
| `01-tenant-isolation` | matrice §47 sur chaque table, plus le cloisonnement interne (MEMBER vs OWNER) |
| `02-privilege-escalation` | les gardes de la section 4, chacune avec sa contre-épreuve |
| `03-financial-tables` | aucune écriture applicative, idempotence des webhooks, cohérence des montants |
| `04-support-confidentiality` | notes internes, périmètre de modification client |
| `05-public-surface` | ce qu'Internet atteint avec la seule clé anon |
| `06-platform-access` | verrou d'accès à l'administration, dans les deux sens |

Chaque interdiction est accompagnée d'une **contre-épreuve** : une garde qui
bloque tout passerait les tests de refus tout en rendant l'application
inutilisable.

### Lire un refus

Une policy SELECT ne lève pas d'erreur : elle rend la ligne **invisible**. Une
lecture interdite renvoie donc un tableau vide avec un statut 200 — comportement
voulu, car une erreur « accès refusé » confirmerait l'existence de la ligne.

Les refus d'écriture, eux, produisent un vrai code d'erreur :

| Code | Signification |
|---|---|
| `42501` | policy ou garde a refusé l'opération |
| `23514` | contrainte CHECK violée (rattachement inter-tenant, dernier OWNER) |
| `23505` | unicité violée (relivraison d'un webhook Stripe) |
| `54000` | limite de débit atteinte |

---

## 7. Ajouter une table

1. `organization_id uuid not null references public.organizations (id)`.
2. `enable` **et** `force row level security`.
3. `revoke all ... from anon` sauf besoin public explicite.
4. Accorder à `authenticated` uniquement les privilèges que les policies
   couvrent — pas de `delete` s'il n'existe aucune policy DELETE.
5. Une policy de lecture membre, une policy de lecture staff, des policies
   d'écriture selon le besoin réel.
6. Nommer `<table>_<opération>_<audience>`.
7. Si une colonne doit être protégée indépendamment de sa ligne : ajouter une
   garde par trigger — la RLS n'y suffira pas.
8. Ajouter la table à la matrice de la section 3 et à `tests/rls/`.
9. Ajouter la table à `EXPECTED` dans `scripts/audit-privileges.mjs`.
10. `npm run check:schema` puis `npm run check:privileges` avant de pousser.
