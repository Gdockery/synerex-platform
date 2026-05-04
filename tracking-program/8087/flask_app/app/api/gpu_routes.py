"""
GPU utility routes.

GET /api/gpu/queue  — proxy to GPU GET /queue (role 8 admin only).
                      Injects X-Admin-Token server-side; token never reaches browser.
"""
import logging
import os

import requests as _requests
from flask import Blueprint, jsonify
from flask_login import current_user, login_required

logger = logging.getLogger(__name__)

gpu_bp = Blueprint("gpu", __name__, url_prefix="")

GPU_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")
GPU_ADMIN_TOKEN = os.environ.get("GPU_ADMIN_TOKEN", "")


@gpu_bp.route("/api/gpu/queue", methods=["GET"])
@login_required
def get_gpu_queue():
    """
    GET /api/gpu/queue — returns all active GPU jobs across all users.
    Role 8 (Synerex admin) only. Admin token is injected server-side.
    """
    if getattr(current_user, "role", None) != 8:
        return jsonify({"error": "Admin access required"}), 403

    if not GPU_ADMIN_TOKEN:
        return jsonify({"error": "GPU admin token not configured on server"}), 500

    try:
        resp = _requests.get(
            f"{GPU_PLATFORM_URL}/queue",
            headers={"X-Admin-Token": GPU_ADMIN_TOKEN},
            timeout=15,
        )
    except _requests.ConnectionError:
        return jsonify({"error": "Cannot reach GPU server"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if resp.status_code == 403:
        return jsonify({"error": "Admin access required — token rejected by GPU server"}), 403

    try:
        resp.raise_for_status()
    except _requests.HTTPError:
        return jsonify({"error": f"GPU server error: {resp.status_code}"}), 502

    return jsonify(resp.json()), 200
