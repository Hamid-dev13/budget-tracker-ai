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

item=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
  | jq -r --argjson n "$issue" '.items[] | select(.content.number == $n) | .id')

if [[ -z "$item" ]]; then
  echo "issue #$issue absente du board — ajoute-la avec 'gh project item-add'" >&2
  exit 1
fi

gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$item" \
  --field-id "$STATUS_FIELD" \
  --single-select-option-id "$option" > /dev/null

echo "#$issue → $status"
