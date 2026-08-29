# 10 — Production Readiness & Deployment Standards

Ce document définit les exigences opérationnelles, la gestion des environnements et la checklist de déploiement en production pour **HBG Labs Client Platform**.

---

## 1. Gestion des Environnements

Le projet distingue trois environnements étanches :

| Environnement | Rôle | Supabase | Stripe | Vercel |
|---|---|---|---|---|
| **Development** | Développement local et tests itératifs | Projet Dev (`eu-west-1` / `hbg-labs-dev`) | Mode Test (`sk_test_...`) | Localhost (`http://localhost:5173`) |
| **Preview / Staging** | Validation des PRs et tests d'intégration | Projet Staging dédié | Mode Test (`sk_test_...`) | URLs de Preview Vercel |
| **Production** | Environnement client final en ligne | Projet Production verrouillé | Mode Live (`sk_live_...`) | Domaine de production HBG Labs |

---

## 2. Configuration Vercel & SPA Routing

Le déploiement frontend sur Vercel est gouverné par [`vercel.json`](file:///c:/Users/HBZ/Documents/HBG%20LABS%20CLIENT%20PLATFORM/vercel.json) :
- **Build Command** : `npm run build` (déclenche `tsc -b`, `vite build`, et `check-bundle-secrets.mjs`).
- **SPA Rewrites** : Redirection de toutes les routes dynamiques `/(.*)` vers `/index.html`.
- **En-têtes de Sécurité Obligatoires** :
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- **Mise en Cache des Assets** : `/assets/(.*)` mis en cache immuable longue durée (`public, max-age=31536000, immutable`).

---

## 3. Checklist Complète de Déploiement en Production

Avant toute mise en production ou fusion sur la branche principale, chaque élément de cette liste doit être validé :

```text
[ ] Typecheck sans erreur (npm run typecheck)
[ ] Lint conforme aux standards (npm run lint)
[ ] Schéma et migrations vérifiés (npm run check:schema)
[ ] Privilèges SQL audités et conformes (npm run check:privileges)
[ ] Suite complète d'isolation multi-tenant au vert (npm run test:rls)
[ ] Tests unitaires et d'intégration validés (npm test)
[ ] Build réussi sans erreur (npm run build)
[ ] Zéro secret exposé dans le bundle dist/ (npm run check:secrets)
[ ] Clés Stripe en mode Live configurées exclusivement côté serveur (Edge Functions)
[ ] Webhook Stripe configuré avec validation de signature et idempotence active
[ ] RLS activée et FORCÉE sur 100% des tables
[ ] Aucune fausse donnée (fake data / mocks) dans le code de production
[ ] Supervision Sentry configurée sans fuite de DSN privé
[ ] Variables d'environnement Vercel et Supabase synchronisées et vérifiées
```

---

## 4. Gestion des Incidents & Procédure de Rollback

1. **Rollback Frontend Immédiat** :
   - En cas d'anomalie critique sur l'interface, utiliser le rollback instantané depuis le tableau de bord Vercel vers le déploiement précédent sain.
2. **Gestion des Migrations en Base** :
   - Les migrations de schéma doivent être conçues pour être **rétrocompatibles** avec la version N-1 du frontend.
   - Ne jamais supprimer de colonne ou renommer une table sans phase de transition préalable.
3. **Journalisation et Alertes** :
   - Tout événement de sécurité ou échec répété de webhook Stripe doit être consultable dans `audit_logs` et `stripe_webhook_events`.
