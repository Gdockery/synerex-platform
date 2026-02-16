#!/bin/sh
# Simple cron-style runner for tracking errands.
# POSTs to check-alerts every 5 minutes.
# Run inside Docker with access to tracking-errands:1340.
set -e
ERANDS_URL="${TRACKING_ERRANDS_URL:-http://tracking-errands:1340}"
while true; do
  sleep 300
  wget -q -O - --post-data="" "$ERANDS_URL/check-alerts" 2>/dev/null || true
done
