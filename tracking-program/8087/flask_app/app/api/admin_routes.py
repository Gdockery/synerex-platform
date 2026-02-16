"""
Admin routes - restart, etc.
Used by Admin Panel for service management.
"""
import logging
import os
import threading
import time

from flask import Blueprint, jsonify, request

from app.services.license_service import verify_jwt

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def admin_required(f):
    """Require admin JWT (verified via License Service) OR X-Admin-Restart-Secret from License Service proxy."""
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow internal calls from License Service proxy (Admin Panel uses session auth there)
        secret = os.environ.get("ADMIN_RESTART_SECRET", "")
        provided = request.headers.get("X-Admin-Restart-Secret")
        if secret and provided and secret == provided:
            return f(*args, **kwargs)

        token = (
            request.headers.get("Authorization", "").replace("Bearer ", "")
            or request.headers.get("X-Session-Token")
            or request.args.get("session_token")
        )
        if not token:
            return jsonify({"error": "Authentication required", "code": "AUTH_REQUIRED"}), 401

        license_url = os.environ.get("LICENSE_SERVICE_URL", "http://localhost:8000")
        if not license_url:
            return jsonify({"error": "License Service URL not configured"}), 500

        claims = verify_jwt(token, license_url)
        if not claims:
            return jsonify({"error": "Invalid or expired token", "code": "TOKEN_INVALID"}), 401

        roles = claims.get("roles") or []
        if "administrator" not in roles and "admin" not in roles:
            return jsonify({
                "error": "Administrator access required",
                "code": "ADMIN_REQUIRED",
                "your_role": "user",
            }), 403

        return f(*args, **kwargs)

    return decorated


def _running_in_container():
    """Detect if we're running in Docker or another container (Compose, K8s, etc.)."""
    # Env override: allow forcing restart behavior when detection fails
    if os.environ.get("RESTART_VIA_EXIT") == "1":
        return True
    # /.dockerenv exists in Docker containers
    if os.path.exists("/.dockerenv"):
        return True
    # Kubernetes
    if os.environ.get("KUBERNETES_SERVICE_HOST"):
        return True
    try:
        with open("/proc/1/cgroup", "r") as f:
            content = f.read()
            return any(x in content for x in ("docker", "containerd", "kubepods"))
    except Exception:
        return False


@admin_bp.route("/restart", methods=["POST"])
@admin_required
def admin_restart():
    """Restart the Tracking Flask app. In Docker/containers, exits so container restarts."""
    try:
        if _running_in_container():
            def _exit_for_restart():
                time.sleep(2)
                os._exit(0)

            t = threading.Thread(target=_exit_for_restart, daemon=True)
            t.start()
            logger.info("Docker detected; scheduling process exit for container restart")
            return jsonify({
                "success": True,
                "message": "Tracking Program restart initiated. The service will be back in a few seconds.",
                "restart_in_progress": True,
            })
        else:
            # Local dev: could invoke Service Manager restart if available
            return jsonify({
                "success": False,
                "message": "Restart from Admin Panel is only supported when running in Docker. For local dev, restart the process manually.",
            }), 400
    except Exception as e:
        logger.exception("admin_restart failed")
        return jsonify({"success": False, "message": str(e)}), 500
