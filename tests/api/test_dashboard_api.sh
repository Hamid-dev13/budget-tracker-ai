#!/usr/bin/env bash
# Recette HTTP des routes du dashboard.
# Usage : BASE_URL=http://localhost:3001 BUDGET_FILE=data/budget.recette.json ./tests/api/test_dashboard_api.sh
#
# Le serveur visé DOIT pointer sur un budget jetable : la recette écrit et supprime.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
BUDGET_FILE="${BUDGET_FILE:-data/budget.recette.json}"

ok=0
ko=0

# cas <description> <attendu> <methode> <chemin> [corps json]
cas() {
  local titre="$1" attendu="$2" methode="$3" chemin="$4" corps="${5:-}"
  local code body

  if [ -n "$corps" ]; then
    body=$(curl -s -o /tmp/recette.body -w '%{http_code}' -X "$methode" \
      -H 'content-type: application/json' -d "$corps" "$BASE_URL$chemin")
  else
    body=$(curl -s -o /tmp/recette.body -w '%{http_code}' -X "$methode" "$BASE_URL$chemin")
  fi
  code="$body"

  if [ "$code" = "$attendu" ]; then
    printf '  \033[32mOK\033[0m   %-3s %-45s → %s\n' "$methode" "$chemin" "$code"
    ok=$((ok + 1))
  else
    printf '  \033[31mKO\033[0m   %-3s %-45s → %s (attendu %s)\n' "$methode" "$chemin" "$code" "$attendu"
    printf '       %s\n' "$(head -c 200 /tmp/recette.body)"
    ko=$((ko + 1))
  fi
}

# valeur <description> <jq-ish python path> <attendu>
valeur() {
  local titre="$1" expr="$2" attendu="$3" obtenu
  obtenu=$(curl -s "$BASE_URL$4" | python3 -c "import json,sys; print($expr)" 2>/dev/null)

  if [ "$obtenu" = "$attendu" ]; then
    printf '  \033[32mOK\033[0m   %-49s → %s\n' "$titre" "$obtenu"
    ok=$((ok + 1))
  else
    printf '  \033[31mKO\033[0m   %-49s → %s (attendu %s)\n' "$titre" "$obtenu" "$attendu"
    ko=$((ko + 1))
  fi
}

echo "Recette API — $BASE_URL"
echo

# Garde-fou : le serveur visé doit écrire dans le fichier que ce script pilote,
# sinon tous les cas échouent pour une raison sans rapport avec le code.
rm -f "$BUDGET_FILE"
curl -s -o /dev/null -X POST -H 'content-type: application/json' \
  -d '{"solde":1,"date_fin":"2099-01-01","date_debut":"2099-01-01"}' "$BASE_URL/api/budget"
if [ ! -f "$BUDGET_FILE" ]; then
  echo "  ABANDON : $BASE_URL n'écrit pas dans $BUDGET_FILE."
  echo "  Lance un serveur dont BUDGET_PATH pointe sur ce fichier, par exemple :"
  echo "    docker compose -f docker-compose.recette.yml up -d --build"
  echo "    BASE_URL=http://localhost:3002 ./tests/api/test_dashboard_api.sh"
  exit 2
fi

echo "· Budget absent"
rm -f "$BUDGET_FILE"
cas 'budget non initialisé'      404 GET  /api/budget
cas 'dépense sans budget'        404 POST /api/expenses '{"montant":10,"description":"Courses"}'

echo
echo "· Initialisation"
cas 'init valide'                201 POST /api/budget   '{"solde":248,"date_fin":"2026-09-30","date_debut":"2026-09-19"}'
cas 'init solde nul'             400 POST /api/budget   '{"solde":0,"date_fin":"2026-09-30"}'
cas 'init période inversée'      400 POST /api/budget   '{"solde":100,"date_fin":"2026-09-10","date_debut":"2026-09-19"}'
cas 'init corps non JSON'        400 POST /api/budget   'pas du json'

echo
echo "· Dépenses"
cas 'dépense valide'             201 POST /api/expenses '{"montant":45.12,"description":"Courses","date":"2026-09-19"}'
cas 'dépense valide 2'           201 POST /api/expenses '{"montant":65.58,"description":"Le reste","date":"2026-09-19"}'
cas 'montant négatif'            400 POST /api/expenses '{"montant":-5,"description":"Remboursement"}'
cas 'montant nul'                400 POST /api/expenses '{"montant":0,"description":"Rien"}'
cas 'description vide'           400 POST /api/expenses '{"montant":10,"description":"   "}'
cas 'date mal formée'            400 POST /api/expenses '{"montant":10,"description":"X","date":"19/09/2026"}'

echo
echo "· Lecture du budget"
cas 'budget initialisé'          200 GET  '/api/budget?today=2026-09-20'
cas 'today mal formé'            400 GET  '/api/budget?today=20-09-2026'

valeur 'plafond journalier'   "round(json.load(sys.stdin)['plafondJour'],2)"      '20.67' '/api/budget?today=2026-09-20'
valeur 'solde restant'        "round(json.load(sys.stdin)['soldeRestant'],2)"     '137.3' '/api/budget?today=2026-09-20'
valeur "budget aujourd'hui"   "json.load(sys.stdin)['budgetAujourdhui']"          '0'     '/api/budget?today=2026-09-20'
valeur 'jours bloqués'        "json.load(sys.stdin)['joursBloques']"              '4'     '/api/budget?today=2026-09-20'
valeur 'date de reprise'      "json.load(sys.stdin)['dateReprise']"               '2026-09-24' '/api/budget?today=2026-09-20'
valeur 'budget à la reprise'  "round(json.load(sys.stdin)['budgetJourReprise'],2)" '13.3' '/api/budget?today=2026-09-20'
valeur 'statut'               "json.load(sys.stdin)['status']"                    'danger' '/api/budget?today=2026-09-20'
valeur 'jours de la période'  "len(json.load(sys.stdin)['jours'])"                '12'    '/api/budget?today=2026-09-20'
valeur 'dette remboursée'     "json.load(sys.stdin)['joursBloques']"              '0'     '/api/budget?today=2026-09-25'

echo
echo "· Historique"
cas 'historique complet'         200 GET  /api/expenses
cas 'historique limité'          200 GET  '/api/expenses?limit=1'
cas 'limit non numérique'        400 GET  '/api/expenses?limit=beaucoup'
valeur 'historique : 2 dépenses' "len(json.load(sys.stdin))"                      '2' '/api/expenses'
valeur 'historique limité à 1'   "len(json.load(sys.stdin))"                      '1' '/api/expenses?limit=1'

echo
printf 'Résultat : \033[32m%d OK\033[0m, ' "$ok"
if [ "$ko" -gt 0 ]; then
  printf '\033[31m%d KO\033[0m\n' "$ko"
  exit 1
fi
printf '0 KO\n'
