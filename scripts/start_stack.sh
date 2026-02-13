#!/usr/bin/env bash
# Start the Docker (Phase 4 baseline) stack only. Do not use old per-service scripts.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

docker-compose up --build -d
