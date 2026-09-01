# Exploitation

Ce que l'on fait quand quelque chose ne va pas, et dans quel ordre.

Ce document s'adresse à la personne qui exploite la plateforme, pas à celle qui
la développe. Il part des **symptômes** — ce qu'un client signale, ce qu'un
écran affiche — et non de l'architecture.

---

## 1. Avant toute mise en production

```bash
npm run preflight -- --prod
```

Le script exécute les suites, lit la configuration réelle et énumère ce qu'il ne
peut pas voir. Il sort en erreur au premier point bloquant.

Les lignes marquées `·` sont **manuelles**, et ce n'est pas un détail : le script
ne prétend pas les avoir vérifiées. Une checklist qui afficherait « vérifié » sur
ce qu'elle n'a pas vu vaudrait moins que pas de checklist — elle ajouterait la
certitude à l'ignorance.

---

## 2. Retour arrière

### 2.1 Le frontend

Tableau de bord Vercel → Deployments → le déploiement sain précédent →
**Promote to Production**. L'opération prend quelques secondes et ne touche pas
à la base.

C'est le premier geste face à une anomalie d'interface. Diagnostiquer d'abord et
revenir ensuite inverse l'ordre des priorités : le client attend, pas le
diagnostic.

### 2.2 La base

**Il n'y a pas de retour arrière de migration.** C'est délibéré, et cela impose
une discipline en amont : chaque migration doit rester compatible avec la
version du frontend DÉJÀ EN LIGNE.

Concrètement : ajouter une colonne, oui. En supprimer ou en renommer une,
jamais en une seule fois — le déploiement du frontend et celui de la base ne
sont pas simultanés, et pendant l'intervalle l'un des deux parlerait d'une
colonne que l'autre ignore.

Une colonne se retire en trois temps, séparés par des déploiements :

1. le frontend cesse de la lire ;
2. la colonne devient nullable, ou cesse d'être écrite ;
3. une migration ultérieure la supprime.

### 2.3 Ce qui ne se rejoue pas

Un courriel parti est parti. Un prélèvement effectué se rembourse dans Stripe,
il ne s'annule pas en base. Les tables financières n'ont aucune policy
d'écriture, y compris pour vous : **toute correction se fait dans Stripe**, et
le webhook la propage.

---

## 3. Par symptôme

### « Je n'ai pas reçu le courriel »

```bash
npm run email:status
```

| Ce que montre la commande | Cause | Geste |
|---|---|---|
| Canal fermé | Le canal n'a jamais été ouvert | `npm run email:on` |
| File qui grossit | La tâche `pg_cron` ne tourne plus | Rejouer `docs/SETUP.md` §9.3 |
| Échecs avec un motif | Resend refuse | Lire le motif : domaine non vérifié, adresse invalide |

Un message resté plus de vingt-quatre heures en file passe à `FAILED` sans être
envoyé. Ce n'est pas une panne : passé ce délai, « vous avez un nouveau
message » désigne une demande souvent déjà close, et un courriel exact dans son
contenu serait faux dans son propos.

Les notifications en application, elles, ne dépendent d'aucun envoi : le client
les voit dans sa cloche même si le courriel n'est jamais parti.

### « J'ai payé et mon abonnement n'apparaît pas »

L'écran de facturation affiche « Confirmation en cours » pendant quatre-vingt-dix
secondes, puis dit que la confirmation tarde. C'est le comportement attendu : le
webhook arrive de façon asynchrone.

Au-delà, vérifier dans l'ordre :

1. **Stripe → Developers → Webhooks → l'endpoint → Deliveries.**
   Une réponse 400 signale une signature invalide : `STRIPE_WEBHOOK_SECRET` ne
   correspond pas à l'endpoint. Une 500 signale un échec de traitement.

2. **Le registre local.**

   ```sql
   select event_id, event_type, processed, attempts, error, created_at
     from stripe_webhook_events
    order by created_at desc
    limit 20;
   ```

   `processed = false` avec un `error` : le motif est écrit là. `error`
   renseigné avec `processed = true` n'est pas une panne — c'est un événement
   volontairement non reflété, et le texte dit pourquoi.

3. **Les journaux de la fonction.**

   ```bash
   npx supabase functions logs stripe-webhook
   ```

Stripe rejoue automatiquement les événements en échec pendant plusieurs jours.
Un correctif déployé suffit donc souvent : l'événement suivant repartira, et le
traitement reprendra là où il s'était arrêté.

**Ne jamais corriger la ligne d'abonnement à la main.** Un abonnement passé à
`active` en base produit un client qui accède au service sans que Stripe ne
prélève rien. L'écart ne se voit nulle part et se découvre au rapprochement
comptable, des mois plus tard.

### « Mon site affiche Vérification non configurée »

Le site n'a pas de `vercel_project_id`, ou la fonction n'a jamais tourné.

```bash
npx supabase functions logs vercel-refresh
```

« Projet Vercel introuvable » : l'identifiant est erroné, ou le projet
appartient à une autre équipe que `VERCEL_TEAM_ID`.

Si l'API Vercel répond mal, la ligne n'est pas touchée et l'affichage reste sur
« non configuré ». C'est voulu : une panne de notre côté ne doit pas afficher
une alerte rouge sur le site d'un client dont tout va bien.

### « Je vois les données d'un autre client »

**Incident de sécurité. Priorité absolue.**

1. Relever précisément ce qui a été vu, et par qui ;
2. lancer `npm run test:rls` — 190 contrôles rejouent chaque garantie
   d'isolation ; si l'un tombe, il nomme la policy en cause ;
3. consulter le journal d'audit :

   ```sql
   select created_at, action, actor_email, actor_platform_role, organization_id
     from audit_logs
    order by created_at desc
    limit 100;
   ```

4. si la faille est confirmée, retirer l'accès avant de corriger :

   ```sql
   update organization_members set status = 'REVOKED' where user_id = '...';
   ```

Aucun test d'isolation n'est tombé à ce jour. Si l'un tombe, il désigne la
règle exacte qui a cédé — c'est la raison d'être de cette suite.

### « Tout est cassé depuis le déploiement »

1. **Revenir en arrière** (§2.1). Diagnostiquer ensuite.
2. Console du navigateur : une violation de politique de sécurité du contenu
   apparaît sous la forme `Refused to connect to ...`. Si l'origine est
   légitime, elle manque dans `vercel.json`.
3. Sentry, si le DSN est configuré, porte l'erreur et sa pile.
4. Une page qui affiche « Cette page n'a pas pu se charger » plutôt que
   « page introuvable » signale un morceau de code disparu : un onglet resté
   ouvert pendant un déploiement. Le rechargement suffit, et rien n'est cassé.

---

## 4. Requêtes d'exploitation

```sql
-- Qui a accès à l'administration, et depuis quand
select p.email, p.platform_role, p.created_at
  from profiles p
 where p.platform_role is not null
 order by p.created_at;

-- Actions sensibles des dernières 24 heures
select created_at, action, actor_email, resource_type
  from audit_logs
 where created_at > now() - interval '24 hours'
 order by created_at desc;

-- Abonnements en incident de paiement
select o.name, s.status, s.current_period_end, s.mrr_cents
  from subscriptions s
  join organizations o on o.id = s.organization_id
 where s.status in ('past_due', 'unpaid')
 order by s.current_period_end;

-- Demandes clients sans première réponse
select t.reference, o.name, t.created_at
  from support_tickets t
  join organizations o on o.id = t.organization_id
 where t.first_response_at is null
   and t.status not in ('RESOLVED', 'CLOSED')
 order by t.created_at;
```

---

## 5. Rotation des secrets

Un secret exposé — dans un dépôt public, une capture d'écran, un journal — doit
être **révoqué**, pas seulement retiré. Le retirer ne le rend pas invalide.

| Secret | Où le régénérer | Où le redéposer | Effet du délai |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `.env`, secrets de fonctions, Vault (`service_role_key`) | Les tâches `pg_cron` échouent |
| `STRIPE_SECRET_KEY` | Stripe → API keys | `supabase secrets set` | Le paiement et le portail échouent |
| `STRIPE_WEBHOOK_SECRET` | Stripe → l'endpoint → Signing secret | `supabase secrets set` | Tous les événements sont rejetés en 400 |
| `RESEND_API_KEY` | Resend → API Keys | `supabase secrets set` | La file de courriels s'accumule puis expire |
| `VERCEL_TOKEN` | Vercel → Tokens | `supabase secrets set` | L'état des sites cesse d'être rafraîchi |

`VITE_SUPABASE_ANON_KEY` et `VITE_SENTRY_DSN` sont **publics par conception** :
ils sont inscrits en clair dans le bundle, et leur divulgation n'est pas un
incident. C'est la RLS qui protège les données, jamais le secret de la clé anon.

Après toute rotation :

```bash
npx supabase functions deploy stripe-webhook
npx supabase functions deploy notifications-dispatch
npx supabase functions deploy vercel-refresh
npm run preflight -- --quick
```

---

## 6. Sauvegardes

Supabase sauvegarde quotidiennement sur les offres payantes ; la restauration
dans le temps (PITR) est une option distincte, à activer explicitement.

**Une sauvegarde jamais restaurée n'est pas une sauvegarde.** L'essai de
restauration se fait sur un projet distinct, jamais sur celui de production, et
mérite d'être refait après tout changement structurant du schéma.

Ce que la restauration ne couvre pas : Stripe, Resend et Vercel ont leur propre
état. Restaurer la base à hier ne défait pas un prélèvement d'aujourd'hui — le
miroir local se reconstruira à partir des événements Stripe, qui font autorité.

---

## 7. Environnements

Le marqueur `platform_settings.environment` voyage avec la base. Une base
marquée `production` refuse la suite de tests d'isolation, qui crée et détruit
des comptes.

```sql
-- À exécuter UNE FOIS sur le projet de production
update platform_settings set value = 'production' where key = 'environment';
```

Ce marqueur double le garde-fou local `VITE_APP_ENV`, et le double pour une
raison précise : `VITE_APP_ENV` décrit l'intention du poste de travail, pas
l'identité de la base visée. Copier l'URL et la clé de service de la production
dans un `.env` resté en `development` suffirait à contourner le premier
contrôle. Le second, lui, tient quelle que soit la machine.

---

## 8. Dérive entre le dépôt et la base

**Symptôme.** `npx supabase migration list` affiche des lignes où une seule des
deux colonnes est remplie :

```text
20260831215000   local ✔   distant ✖    → écrite, jamais appliquée
20260901014306   local ✖   distant ✔    → appliquée, jamais écrite
```

**Cause, dans les deux cas : l'éditeur SQL du tableau de bord Supabase.** Le SQL
qu'on y exécute est enregistré dans l'historique des migrations sous un
horodatage inventé sur le moment, et n'existe nulle part dans le dépôt. Le
raccourci est tentant — la correction est immédiate, et elle marche.

Ce qu'il coûte se voit plus tard : une installation neuve ne reproduit plus la
production, le changement n'a été ni relu ni testé, et le prochain `db push`
peut le défaire sans prévenir. Ce dernier point est le plus vicieux : si un
fichier local pose un prix à 490 € et qu'une correction manuelle l'a porté à
580 €, appliquer la migration locale ramène silencieusement 490 €.

**Diagnostic.** Lire ce qui a réellement été exécuté :

```sql
select version, name, array_to_string(statements, ' ;; ')
  from supabase_migrations.schema_migrations
 where version > '<dernière version connue du dépôt>'
 order by version;
```

Puis comparer l'état réel de la base avec ce qu'affirme le fichier local. C'est
la comparaison qui tranche, pas la lecture des deux SQL côte à côte : seule
compte la question « appliquer ce fichier changerait-il quelque chose ? ».

**Réparation, une fois la réponse connue.**

*Si l'état de la base correspond déjà au fichier local* — le fichier a été mis à
jour après coup pour intégrer les corrections manuelles — il n'y a rien à
exécuter, seulement un registre à remettre d'aplomb :

```bash
npx supabase migration repair --status applied  <version-locale>
npx supabase migration repair --status reverted <versions-orphelines>
```

`migration repair` n'exécute ni n'annule aucun SQL : il ne touche que la table
`supabase_migrations.schema_migrations`. C'est de la comptabilité, et elle se
refait dans l'autre sens si l'on s'est trompé.

*Si l'état diverge*, ne rien réparer : transcrire d'abord le changement manquant
dans une nouvelle migration datée, l'appliquer par `db push`, et seulement
ensuite aligner le registre.

**Vérifier.** `npx supabase migration list` ne doit plus afficher aucune ligne à
une seule colonne.

**Éviter.** Toute modification de schéma ou de catalogue passe par un fichier de
migration et par `npm run db:push`. L'éditeur SQL reste précieux pour LIRE —
c'est d'ailleurs par lui qu'on diagnostique — et pour les gestes documentés qui
n'ont pas leur place dans une migration, comme marquer une base « production »
ou programmer une tâche `pg_cron` dont l'URL dépend du projet.
