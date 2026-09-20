# Architecture

## Vue d'ensemble

```
Telegram                          Navigateur
   |                                  |
   | (messages naturels)              | (HTTP)
   v                                  v
Hermes Agent                    Dashboard Next.js
   |                                  |
   | (lance un process stdio)         |
   v                                  v
MCP server  ──────┐          ┌────── API routes
                  |          |
                  v          v
            lib/budget-service.ts
                     |
                     v
            lib/budget-logic.ts      ← LA règle métier, écrite une seule fois
                     |
                     v
            lib/budget-store.ts      ← seul écrivain, écriture atomique
                     |
                     v
       data/budget.json (source de vérité — bind mount host)
```

Le point clé : le MCP et l'API ne réimplémentent rien. Ils appellent la même couche
service, donc Hermes et le dashboard ne peuvent pas annoncer deux chiffres différents.
C'est exactement ce qui clochait dans la version précédente, où la dette était calculée
en Python pour Hermes et en TypeScript pour le dashboard — avec deux définitions qui
avaient déjà divergé.

## Structure du projet

```
budget-tracker-ai/
├── dashboard/                  # une seule application TypeScript
│   ├── lib/
│   │   ├── budget-logic.ts     # logique pure, aucune I/O, aucune horloge implicite
│   │   ├── budget-store.ts     # lecture / écriture atomique du JSON
│   │   ├── budget-service.ts   # les 4 opérations métier
│   │   ├── errors.ts           # erreurs typées portant leur code HTTP
│   │   └── budget.ts           # présentation seule (formatage, couleurs, charts)
│   ├── app/
│   │   ├── page.tsx            # dashboard
│   │   └── api/                # budget/ et expenses/
│   ├── mcp/
│   │   ├── server.ts           # les 4 outils MCP
│   │   └── stdio.ts            # point d'entrée lancé par Hermes
│   ├── scripts/smoke-mcp.mjs
│   ├── tests/                  # vitest
│   └── Dockerfile
├── tests/api/test_dashboard_api.sh
├── data/budget.json
├── docker-compose.yml
└── CLAUDE.md
```

## Composants

### Logique métier — `lib/budget-logic.ts`
- Fonctions pures, aucune I/O, aucun accès à l'horloge : le jour courant est un paramètre.
- Modèle unique de la cagnotte cumulée (voir `CLAUDE.md`).
- Les dates sont manipulées en UTC : un calcul en heure locale saute un jour au
  changement d'heure.

### Serveur MCP — `mcp/server.ts`
- 4 outils orientés intention, qui répondent un résultat lisible par l'agent
  (« 4 jours bloqués, reprise le 24 »), pas du JSON brut à réinterpréter.
- Transport **stdio** : Hermes lance le process, il ne tourne pas en démon.
  C'est pourquoi il n'y a plus de service `mcp` dans le Compose.
- Bundlé en un fichier autonome par esbuild (`npm run build:mcp`).

### API HTTP — `app/api/`
- `GET /api/budget` renvoie la **vue calculée**, pas le JSON brut.
- Les écritures passent par POST, et uniquement par là.

### Dashboard — Next.js
- Page principale en client component, refresh toutes les 30 secondes.
- Ne calcule aucune règle : il affiche la vue que le serveur lui envoie, y compris
  le jour courant (`today`), pour ne pas dépendre de l'horloge du navigateur.
- Les pages `/calendrier` et `/historique` sont des server components qui appellent
  directement la couche service — même process, pas de HTTP interne inutile.

### Source de vérité — budget.json
- Bind mount sur le host : `./data:/app/data`
- Survit aux rebuilds et suppressions de conteneurs
- Écrit uniquement par `budget-store.ts`, en écriture atomique (fichier temporaire
  puis `rename`), pour qu'une interruption ne laisse jamais le fichier tronqué.

## Docker

Un seul service : le MCP étant un binaire stdio, il n'a pas sa place comme démon.

```yaml
name: budget-tracker

services:
  app:
    build: ./dashboard
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - BUDGET_PATH=/app/data/budget.json
```

La preprod déclare un `name:` distinct, sans quoi Compose réutilise le nom du répertoire
et remplace les conteneurs de prod au lieu de tourner à côté.

## Architecture du code

Simple et plat — pas de clean architecture, pas de 3-tiers.
Une seule règle structurante : **la logique métier est écrite une fois**, dans
`budget-logic.ts`, et tous les clients (API, MCP, pages serveur) l'importent.

## Ce qui n'existe pas dans cette architecture

- Pas de base de données (JSON suffit)
- Pas d'authentification (usage solo, sur le réseau Tailscale du home lab)
- Pas de webhook Telegram (Hermes gère ça)
- Plus de Python : la logique était dupliquée en Python et en TypeScript, avec deux
  définitions divergentes de la dette. Tout est en TypeScript depuis.
