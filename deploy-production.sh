#!/usr/bin/env bash
# deploy-production.sh
# Run on the server: bash /root/synerex-platform/deploy-production.sh
#
# MANUAL STEPS REQUIRED after git merge if conflicts appear in:
#   - docker-compose.yml     (keep network/IP config; add upstream service capabilities)
#   - nginx.conf             (keep IP-based routing; apply new timeout/body-size changes)
#   - emv-program/8082/.env  (revert any 100.91.109.59 / 100.106.19.30 Tailscale IPs)
#
# After resolving conflicts manually, re-run this script with: bash deploy-production.sh --skip-merge
set -euo pipefail
cd "$(dirname "$0")" 2>/dev/null || cd /root/synerex-platform

SKIP_MERGE=false
if [[ "${1:-}" == "--skip-merge" ]]; then
  SKIP_MERGE=true
fi

echo "================================================"
echo " Synerex Production Deploy"
echo "================================================"

if [ "$SKIP_MERGE" = false ]; then
  echo ""
  echo "=== [1] Fetching latest commits ==="
  git fetch origin

  echo ""
  echo "=== [2] Merging origin/master ==="
  echo "   REMINDER: check these files after merge:"
  echo "   - docker-compose.yml  (keep networks/ipv4_address blocks; add new service capabilities)"
  echo "   - nginx.conf          (keep IP-based proxy_pass; apply new timeouts/body-size)"
  echo "   - emv-program/8082/.env  (replace Tailscale IPs — see DEPLOYMENT_OVERRIDES below)"
  echo ""
  if ! git merge origin/master; then
    echo ""
    echo "CONFLICT detected. Resolve the files above, then run:"
    echo "  bash deploy-production.sh --skip-merge"
    exit 1
  fi
  echo "Merge OK."
  echo ""
  echo "--- DEPLOYMENT OVERRIDES TO CHECK ---"
  echo "emv-program/8082/.env — replace any 100.91.109.59 or Tailscale IPs with:"
  echo "  WEBSITE_URL=http://172.18.0.1:8080"
  echo "  EMV_BASE_URL=http://172.18.0.1:8080/emv"
  echo "  SERVICE_MANAGER_URL=http://172.18.0.1:9000"
  echo "  HTML_REPORT_URL=http://172.18.1.15:8084"
  echo "  LOCAL_HOSTNAMES=localhost,127.0.0.1"
  echo "  (see full list in DEPLOYMENT_NOTES in the Cursor plan)"
  echo ""
  read -p "Confirm overrides look correct and press Enter to continue (Ctrl+C to abort)..."
fi

echo ""
echo "=== [3] Creating storage directories ==="
mkdir -p tracking-program/8087/storage/{oem_logo,client_company_logo,company_logo}
echo "Done."

echo ""
echo "=== [4] License-service DB migrations (idempotent) ==="
MYSQL_EXEC="snap run docker exec synerex-platform-mysql-1 mysql -u license_user -pLicensePass123 licensing"

for col_check in \
  "organizations:stripe_customer_id:ALTER TABLE organizations ADD COLUMN stripe_customer_id VARCHAR(255) NULL" \
  "users:reset_token:ALTER TABLE users ADD COLUMN reset_token VARCHAR(128) NULL" \
  "users:reset_token_expires_at:ALTER TABLE users ADD COLUMN reset_token_expires_at DATETIME NULL"
do
  table=$(echo "$col_check" | cut -d: -f1)
  col=$(echo "$col_check" | cut -d: -f2)
  stmt=$(echo "$col_check" | cut -d: -f3-)
  count=$($MYSQL_EXEC -e "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='licensing' AND TABLE_NAME='$table' AND COLUMN_NAME='$col';" 2>/dev/null | tail -1)
  if [ "$count" = "0" ]; then
    $MYSQL_EXEC -e "$stmt;" 2>/dev/null && echo "Added $table.$col" || echo "WARNING: Failed to add $table.$col"
  else
    echo "$table.$col already exists — skipped"
  fi
done

echo ""
echo "=== [5] Creating any missing DB tables (oem_invoices, etc.) ==="
snap run docker exec synerex-platform-license-service-1 python -c \
  "from app.db import engine, Base; from app.models import OemInvoice; Base.metadata.create_all(engine); print('create_all OK')" \
  || echo "WARNING: create_all failed — service may need to be rebuilt first; re-run after step 6"

echo ""
echo "=== [6] Rebuilding services ==="
snap run docker compose up -d --build tracking-program license-service emv-program website

echo ""
echo "=== [7] Restarting proxy ==="
snap run docker compose restart proxy

echo ""
echo "=== Done. Container status: ==="
snap run docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== Smoke-test URLs: ==="
echo "  https://synerexlabs.com"
echo "  https://synerexlabs.com/license/auth/login  (admin@synerex.local / admin123)"
echo "  https://tracking.synerexlabs.com"
echo "  https://emv.synerexlabs.com/emv/"
