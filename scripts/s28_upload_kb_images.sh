#!/usr/bin/env bash
# S28 Phase 6 — upload .omc/staging/kb-images/ → prod /var/kb-images/
#
# Chunked tar-over-ssh (rsync отсутствует на Windows bash). Шарды по ~20
# директорий подряд, устойчиво к обрывам: прогресс в логе, resume возможен
# через skip уже скопированных шардов (их мало — 256, можно перезапустить).
#
# Usage:
#   scripts/s28_upload_kb_images.sh             # upload all
#   scripts/s28_upload_kb_images.sh --dry-run   # tar sizes only
#
set -euo pipefail

STAGING="${STAGING:-.omc/staging/kb-images}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/html/django/kb-images}"
SSH_WRAPPER="${SSH_WRAPPER:-/tmp/llcar_ssh.sh}"
PROGRESS_LOG="${PROGRESS_LOG:-.omc/research/s28-upload-progress.log}"

if [[ ! -x "$SSH_WRAPPER" ]]; then
  echo "[err] $SSH_WRAPPER not found or not executable. Run scripts/deploy-v3.sh first to provision SSH wrapper."
  exit 1
fi
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) grep '^#' "$0" | head -15 | sed 's/^# //'; exit 0 ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

if [[ ! -d "$STAGING" ]]; then
  echo "[err] staging not found: $STAGING"
  exit 1
fi

mkdir -p "$(dirname "$PROGRESS_LOG")"

echo "[info] staging: $STAGING"
echo "[info] remote:  $REMOTE_ROOT (via $SSH_WRAPPER)"

# List all shard dirs (top-level, typically 256 named 00..ff)
all_shards=( $(ls "$STAGING" | sort) )
echo "[info] local shards: ${#all_shards[@]}"

# Ensure remote root exists + list already-uploaded shards to skip
if (( DRY_RUN == 0 )); then
  "$SSH_WRAPPER" "mkdir -p '$REMOTE_ROOT'"
  remote_existing=$("$SSH_WRAPPER" "ls '$REMOTE_ROOT' 2>/dev/null" | tr '\n' ' ')
  echo "[info] remote existing shards: $(echo $remote_existing | wc -w)"
else
  remote_existing=""
fi

# Skip shards that fully exist on remote (simple presence check)
shards=()
for s in "${all_shards[@]}"; do
  if echo "$remote_existing" | grep -qw "$s"; then
    continue
  fi
  shards+=( "$s" )
done
echo "[info] shards to upload: ${#shards[@]}"

# Group shards into small chunks of 5 (≈60 MB) to avoid SSH session abort
CHUNK_SIZE=5
chunk_idx=0
total_bytes=0
uploaded_chunks=0

for ((i=0; i<${#shards[@]}; i+=CHUNK_SIZE)); do
  chunk_idx=$((chunk_idx + 1))
  end=$((i + CHUNK_SIZE))
  [[ $end -gt ${#shards[@]} ]] && end=${#shards[@]}
  chunk_shards=( "${shards[@]:i:CHUNK_SIZE}" )

  # Skip per-shard du (slow on Windows fs); rough estimate via file count
  echo "[chunk $chunk_idx] shards ${chunk_shards[0]}..${chunk_shards[-1]} (${#chunk_shards[@]} dirs)"

  if (( DRY_RUN == 1 )); then
    continue
  fi

  start_ts=$(date +%s)
  # tar the chunk shards and pipe to ssh wrapper
  if tar cf - -C "$STAGING" "${chunk_shards[@]}" \
     | "$SSH_WRAPPER" "tar xf - -C '$REMOTE_ROOT'"; then
    elapsed=$(( $(date +%s) - start_ts ))
    uploaded_chunks=$((uploaded_chunks + 1))
    echo "[chunk $chunk_idx] ok (${elapsed}s)"
    echo "$chunk_idx ${chunk_shards[0]}..${chunk_shards[-1]} ok ${elapsed}s" >> "$PROGRESS_LOG"
  else
    echo "[chunk $chunk_idx] FAILED — retry in 10s..."
    sleep 10
    # Retry once
    if tar cf - -C "$STAGING" "${chunk_shards[@]}" \
       | "$SSH_WRAPPER" "tar xf - -C '$REMOTE_ROOT'"; then
      uploaded_chunks=$((uploaded_chunks + 1))
      echo "[chunk $chunk_idx] ok on retry"
      echo "$chunk_idx ${chunk_shards[0]}..${chunk_shards[-1]} ok_retry" >> "$PROGRESS_LOG"
    else
      echo "[chunk $chunk_idx] STILL FAILED — moving on"
      echo "$chunk_idx ${chunk_shards[0]}..${chunk_shards[-1]} FAIL" >> "$PROGRESS_LOG"
    fi
  fi
  sleep 2  # brief gap to let SSH server breathe
done

echo ""
echo "[done] uploaded $uploaded_chunks / $chunk_idx chunks"
echo "[info] progress log: $PROGRESS_LOG"
