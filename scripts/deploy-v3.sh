#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# LLCAR V3 Deploy Script
# Builds frontend, diffs & uploads ALL changed files, deploys backend.
# Usage: ./scripts/deploy-v3.sh [--skip-build] [--backend-only] [--frontend-only]
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SSH="/tmp/llcar_ssh.sh"
SCP="/tmp/llcar_scp.sh"
REMOTE_HOST="webadmin@185.55.57.145"

FRONTEND_SRC="$PROJECT_ROOT/llcar-dashboard"
DIST_DIR="$FRONTEND_SRC/dist"
DIST_STATIC="$DIST_DIR/static"

REMOTE_SPA="/var/www/html/django/static/spa-v3"
REMOTE_BACKEND="/var/www/html/django/dashboard/diagnostic"
REMOTE_DATA="/var/www/html/django/dashboard/data"
REMOTE_DJANGO="/var/www/html/django"
REMOTE_WSGI="/var/www/html/django/llcar/wsgi.py"

API_URL="https://185.55.57.145/api/v2/diagnose-latest/?client_hash=test"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Parse flags ---
SKIP_BUILD=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# Counters (initialized for summary, even when sections are skipped)
UPLOAD_COUNT=0
SKIP_COUNT=0
STALE_COUNT=0
PY_COUNT=0

for arg in "$@"; do
    case "$arg" in
        --skip-build)     SKIP_BUILD=true ;;
        --backend-only)   BACKEND_ONLY=true ;;
        --frontend-only)  FRONTEND_ONLY=true ;;
        *)                error "Unknown flag: $arg"; exit 1 ;;
    esac
done

# --- Preflight checks ---
if [[ ! -x "$SSH" ]]; then
    error "SSH wrapper not found at $SSH"
    exit 1
fi
if [[ ! -x "$SCP" ]]; then
    error "SCP wrapper not found at $SCP"
    exit 1
fi

# =============================================================================
# STEP 1: Build frontend (unless --skip-build or --backend-only)
# =============================================================================
if [[ "$BACKEND_ONLY" == false && "$SKIP_BUILD" == false ]]; then
    log "Step 1: Building frontend..."
    cd "$FRONTEND_SRC"
    npm run build
    cd "$PROJECT_ROOT"
    log "Build complete. Files in dist/:"
    ls "$DIST_DIR" | head -5
    log "Static chunks: $(ls "$DIST_STATIC" | wc -l) files"
else
    log "Step 1: Skipping build (flag set)"
fi

# =============================================================================
# STEP 2: Deploy frontend — diff local vs remote, upload ALL changed files
# =============================================================================
if [[ "$BACKEND_ONLY" == false ]]; then
    log "Step 2: Comparing local dist/static/ vs remote spa-v3/static/..."

    # Get remote file listing (name + size)
    REMOTE_LIST=$($SSH "ls -la $REMOTE_SPA/static/ 2>/dev/null | awk '{print \$NF, \$5}'" || echo "")

    # Build a temp file with remote filenames for quick lookup
    REMOTE_NAMES=$(echo "$REMOTE_LIST" | awk '{print $1}')

    UPLOAD_COUNT=0
    SKIP_COUNT=0

    # Upload all static chunks (JS, CSS, assets)
    for local_file in "$DIST_STATIC"/*; do
        filename=$(basename "$local_file")
        local_size=$(wc -c < "$local_file" | tr -d ' ')

        # Check if file exists on remote with same name
        remote_size=$(echo "$REMOTE_LIST" | grep "^${filename} " | awk '{print $2}' || echo "")

        if [[ -n "$remote_size" && "$remote_size" == "$local_size" ]]; then
            SKIP_COUNT=$((SKIP_COUNT + 1))
            continue
        fi

        # Upload new or changed file
        $SCP "$local_file" "$REMOTE_HOST:$REMOTE_SPA/static/$filename"
        UPLOAD_COUNT=$((UPLOAD_COUNT + 1))
    done

    log "Static files: uploaded=$UPLOAD_COUNT, unchanged=$SKIP_COUNT"

    # Upload index.html (always — it references chunk hashes)
    if [[ -f "$DIST_DIR/index.html" ]]; then
        log "Uploading index.html..."
        $SCP "$DIST_DIR/index.html" "$REMOTE_HOST:$REMOTE_SPA/index.html"
    fi

    # Upload favicon, icons, logo if they exist
    for asset in favicon.svg icons.svg llcar-logo.png llcar-logo-transparent.png; do
        if [[ -f "$DIST_DIR/$asset" ]]; then
            $SCP "$DIST_DIR/$asset" "$REMOTE_HOST:$REMOTE_SPA/$asset"
        fi
    done

    # Upload 3D models directory if it exists
    if [[ -d "$DIST_DIR/models" ]]; then
        log "Uploading 3D models..."
        for model_file in "$DIST_DIR/models"/*; do
            if [[ -f "$model_file" ]]; then
                $SSH "mkdir -p $REMOTE_SPA/models"
                $SCP "$model_file" "$REMOTE_HOST:$REMOTE_SPA/models/$(basename "$model_file")"
            fi
        done
    fi

    # Clean up stale remote chunks that no longer exist locally
    log "Cleaning stale remote chunks..."
    LOCAL_NAMES=$(ls "$DIST_STATIC" | sort)
    STALE=$($SSH "ls $REMOTE_SPA/static/ 2>/dev/null" | sort | comm -23 - <(echo "$LOCAL_NAMES") || echo "")
    STALE_COUNT=0
    if [[ -n "$STALE" ]]; then
        for stale_file in $STALE; do
            $SSH "rm -f $REMOTE_SPA/static/$stale_file"
            STALE_COUNT=$((STALE_COUNT + 1))
        done
    fi
    log "Cleaned $STALE_COUNT stale chunks"
fi

# =============================================================================
# STEP 3: Deploy backend .py files
# =============================================================================
if [[ "$FRONTEND_ONLY" == false ]]; then
    log "Step 3: Deploying backend Python files..."

    BACKEND_SRC="$PROJECT_ROOT/dashboard_build/diagnostic"

    # Core .py files (flat directory)
    PY_COUNT=0
    for py_file in "$BACKEND_SRC"/*.py; do
        if [[ -f "$py_file" ]]; then
            filename=$(basename "$py_file")
            $SCP "$py_file" "$REMOTE_HOST:$REMOTE_BACKEND/$filename"
            PY_COUNT=$((PY_COUNT + 1))
        fi
    done
    log "Uploaded $PY_COUNT .py files to $REMOTE_BACKEND/"

    # Rules subdirectory
    if [[ -d "$BACKEND_SRC/rules" ]]; then
        log "Deploying rules/..."
        $SSH "mkdir -p $REMOTE_BACKEND/rules"
        for rules_file in "$BACKEND_SRC/rules"/*.py "$BACKEND_SRC/rules"/*.json; do
            if [[ -f "$rules_file" ]]; then
                $SCP "$rules_file" "$REMOTE_HOST:$REMOTE_BACKEND/rules/$(basename "$rules_file")"
            fi
        done
    fi

    # Management commands
    if [[ -d "$BACKEND_SRC/management" ]]; then
        log "Deploying management commands..."
        $SSH "mkdir -p $REMOTE_BACKEND/management/commands"
        # __init__.py for package recognition
        $SSH "touch $REMOTE_BACKEND/management/__init__.py"
        $SSH "touch $REMOTE_BACKEND/management/commands/__init__.py"
        for cmd_file in "$BACKEND_SRC/management/commands"/*.py; do
            if [[ -f "$cmd_file" ]]; then
                $SCP "$cmd_file" "$REMOTE_HOST:$REMOTE_BACKEND/management/commands/$(basename "$cmd_file")"
            fi
        done
    fi

    # SQL directory
    if [[ -d "$BACKEND_SRC/sql" ]]; then
        log "Deploying sql/..."
        $SSH "mkdir -p $REMOTE_BACKEND/sql"
        for sql_file in "$BACKEND_SRC/sql"/*; do
            if [[ -f "$sql_file" ]]; then
                $SCP "$sql_file" "$REMOTE_HOST:$REMOTE_BACKEND/sql/$(basename "$sql_file")"
            fi
        done
    fi

    # Diagnostic data directory (severity_overrides.json etc.)
    if [[ -d "$BACKEND_SRC/data" ]]; then
        log "Deploying diagnostic/data/..."
        $SSH "mkdir -p $REMOTE_BACKEND/data"
        for data_file in "$BACKEND_SRC/data"/*; do
            if [[ -f "$data_file" ]]; then
                $SCP "$data_file" "$REMOTE_HOST:$REMOTE_BACKEND/data/$(basename "$data_file")"
            fi
        done
    fi

    # Top-level data/*.json (dtc-index, situations, recalls)
    DATA_SRC="$PROJECT_ROOT/dashboard_build/data"
    if [[ -d "$DATA_SRC" ]]; then
        log "Deploying data/*.json..."
        $SSH "mkdir -p $REMOTE_DATA"
        for json_file in "$DATA_SRC"/*.json; do
            if [[ -f "$json_file" ]]; then
                $SCP "$json_file" "$REMOTE_HOST:$REMOTE_DATA/$(basename "$json_file")"
            fi
        done
    fi

    # =============================================================================
    # STEP 4: Touch wsgi.py to trigger gunicorn --reload
    # =============================================================================
    log "Step 4: Touching wsgi.py to reload gunicorn..."
    $SSH "touch $REMOTE_WSGI"

    # Wait for gunicorn to pick up the change
    sleep 3
fi

# =============================================================================
# STEP 5: Verify API responds 200
# =============================================================================
log "Step 5: Verifying API health..."

MAX_RETRIES=3
RETRY_DELAY=5
API_OK=false

for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$($SSH "curl -sk -o /dev/null -w '%{http_code}' '$API_URL'" || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
        API_OK=true
        break
    fi
    warn "API returned $HTTP_CODE (attempt $i/$MAX_RETRIES), retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
done

if [[ "$API_OK" == true ]]; then
    log "API responds 200 — deploy successful!"
else
    error "API did not return 200 after $MAX_RETRIES attempts. Check server logs."
    error "  SSH in: $SSH 'journalctl -u gunicorn --since \"5 min ago\" --no-pager | tail -30'"
    exit 1
fi

# =============================================================================
# STEP 6: Canary — проверка что gunicorn держит НОВЫЙ код в памяти
# =============================================================================
# Step 5 может дать ложный 200: если gunicorn без --reload, старый код продолжит
# отвечать на /api/v2/diagnose-latest/. Canary бьёт на endpoint, появившийся в
# свежем backend-апдейте (S23 shadow-metrics). 404 = код на диске новый,
# в памяти старый → нужен рестарт gunicorn.
if [[ "$FRONTEND_ONLY" == false ]]; then
    log "Step 6: Canary check (shadow-metrics endpoint)..."
    CANARY_URL="https://185.55.57.145/api/diagnostics/shadow-metrics/?rule_name=__canary_$(date +%s)"
    CANARY_CODE=$($SSH "curl -sk -o /dev/null -w '%{http_code}' '$CANARY_URL'" || echo "000")
    if [[ "$CANARY_CODE" == "200" ]]; then
        log "Canary OK — новый код в памяти gunicorn"
    elif [[ "$CANARY_CODE" == "404" ]]; then
        warn "Canary FAIL (shadow-metrics → 404): код на диске свежий, но gunicorn держит старый в памяти."
        warn "Рестарт workaround (без sudo):"
        warn "  $SSH \"rm -f /var/www/html/django/app.sock && cd /var/www/html/django && nohup venv/bin/gunicorn --access-logfile - --workers 3 --reload --bind unix:app.sock llcar.wsgi:application >/tmp/gunicorn-restart.log 2>&1 &\""
        exit 1
    else
        warn "Canary вернул HTTP $CANARY_CODE — проверь вручную: $CANARY_URL"
    fi
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
log "=== Deploy Complete ==="
if [[ "$BACKEND_ONLY" == false ]]; then
    log "  Frontend: $UPLOAD_COUNT files uploaded, $SKIP_COUNT unchanged, $STALE_COUNT stale removed"
    log "  Path:     $REMOTE_SPA/"
fi
if [[ "$FRONTEND_ONLY" == false ]]; then
    log "  Backend:  $PY_COUNT .py files"
    log "  Path:     $REMOTE_BACKEND/"
fi
log "  API:      $API_URL -> 200"
echo ""
