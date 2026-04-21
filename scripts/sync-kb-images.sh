#!/usr/bin/env bash
# S27 Этап H2.1 — синхронизация картинок D:\ → прод-сервер
#
# Копирует только те webp-файлы, которые реально упомянуты в manual.md
# (манифест создаётся через scripts/s27_audit_image_refs.py).
#
# На сервере картинки раскладываются с 2-level sharding:
#   /var/kb-images/<hash[0:2]>/<hash>.webp
#
# Django view api_views.py#kb_image читает оттуда с cache immutable 1 год.
#
# Usage:
#   scripts/sync-kb-images.sh --check-only        # посчитать размер, не копировать
#   scripts/sync-kb-images.sh                     # синк в локальный STAGING
#   scripts/sync-kb-images.sh --remote            # rsync на прод сервер
#
set -euo pipefail

MANIFEST="${MANIFEST:-.omc/research/images-manifest.txt}"
STAGING="${STAGING:-.omc/staging/kb-images}"
REMOTE_HOST="${REMOTE_HOST:-root@185.55.57.145}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/kb-images}"
SSH_OPTS="${SSH_OPTS:--o StrictHostKeyChecking=no}"

CHECK_ONLY=0
PUSH_REMOTE=0

for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=1 ;;
    --remote) PUSH_REMOTE=1 ;;
    -h|--help)
      grep '^#' "$0" | head -25 | sed 's/^# //'
      exit 0
      ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "[err] manifest not found: $MANIFEST"
  echo "      run: python scripts/s27_audit_image_refs.py"
  exit 1
fi

total=$(wc -l < "$MANIFEST")
echo "[info] manifest: $total hashes"

# Estimate total size
total_bytes=0
missing=0
while IFS=$'\t' read -r hash src_path; do
  if [[ -f "$src_path" ]]; then
    sz=$(stat -c%s "$src_path" 2>/dev/null || stat -f%z "$src_path" 2>/dev/null || echo 0)
    total_bytes=$((total_bytes + sz))
  else
    missing=$((missing + 1))
  fi
done < "$MANIFEST"
echo "[info] total size: $((total_bytes / 1024 / 1024)) MB  ·  missing: $missing"

if (( CHECK_ONLY == 1 )); then
  exit 0
fi

# Stage locally with sharding
echo "[stage] copying to $STAGING (sharding by hash[0:2])..."
mkdir -p "$STAGING"
staged=0
while IFS=$'\t' read -r hash src_path; do
  if [[ ! -f "$src_path" ]]; then
    continue
  fi
  shard="${hash:0:2}"
  dest_dir="$STAGING/$shard"
  mkdir -p "$dest_dir"
  dest="$dest_dir/$hash.webp"
  # Skip if already correct
  if [[ -f "$dest" ]]; then
    src_sz=$(stat -c%s "$src_path" 2>/dev/null || stat -f%z "$src_path" 2>/dev/null)
    dst_sz=$(stat -c%s "$dest" 2>/dev/null || stat -f%z "$dest" 2>/dev/null)
    if [[ "$src_sz" == "$dst_sz" ]]; then
      continue
    fi
  fi
  cp -f "$src_path" "$dest"
  staged=$((staged + 1))
  if (( staged % 5000 == 0 )); then
    echo "  [stage] $staged/$total"
  fi
done < "$MANIFEST"
echo "[done] staged: $staged files in $STAGING"

if (( PUSH_REMOTE == 1 )); then
  echo "[push] rsync → $REMOTE_HOST:$REMOTE_ROOT/"
  rsync -avz --progress \
    -e "ssh $SSH_OPTS" \
    "$STAGING/" "$REMOTE_HOST:$REMOTE_ROOT/"
  echo "[done] remote sync complete"
else
  echo "[hint] staged locally. Pass --remote to push to $REMOTE_HOST"
fi
