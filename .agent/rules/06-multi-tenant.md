# 06 — Multi-Tenant Architecture & Data Isolation

Ce document établit les règles d'isolation étanche entre organisations clientes sur **HBG Labs Client Platform**.

---

## 1. Principe Fondamental : `Organization A ≠ Organization B`

Chaque organisation cliente constitue un tenant autonome et strictement isolé.

- **Règle d'or** : Un utilisateur appartenant à l'Organisation A ne doit **jamais** pouvoir lire, créer, modifier ou supprimer des données appartenant à l'Organisation B.
- **Défense en Profondeur** : Même si un utilisateur manipule les paramètres d'URL, falsifie une charge utile JSON ou interroge directement l'API PostgREST avec sa clé de session, PostgreSQL et la RLS doivent rejeter l'accès.

---

## 2. Modèle des Deux Axes de Rôles Disjoints

Pour éviter toute confusion entre l'équipe éditrice de la plateforme et les clients finaux :

```text
profiles.platform_role (Équipe HBG Labs)      organization_members.role (Clients)
───────────────────────────────────────      ───────────────────────────────────
  NULL      Client (aucun accès transversal)   OWNER    Dirigeant : membres + facturation
  SUPPORT   Support : tickets & messages       MANAGER  Gestionnaire : sites, sans facturation
  STAFF     Exploitation : sites, domaines     MEMBER   Consultant : lecture & tickets
  ADMIN     Administration complète
  OWNER     Direction HBG Labs
```

### Règles d'or :
1. Un utilisateur client a **toujours** `platform_role = NULL`.
2. Les collaborateurs de HBG Labs accèdent aux ressources via des politiques spécifiques (`is_platform_staff()`, `is_platform_admin()`), jamais en s'injectant dans l'organisation cliente.
3. Ne jamais utiliser un même champ ou énumération pour désigner à la fois le rôle interne et le rôle organisationnel.

---

## 3. Modèle d'Adhésion & Cycle de Vie (`organization_members`)

- **Statuts d'adhésion (`membership_status`)** :
  - `INVITED` : Invitation en attente d'acceptation.
  - `ACTIVE` : Seul statut ouvrant l'accès aux données de l'organisation.
  - `REVOKED` : Accès révoqué (l'enregistrement est conservé pour l'auditabilité de l'historique).
- **Triggers de protection d'appartenance** :
  - `guard_membership_keys` : Empêche la modification de `organization_id` ou `user_id` sur une ligne existante.
  - `guard_last_org_owner` : Empêche la révocation ou la rétrogradation du dernier OWNER actif d'une organisation.

---

## 4. Cloisonnement des Ressources Métier

Toute table liée à un tenant porte une clé étrangère non nullable `organization_id references public.organizations(id)` :
- `websites`
- `domains`
- `subscriptions`
- `invoices`
- `payments`
- `support_tickets`
- `ticket_attachments`

### Triggers d'Intégrité Inter-Tenant :
- `guard_domain_website_tenant` : Empêche de rattacher un domaine appartenant à l'Org A vers un site appartenant à l'Org B.
- `guard_ticket_website_tenant` : Empêche d'associer un ticket de support à un site d'un autre tenant.
- `stamp_attachment_organization` : Recalcule et force `organization_id` sur les pièces jointes à partir du ticket parent.

---

## 5. Cloisonnement Financier Spécifique

- Les tables financières (`invoices`, `payments`) sont strictement réservées au rôle `OWNER` de l'organisation (en plus du staff plateforme).
- Les membres de type `MEMBER` et `MANAGER` ne peuvent pas lire les factures ni les détails des paiements.
- `subscriptions` reste consultable par tous les membres actifs de l'organisation pour afficher l'offre courante sur le tableau de bord.

---

## 6. Tests d'Isolation Multi-Tenant Obligatoires

Chaque nouvelle entité ou modification de policy doit être validée par la suite Vitest RLS :

```bash
npm run test:rls
```

Chaque cas de test vérifie systématiquement le scénario croisé :
```text
User A (Org A) → Ressource Org A → AUTORISÉ (200 / Données renvoyées)
User A (Org A) → Ressource Org B → REFUSÉ (Tableau vide en SELECT, 42501 en écriture)
```
