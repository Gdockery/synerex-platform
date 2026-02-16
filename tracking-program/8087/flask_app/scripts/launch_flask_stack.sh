#!/bin/bash
# Launch Flask stack for cutover.
# Run from tracking-program/ directory.
# Main: 8087, Rollup: 1339, Errands: 1340

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PARENT="$(dirname "$ROOT")"

echo "Starting Flask stack..."
echo "  Main:    http://localhost:8087"
echo "  Rollup:  http://localhost:1339/health"
echo "  Errands: http://localhost:1340/health"

# Rollup in background (sibling of 8087/)
[ -d "$PARENT/../8087-rollup" ] && (cd "$PARENT/../8087-rollup" && PORT=1339 python run.py &)

# Errands in background
[ -d "$PARENT/../8087-errands" ] && (cd "$PARENT/../8087-errands" && PORT=1340 python run.py &)

# Main in foreground
PORT=8087 python run.py
