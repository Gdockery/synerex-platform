#!/usr/bin/env bash
# Rebuild and restart Docker services. Run from project root.
# Usage: ./scripts/rebuild_restart.sh [service1 service2 ...]
# If no services given, rebuilds and restarts license-service and emv-program.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ $# -eq 0 ]; then
  SERVICES=(license-service emv-program)
else
  SERVICES=("$@")
fi

echo "Rebuilding and restarting: ${SERVICES[*]}"
docker-compose build "${SERVICES[@]}"
# Stop and remove containers first (avoids docker-compose ContainerConfig bug on recreate)
docker-compose stop "${SERVICES[@]}" 2>/dev/null || true
docker-compose rm -f "${SERVICES[@]}" 2>/dev/null || true
docker-compose up -d "${SERVICES[@]}"
# Nginx fix: restart proxy so it re-resolves upstream IPs (avoids 502 from stale cache when emv-program/tracking-program are recreated).
# nginx.conf uses variables in proxy_pass for /emv/ and /tracking/ so DNS is resolved per-request, but a full proxy restart ensures clean state.
docker-compose restart proxy 2>/dev/null || true
echo "Done. Services: ${SERVICES[*]}"
