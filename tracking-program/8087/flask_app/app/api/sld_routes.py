"""
SLD (Single-Line Drawing) routes.

POST /api/sld/analyze              — submit PDF or image, returns job_id immediately
GET  /api/sld/analyze/<job_id>     — poll for result (pending / done / error)
POST /api/project/<id>/sld/accept  — save placements + sldAnalysis to project
POST /api/project/<id>/sld/dismiss — dismiss review (front-end only, no DB change)
"""
import logging
import os
import threading
import time
import uuid

import requests as _requests
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.helpers.decorators import license_required
from app.db.request_session import get_session
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)

sld_bp = Blueprint("sld", __name__, url_prefix="")

# Shared with bill_routes — same GPU server, same port
SLD_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")
SLD_PLATFORM_TIMEOUT = int(os.environ.get("BILL_PLATFORM_TIMEOUT", "600"))

_SLD_JOBS: dict = {}
_SLD_JOBS_LOCK = threading.Lock()
_SLD_JOB_TTL = 1800  # 30 minutes


def _prune_sld_jobs() -> None:
    now = time.time()
    with _SLD_JOBS_LOCK:
        stale = [k for k, v in _SLD_JOBS.items() if now - v.get("created_at", 0) > _SLD_JOB_TTL]
        for k in stale:
            del _SLD_JOBS[k]


_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}


def _run_sld_extraction(job_id: str, file_bytes: bytes, filename: str, bill_peak_kw=None) -> None:
    platform_url = SLD_PLATFORM_URL
    poll_interval = 5
    max_wait = SLD_PLATFORM_TIMEOUT

    try:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
        ct = _CONTENT_TYPES.get(ext, "application/octet-stream")

        extra_data = {}
        if bill_peak_kw is not None:
            extra_data["bill_peak_kw"] = str(bill_peak_kw)

        logger.info("SLD job %s: POSTing to %s/slds (file=%s peak_kw=%s)", job_id, platform_url, filename, bill_peak_kw)
        resp = _requests.post(
            f"{platform_url}/slds",
            files={"file": (filename, file_bytes, ct)},
            data=extra_data,
            timeout=60,
        )
        resp.raise_for_status()
        sld_id = resp.json()["id"]
        logger.info("SLD job %s: platform sld_id=%s", job_id, sld_id)

        deadline = time.time() + max_wait
        while time.time() < deadline:
            time.sleep(poll_interval)
            poll = _requests.get(f"{platform_url}/slds/{sld_id}", timeout=15)
            if poll.status_code == 404:
                logger.info("SLD job %s: 404 while polling sld_id=%s — still processing", job_id, sld_id)
                continue
            poll.raise_for_status()
            data = poll.json()
            status = data.get("status")
            logger.info("SLD job %s: poll status=%s", job_id, status)

            if status == "pending_review":
                with _SLD_JOBS_LOCK:
                    _SLD_JOBS[job_id].update({
                        "status": "done",
                        "sld_id": sld_id,
                        "result": data.get("result") or {},
                    })
                return
            elif status == "failed":
                raw = (data.get("raw_notes") or "").strip()
                with _SLD_JOBS_LOCK:
                    _SLD_JOBS[job_id].update({
                        "status": "error",
                        "error": f"SLD parsing failed: {raw}" if raw else "SLD parsing failed. Please try again.",
                    })
                return
            # status == "processing" → keep polling

        # Timeout
        with _SLD_JOBS_LOCK:
            _SLD_JOBS[job_id].update({
                "status": "error",
                "error": "SLD analysis timed out. Please try again with a smaller file or narrower page range.",
            })

    except _requests.ConnectionError:
        logger.warning("SLD job %s: cannot reach platform at %s", job_id, platform_url)
        with _SLD_JOBS_LOCK:
            _SLD_JOBS[job_id].update({
                "status": "error",
                "error": "Cannot connect to the SLD processing service. Please try again later.",
            })
    except Exception:
        logger.exception("SLD extraction error for job %s", job_id)
        with _SLD_JOBS_LOCK:
            _SLD_JOBS[job_id].update({
                "status": "error",
                "error": "SLD analysis failed. Please try again.",
            })


@sld_bp.route("/api/sld/analyze", methods=["POST"])
@login_required
@license_required
def analyze_sld():
    """POST /api/sld/analyze — submit SLD file for async AI extraction."""
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

    _prune_sld_jobs()
    job_id = str(uuid.uuid4())
    with _SLD_JOBS_LOCK:
        _SLD_JOBS[job_id] = {"status": "pending", "created_at": time.time()}

    filename = file.filename or "sld.pdf"
    t = threading.Thread(
        target=_run_sld_extraction,
        args=(job_id, file_bytes, filename, bill_peak_kw),
        daemon=True,
    )
    t.start()

    logger.info("SLD analyze job %s started (file=%s)", job_id, filename)
    return jsonify({"success": True, "job_id": job_id, "status": "pending"}), 202


@sld_bp.route("/api/sld/analyze/<job_id>", methods=["GET"])
@login_required
def analyze_sld_status(job_id: str):
    """GET /api/sld/analyze/<job_id> — poll for result."""
    with _SLD_JOBS_LOCK:
        job = _SLD_JOBS.get(job_id)
    if not job:
        return jsonify({"status": "error", "error": "Job not found or expired"}), 404

    status = job.get("status", "pending")
    if status == "done":
        return jsonify({
            "status": "done",
            "success": True,
            "sld_id": job.get("sld_id"),
            "result": job.get("result", {}),
        })
    elif status == "error":
        return jsonify({"status": "error", "success": False, "error": job.get("error", "Unknown error")})
    else:
        return jsonify({"status": status})


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
