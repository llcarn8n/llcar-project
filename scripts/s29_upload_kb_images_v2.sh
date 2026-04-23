#!/usr/bin/env bash
# S29 P0 — per-shard scp upload .omc/staging/kb-images/ → prod /var/www/html/django/kb-images/
#
# Фикс: single-SSH remote inventory + бережный pace — сервер режет быстрые SSH connections
# ("kex_exchange_identification: Software caused connection abort"). Был tar-over-ssh в v1
# (SSH abort на больших чанках) и 256 отдельных ssh ls в первой версии v2 (rate limit).
#
# Эта версия:
#   - ОДИН ssh call вытаскивает counts всех шардов сразу (server-side du-loop)
#   - scp per-shard с sleep 3s между вызовами (щадит MaxStartups)
#   - count-based skip: remote >= local → пропуск
#   - resumable: безопасен для повторного запуска
#
# Usage:
#   bash scripts/s29_upload_kb_images_v2.sh                  # upload всё что нужно
#   bash scripts/s29_upload_kb_images_v2.sh --dry-run        # отчёт без scp
#   bash scripts/s29_upload_kb_images_v2.sh --shard 4a       # конкретный шард
set -euo pipefail

STAGING="${STAGING:-.omc/staging/kb-images}"
REMOTE_HOST="${REMOTE_HOST:-webadmin@185.55.57.145}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/html/django/kb-images}"
SSH_WRAPPER="${SSH_WRAPPER:-/tmp/llcar_ssh.sh}"
SCP_WRAPPER="${SCP_WRAPPER:-/tmp/llcar_scp.sh}"
PROGRESS_LOG="${PROGRESS_LOG:-.omc/research/s29-upload-progress.log}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-3}"

DRY_RUN=0
ONE_SHARD=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --shard) shift; ONE_SHARD="${1:-}" ;;
    --shard=*) ONE_SHARD="${arg#--shard=}" ;;
    -h|--help) grep '^#' "$0" | sed 's/^# //'; exit 0 ;;
  esac
done

if [[ ! -x "$SSH_WRAPPER" || ! -x "$SCP_WRAPPER" ]]; then
  echo "[err] SSH wrappers not found: $SSH_WRAPPER, $SCP_WRAPPER"
  echo "[hint] run bash scripts/deploy-v3.sh --provision-ssh to provision"
  exit 1
fi

if [[ ! -d "$STAGING" ]]; then
  echo "[err] staging not found: $STAGING"
  exit 1
fi

mkdir -p "$(dirname "$PROGRESS_LOG")"
touch "$PROGRESS_LOG"

# Ensure remote root + fetch ALL remote shard counts in one SSH call
echo "[info] fetching remote inventory (1 SSH call)..."
REMOTE_INVENTORY=$("$SSH_WRAPPER" "mkdir -p '$REMOTE_ROOT' && cd '$REMOTE_ROOT' && for d in \$(ls 2>/dev/null); do if [[ -d \"\$d\" ]]; then n=\$(ls \"\$d\" 2>/dev/null | wc -l); echo \"\$d \$n\"; fi; done" 2>/dev/null || true)

declare -A REMOTE_COUNTS
while IFS=' ' read -r s n; do
  [[ -z "$s" ]] && continue
  REMOTE_COUNTS["$s"]="$n"
done <<< "$REMOTE_INVENTORY"

echo "[info] remote shards found: ${#REMOTE_COUNTS[@]}"

# Collect local shard list
if [[ -n "$ONE_SHARD" ]]; then
  shards=( "$ONE_SHARD" )
else
  shards=( $(ls "$STAGING" | sort) )
fi

echo "[info] staging:     $STAGING"
echo "[info] remote:      $REMOTE_HOST:$REMOTE_ROOT"
echo "[info] local shards: ${#shards[@]}"
echo "[info] sleep:       ${SLEEP_BETWEEN}s between scp calls"

uploaded=0
skipped=0
failed=0
started_at=$(date +%s)

for shard in "${shards[@]}"; do
  if [[ ! -d "$STAGING/$shard" ]]; then
    continue
  fi

  local_n=$(find "$STAGING/$shard" -maxdepth 1 -name "*.webp" 2>/dev/null | wc -l)
  remote_n="${REMOTE_COUNTS[$shard]:-0}"

  if (( local_n == 0 )); then
    continue
  fi

  if (( remote_n >= local_n )); then
    skipped=$((skipped + 1))
    continue
  fi

  missing=$((local_n - remote_n))
  echo "[upload] $shard: local=$local_n remote=$remote_n missing=$missing"

  if (( DRY_RUN == 1 )); then
    continue
  fi

  start_ts=$(date +%s)
  if "$SCP_WRAPPER" -r -q "$STAGING/$shard" "$REMOTE_HOST:$REMOTE_ROOT/"; then
    elapsed=$(( $(date +%s) - start_ts ))
    uploaded=$((uploaded + 1))
    echo "[ok] $shard: ${elapsed}s ($local_n files)"
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $shard ok ${elapsed}s $local_n" >> "$PROGRESS_LOG"
  else
    failed=$((failed + 1))
    echo "[fail] $shard: scp error — retry in 10s"
    sleep 10
    if "$SCP_WRAPPER" -r -q "$STAGING/$shard" "$REMOTE_HOST:$REMOTE_ROOT/"; then
      uploaded=$((uploaded + 1))
      failed=$((failed - 1))
      echo "[ok-retry] $shard"
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $shard ok-retry" >> "$PROGRESS_LOG"
    else
      echo "[fail-final] $shard — skipping to continue batch"
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $shard FAIL" >> "$PROGRESS_LOG"
    fi
  fi

  sleep "$SLEEP_BETWEEN"
done

total_elapsed=$(( $(date +%s) - started_at ))
echo ""
echo "[done] uploaded=$uploaded skipped=$skipped failed=$failed elapsed=${total_elapsed}s"
echo "[info] progress log: $PROGRESS_LOG"

if (( failed > 0 )); then
  echo "[warn] $failed shards failed — re-run the script to retry (resumable)"
  exit 2
fi
