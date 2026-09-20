# CLAUDE.md

## Ce projet

Budget tracker conversationnel. L'interface c'est Telegram — Hermes enregistre les dépenses via MCP et répond en jours de dette. Un dashboard Next.js visualise les données.

## Stack

- MCP Server : Python (mcp library)
- Dashboard : Next.js 14 App Router + TypeScript + Tailwind
- Source de vérité : `data/budget.json` (bind mount Docker)
- Docker Compose : 2 services (mcp + dashboard)

## Règles absolues

- Ne jamais écrire directement dans `budget.json` depuis le dashboard — lecture seule
- Toujours passer par le MCP server pour modifier les données
- Le bind mount `./data:/app/data` ne doit jamais être remplacé par un volume Docker nommé
- Pas de base de données — JSON suffit pour ce projet

## Logique métier — dette en jours

```python
# Plafond journalier fixe
plafond_jour = solde_depart / jours_dans_le_mois

# Après une dépense
depense_totale_jour = sum(depenses du jour)
depassement = depense_totale_jour - plafond_jour
dette_jours = depassement / plafond_jour  # peut être fractionnaire

# Jours bloqués = ceil(dette_jours)
# Le dernier jour bloqué peut être partiel (budget réduit)
```

## Outils MCP exposés

- `init_budget(solde, date_fin)` — initialise le budget du mois
- `add_expense(montant, description, date?)` — enregistre une dépense
- `get_status()` — retourne solde, budget aujourd'hui, jours bloqués
- `get_history(limit?)` — retourne l'historique des dépenses

## Structure des fichiers

```
mcp/server.py          # MCP server complet
mcp/Dockerfile
mcp/requirements.txt
dashboard/app/page.tsx           # page unique
dashboard/app/api/budget/route.ts # lit budget.json
dashboard/Dockerfile
data/budget.json                 # source de vérité
docker-compose.yml
```

## Format budget.json

```json
{
  "solde_depart": 248.0,
  "date_debut": "2026-09-19",
  "date_fin": "2026-09-30",
  "plafond_jour": 22.50,
  "depenses": [
    {
      "date": "2026-09-19",
      "montant": 45.12,
      "description": "Courses"
    }
  ]
}
```

## Commandes utiles

```bash
docker compose up --build    # lance tout
docker compose logs mcp      # logs du MCP server
docker compose logs dashboard # logs du dashboard
```

## Stratégie de test (TDD)

### Règle absolue
Pas de code de production sans test qui échoue en premier. Cycle RED → GREEN → REFACTOR.

### 4 layers de test

| Layer | Outil | Ce qu'on teste |
|---|---|---|
| Unitaire | `pytest` | Logique dette en jours, calculs |
| Intégration | `pytest` + JSON réel | MCP tools end-to-end, lecture/écriture |
| API | `curl` | Routes dashboard `/api/budget` |
| E2E | `browser_exec` (Playwright) | UI, calendrier, couleurs |

### Structure des tests

```
tests/
├── unit/
│   └── test_budget_logic.py    # calculs purs
├── integration/
│   └── test_mcp_tools.py       # outils MCP avec JSON réel
├── api/
│   └── test_dashboard_api.sh   # curl sur les routes
└── e2e/
    └── test_dashboard_ui.py    # Playwright via browser_exec
```

### Environnements

- **Preprod** : `docker compose -f docker-compose.preprod.yml up` — port 3001, données de test
- **Prod** : `docker compose up` — port 3000, données réelles

La preprod a son propre `data/budget.test.json` — jamais toucher aux données prod pour tester.

### Smoke tests post-deploy

```bash
curl -f http://localhost:3000/api/budget | jq '.solde_restant'
```
Si ça échoue → rollback immédiat.
