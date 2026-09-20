# Tasks

Le suivi vit dans le **GitHub Project** : https://github.com/users/Hamid-dev13/projects/5

Ce fichier ne liste plus les tâches — deux sources de vérité finissent toujours par
diverger, et c'est précisément le problème qu'on a corrigé dans le code (la logique
métier écrite deux fois, en Python et en TypeScript, avec deux résultats différents).

```bash
gh issue list                                    # les issues ouvertes
gh project item-list 5 --owner Hamid-dev13       # le board avec les statuts
```

## Où en est le projet

| Phase | État |
|---|---|
| Logique métier, API, MCP, dashboard | livré (#1 #2 #3 #5 #7) |
| Calendrier — reste le responsive mobile | en cours (#4) |
| Design — reste la validation visuelle | en cours (#6) |
| Connecter Hermes au MCP | en cours (#8) |
| Tests E2E Playwright | à faire (#9) |
