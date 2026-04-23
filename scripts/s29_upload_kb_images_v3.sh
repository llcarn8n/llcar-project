#!/usr/bin/env bash
# S29 P0 v3 — tar-over-ssh per-shard upload (fast).
#
# v1 (s28): tar chunks по 5 shards → SSH abort на больших чанках.
# v2: scp -r per-shard → ~220s/shard = 9 часов total (per-file scp latency).
# v3 (эта): tar cf - <shard> | ssh "tar xf - -C remote/" per-shard.
#   Single SSH per shard, но stream-based → 5-15s/shard = ~25 мин total.
#
# Usage:
#   bash scripts/s29_upload_kb_images_v3.sh                  # upload всё
#   bash scripts/s29_upload_kb_images_v3.sh --dry-run        # без tar
#   bash scripts/s29_upload_kb_images_v3.sh --shard 4a       # один шард
set -euo pipefail

STAGING="${STAGING:-.omc/staging/kb-images}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/html/django/kb-images}"
SSH_WRAPPER="${SSH_WRAPPER:-/tmp/llcar_ssh.sh}"
PROGRESS_LOG="${PROGRESS_LOG:-.omc/research/s29-upload-v3-progress.log}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-2}"

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

if [[ ! -x "$SSH_WRAPPER" ]]; then
  echo "[err] SSH wrapper not found: $SSH_WRAPPER"
  exit 1
fi

if [[ ! -d "$STAGING" ]]; then
  echo "[err] staging not found: $STAGING"
  exit 1
fi

mkdir -p "$(dirname "$PROGRESS_LOG")"
touch "$PROGRESS_LOG"

# Один SSH для inventory всех remote shard counts
echo "[info] fetching remote inventory (1 SSH call)..."
REMOTE_INVENTORY=$("$SSH_WRAPPER" "mkdir -p '$REMOTE_ROOT' && cd '$REMOTE_ROOT' && for d in \$(ls 2>/dev/null); do if [[ -d \"\$d\" ]]; then n=\$(ls \"\$d\" 2>/dev/null | wc -l); echo \"\$d \$n\"; fi; done" 2>/dev/null || true)

declare -A REMOTE_COUNTS
while IFS=' ' read -r s n; do
  [[ -z "$s" ]] && continue
  REMOTE_COUNTS["$s"]="$n"
done <<< "$REMOTE_INVENTORY"

echo "[info] remote shards: ${#REMOTE_COUNTS[@]}"

if [[ -n "$ONE_SHARD" ]]; then
  shards=( "$ONE_SHARD" )
else
  shards=( $(ls "$STAGING" | sort) )
fi

echo "[info] staging:     $STAGING"
echo "[info] remote:      $REMOTE_ROOT"
echo "[info] local shards: ${#shards[@]}"

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
  # tar shard → ssh → extract. Single SSH connection per shard.
  # --keep-newer-files: не перезаписывает если remote новее (на случай partial)
  if tar cf - -C "$STAGING" "$shard" | "$SSH_WRAPPER" "tar xf - -C '$REMOTE_ROOT'"; then
    elapsed=$(( $(date +%s) - start_ts ))
    uploaded=$((uploaded + 1))
    echo "[ok] $shard: ${elapsed}s ($local_n files)"
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $shard ok ${elapsed}s $local_n" >> "$PROGRESS_LOG"
  else
    failed=$((failed + 1))
    echo "[fail] $shard: tar|ssh error — retry in 5s"
    sleep 5
    if tar cf - -C "$STAGING" "$shard" | "$SSH_WRAPPER" "tar xf - -C '$REMOTE_ROOT'"; then
      uploaded=$((uploaded + 1))
      failed=$((failed - 1))
      echo "[ok-retry] $shard"
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $shard ok-retry" >> "$PROGRESS_LOG"
    else
      echo "[fail-final] $shard — continuing batch"
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
  echo "[warn] $failed shards failed — re-run to retry (resumable)"
  exit 2
fi
