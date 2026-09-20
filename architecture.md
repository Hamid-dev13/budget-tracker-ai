# Architecture

## Vue d'ensemble

```
Telegram
   |
   | (messages naturels)
   v
Hermes Agent
   |
   | (appels MCP)
   v
MCP Server (Python)
   |
   | (lecture/écriture)
   v
budget.json (source de vérité)
   |
   | (lecture)
   v
Dashboard (Next.js)
```

## Composants

### MCP Server — Python
- Fichier unique `server.py`
- Expose 4 outils : `init_budget`, `add_expense`, `get_status`, `get_history`
- Lit et écrit `/opt/data/budget/budget.json`
- Calcul de la dette en jours intégré

### Dashboard — Next.js
- Page unique avec 3 blocs :
  - Solde restant + budget du jour
  - Calendrier du mois (jours bloqués en rouge)
  - Historique des dépenses
- Lit les données via une API route qui pointe sur `budget.json`
- Refresh toutes les 30 secondes

### Source de vérité — budget.json
- Un seul fichier JSON
- Structure : solde, plafond/jour, dépenses[]
- Toujours écrit par le MCP, jamais par le dashboard

## Ce qui n'existe pas dans cette architecture

- Pas de base de données (JSON suffit)
- Pas d'authentification (usage solo)
- Pas de webhook Telegram (Hermes gère ça)
