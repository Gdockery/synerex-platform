"""
Errands Flask app - port 1340.
Cron jobs POST to: /check-payment, /sync-data, /schedule-switches.
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

from flask import Flask

from app.config import Config
from app.extensions import db
from app import models  # noqa: F401
from app.services.rollup_errands import (
    run_check_payment,
    run_schedule_switches,
    run_sync_data,
)
from app.services.alert_service import check_all_alert_conditions

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)


@app.route("/check-payment", methods=["POST"])
def handle_check_payment():
    with app.app_context():
        run_check_payment()
    return "", 200


@app.route("/sync-data", methods=["POST"])
def handle_sync_data():
    with app.app_context():
        run_sync_data()
    return "", 200


@app.route("/schedule-switches", methods=["POST"])
def handle_schedule_switches():
    with app.app_context():
        run_schedule_switches()
    return "", 200


@app.route("/check-alerts", methods=["POST"])
def handle_check_alerts():
    """Check meter/repeater/switch alert conditions for all projects."""
    with app.app_context():
        try:
            check_all_alert_conditions()
            return "Alert check complete.", 200
        except Exception as e:
            return str(e), 500


@app.route("/migrate-xuid", methods=["POST"])
def handle_migrate_xuid():
    """Ported from errands/migrate-xuid.js. Full DataSync doMigrate."""
    with app.app_context():
        try:
            from app.services.datasync_migration import do_migrate
            ok, msg = do_migrate()
            return msg, 200 if ok else 500
        except Exception as e:
            return str(e), 500


@app.route("/undo-migrate-xuid", methods=["POST"])
def handle_undo_migrate_xuid():
    """Ported from errands/undo-migrate-xuid.js. Full DataSync undoMigrate."""
    with app.app_context():
        try:
            from app.services.datasync_migration import undo_migrate
            ok, msg = undo_migrate()
            return msg, 200 if ok else 500
        except Exception as e:
            return str(e), 500


@app.route("/test", methods=["GET"])
def handle_test():
    """Ported from errands/test.js. Dev endpoint - recreates delete triggers."""
    with app.app_context():
        try:
            from app.services.datasync_migration import destroy_delete_triggers, create_delete_triggers
            destroy_delete_triggers()
            create_delete_triggers()
            return "Delete triggers recreated.", 200
        except Exception as e:
            return f"Done with error: {e}", 200


@app.route("/reload", methods=["GET"])
def handle_reload():
    """Ported from errands/reload.js. No actions equivalent."""
    return "Flask does not support hot reload", 200


@app.route("/health")
def health():
    return {"status": "healthy"}, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 1340))
    app.run(host="0.0.0.0", port=port)
