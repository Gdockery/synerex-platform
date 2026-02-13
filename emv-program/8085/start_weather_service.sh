#!/bin/bash
# Start the Weather Service on port 8200.
# Run from anywhere; script dir is used as working directory.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EMV_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="${EMV_ROOT}/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/weather_service.log"

echo "Starting Weather Service on port 8200..."

# Kill any existing weather service on 8200
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti:8200 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "Stopping existing process on port 8200 (PID $PID)..."
    kill "$PID" 2>/dev/null || true
    sleep 2
  fi
elif command -v fuser >/dev/null 2>&1; then
  fuser -k 8200/tcp 2>/dev/null || true
  sleep 2
fi

# Start from 8085 so imports and paths resolve
cd "$SCRIPT_DIR"
if [ -d "$EMV_ROOT/venv" ]; then
  . "$EMV_ROOT/venv/bin/activate"
fi
nohup python3 weather_service.py >> "$LOG_FILE" 2>&1 &
PID=$!
echo "Started (PID: $PID). Log: $LOG_FILE"
sleep 2

# Health check
WEATHER_URL="${WEATHER_SERVICE_URL:-http://127.0.0.1:8200}"
if curl -s -m 5 "$WEATHER_URL/health" >/dev/null 2>&1; then
  echo "Weather service is running and healthy at $WEATHER_URL"
else
  echo "Service may still be starting. If fetch still fails, check: tail -f $LOG_FILE"
fi
