# 09 — Git & Version Control Guidelines

Ce document régit les pratiques de gestion de version, de structuration des branches et de formatage des commits sur **HBG Labs Client Platform**.

---

## 1. Format des Messages de Commit (Conventional Commits)

Les messages de commit doivent être clairs, concis et respecter le standard *Conventional Commits* :

```text
<type>(<scope optionnel>): <description courte et impérative en anglais ou français>

[Corps explicatif optionnel détaillant le pourquoi et les choix de conception]
```

### Types Autorisés :

| Préfixe | Usage & Exemple |
|---|---|
| `feat` | Nouvelle fonctionnalité (`feat: add client organization switcher`) |
| `fix` | Correction d'anomalie (`fix: prevent cross-tenant access in tickets service`) |
| `security` | Durcissement ou correctif de sécurité (`security: harden organization authorization triggers`) |
| `test` | Ajout ou mise à jour de tests (`test: add subscription checkout webhook tests`) |
| `refactor` | Refactorisation sans changement de comportement (`refactor: simplify billing query hooks`) |
| `docs` | Documentation technique (`docs: update database schema overview`) |
| `chore` | Tâches de maintenance, dépendances, scripts (`chore: update eslint rules`) |

---

## 2. Règle Anti-Fuite de Données & Fichiers Ignorés

- **Aucun Secret dans Git** : Ne jamais commiter de fichier `.env`, de clé privée, de jeton d'accès ou de mot de passe de base de données.
- **Vérification `.gitignore`** : Vérifier que les répertoires `node_modules/`, `dist/`, `.env`, `.env.local` et `.temp/` sont bien ignorés.
- **Revue Systématique du Diff** : Avant tout commit, inspecter attentivement le diff (`git status`, `git diff`) pour vérifier qu'aucun fichier indésirable ou modification accidentelle n'est inclus.

---

## 3. Intégrité des Branches & Respect de l'Historique

- **Interdiction des Changements Destructifs Sans Accord** : Ne jamais exécuter de commande destructive (`git reset --hard`, `git push --force`, `git clean -fdx`) sans l'accord préalable explicite de l'utilisateur.
- **Principe du Changement Minimal** : N'inclure dans un commit que les modifications directement liées à la tâche en cours. Éviter de reformater des fichiers entiers non concernés.
- **Migrations SQL Immuables** : Une fois commitée et partagée, une migration SQL ne doit plus être modifiée. Tout correctif fait l'objet d'une nouvelle migration chronologique.
