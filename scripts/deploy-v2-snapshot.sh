#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ONE-TIME V2 SNAPSHOT — deploys current V3 build (with base=/static/spa/) to V2 slot
# Uses tar-based single-transfer to avoid SSH rate limiting
# PRE-REQUISITE: build with MSYS_NO_PATHCONV=1 npx vite build --base=/static/spa/
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SSH="/tmp/llcar_ssh.sh"
SCP="/tmp/llcar_scp.sh"
REMOTE_HOST="webadmin@185.55.57.145"

DIST_DIR="$PROJECT_ROOT/llcar-dashboard/dist"
REMOTE_SPA="/var/www/html/django/static/spa"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[V2-SNAP]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Preflight ---
if [[ ! -x "$SSH" ]]; then error "SSH wrapper not found at $SSH"; exit 1; fi
if [[ ! -x "$SCP" ]]; then error "SCP wrapper not found at $SCP"; exit 1; fi
if [[ ! -f "$DIST_DIR/index.html" ]]; then error "No dist/index.html — run build first"; exit 1; fi

# Verify build has correct base path
if grep -q "spa-v3" "$DIST_DIR/index.html"; then
    error "index.html contains 'spa-v3' — rebuild with --base=/static/spa/"
    exit 1
fi
log "Build verified: no spa-v3 references in index.html"

# =============================================================================
# STEP 1: Pack dist/ into a single tarball
# =============================================================================
log "Step 1: Creating tarball..."
TAR_FILE="/tmp/llcar-v2-snapshot.tar.gz"
cd "$DIST_DIR"
tar czf "$TAR_FILE" .
TAR_SIZE=$(wc -c < "$TAR_FILE" | tr -d ' ')
log "  Tarball: $(( TAR_SIZE / 1024 )) KB"

# =============================================================================
# STEP 2: Upload single tarball to server
# =============================================================================
log "Step 2: Uploading tarball..."
$SCP "$TAR_FILE" "$REMOTE_HOST:/tmp/llcar-v2-snapshot.tar.gz"
log "  Upload complete"

# =============================================================================
# STEP 3: Extract on server (clean old, unpack new)
# =============================================================================
log "Step 3: Extracting on server..."
$SSH "
    rm -rf $REMOTE_SPA/static/* 2>/dev/null || true
    rm -f $REMOTE_SPA/index.html 2>/dev/null || true
    mkdir -p $REMOTE_SPA/static $REMOTE_SPA/models
    cd $REMOTE_SPA
    tar xzf /tmp/llcar-v2-snapshot.tar.gz
    rm /tmp/llcar-v2-snapshot.tar.gz
    echo 'Files extracted:'
    ls -la $REMOTE_SPA/
    echo '---'
    echo \"Static files: \$(ls $REMOTE_SPA/static/ | wc -l)\"
"

# =============================================================================
# STEP 4: Verify
# =============================================================================
log "Step 4: Verification..."

# Check index.html has no spa-v3
SPA_V3_COUNT=$($SSH "grep -c 'spa-v3' $REMOTE_SPA/index.html" || echo "0")
if [[ "$SPA_V3_COUNT" != "0" ]]; then
    error "Remote index.html still contains spa-v3!"
    exit 1
fi
log "  No spa-v3 references — OK"

# Check /v2/ responds
HTTP_CODE=$($SSH "curl -sk -o /dev/null -w '%{http_code}' -H 'Host: llcar.ru' 'https://127.0.0.1/v2/'" || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
    log "  /v2/ responds 200 — OK"
else
    warn "  /v2/ returned $HTTP_CODE"
fi

# Check V3 not broken
V3_CODE=$($SSH "curl -sk -o /dev/null -w '%{http_code}' -H 'Host: llcar.ru' 'https://127.0.0.1/v3/'" || echo "000")
if [[ "$V3_CODE" == "200" ]]; then
    log "  /v3/ responds 200 — OK (not broken)"
else
    warn "  /v3/ returned $V3_CODE"
fi

# Check API
API_CODE=$($SSH "curl -sk -o /dev/null -w '%{http_code}' 'https://127.0.0.1/api/v2/diagnose-latest/?client_hash=test'" || echo "000")
if [[ "$API_CODE" == "200" ]]; then
    log "  API responds 200 — OK"
else
    warn "  API returned $API_CODE"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
log "=== V2 Snapshot Complete ==="
log "  Path:  $REMOTE_SPA/"
log "  V2:    /v2/ → $HTTP_CODE"
log "  V3:    /v3/ → $V3_CODE (untouched)"
log "  API:   → $API_CODE"
echo ""

rm -f "$TAR_FILE"
