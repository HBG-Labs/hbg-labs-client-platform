# HBG Labs — Client Platform

Plateforme SaaS multi-tenant de HBG Labs : création de sites web, hébergement,
maintenance, gestion des domaines, abonnements, facturation et support client.

**En ligne : https://hbg-labs-client-platform.vercel.app**

**Statut : lots 1 à 8 livrés, plateforme déployée.** Schéma multi-tenant vérifié sur Supabase, site
public complet, authentification réelle, espace d'administration permettant de
créer un client de bout en bout, espace client affichant site et domaine, et
facturation Stripe raccordée du Checkout au webhook.

---

## Démarrage

```bash
npm install
cp .env.example .env     # PowerShell : Copy-Item .env.example .env
npm run dev
```

Sans projet Supabase configuré, l'application affiche un écran **Configuration
requise** plutôt qu'une interface peuplée de données fictives.

Marche à suivre complète : [docs/SETUP.md](./docs/SETUP.md).

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run verify` | schéma, privilèges, lint, types, tests, build, scan de secrets |
| `npm test` | tests de rendu des pages publiques |
| `npm run test:rls` | isolation multi-tenant, 182 tests (exige une base Supabase) |
| `npm run check:schema` | analyse statique des migrations, sans base |
| `npm run check:privileges` | privilèges réels de la base vs. attendus |
| `npm run db:push` | applique les migrations au projet lié |
| `npm run db:seed` | insère la grille tarifaire |
| `npm run db:types` | régénère les types TypeScript depuis la base |
| `npm run check:access` | qui peut atteindre l'administration |
| `npm run stripe:check` | écarts entre le catalogue en base et Stripe |
| `npm run stripe:sync` | publie les offres chez Stripe et écrit les identifiants |
| `npm run email:status` | canal courriel : état, file d'attente, échecs |
| `npm run email:on` / `email:off` | ouvre ou ferme le canal courriel |
| `npm run auth:check` | écarts de configuration Auth du projet distant |
| `npm run auth:sync` | aligne la configuration Auth sur le dépôt |

---

## Documentation

| Document | Contenu |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | vue d'ensemble, décisions structurantes, feuille de route |
| [DATABASE.md](./docs/DATABASE.md) | les 19 tables, leurs contraintes et le pourquoi |
| [RLS.md](./docs/RLS.md) | modèle d'autorisation, matrice d'accès, gardes |
| [CONTRACTS.md](./docs/CONTRACTS.md) | contrat backend ↔ frontend — **à lire avant de développer un écran** |
| [SETUP.md](./docs/SETUP.md) | installation, accès administrateur, déploiement, dépannage |

---

## Accès à l'administration

Une seule adresse est autorisée : **hbglabs@gmail.com**. Elle est inscrite dans
`platform_access`, table verrouillée et inaccessible depuis l'application.

Un rôle plateforme ne s'attribue qu'à une adresse figurant dans cette liste,
avec exactement ce rôle. La règle s'impose à tous, `service_role` compris : même
une session OWNER compromise ne peut promouvoir personne.

Le compte n'existe pas encore. Inscrivez-vous avec cette adresse et le rôle
s'appliquera automatiquement. Détail dans [SETUP.md §6](./docs/SETUP.md).

## Ce que contient le lot 9

*En cours. Première partie livrée : les courriels transactionnels.*

Courriels transactionnels (§26) :

- Fonction Edge `notifications-dispatch` : vide la file d'envoi via Resend,
  ordonnancée par `pg_cron` à l'intérieur de Supabase
- Les triggers de notification produisent une seconde ligne, canal EMAIL, dont
  le titre, le corps et le lien sont ceux de la cloche — une seule formulation,
  donc aucun risque que le courriel raconte autre chose
- `npm run email:status` montre l'état du canal, la file et les motifs d'échec

**Le canal est fermé par défaut, et l'interrupteur est en base.** La migration 18
refusait de créer des lignes EMAIL faute de service d'envoi : « laisserait croire
à des envois qui n'auront pas lieu ». Appliquer les migrations et configurer
Resend restent deux gestes distincts, parfois séparés de plusieurs semaines.
Tant que `platform_settings.email_delivery` vaut `off`, aucune ligne n'existe :
rien ne s'accumule, et l'ouverture n'expédie pas un arriéré de messages périmés.

`platform_settings` est une table fermée — aucun privilège pour `anon` ni
`authenticated`, RLS activée sans policy. Un réglage qui déclenche des envois
vers des adresses réelles n'a pas à être basculable depuis un navigateur, fût-ce
celui d'un administrateur.

**« Envoyé » ne veut pas dire « tenté ».** Le statut ne passe à `SENT` qu'après
acceptation par Resend. Un échec laisse une ligne `FAILED` avec son motif, et
`npm run email:status` en affiche les derniers.

**Un courriel périmé ne part pas.** Au-delà de vingt-quatre heures d'attente, la
ligne passe à `FAILED` sans être envoyée. Une panne de trois jours suivie d'une
reprise expédierait sinon « vous avez un nouveau message » pour des demandes
déjà closes : exact dans le contenu, faux dans le propos.

Un `revoke` qui ne révoquait rien a été trouvé en vérifiant plutôt qu'en
relisant, et corrigé par la migration 21 : sur PostgreSQL, retirer un privilège
à `PUBLIC` ne retire rien à un rôle qui le détient nommément — ce que font les
privilèges par défaut de Supabase pour `anon` et `authenticated`. Le `revoke`
n'échouait pas ; il ne faisait simplement rien.

## Ce que contient le lot 8

Facturation Stripe (§19 à §23, §30), de bout en bout :

- Trois fonctions Edge : ouverture d'une session Checkout, portail de
  facturation Stripe, et webhook qui alimente le miroir local
- Côté client, `/dashboard/facturation` : abonnement, prochaine échéance,
  factures téléchargeables et historique des paiements
- Côté HBG Labs, `/admin/abonnements` : contrats en cours, MRR et incidents de
  paiement
- `npm run stripe:sync` publie le catalogue en base vers Stripe, et écrit les
  identifiants en retour

**Le webhook est le seul chemin d'écriture.** `subscriptions`, `invoices` et
`payments` n'ont aucune policy d'écriture, pas même pour un OWNER plateforme :
c'était déjà vrai au lot 1, et rien n'a été assoupli pour livrer celui-ci. Une
correction se fait dans Stripe, jamais dans la base.

**L'écran ne conclut rien à la place de Stripe.** Au retour du paiement, le
webhook n'est pas encore arrivé : l'interface affiche « confirmation en cours »
et interroge la base jusqu'à ce que l'abonnement existe. Passé quatre-vingt-dix
secondes, elle cesse d'attendre et le dit — un paiement peut être refusé après
la redirection, et afficher « actif » sur la foi d'un retour d'URL serait faux.

**Le montant ne vient jamais du navigateur.** Le Checkout ne reçoit qu'un
identifiant de prix, relu en base à travers la RLS. Le serveur refuse en outre
les offres sur devis et les prix « à partir de » : un tarif non ferme ne peut
pas être prélevé.

Deux écarts assumés par rapport à la spécification, détaillés dans
[DATABASE.md](./docs/DATABASE.md) : un conflit d'idempotence ne suffit pas à
conclure qu'un événement a été traité, et un événement volontairement non
reflété est acquitté avec sa raison plutôt que rejoué indéfiniment.

**Le catalogue Stripe reste à publier.** Tant que `stripe_price_id` est NULL,
aucune offre n'est souscriptible et l'interface propose « Demander un devis ».
Marche à suivre dans [SETUP.md §8](./docs/SETUP.md).

**Ce qui n'est pas encore vérifié.** Le compte Stripe n'existe pas au moment de
la livraison : les trois fonctions Edge n'ont donc jamais été exécutées contre
l'API réelle, et aucun webhook n'a été reçu. Ce qui est vérifié l'est côté
application — 19 tests de rendu et de règles d'affichage — et côté base, où les
172 tests d'isolation confirment que les tables financières restent
inaccessibles en écriture. Le parcours complet se vérifie en suivant
[SETUP.md §8.6](./docs/SETUP.md), clés de test en main.

## Ce que contient le lot 7

Journal d'audit alimenté (§44) :

- Dix-neuf triggers PostgreSQL consignent les actions sensibles : connexions,
  accès à l'administration, rôles plateforme, clients, adhésions, sites,
  domaines, demandes, abonnements
- Écran `/admin/journal` avec filtre par type d'action et par auteur ; les
  gestes qui ouvrent l'accès aux données de tous les clients y sont signalés
- Chaque entrée porte l'auteur, son rôle et son organisation au moment de
  l'action, ainsi que la valeur d'avant et celle d'après

La table existait depuis le lot 1, protégée et documentée. Elle était vide.
Un journal inviolable qui n'enregistre rien offre exactement les mêmes
garanties que pas de journal, en donnant l'impression du contraire.

Les entrées naissent de triggers, non d'appels applicatifs. Un appel s'oublie,
se contourne, et surtout peut réussir l'action en ratant la trace : le trigger
vit dans la même transaction, si le journal échoue le changement échoue avec
lui.

**Pas d'adresse IP.** La colonne existe, §44 la demande « si légalement
approprié », mais un trigger ne connaît pas l'adresse de l'appelant et la
faire remonter par le navigateur reviendrait à journaliser une valeur
falsifiable. Une IP forgeable donnerait au journal une autorité qu'il n'a pas.

Trois défauts ont été trouvés en vérifiant plutôt qu'en relisant, tous
corrigés : les triggers rendaient toute suppression d'organisation impossible,
le balayage des tests annonçait des suppressions qui échouaient, et le
démontage nettoyait le journal après avoir perdu le moyen de le retrouver.

## Ce que contient le lot 6

Notifications en application (§26) :

- Cloche dans l'espace client et dans l'administration, avec compteur de non
  lues, panneau des vingt dernières et marquage « tout lu »
- Une demande ouverte, une réponse reçue, un statut qui change : chacun
  prévient la bonne personne, et personne d'autre
- Une **note interne ne notifie personne**. Le titre d'une notification
  apparaîtrait dans la cloche du client et trahirait l'existence d'une note que
  la policy lui cache : la confidentialité se perdrait par un canal détourné,
  sans qu'aucune policy soit violée
- Un émetteur ne se notifie jamais lui-même

Les notifications naissent de triggers PostgreSQL, non du navigateur. La policy
d'insertion réserve l'écriture aux administrateurs plateforme — un client ne
peut pas créer de notification pour HBG Labs, et c'est voulu. Émettre côté
serveur, à partir de l'événement lui-même, respecte cette règle et rend le
déclenchement impossible à oublier.

Le canal EMAIL reste inutilisé : aucun service d'envoi n'est raccordé. Créer des
lignes en attente laisserait croire à des envois qui n'auront pas lieu.

Dix tests d'isolation supplémentaires vérifient l'émission contre la vraie base,
dont la garde des notes internes — dégradée volontairement une fois pour
confirmer que le test la détecte.

## Ce que contient le lot 5

Demandes d'assistance et de modification (§24, §25, §31), de bout en bout :

- Côté client : liste des demandes, création avec les exemples du §25, fil de
  conversation, clôture et réouverture
- Côté HBG Labs : file de traitement signalant les demandes sans première
  réponse, fil de conversation, notes internes, priorité et statut
- Un seul service pour les deux côtés : c'est la RLS qui décide de ce que
  chacun reçoit, pas le code

Les notes internes ne peuvent pas fuir : la policy les écarte avant que la
réponse ne quitte PostgreSQL, et aucun filtre applicatif n'intervient.

## Ce que contient le lot 4

Espace d'administration (§27 à §32) et premiers écrans client (§16, §17) :

- Vue globale avec compteurs réels, et mention explicite là où un zéro traduit
  l'absence de Stripe plutôt qu'une absence de clients
- Clients : création, fiche détaillée, rattachement d'utilisateurs par adresse
- Sites et domaines : création et modification, avec sélection des sites
  restreinte au client concerné pour éviter tout rattachement inter-tenant
- Demandes reçues : les formulaires publics étaient jusqu'ici lisibles
  uniquement en SQL, cet écran les expose enfin
- Côté client, « Mon site » et « Domaine », où aucun voyant ne passe au vert
  sans vérification réelle
- Tableaux transformés en cartes sous 768 pixels (§40)

Le parcours complet est vérifié contre la base : un administrateur crée une
organisation, y rattache un utilisateur, ajoute un site et un domaine ; le
client les voit, un autre client ne les voit pas.

## Ce que contient le lot 3

Authentification Supabase (§9), sans aucune session simulée :

- Inscription avec confirmation d'adresse, connexion, déconnexion
- Mot de passe oublié, réinitialisation par lien, changement depuis les paramètres
- Session persistante alimentée par `onAuthStateChange`, cache vidé à la déconnexion
- Gardes de route `RequireAuth` et `RequireGuest`, distinguant « session en
  cours de résolution » de « non connecté »
- Tableau de bord affichant le profil et les rattachements réels, sans tuile fictive
- `sync-auth-config.mjs` : la configuration Auth du projet distant devient
  vérifiable, et sa dérive détectable

Deux règles de confidentialité sont appliquées et testées : le message d'échec
de connexion ne révèle jamais si un compte existe, et la demande de
réinitialisation répond la même chose pour une adresse inconnue.

## Ce que contient le lot 2

Site public complet (§5, §6, §41) :

- Landing page, pages services, création, hébergement, maintenance et tarifs
- Formulaires de devis et de contact **réellement fonctionnels**, écrivant dans
  Supabase par les policies vérifiées au lot 1
- Mentions légales, politique de confidentialité et conditions générales
- Navigation avec tiroir mobile, pied de page, 4 états UI sur chaque écran
- Référencement : titres, descriptions, Open Graph, canoniques, données
  structurées schema.org, sitemap et robots.txt générés au build
- Chargement paresseux par page : l'accueil ne télécharge pas les CGV

Deux écarts assumés par rapport au §6, détaillés plus bas : pas de section
témoignages, et mentions légales en attente de vos informations d'entreprise.

## Ce que contient le lot 1

- Projet Vite · React 19 · TypeScript · Tailwind 4, arborescence modulaire (§38)
- 16 migrations SQL : 19 tables, 22 types, 30 fonctions (§45)
  — 21 migrations et 40 fonctions aujourd'hui, lots 3 à 9 compris
  (le lot 8 n'a demandé aucune migration : le schéma financier l'attendait)
- RLS activée **et forcée** sur toutes les tables, 11 gardes par trigger
- Suite de 136 tests d'isolation multi-tenant (§47), tous au vert
  — 172 aujourd'hui, avec le verrou d'accès, les notifications et le journal
- Design system : jetons de couleur, `Button`, `Card`, `StatusBadge`, états
- Quatre gardes automatiques : secrets, environnement, schéma, privilèges (§36)
- Grille tarifaire réelle en base, jamais codée en dur (§7)

## Ce qu'il ne contient pas

Abonnements et facturation (Stripe), intégration Vercel, notifications par
courriel, journal d'audit alimenté. Rien de tout cela n'est esquissé ni simulé : conformément au §57,
une fonctionnalité absente est déclarée absente plutôt que maquettée.

## Trois points en attente de votre part

**Serveur SMTP.** Le service intégré de Supabase plafonne à deux courriels par
heure. Suffisant pour tester, insuffisant dès les premiers clients : chaque
inscription et chaque réinitialisation en consomme un. Resend est prévu au
lot 6, mais la limite s'applique dès maintenant.

**Informations d'entreprise.** `src/config/site.ts` attend la dénomination
sociale, la forme juridique, le SIRET, l'adresse du siège, le directeur de la
publication et l'adresse de contact. Tant qu'ils manquent, les pages légales
affichent un avertissement de publication incomplète au lieu d'informations
inventées. Ces mentions sont obligatoires avant toute mise en ligne publique.

**Section témoignages.** Le §6 la prévoit, elle n'existe pas : aucun avis client
réel n'est disponible, et en fabriquer contreviendrait au §57. La section
« Nos engagements » occupe cette place. Un test empêche qu'un faux témoignage
soit réintroduit par inadvertance.

---

## Vérification

Le schéma est appliqué sur le projet Supabase **HBGLABS CLIENT PLATFORM**
(PostgreSQL 17, eu-west-1) et la suite d'isolation y a été exécutée.

| Contrôle | Résultat |
|---|---|
| Application des 21 migrations sur base vierge | sans erreur |
| `npm run test:rls` : 182 tests, 9 fichiers | tous au vert |
| `npm test` : 91 tests de rendu, de gardes et de confidentialité | tous au vert |
| Écriture des formulaires depuis la clé anon | vérifiée contre la base réelle |
| Parcours d'authentification, 13 contrôles | vérifié contre la base réelle |
| Parcours administrateur, 19 contrôles | vérifié contre la base réelle |
| Verrou d'accès à l'administration, 11 tests | vérifié contre la base réelle |
| Émission des notifications, 37 contrôles | vérifiée contre la base réelle |
| Journal d'audit : émission, contenu et surface d'écriture | vérifiés contre la base réelle |
| Aucun résidu laissé par la suite en base | vérifié après exécution |
| Parcours des demandes, 25 contrôles | vérifié contre la base réelle |
| `npm run auth:check` | configuration Auth conforme |
| `npm run check:privileges` | conforme, aucun surplus ni manque |
| `npm run check:schema` | RLS activée et forcée sur 21/21 tables |
| `npm run verify` | lint, types, build, aucun secret dans le bundle |

### Un défaut trouvé et corrigé

L'audit des privilèges réels a révélé que `authenticated` détenait INSERT,
UPDATE, DELETE, TRUNCATE, REFERENCES et TRIGGER sur toutes les tables —
y compris celles documentées en lecture seule. Cause : Supabase accorde tout
par défaut, et un `GRANT` est additif, il ne retire rien.

Aucune donnée n'a jamais été exposée : la RLS bloquait les effets, ce que les
133 tests d'alors confirmaient. Mais **TRUNCATE échappe à la RLS**, et il n'y
avait donc qu'une barrière là où la documentation en annonçait deux.

Corrigé par la migration 16, et désormais surveillé en continu par
`npm run check:privileges`. Détail dans [RLS.md §4bis](./docs/RLS.md).
