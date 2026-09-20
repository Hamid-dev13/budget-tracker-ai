# Plan

## Ordre d'implémentation

### Phase 1 — MCP Server (base de tout)
1. Créer `server.py` avec les 4 outils MCP
2. Brancher sur `budget.json` existant
3. Tester chaque outil manuellement
4. Connecter Hermes au MCP server

### Phase 2 — Intégration Telegram
1. Vérifier que Hermes appelle bien les outils MCP
2. Tester : envoyer une dépense → MCP l'enregistre
3. Tester : demander le statut → MCP répond en jours

### Phase 3 — Dashboard Next.js
1. Scaffolder le projet Next.js
2. API route qui lit `budget.json`
3. Page principale : solde + jours bloqués + historique
4. Calendrier du mois avec jours colorés
5. Auto-refresh toutes les 30 secondes

### Phase 4 — Polish
1. Reset automatique fin de mois
2. Historique multi-mois
3. CLAUDE.md pour les agents futurs

## Dépendances

- Phase 2 bloquée par Phase 1
- Phase 3 indépendante de Phase 2 (peut tourner en parallèle)
- Phase 4 bloquée par Phase 3

## On commence par quoi

Phase 1. Sans MCP server rien ne tient.
