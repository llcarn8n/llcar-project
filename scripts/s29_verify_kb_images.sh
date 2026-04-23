#!/usr/bin/env bash
# S29 P0 verify — sample random hashes from manifest, curl HEAD на prod, подсчёт 200/404.
#
# Usage:
#   bash scripts/s29_verify_kb_images.sh             # sample 20 случайных
#   bash scripts/s29_verify_kb_images.sh --n 100     # sample 100
#   bash scripts/s29_verify_kb_images.sh --all       # curl всех 422K (долго, ~10 мин при conn:100)
set -euo pipefail

MANIFEST="${MANIFEST:-.omc/research/images-manifest.txt}"
BASE_URL="${BASE_URL:-https://llcar.ru/api/kb-image}"
N="${N:-20}"
ALL=0

for arg in "$@"; do
  case "$arg" in
    --n) shift; N="${1:-20}" ;;
    --n=*) N="${arg#--n=}" ;;
    --all) ALL=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# //'; exit 0 ;;
  esac
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "[err] manifest not found: $MANIFEST"
  exit 1
fi

if (( ALL == 1 )); then
  SAMPLE=$(awk '{print $1}' "$MANIFEST")
  total=$(echo "$SAMPLE" | wc -l)
  echo "[info] checking ALL $total hashes (slow — ~10 min)"
else
  SAMPLE=$(awk '{print $1}' "$MANIFEST" | shuf -n "$N")
  total="$N"
  echo "[info] sampling $total random hashes"
fi

ok=0
fail=0
failed_hashes=()

while read -r h; do
  [[ -z "$h" ]] && continue
  code=$(curl -sI -o /dev/null -w "%{http_code}" "$BASE_URL/$h")
  if [[ "$code" == "200" ]]; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
    failed_hashes+=( "$h:$code" )
  fi
done <<< "$SAMPLE"

pct=$(awk -v o="$ok" -v t="$total" 'BEGIN {printf "%.1f", 100*o/t}')
echo ""
echo "[result] 200 OK: $ok / $total ($pct%)"
echo "[result] failures: $fail"
if (( fail > 0 )) && (( ${#failed_hashes[@]} <= 10 )); then
  echo ""
  echo "[failed samples]:"
  for fh in "${failed_hashes[@]}"; do
    echo "  $fh"
  done
fi

# Exit non-zero if any failed (for CI-style use)
(( fail == 0 ))
