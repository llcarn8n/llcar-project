#!/bin/bash
# server-check.sh — LLCAR server health check
set -euo pipefail

SSH="/tmp/llcar_ssh.sh"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ERRORS=$((ERRORS+1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

ERRORS=0

echo "=== LLCAR Server Health Check ==="
echo "$(date)"
echo ""

# 1. SSH connectivity
echo "--- SSH ---"
if $SSH "echo ok" 2>/dev/null | grep -q ok; then
    pass "SSH connection"
else
    fail "SSH connection failed"
    echo "Cannot continue without SSH"
    exit 1
fi

# 2. Gunicorn
echo "--- Gunicorn ---"
GUNICORN_COUNT=$($SSH "ps aux | grep gunicorn | grep -v grep | wc -l" 2>/dev/null)
if [ "$GUNICORN_COUNT" -gt 0 ]; then
    pass "Gunicorn running ($GUNICORN_COUNT processes)"
else
    fail "Gunicorn not running"
fi
# Check for duplicate (www-data vs webadmin)
WWW_DATA=$($SSH "ps aux | grep gunicorn | grep www-data | grep -v grep | wc -l" 2>/dev/null || echo 0)
WEBADMIN=$($SSH "ps aux | grep gunicorn | grep webadmin | grep -v grep | wc -l" 2>/dev/null || echo 0)
if [ "$WWW_DATA" -gt 0 ] && [ "$WEBADMIN" -gt 0 ]; then
    warn "Duplicate gunicorn: www-data($WWW_DATA) + webadmin($WEBADMIN)"
fi
# Check --reload flag
if $SSH "ps aux | grep gunicorn | grep webadmin | grep reload" 2>/dev/null | grep -q reload; then
    pass "Gunicorn has --reload flag"
else
    warn "Gunicorn missing --reload flag"
fi

# 3. API
echo "--- API ---"
API_STATUS=$($SSH "curl -sk -o /dev/null -w '%{http_code}' -H 'Host: llcar.ru' 'https://127.0.0.1/api/v2/diagnose-latest/?client_hash=test&minutes=60'" 2>/dev/null)
if [ "$API_STATUS" = "200" ]; then
    pass "API V2 responds 200"
else
    fail "API V2 returned $API_STATUS"
fi

# 4. Disk space
echo "--- Disk ---"
DISK_PCT=$($SSH "df / | tail -1 | awk '{print \$5}' | tr -d '%'" 2>/dev/null)
if [ "$DISK_PCT" -lt 80 ]; then
    pass "Disk usage ${DISK_PCT}%"
elif [ "$DISK_PCT" -lt 95 ]; then
    warn "Disk usage ${DISK_PCT}%"
else
    fail "Disk usage ${DISK_PCT}% — CRITICAL"
fi

# 5. PostgreSQL
echo "--- PostgreSQL ---"
PG_OK=$($SSH "PGPASSWORD=postgres psql -U postgres -d vehinfo -c 'SELECT 1' 2>/dev/null | grep -c '1 row'" 2>/dev/null || echo 0)
if [ "$PG_OK" -gt 0 ]; then
    pass "PostgreSQL vehinfo"
else
    fail "PostgreSQL connection failed"
fi

# 6. Data tables
echo "--- Data ---"
$SSH "PGPASSWORD=postgres psql -U postgres -d vehinfo -t -c \"
SELECT 'qtp_packets: ' || COUNT(*) FROM qtp_packets
UNION ALL SELECT 'accel_windows: ' || COUNT(*) FROM accel_windows
UNION ALL SELECT 'anomaly_scores: ' || COUNT(*) FROM anomaly_scores
UNION ALL SELECT 'correlation_results: ' || COUNT(*) FROM correlation_results
\"" 2>/dev/null | while read line; do
    [ -n "$line" ] && echo "  $line"
done

# 7. Frontend files
echo "--- Frontend V3 ---"
V3_COUNT=$($SSH "ls /var/www/html/django/static/spa-v3/static/ 2>/dev/null | wc -l" 2>/dev/null)
if [ "$V3_COUNT" -gt 40 ]; then
    pass "V3 has $V3_COUNT static files"
else
    fail "V3 only has $V3_COUNT files (expected 50+)"
fi

# 8. Summary
echo ""
echo "=== Summary: $ERRORS errors ==="
exit $ERRORS
