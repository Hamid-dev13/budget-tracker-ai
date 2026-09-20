---
name: issue-workflow
description: Workflow obligatoire pour toute feature, correction ou refacto sur budget-tracker-ai. Lire le board GitHub avant de toucher au code, ouvrir une issue, la passer In Progress, développer en TDD, puis la fermer en Done. À déclencher dès qu'on demande d'ajouter, corriger, modifier ou refactorer quelque chose dans ce projet — même pour une petite correction, et même si aucune issue n'est mentionnée.
---

# Workflow issue → TDD → Done

Le suivi vit dans le **GitHub Project 5** (`Hamid-dev13`), pas dans un fichier.
`tasks.md` ne fait que pointer vers lui. Aucun code ne part sans issue.

## 1. Lire le board — avant de toucher au code

```bash
gh issue list                                       # issues ouvertes
gh project item-list 5 --owner Hamid-dev13 --format json \
  | jq -r '.items[] | "#\(.content.number)\t\(.status)\t\(.content.title)"'
```

Si une issue ouverte couvre déjà la demande, la reprendre — ne pas en créer un doublon.

## 2. Ouvrir l'issue

Titre : `US-NN · <intitulé court>` pour une user story, sinon `fix: <intitulé>`.
`NN` = numéro suivant dans la série.

```bash
gh issue create \
  --title "US-10 · Titre de la feature" \
  --label "dashboard,user-story" \
  --body "$(cat <<'BODY'
## Objectif
<le résultat attendu, côté utilisateur>

## Tâches
- [ ] …

## Critères d'acceptation
- <vérifiable, pas « ça marche »>
BODY
)"
```

L'issue est ajoutée au board automatiquement. Vérifier qu'elle y est, sinon :

```bash
gh project item-add 5 --owner Hamid-dev13 --url <url-de-l-issue>
```

## 3. Passer In Progress — avant la première ligne de code

```bash
.claude/skills/issue-workflow/set-status.sh <numéro> "In Progress"
```

## 4. Développer en TDD

**Règle absolue de `CLAUDE.md` : pas de code de production sans test qui échoue
en premier.** Le cycle, par tâche cochée de l'issue :

1. **RED** — écrire le test, le lancer, *constater l'échec*. Un test qui passe
   du premier coup ne prouve rien : il faut l'avoir vu rouge.
2. **GREEN** — le minimum de code pour le faire passer.
3. **REFACTOR** — nettoyer, les tests restent verts.

Le layer se choisit selon ce qu'on touche (voir `CLAUDE.md` § Stratégie de test) :

| On touche à | Test à écrire d'abord |
|---|---|
| une règle de calcul | unitaire, `tests/unit` sur `budget-logic.ts` |
| le store, le service, un outil MCP | intégration, `tests/integration` sur un JSON jetable |
| une route `/api` | `tests/api`, puis recette curl sur le port 3002 |
| l'UI, la navigation, les couleurs | E2E Playwright (`browser_exec`) |

Un changement purement visuel sans assertion possible : le dire explicitement
dans l'issue plutôt que de sauter l'étape en silence.

Avant de déclarer fini :

```bash
cd dashboard && npm test && npx tsc --noEmit
```

## 5. Commit

Le commit référence l'issue — c'est ce qui relie le code au board.

```bash
git commit -m "feat(dashboard): <ce que ça change>

Refs #<numéro>"
```

`Closes #<numéro>` à la place de `Refs` si le commit termine l'issue.

## 6. Fermer en Done

Seulement quand les tests passent et que **tous** les critères d'acceptation
de l'issue sont vérifiés.

```bash
gh issue close <numéro> --comment "<ce qui a été livré, en une ligne>"
.claude/skills/issue-workflow/set-status.sh <numéro> Done
```

Un critère non tenu → l'issue reste ouverte et on dit lequel. Ne jamais fermer
une issue « à moitié faite » en promettant un suivi.

## Références du board

Project `PVT_kwHOCsrrg84BkEQ6` · champ Status `PVTSSF_lAHOCsrrg84BkEQ6zhi2QD4`
Options : `Todo` = `f75ad846`, `In Progress` = `47fc9ee4`, `Done` = `98236657`.
