"""
Rollup Flask app - port 1339.
Cron jobs POST to: /schedule, /cache-instantaneous-readings, /perform-rollup,
/calculate-tests, /accumulate-savings, /schedule-switches.
"""
import os
import sys
from pathlib import Path

# Add main Flask app to path so we can import app.*
_root = Path(__file__).resolve().parent
_main_app = _root.parent / "8087-flask"
sys.path.insert(0, str(_main_app))

# Load env from main app or project root
from dotenv import load_dotenv
_env = _main_app / ".env"
load_dotenv(_env if _env.exists() else _root.parent / ".env")

from flask import Flask, request

from app.config import Config
from app.extensions import db
from app import models  # noqa: F401
from app.services.rollup_errands import (
    run_accumulate_savings,
    run_cache_instantaneous_readings,
    run_calculate_tests,
    run_perform_rollup,
    run_rollup_schedule_tasks,
    run_schedule_switches,
)

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)


@app.route("/schedule", methods=["POST"])
@app.route("/cache-instantaneous-readings", methods=["POST"])
@app.route("/perform-rollup", methods=["POST"])
@app.route("/calculate-tests", methods=["POST"])
@app.route("/accumulate-savings", methods=["POST"])
@app.route("/schedule-switches", methods=["POST"])
def handle_rollup():
    path = request.path
    with app.app_context():
        if "perform-rollup" in path:
            run_perform_rollup()
        elif "cache-instantaneous" in path:
            run_cache_instantaneous_readings()
        elif "calculate-tests" in path:
            run_calculate_tests()
        elif "accumulate-savings" in path:
            run_accumulate_savings()
        elif "schedule-switches" in path:
            run_schedule_switches()
        elif path.endswith("/schedule"):
            run_rollup_schedule_tasks()
    return "", 200


@app.route("/health")
def health():
    return {"status": "healthy"}, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 1339))
    app.run(host="0.0.0.0", port=port)
