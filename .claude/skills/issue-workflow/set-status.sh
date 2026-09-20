#!/usr/bin/env bash
# Change le statut d'une issue dans le GitHub Project 5.
#   ./set-status.sh 10 "In Progress"
set -euo pipefail

PROJECT_ID="PVT_kwHOCsrrg84BkEQ6"
STATUS_FIELD="PVTSSF_lAHOCsrrg84BkEQ6zhi2QD4"
OWNER="Hamid-dev13"
PROJECT_NUMBER=5

issue="${1:-}"
status="${2:-}"

if [[ -z "$issue" || -z "$status" ]]; then
  echo "usage: $0 <numéro-issue> <Todo|In Progress|Done>" >&2
  exit 64
fi

case "$status" in
  Todo)          option="f75ad846" ;;
  "In Progress") option="47fc9ee4" ;;
  Done)          option="98236657" ;;
  *) echo "statut inconnu : '$status' (Todo | In Progress | Done)" >&2; exit 64 ;;
esac

# Une issue tout juste ajoutée au board met quelques secondes à y apparaître.
item=""
for _ in 1 2 3; do
  item=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 200 --format json \
    | jq -r --argjson n "$issue" '.items[] | select(.content.number == $n) | .id')
  [[ -n "$item" ]] && break
  sleep 2
done

if [[ -z "$item" ]]; then
  echo "issue #$issue absente du board — ajoute-la avec :" >&2
  echo "  gh project item-add $PROJECT_NUMBER --owner $OWNER --url <url-de-l-issue>" >&2
  exit 1
fi

gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$item" \
  --field-id "$STATUS_FIELD" \
  --single-select-option-id "$option" > /dev/null

echo "#$issue → $status"
