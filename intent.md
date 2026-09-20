# Intent

## Pourquoi ce projet existe

Suivre ses dépenses au quotidien est une friction. Les apps bancaires
donnent un solde mais pas une vision en jours. Les apps budget sont trop
complexes. Ce projet résout un problème simple : combien je peux dépenser
aujourd'hui sans compromettre le reste du mois.

## Ce qu'on construit

Un budget tracker conversationnel. L'interface principale c'est Telegram —
on envoie une dépense en langage naturel, l'agent la enregistre et répond
avec le solde en jours, pas en euros.

Un dashboard web vient par dessus pour visualiser : solde restant, jours
bloqués, historique des dépenses.

## Philosophie

- L'humain parle en jours, pas en euros
- Telegram est l'interface, pas une appli
- Le MCP server est la source de vérité
- Simple d'abord, connecté à la banque ensuite

## Ce qu'on ne construit pas (pour l'instant)

- Connexion bancaire automatique
- Multi-utilisateur
- Catégories de dépenses complexes
