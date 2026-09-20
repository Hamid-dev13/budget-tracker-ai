# CLAUDE.md

## Ce projet

Budget tracker conversationnel. L'interface c'est Telegram — Hermes enregistre les dépenses
via MCP et répond en jours de dette. Un dashboard Next.js visualise les données.

## Stack

- Une seule application TypeScript : Next.js 14 App Router + Tailwind
- API HTTP (route handlers) : le seul point d'écriture de `budget.json`
- Serveur MCP : `@modelcontextprotocol/sdk`, transport stdio, lancé par Hermes
- Logique métier : `dashboard/lib/budget-logic.ts`, importée par l'API **et** par le MCP
- Source de vérité : `data/budget.json` (bind mount Docker)
- Tests : vitest (unitaire, intégration, API) + recette curl

## Règles absolues

- Toute règle métier vit dans `lib/budget-logic.ts` — jamais dans un composant React,
  jamais dupliquée. Le dashboard et Hermes doivent toujours annoncer le même chiffre.
- Jamais de `new Date()` implicite dans un calcul : le jour courant est un paramètre.
  Côté serveur il vient de `todayISO()` (fuseau Europe/Paris).
- Seul `lib/budget-store.ts` écrit dans `budget.json`, et son écriture est atomique.
- Le dashboard ne calcule rien : il consomme la vue renvoyée par `GET /api/budget`.
- Le bind mount `./data:/app/data` ne doit jamais être remplacé par un volume Docker nommé
- Le conteneur doit tourner avec l'uid propriétaire de `./data` sur l'hôte
  (`user: "${APP_UID:-1000}:${APP_GID:-1000}"`, renseigné dans `.env`). L'image déclare
  l'uid 1001 : sans cet override, **toute écriture échoue en EACCES**. Ça ne se voyait pas
  tant que le dashboard était en lecture seule.
- Le port n'est **jamais** publié sur `0.0.0.0` : l'API accepte des écritures sans
  authentification et `POST /api/budget` écrase tout le budget. `BIND_ADDR` vaut
  `127.0.0.1` par défaut, et l'IP Tailscale sur le lab (dont le firewall est inactif
  et qui a une IPv6 publique).
- Pas de base de données — JSON suffit pour ce projet

## Logique métier — la cagnotte cumulée

Un seul modèle, dont tout découle :

```
cagnotte(J) = (jours écoulés depuis date_debut, J inclus) × plafond_jour
              − (dépenses cumulées sur la même fenêtre)

plafond_jour = solde_depart / nb_jours_de_la_période    ← toujours recalculé
```

- `budget_aujourd_hui` = cagnotte si positive, sinon 0
- `dette_jours` = cagnotte négative convertie en jours (`−cagnotte / plafond`), fractionnaire
- `jours_bloqués` = `ceil(dette_jours)`
- `date_reprise` = aujourd'hui + `jours_bloqués`, avec un budget partiel :
  `(1 − frac(dette)) × plafond`

Conséquence voulue : **un jour sans dépense rembourse la dette**. Le champ `plafond_jour`
stocké dans le JSON est conservé pour la lisibilité mais toujours ignoré à la lecture.

## Outils MCP exposés

Mêmes signatures qu'avant, mais ils répondent un **résultat lisible** par l'agent
(« 4 jours bloqués, reprise le 2026-09-24 avec 13,30 € »), jamais du JSON brut.

- `init_budget(solde, date_fin, date_debut?)` — initialise la période
- `add_expense(montant, description, date?)` — enregistre et annonce l'impact
- `get_status(today?)` — solde, budget du jour, jours bloqués, reprise
- `get_history(limit?)` — historique du plus récent au plus ancien

## API HTTP

| Route | Effet |
|---|---|
| `GET /api/budget?today=` | la vue calculée + `depenses`, `dateDebut`, `dateFin`, `today` |
| `POST /api/budget` | `{solde, date_fin, date_debut?}` → initialise |
| `GET /api/expenses?limit=` | historique |
| `POST /api/expenses` | `{montant, description, date?}` → enregistre |

Codes : `400` entrée invalide, `404` budget non initialisé, `500` fichier corrompu.

## Structure des fichiers

```
dashboard/
  lib/budget-logic.ts      # logique pure — LA source de vérité, aucune I/O
  lib/budget-store.ts      # lecture/écriture atomique du JSON
  lib/budget-service.ts    # les 4 opérations métier (API + MCP)
  lib/errors.ts            # erreurs typées portant leur code HTTP
  lib/budget.ts            # présentation seule : formatage, couleurs, agrégats de charts
  app/api/budget/route.ts
  app/api/expenses/route.ts
  app/page.tsx             # dashboard (client, poll 30 s)
  mcp/server.ts            # les 4 outils MCP
  mcp/stdio.ts             # point d'entrée lancé par Hermes
  scripts/smoke-mcp.mjs    # smoke test du binaire MCP
  tests/                   # vitest : unit, integration, api
tests/api/test_dashboard_api.sh  # recette curl
data/budget.json                 # source de vérité
docker-compose.yml
```

## Commandes utiles

```bash
# Développement
cd dashboard && npm install
BUDGET_PATH=$PWD/../data/budget.json npm run dev     # http://localhost:3000

# Tests
cd dashboard && npm test                              # vitest, toutes les couches
npx tsc --noEmit                                      # typage

# Recette API (sur un budget JETABLE — la recette écrit et supprime)
docker compose -f docker-compose.recette.yml up -d --build     # port 3002
BASE_URL=http://localhost:3002 ./tests/api/test_dashboard_api.sh
docker compose -f docker-compose.recette.yml down && rm -f data/budget.recette.json

# Serveur MCP
cd dashboard && npm run build:mcp                     # → dist/mcp-server.mjs
node scripts/smoke-mcp.mjs /chemin/budget-jetable.json

# Docker
docker compose up --build                             # prod, port 3000
docker compose -f docker-compose.preprod.yml up       # preprod, port 3001
docker compose logs app
```

## Brancher Hermes

Le serveur MCP est un binaire **stdio** : Hermes le lance, il ne tourne pas en démon.
C'est pour cela qu'il n'y a plus de service `mcp` dans le Compose — un process stdio
sans client attaché lit EOF et sort aussitôt.

```json
{
  "command": "node",
  "args": ["/chemin/vers/budget-tracker-ai/dashboard/dist/mcp-server.mjs"],
  "env": { "BUDGET_PATH": "/chemin/vers/budget-tracker-ai/data/budget.json" }
}
```

En transport stdio, **stdout appartient au protocole** : tout log passe par stderr.

## Déploiement sur le home lab

Le lab (`hamidhomeserver`, Tailscale `100.98.46.26`) héberge les deux moitiés :

```bash
ssh hamid@100.98.46.26
cd ~/.hermes/projects/budget-tracker-ai
git pull origin main
docker compose up -d --build        # dashboard → http://100.98.46.26:3000
```

`.env` y contient `APP_UID`/`APP_GID` (droits du bind mount) et
`BIND_ADDR=100.98.46.26` (le port n'écoute que sur Tailscale).

Pour le MCP, après un changement de la logique ou des outils :

```bash
cd dashboard && npm run build:mcp
scp dist/mcp-server.mjs hamid@100.98.46.26:~/.hermes/mcp/budget/
ssh hamid@100.98.46.26 docker restart hermes
```

Node n'est pas installé sur l'hôte du lab, mais le conteneur `hermes` embarque Node v26
et monte `~/.hermes` sur `/opt/data` — d'où les chemins `/opt/data/...` dans `config.yaml`.

## Workflow de contribution

Rien ne part sans issue. Le suivi vit dans le [GitHub Project 5](https://github.com/users/Hamid-dev13/projects/5).

Le cycle complet — lire le board, ouvrir l'issue, la passer `In Progress`, développer
en TDD, commiter en référençant le numéro, fermer en `Done` — est décrit dans le skill
`.claude/skills/issue-workflow/SKILL.md`. **À suivre pour toute feature, correction ou
refacto**, même petite.

## Stratégie de test (TDD)

### Règle absolue
Pas de code de production sans test qui échoue en premier. Cycle RED → GREEN → REFACTOR.

### 4 layers de test

| Layer | Outil | Ce qu'on teste |
|---|---|---|
| Unitaire | `vitest` | `budget-logic.ts` : cagnotte, dette, jours bloqués, dates |
| Intégration | `vitest` + JSON réel | store, service, et les outils MCP via un client en mémoire |
| API | `vitest` + `curl` | handlers de routes, puis recette sur le serveur réel |
| E2E | `browser_exec` (Playwright) | UI, calendrier, couleurs |

### Cas de régression à ne jamais perdre

- une période qui **franchit le 28 du mois** (l'ancienne version Python bouclait à l'infini) ;
- le **changement d'heure** du 25/10 (un calcul de date en heure locale saute un jour) ;
- la journée réelle du 19/09 : 110,70 € sur un plafond de 20,67 € → 4 jours bloqués,
  reprise le 24/09 avec 13,30 €.

### Environnements

- **Prod** : `docker compose up` — port 3000, `budget.json`
- **Preprod** : `docker compose -f docker-compose.preprod.yml up` — port 3001, `budget.test.json`
- **Recette** : `docker compose -f docker-compose.recette.yml up` — port 3002, `budget.recette.json`

Ne jamais lancer la recette ni tester une écriture contre la prod : elle écrit et supprime.

Chaque fichier Compose déclare un `name:` distinct : sans lui, Compose réutilise le nom
du répertoire et un environnement remplacerait les conteneurs d'un autre.

`.env` (non versionné, modèle dans `.env.example`) porte `APP_UID`/`APP_GID`.

### Smoke tests post-deploy

```bash
curl -f http://localhost:3000/api/budget | jq '.soldeRestant'
```
Si ça échoue → rollback immédiat.
