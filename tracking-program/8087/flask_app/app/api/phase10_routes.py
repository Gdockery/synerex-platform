"""
Phase 10: Rollup - PUT /api/rollup/* for manual admin trigger.
Cron endpoints run in separate apps: 8087-rollup (1339), 8087-errands (1340).
"""
import logging

from flask import Blueprint, jsonify
from flask_login import login_required

from app.helpers.decorators import license_required
from app.services.rollup_errands import (
    run_accumulate_savings,
    run_generate_monthly_reports,
    run_perform_rollup,
)

logger = logging.getLogger(__name__)

phase10_bp = Blueprint("phase10", __name__, url_prefix="")


@phase10_bp.route("/api/rollup/run-15min-rollup", methods=["PUT"])
@login_required
@license_required
def run_15min_rollup():
    """PUT /api/rollup/run-15min-rollup - manual trigger for perform-rollup."""
    try:
        run_perform_rollup()
        return jsonify({"ok": True})
    except Exception as e:
        logger.exception("run-15min-rollup failed")
        return jsonify({"error": str(e)}), 500


@phase10_bp.route("/api/rollup/run-daily-script", methods=["PUT"])
@login_required
@license_required
def run_daily_script():
    """PUT /api/rollup/run-daily-script - accumulate-savings / daily calculations."""
    try:
        run_accumulate_savings()
        return jsonify({"ok": True})
    except Exception as e:
        logger.exception("run-daily-script failed")
        return jsonify({"error": str(e)}), 500


@phase10_bp.route("/api/rollup/generate-automatic-monthly-reports", methods=["PUT"])
@login_required
@license_required
def generate_automatic_monthly_reports():
    """PUT /api/rollup/generate-automatic-monthly-reports."""
    try:
        run_generate_monthly_reports()
        return jsonify({"ok": True})
    except Exception as e:
        logger.exception("generate-automatic-monthly-reports failed")
        return jsonify({"error": str(e)}), 500
