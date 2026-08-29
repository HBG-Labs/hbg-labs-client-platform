# 04 — Supabase & PostgreSQL Standards

Ce document définit les règles de gestion de la base de données PostgreSQL 17, du moteur Supabase (PostgREST, Auth, Storage, Edge Functions) et des politiques de sécurité.

---

## 1. Migrations SQL Obligatoires

- **Emplacement des Migrations** : Toutes les modifications de schéma vivent exclusivement dans [`supabase/migrations/`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/supabase/migrations).
- **Format Horodaté** : `YYYYMMDDHHMMSS_nom_descriptif.sql` (ex. `20260828100000_init_enums.sql`).
- **Immutabilité** : Une migration déjà appliquée ou déployée en staging/production ne doit **jamais** être modifiée rétrospectivement. Toute modification ultérieure passe par une nouvelle migration additive.
- **Régénération des Types** : Après chaque migration, régénérer les types TypeScript avec :
  ```bash
  npm run db:types
  ```

---

## 2. Row Level Security (RLS) : `ENABLE` & `FORCE`

La sécurité par ligne est le pilier absolu de l'architecture.

1. **Activation et Forçage Systématiques** :
   Toute nouvelle table créée doit comporter immédiatement :
   ```sql
   alter table public.nouvelle_table enable row level security;
   alter table public.nouvelle_table force row level security;
   ```
2. **Double Barrière : Privilèges & Policies** :
   - Révoquer tous les privilèges par défaut à `anon` et `authenticated`.
   - Réattribuer uniquement les opérations nécessaires (ex. `grant select on public.nouvelle_table to authenticated`).
   - Nommer chaque policy selon la convention : `<table>_<opération>_<audience>` (ex. `websites_select_member`, `websites_all_platform_admin`).
3. **Interdiction de Désactiver la RLS** :
   Il est formellement interdit de désactiver la RLS ou de supprimer une policy pour contourner un problème de lecture/écriture dans le frontend.

---

## 3. Fonctions de Sécurité (`SECURITY DEFINER`)

- **Éviter la Récursion Infinie** : Les fonctions d'évaluation d'appartenance (`is_org_member`, `is_org_manager`, `is_org_owner`, `is_platform_staff`) sont déclarées en `SECURITY DEFINER` avec verrouillage explicite du chemin de recherche :
  ```sql
  create or replace function public.is_org_member(org_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  begin
    return exists (
      select 1 from public.organization_members
      where organization_id = org_id
        and user_id = auth.uid()
        and status = 'ACTIVE'
    );
  end;
  $$;
  ```
- **Le Piège de `current_user`** : Dans une fonction `SECURITY DEFINER`, `current_user` renvoie le propriétaire (superuser). Toute vérification d'identité ou de rôle d'appelant doit lire les revendications JWT (`request.jwt.claims`), comme implémenté dans `is_trusted_backend()`.

---

## 4. Triggers de Garde (Sécurité au Niveau Colonne)

La RLS s'appliquant par ligne entière, des triggers `BEFORE INSERT OR UPDATE` assurent la protection des colonnes sensibles :
- `guard_platform_role` : Empêche toute escalade vers un `platform_role` via l'API client.
- `guard_membership_keys` : Empêche le transfert d'une adhésion vers une autre organisation.
- `guard_last_org_owner` : Empêche de laisser une organisation sans aucun OWNER actif.
- `guard_stripe_customer_id` : Verrouille l'identifiant client Stripe d'une organisation.
- `guard_ticket_client_update` : Limite les modifications apportées par un client sur ses tickets.
- `stamp_message_author_role` : Détermine côté serveur si l'auteur d'un message est membre de l'équipe HBG Labs.
- `stamp_attachment_organization` : Valide et synchronise le préfixe de stockage d'une pièce jointe.

---

## 5. Intégrité Référentielle & Suppressions

| Action FK | Usage | Tables concernées |
|---|---|---|
| `CASCADE` | La donnée dépend entièrement de son parent | `organization_members`, `support_messages` |
| `SET NULL` | L'historique persiste même si le parent est supprimé | `support_tickets.assigned_to_user_id`, `audit_logs.actor_user_id` |
| `RESTRICT` | La suppression est interdite par obligation légale | `invoices`, `payments` |

---

## 6. Storage Supabase & Fichiers Privés

- **Tous les Buckets Sont Privés** : `org-logos`, `ticket-attachments`, `avatars`.
- **Cloisonnement par Préfixe** :
  - `org-logos/{organization_id}/...`
  - `ticket-attachments/{organization_id}/{ticket_id}/...`
  - `avatars/{user_id}/...`
- **Accès par URLs Signées** : Ne jamais exposer de fichiers privés via des URLs publiques statiques.

---

## 7. Commandes de Contrôle de Base de Données

```bash
npm run check:schema      # Analyse statique des migrations (RLS, contraintes, nommage)
npm run check:privileges  # Audit des privilèges réels de la base vs. attendus
npm run test:rls          # Suite de 136+ tests d'isolation multi-tenant contre Supabase
npm run db:types          # Régénération des types TypeScript
```
