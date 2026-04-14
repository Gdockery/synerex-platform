"""
Bill routes - standalone bill scan for Scan Bill First flow.

POST /api/bill/analyze        — submit PDF, returns job_id immediately
GET  /api/bill/analyze/<id>   — poll for result (pending / done / error)

Extraction is delegated to the bill-platform FastAPI service (port 8000),
which runs qwen2.5vl:32b with refined prompts and post-processing for
tiered billing, multilingual bills, rate calculations, etc.
"""
import logging
import os
import threading
import time
import uuid

import requests as _requests
from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required

logger = logging.getLogger(__name__)

bill_bp = Blueprint("bill", __name__, url_prefix="")

# Bill-platform FastAPI service URL (same host, port 8000)
BILL_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")
# How long to wait total for the GPU to finish (seconds)
BILL_PLATFORM_TIMEOUT = int(os.environ.get("BILL_PLATFORM_TIMEOUT", "1200"))

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


def _map_platform_result(parse: dict) -> dict:
    """
    Convert bill-platform ParseResult dict into the format the tracking
    frontend expects (same shape as the old bill_ai_extractor output).
    """
    # Map lineItems: {description, amount, units, ratePerUnit, meterKwh, meterKwPeak}
    #             → {name, unit, type, cost, billingRate, quantity}
    line_items = []
    for li in (parse.get("lineItems") or []):
        units = str(li.get("units") or "").lower()
        if "kwh" in units or "kwh" in str(li.get("description") or "").lower():
            item_type = "kwh"
        elif "kw" in units:
            item_type = "kw"
        elif "tax" in units or "tax" in str(li.get("description") or "").lower():
            item_type = "tax"
        else:
            item_type = "fixed"
        qty = li.get("meterKwh") or li.get("meterKwPeak") or 0
        line_items.append({
            "name": li.get("description") or "",
            "unit": li.get("units") or "",
            "type": item_type,
            "cost": li.get("amount") or 0,
            "billingRate": li.get("ratePerUnit") or 0,
            "quantity": qty,
        })

    # Strip currency symbol from billAmount so frontend gets a plain number
    bill_amount_raw = str(parse.get("billAmount") or "")
    bill_amount = bill_amount_raw.strip()
    for sym in ("NT$", "$", "€", "£", "¥", "₩"):
        bill_amount = bill_amount.replace(sym, "")
    bill_amount = bill_amount.replace(",", "").strip()

    # Convert billDate string → epoch milliseconds (frontend expects epoch ms)
    bill_date = None
    bill_date_str = parse.get("billDate")
    if bill_date_str:
        from datetime import datetime
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(str(bill_date_str)[:10], fmt)
                bill_date = int(dt.timestamp() * 1000)
                break
            except (ValueError, TypeError):
                continue

    currency = parse.get("currency") or "USD"
    currency_sym = {"USD": "$", "TWD": "NT$", "NTD": "NT$", "EUR": "€",
                    "GBP": "£", "JPY": "¥", "KRW": "₩", "CAD": "$"}.get(currency, "$")

    return {
        "customerName":          parse.get("customerName") or "",
        "accountNumber":         parse.get("accountNumber") or "",
        "billDate":              bill_date,
        "billAmount":            bill_amount,
        "electricCompanyName":   parse.get("electricCompanyName") or "",
        "electricCompanyAddress":parse.get("electricCompanyAddress") or "",
        "electricCompanyCity":   parse.get("electricCompanyCity") or "",
        "electricCompanyState":  parse.get("electricCompanyState") or "",
        "electricCompanyZip":    parse.get("electricCompanyZip") or "",
        "serviceAddress":        parse.get("serviceAddress") or "",
        "serviceCity":           parse.get("serviceCity") or "",
        "serviceState":          parse.get("serviceState") or "",
        "serviceZip":            parse.get("serviceZip") or "",
        "meterNumber":           parse.get("meterNumber") or "",
        "totalKwh":              parse.get("totalKwh") or "",
        "kwPeak":                parse.get("kwPeak") or "",
        "kwhRate":               parse.get("kwhRate") or "",
        "kwRatePerTariff":       parse.get("kwRatePerTariff") or "",
        "daysBilled":            parse.get("daysBilled") or "",
        "customerCharge":        parse.get("customerCharge") or "",
        "taxAmount":             parse.get("taxAmount") or "",
        "tariff":                parse.get("tariff") or "",
        "billReference":         parse.get("billReference") or "",
        "voltage":               parse.get("voltage") or "",
        "currencySymbol":        currency_sym,
        "lineItems":             line_items,
    }


def _run_extraction(job_id: str, pdf_buffer: bytes, filename: str) -> None:
    """
    Background thread: POST the PDF to bill-platform, poll until done,
    then store the mapped result in _JOBS.
    """
    platform_url = BILL_PLATFORM_URL
    poll_interval = 5   # seconds between status checks
    max_wait = BILL_PLATFORM_TIMEOUT

    try:
        # 1. Submit PDF to bill-platform
        logger.info("Bill job %s: POSTing to %s/bills", job_id, platform_url)
        resp = _requests.post(
            f"{platform_url}/bills",
            files={"file": (filename, pdf_buffer, "application/pdf")},
            timeout=30,
        )
        resp.raise_for_status()
        bill_id = resp.json()["id"]
        logger.info("Bill job %s: bill-platform bill_id=%s", job_id, bill_id)

        # 2. Poll until status changes from "processing"
        deadline = time.time() + max_wait
        while time.time() < deadline:
            time.sleep(poll_interval)
            poll = _requests.get(f"{platform_url}/bills/{bill_id}", timeout=15)
            poll.raise_for_status()
            data = poll.json()
            status = data.get("status")
            logger.info("Bill job %s: poll status=%s", job_id, status)

            if status in ("pending_review", "approved"):
                parse = data.get("initial_parse") or {}
                result = _map_platform_result(parse)
                meaningful = [k for k in result if k not in ("lineItems", "currencySymbol") and result[k] not in (None, "", [])]
                with _JOBS_LOCK:
                    _JOBS[job_id].update({
                        "status": "done",
                        "result": result,
                        "partial": len(meaningful) < 5,
                    })
                return
            elif status == "failed":
                with _JOBS_LOCK:
                    _JOBS[job_id].update({
                        "status": "error",
                        "error": "Bill parsing failed on the AI server. Please try again or enter data manually.",
                    })
                return
            # status == "processing" → keep polling

        # Timed out
        with _JOBS_LOCK:
            _JOBS[job_id].update({
                "status": "error",
                "error": "AI extraction timed out. The bill may be very complex. Please try again or enter data manually.",
            })

    except _requests.ConnectionError:
        logger.warning("Bill job %s: cannot reach bill-platform at %s", job_id, platform_url)
        with _JOBS_LOCK:
            _JOBS[job_id].update({
                "status": "error",
                "error": "Cannot connect to the bill processing service. Please try again later.",
            })
    except Exception:
        logger.exception("Bill platform extraction error for job %s", job_id)
        with _JOBS_LOCK:
            _JOBS[job_id].update({
                "status": "error",
                "error": "AI extraction failed. Please try again or enter data manually.",
            })


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

    _prune_jobs()

    job_id = str(uuid.uuid4())
    with _JOBS_LOCK:
        _JOBS[job_id] = {"status": "pending", "created_at": time.time()}

    filename = file.filename or "bill.pdf"
    t = threading.Thread(target=_run_extraction, args=(job_id, pdf_buffer, filename), daemon=True)
    t.start()

    logger.info("Bill analyze job %s started", job_id)
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
