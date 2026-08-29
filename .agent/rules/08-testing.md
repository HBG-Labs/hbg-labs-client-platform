# 08 — Testing, Verification & Quality Assurance

Ce document définit les standards de test, la suite d'isolation multi-tenant et les outils de vérification automatisée de **HBG Labs Client Platform**.

---

## 1. Commandes de Test & Vérification

Toutes les commandes sont définies dans [`package.json`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/package.json) :

| Commande | Action & Périmètre | Dépendance externe |
|---|---|---|
| `npm run verify` | Pipeline complet : schéma + privilèges + lint + types + build + scan de secrets | Projet Supabase lié (pour l'audit des privilèges) |
| `npm run typecheck` | Compilation TypeScript stricte sans émission (`tsc -b --noEmit`) | Aucune |
| `npm run lint` | Analyse statique du code (`eslint .`) | Aucune |
| `npm test` | Suite de tests unitaires et d'intégration applicatifs (`vitest run`) | Aucune |
| `npm run test:rls` | Suite complète d'isolation multi-tenant (136+ tests) | Projet Supabase de développement |
| `npm run check:schema` | Contrôle statique des 16 migrations (RLS, triggers, conventions) | Aucune |
| `npm run check:privileges` | Vérification des privilèges SQL réels accordés vs attendus | Projet Supabase lié |
| `npm run check:env` | Validation de la configuration et des variables d'environnement | Aucune |
| `npm run check:secrets` | Scan anti-fuite de secrets dans le dossier `dist/` | Après build |

---

## 2. Suite d'Isolation Multi-Tenant (`tests/rls/`)

La suite de tests RLS (`vitest.rls.config.ts`) est le garant absolu de la sécurité des données. Elle s'articule autour de 5 modules clés :

1. **`01-tenant-isolation.test.ts`** :
   - Vérifie la matrice d'accès sur toutes les tables.
   - Contrôle le cloisonnement entre organisations distinctes (`Org A` vs `Org B`).
   - Valide les niveaux d'accès internes (`MEMBER` vs `MANAGER` vs `OWNER`).
2. **`02-privilege-escalation.test.ts`** :
   - Tente les vecteurs d'attaque et d'escalade de privilèges (modification de `platform_role`, transfert d'adhésion, falsification d'auteur).
   - Valide l'efficacité des triggers de garde.
3. **`03-financial-tables.test.ts`** :
   - Vérifie l'interdiction d'écriture applicative sur `subscriptions`, `invoices`, `payments`.
   - Contrôle l'idempotence des événements webhooks.
4. **`04-support-confidentiality.test.ts`** :
   - Vérifie que les notes internes (`is_internal_note = true`) sont invisibles pour les clients.
   - Valide les droits de création et de clôture de tickets.
5. **`05-public-surface.test.ts`** :
   - Vérifie ce qu'un visiteur non authentifié (`anon`) peut lire et écrire.
   - S'assure que les formulaires de devis/contact n'exposent pas les soumissions antérieures.

---

## 3. Règle des Contre-Épreuves Obligatoires

Chaque test d'interdiction de sécurité doit impérativement être assorti de sa **contre-épreuve positive** :
- *Test d'interdiction* : Vérifie qu'un utilisateur non autorisé est bloqué (erreur 42501 ou tableau vide).
- *Contre-épreuve* : Vérifie qu'un utilisateur dûment habilité accède avec succès à la même ressource.

*Justification* : Une règle de sécurité défaillante qui bloquerait 100% des requêtes passerait tous les tests négatifs tout en rendant la plateforme inutilisable.

---

## 4. Tests de Non-Régression

- Tout bug identifié et corrigé doit obligatoirement donner lieu à l'écriture d'un test automatisé reproduisant le cas limite avant correction.
- Ne jamais clore une anomalie sans avoir enrichi la suite de tests correspondante.
