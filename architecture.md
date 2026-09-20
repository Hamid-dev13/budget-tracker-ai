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
data/budget.json (source de vérité — bind mount host)
   |
   | (lecture)
   v
Dashboard (Next.js)
```

## Structure du projet

```
budget-tracker-ai/
├── mcp/
│   ├── server.py          # MCP server, 4 outils
│   ├── Dockerfile
│   └── requirements.txt
├── dashboard/
│   ├── app/
│   │   ├── page.tsx       # page unique
│   │   └── api/budget/
│   │       └── route.ts   # lit budget.json
│   ├── Dockerfile
│   └── package.json
├── data/
│   └── budget.json        # source de vérité
├── docker-compose.yml
├── intent.md
├── spec.md
├── architecture.md
├── plan.md
└── CLAUDE.md
```

## Composants

### MCP Server — Python
- Fichier unique `server.py`
- Expose 4 outils : `init_budget`, `add_expense`, `get_status`, `get_history`
- Lit et écrit `data/budget.json`
- Calcul de la dette en jours intégré

### Dashboard — Next.js
- Page unique avec 3 blocs :
  - Solde restant + budget du jour
  - Calendrier du mois (jours bloqués en rouge)
  - Historique des dépenses
- API route qui lit `data/budget.json`
- Refresh toutes les 30 secondes

### Source de vérité — budget.json
- Bind mount sur le host : `./data:/app/data`
- Survit aux rebuilds et suppressions de conteneurs
- Toujours écrit par le MCP, jamais par le dashboard

## Docker

```yaml
services:
  mcp:
    build: ./mcp
    volumes:
      - ./data:/app/data

  dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

## Architecture du code

Simple et plat — pas de clean architecture, pas de 3-tiers.
Séparation par feature : chaque dossier est autonome.
Quand on ajoute une feature (ex: connexion bancaire), on ajoute un dossier `integrations/` sans toucher au reste.

## Ce qui n'existe pas dans cette architecture

- Pas de base de données (JSON suffit)
- Pas d'authentification (usage solo)
- Pas de webhook Telegram (Hermes gère ça)
