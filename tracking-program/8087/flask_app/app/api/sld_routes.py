"""
SLD (Single-Line Drawing) routes.

POST /api/sld/analyze              — submit file to GPU, return GPU job ID immediately
GET  /api/sld/analyze/<gpu_id>     — pure GPU proxy
POST /api/project/<id>/sld/accept  — save placements + sldAnalysis to project
POST /api/project/<id>/sld/dismiss — front-end only acknowledgment
"""
import logging
import os

import requests as _requests
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.helpers.decorators import license_required
from app.db.request_session import get_session
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)

sld_bp = Blueprint("sld", __name__, url_prefix="")

SLD_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")

_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}


@sld_bp.route("/api/sld/analyze", methods=["POST"])
@login_required
@license_required
def analyze_sld():
    """
    POST /api/sld/analyze
    Submits SLD file to GPU server, returns GPU job ID immediately.
    Angular saves { gpu_job_id, filename, estimated_minutes } to localStorage
    and polls GET /api/sld/analyze/<gpu_id> via My Jobs.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"success": False, "error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in _CONTENT_TYPES:
        return jsonify({"success": False, "error": "File must be PDF, JPG, PNG, or WebP"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 50 * 1024 * 1024:
        return jsonify({"success": False, "error": "File too large (max 50MB)"}), 400

    try:
        file_bytes = file.read()
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to read file: {e}"}), 500

    bill_peak_kw = None
    try:
        val = request.form.get("bill_peak_kw", "").strip()
        if val:
            bill_peak_kw = float(val)
    except (ValueError, TypeError):
        pass

    filename = file.filename or "sld.pdf"
    ct = _CONTENT_TYPES.get(ext, "application/octet-stream")

    extra_data = {}
    if bill_peak_kw is not None:
        extra_data["bill_peak_kw"] = str(bill_peak_kw)

    try:
        resp = _requests.post(
            f"{SLD_PLATFORM_URL}/slds",
            files={"file": (filename, file_bytes, ct)},
            data=extra_data,
            timeout=60,
        )
        resp.raise_for_status()
    except _requests.ConnectionError:
        return jsonify({"success": False, "error": "Cannot connect to the SLD processing service. Please try again later."}), 503
    except _requests.HTTPError as e:
        return jsonify({"success": False, "error": f"GPU server error: {e.response.status_code}"}), 502
    except Exception as e:
        logger.exception("Failed to submit SLD to GPU")
        return jsonify({"success": False, "error": f"Failed to submit SLD: {e}"}), 500

    gpu_data = resp.json()
    gpu_id = gpu_data.get("id")
    estimated_minutes = gpu_data.get("estimated_minutes", 30)

    logger.info("SLD submitted to GPU: gpu_id=%s file=%s peak_kw=%s", gpu_id, filename, bill_peak_kw)
    return jsonify({
        "success": True,
        "job_id": gpu_id,
        "job_type": "sld",
        "filename": filename,
        "estimated_minutes": estimated_minutes,
        "status": "pending",
    }), 202


@sld_bp.route("/api/sld/analyze/<gpu_id>", methods=["GET"])
@login_required
def analyze_sld_status(gpu_id: str):
    """
    GET /api/sld/analyze/<gpu_id>
    Pure GPU proxy — maps GPU response to Angular-expected format.
    GPU is the source of truth; no in-memory state needed.
    """
    try:
        poll = _requests.get(f"{SLD_PLATFORM_URL}/slds/{gpu_id}", timeout=15)
    except _requests.ConnectionError:
        return jsonify({"status": "error", "error": "Cannot reach GPU server"}), 503
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    if poll.status_code == 404:
        return jsonify({"status": "pending", "success": True}), 200

    try:
        poll.raise_for_status()
    except _requests.HTTPError:
        return jsonify({"status": "error", "error": f"GPU error: {poll.status_code}"}), 200

    data = poll.json()
    status = data.get("status", "")

    if status == "pending_review":
        return jsonify({
            "status": "done",
            "success": True,
            "result": data.get("result") or {},
        }), 200

    elif status == "failed":
        error_notes = data.get("error_notes") or ""
        return jsonify({
            "status": "error",
            "success": False,
            "error": "SLD parsing failed on the AI server. Please try again.",
            "error_notes": error_notes,
        }), 200

    else:
        # processing or unknown
        return jsonify({"status": "pending", "success": True}), 200


@sld_bp.route("/api/project/<int:project_id>/sld/accept", methods=["POST"])
@login_required
@license_required
def accept_sld(project_id: int):
    """POST /api/project/<id>/sld/accept — save placements + sldAnalysis to project."""
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    placements = data.get("placements")
    sld_analysis = data.get("sldAnalysis")

    if placements is None and sld_analysis is None:
        return jsonify({"error": "placements or sldAnalysis required"}), 400

    sess = get_session()
    p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404

    user = sess.query(User).get(current_user.id)
    from app.api.web_routes import _user_can_access_project
    if not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Forbidden"}), 403

    if placements is not None:
        p.placements = placements
    if sld_analysis is not None:
        p.sldAnalysis = sld_analysis
    sess.add(p)
    sess.commit()

    return jsonify({"success": True})


@sld_bp.route("/api/project/<int:project_id>/sld/dismiss", methods=["POST"])
@login_required
@license_required
def dismiss_sld(project_id: int):
    """POST /api/project/<id>/sld/dismiss — front-end only acknowledgment."""
    return jsonify({"success": True})
