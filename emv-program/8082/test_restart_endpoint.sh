#!/usr/bin/env bash
# Simulate: login then POST /admin/restart-all-services. Run after 8082 is up.
# Usage: ./test_restart_endpoint.sh   (or: bash test_restart_endpoint.sh)
set -e
BASE="${BASE_URL:-http://localhost:8082}"
echo "=== Testing restart endpoint at $BASE ==="
echo "1. Login..."
LOGIN=$(curl -s -c /tmp/restart_test_cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"administrator","org_id":"admin"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('session_token',''))" 2>/dev/null || true)
if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN"
  exit 1
fi
echo "   OK (session_token present)"
echo "2. POST /admin/restart-all-services (with session)..."
RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE/admin/restart-all-services?session_token=$TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $TOKEN" \
  -b /tmp/restart_test_cookies.txt \
  --max-time 5 || true)
HTTP_CODE=$(echo "$RESP" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESP" | sed '/HTTP_CODE:/d')
echo "   HTTP $HTTP_CODE"
echo "   Body: $BODY"
if [ "$HTTP_CODE" = "200" ]; then
  echo "   PASS: Restart endpoint returned 200 (success or restart-in-progress)."
else
  echo "   FAIL: Expected 200, got $HTTP_CODE. Rebuild emv-program and retry."
  exit 1
fi
