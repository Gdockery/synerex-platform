"""
Bill routes - standalone bill scan for Scan Bill First flow.

POST /api/bill/analyze        — submit PDF, returns job_id immediately
GET  /api/bill/analyze/<id>   — poll for result (pending / done / error)

The AI vision extraction (qwen2.5vl:32b) takes ~2 minutes for a 3-page bill,
which exceeds typical HTTP proxy timeouts. The async job pattern keeps the
initial POST fast and lets the frontend poll until the result is ready.
"""
import base64
import logging
import threading
import time
import uuid

import fitz  # PyMuPDF — page rendering only, not text extraction
from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required
from app.services.bill_ai_extractor import extract_bill_from_images, find_meters_from_images

logger = logging.getLogger(__name__)

bill_bp = Blueprint("bill", __name__, url_prefix="")

# In-memory job store: job_id → { status, result, error, created_at }
# Jobs are pruned after 30 minutes to avoid memory leaks.
_JOBS: dict = {}
_JOBS_LOCK = threading.Lock()
_JOB_TTL = 1800  # 30 minutes


def _prune_jobs() -> None:
    now = time.time()
    with _JOBS_LOCK:
        stale = [jid for jid, j in _JOBS.items() if now - j["created_at"] > _JOB_TTL]
        for jid in stale:
            del _JOBS[jid]


def _run_extraction(job_id: str, image_b64_list: list, app) -> None:
    """Background thread: run AI extraction and store result in _JOBS."""
    with app.app_context():
        try:
            meters = find_meters_from_images(image_b64_list)
            result = extract_bill_from_images(image_b64_list, selected_meters=meters or None)
            with _JOBS_LOCK:
                if result:
                    meaningful = [k for k in result if k != "lineItems" and result[k] not in (None, "", [])]
                    _JOBS[job_id].update({
                        "status": "done",
                        "result": result,
                        "partial": len(meaningful) < 5,
                    })
                else:
                    _JOBS[job_id].update({
                        "status": "error",
                        "error": "AI could not extract bill data from this PDF. Please enter the information manually.",
                    })
        except TimeoutError as e:
            with _JOBS_LOCK:
                _JOBS[job_id].update({"status": "error", "error": str(e)})
        except Exception as e:
            logger.exception("AI bill extraction error for job %s", job_id)
            with _JOBS_LOCK:
                _JOBS[job_id].update({"status": "error", "error": "AI extraction failed. Please try again."})


@bill_bp.route("/api/bill/analyze", methods=["POST"])
@login_required
@license_required
def analyze_bill():
    """
    POST /api/bill/analyze
    Multipart form: 'bill' = PDF file.
    Returns immediately: { job_id, status: 'pending' }
    Poll GET /api/bill/analyze/<job_id> for the result.
    """
    if "bill" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded", "data": {}}), 400

    file = request.files["bill"]
    if not file or not file.filename:
        return jsonify({"success": False, "error": "No file selected", "data": {}}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "File must be a PDF", "data": {}}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 10 * 1024 * 1024:
        return jsonify({"success": False, "error": "File too large (max 10MB)", "data": {}}), 400

    try:
        pdf_buffer = file.read()
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to read file: {e}", "data": {}}), 500

    if not pdf_buffer or len(pdf_buffer) < 100:
        return jsonify({"success": False, "error": "File appears empty or corrupted", "data": {}}), 400

    # Render PDF pages to PNG images
    try:
        doc = fitz.open(stream=pdf_buffer, filetype="pdf")
        image_b64_list = []
        for page in doc:
            pix = page.get_pixmap(dpi=150)
            image_b64_list.append(base64.b64encode(pix.tobytes("png")).decode())
        doc.close()
    except Exception:
        current_app.logger.exception("PDF render error")
        return jsonify({
            "success": False,
            "error": "Failed to render PDF pages. The file may be corrupted or password-protected.",
            "data": {},
        }), 500

    if not image_b64_list:
        return jsonify({"success": False, "error": "PDF has no pages", "data": {}}), 400

    _prune_jobs()

    job_id = str(uuid.uuid4())
    with _JOBS_LOCK:
        _JOBS[job_id] = {"status": "pending", "created_at": time.time()}

    app = current_app._get_current_object()
    t = threading.Thread(target=_run_extraction, args=(job_id, image_b64_list, app), daemon=True)
    t.start()

    logger.info("Bill analyze job %s started (%d pages)", job_id, len(image_b64_list))
    return jsonify({"success": True, "job_id": job_id, "status": "pending"}), 202


@bill_bp.route("/api/bill/analyze/<job_id>", methods=["GET"])
@login_required
def analyze_bill_status(job_id: str):
    """
    GET /api/bill/analyze/<job_id>
    Returns:
      { status: 'pending' }                              — still running
      { status: 'done', success: true, data: {...} }     — complete
      { status: 'error', success: false, error: '...' }  — failed
      404 if job_id unknown or expired
    """
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)

    if not job:
        return jsonify({"success": False, "error": "Job not found or expired"}), 404

    if job["status"] == "pending":
        return jsonify({"status": "pending", "success": True}), 200

    if job["status"] == "error":
        return jsonify({"status": "error", "success": False, "error": job.get("error", "Unknown error"), "data": {}}), 200

    # done
    result = job.get("result") or {}
    meaningful = [k for k in result if k != "lineItems" and result[k] not in (None, "", [])]
    return jsonify({
        "status": "done",
        "success": True,
        "data": result,
        "partial": len(meaningful) < 5,
    }), 200
