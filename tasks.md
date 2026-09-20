# Tasks

## En cours

### Phase 1 — MCP Server

- [ ] US-01 · Créer `mcp/server.py` avec les 4 outils MCP
- [ ] US-02 · Migrer `data/budget.json` depuis `/opt/data/budget/budget.json`
- [ ] US-03 · Dockerfile + requirements.txt pour le MCP
- [ ] US-04 · Connecter Hermes au MCP server local

### Phase 3 — Dashboard (parallèle)

- [ ] US-05 · Scaffolder Next.js dans `dashboard/`
- [ ] US-06 · API route `GET /api/budget` qui lit `data/budget.json`
- [ ] US-07 · Page principale : solde + jours bloqués + historique
- [ ] US-08 · Calendrier du mois avec jours colorés
- [ ] US-09 · Dockerfile dashboard + docker-compose.yml complet

## Bloqué

- Phase 2 (intégration Telegram) → attend Phase 1

## Fait

- [x] intent.md
- [x] spec.md
- [x] architecture.md
- [x] plan.md
- [x] CLAUDE.md

## Tests à créer (TDD — avant le code)

- [ ] TEST-01 · `test_calcul_dette_jours` — logique dette en jours
- [ ] TEST-02 · `test_add_expense` — enregistrement dépense
- [ ] TEST-03 · `test_get_status` — statut budget + jours bloqués
- [ ] TEST-04 · `test_api_budget_route` — curl sur `/api/budget`
- [ ] TEST-05 · `test_dashboard_ui` — Playwright calendrier + couleurs

## Environnements

- [ ] ENV-01 · Créer `docker-compose.preprod.yml` (port 3001, données test)
- [ ] ENV-02 · Créer `data/budget.test.json`
- [ ] ENV-03 · Script smoke test post-deploy
