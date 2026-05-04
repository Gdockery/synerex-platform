"""
Bill routes — bill scan for Bill Analytic flow.

POST /api/bill/analyze      — submit PDF to GPU, return GPU job ID immediately
GET  /api/bill/analyze/<id> — pure GPU proxy, maps response to Angular format
"""
import logging
import os

import requests as _requests
from flask import Blueprint, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required

logger = logging.getLogger(__name__)

bill_bp = Blueprint("bill", __name__, url_prefix="")

BILL_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")


def _map_platform_result(parse: dict) -> dict:
    """
    Convert bill-platform ParseResult dict into the format the tracking
    frontend expects (same shape as the old bill_ai_extractor output).
    """
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

    bill_amount_raw = str(parse.get("billAmount") or "")
    bill_amount = bill_amount_raw.strip()
    for sym in ("NT$", "$", "€", "£", "¥", "₩"):
        bill_amount = bill_amount.replace(sym, "")
    bill_amount = bill_amount.replace(",", "").strip()

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
        "customerName":           parse.get("customerName") or "",
        "accountNumber":          parse.get("accountNumber") or "",
        "billDate":               bill_date,
        "billAmount":             bill_amount,
        "electricCompanyName":    parse.get("electricCompanyName") or "",
        "electricCompanyAddress": parse.get("electricCompanyAddress") or "",
        "electricCompanyCity":    parse.get("electricCompanyCity") or "",
        "electricCompanyState":   parse.get("electricCompanyState") or "",
        "electricCompanyZip":     parse.get("electricCompanyZip") or "",
        "serviceAddress":         parse.get("serviceAddress") or "",
        "serviceCity":            parse.get("serviceCity") or "",
        "serviceState":           parse.get("serviceState") or "",
        "serviceZip":             parse.get("serviceZip") or "",
        "meterNumber":            parse.get("meterNumber") or "",
        "totalKwh":               parse.get("totalKwh") or "",
        "kwPeak":                 parse.get("kwPeak") or "",
        "kwhRate":                parse.get("kwhRate") or "",
        "kwRatePerTariff":        parse.get("kwRatePerTariff") or "",
        "daysBilled":             parse.get("daysBilled") or "",
        "customerCharge":         parse.get("customerCharge") or "",
        "taxAmount":              parse.get("taxAmount") or "",
        "tariff":                 parse.get("tariff") or "",
        "billReference":          parse.get("billReference") or "",
        "voltage":                parse.get("voltage") or "",
        "currencySymbol":         currency_sym,
        "lineItems":              line_items,
    }


@bill_bp.route("/api/bill/analyze", methods=["POST"])
@login_required
@license_required
def analyze_bill():
    """
    POST /api/bill/analyze
    Submits PDF to GPU server, returns GPU job ID immediately.
    Angular saves { gpu_job_id, filename, estimated_minutes } to localStorage
    and polls GET /api/bill/analyze/<gpu_id> via My Jobs.
    """
    if "bill" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["bill"]
    if not file or not file.filename:
        return jsonify({"success": False, "error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "File must be a PDF"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 50 * 1024 * 1024:
        return jsonify({"success": False, "error": "File too large (max 50MB)"}), 400

    try:
        pdf_buffer = file.read()
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to read file: {e}"}), 500

    if not pdf_buffer or len(pdf_buffer) < 100:
        return jsonify({"success": False, "error": "File appears empty or corrupted"}), 400

    filename = file.filename or "bill.pdf"

    # Optional params forwarded to GPU
    meters = request.form.get("meters", "").strip() or None
    page_range = request.form.get("page_range", "").strip() or None

    extra_data = {}
    if meters:
        extra_data["meters"] = meters
    if page_range:
        extra_data["page_range"] = page_range

    try:
        resp = _requests.post(
            f"{BILL_PLATFORM_URL}/bills",
            files={"file": (filename, pdf_buffer, "application/pdf")},
            data=extra_data,
            timeout=60,
        )
        resp.raise_for_status()
    except _requests.ConnectionError:
        return jsonify({"success": False, "error": "Cannot connect to the bill processing service. Please try again later."}), 503
    except _requests.HTTPError as e:
        return jsonify({"success": False, "error": f"GPU server error: {e.response.status_code}"}), 502
    except Exception as e:
        logger.exception("Failed to submit bill to GPU")
        return jsonify({"success": False, "error": f"Failed to submit bill: {e}"}), 500

    gpu_data = resp.json()
    gpu_id = gpu_data.get("id")
    estimated_minutes = gpu_data.get("estimated_minutes", 10)

    logger.info("Bill submitted to GPU: gpu_id=%s file=%s meters=%s page_range=%s", gpu_id, filename, meters, page_range)
    return jsonify({
        "success": True,
        "job_id": gpu_id,
        "job_type": "bill",
        "filename": filename,
        "estimated_minutes": estimated_minutes,
        "status": "pending",
    }), 202


@bill_bp.route("/api/bill/analyze/<gpu_id>", methods=["GET"])
@login_required
def analyze_bill_status(gpu_id: str):
    """
    GET /api/bill/analyze/<gpu_id>
    Pure GPU proxy — maps GPU response to Angular-expected format.
    GPU is the source of truth; no in-memory state needed.
    """
    try:
        poll = _requests.get(f"{BILL_PLATFORM_URL}/bills/{gpu_id}", timeout=15)
    except _requests.ConnectionError:
        return jsonify({"status": "error", "error": "Cannot reach GPU server"}), 503
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    if poll.status_code == 404:
        # GPU may return 404 while still starting up — treat as still processing
        return jsonify({"status": "pending", "success": True}), 200

    try:
        poll.raise_for_status()
    except _requests.HTTPError:
        return jsonify({"status": "error", "error": f"GPU error: {poll.status_code}"}), 200

    data = poll.json()
    status = data.get("status", "")

    if status in ("pending_review", "approved"):
        parse = data.get("corrected_parse") or data.get("initial_parse") or {}
        result = _map_platform_result(parse)
        meaningful = [k for k in result if k not in ("lineItems", "currencySymbol") and result[k] not in (None, "", [])]
        return jsonify({
            "status": "done",
            "success": True,
            "data": result,
            "partial": len(meaningful) < 5,
        }), 200

    elif status == "failed":
        error_notes = data.get("error_notes") or ""
        return jsonify({
            "status": "error",
            "success": False,
            "error": "Bill parsing failed on the AI server. Please try again or enter data manually.",
            "error_notes": error_notes,
        }), 200

    elif status and status.startswith("retrying_"):
        return jsonify({"status": status, "success": True}), 200

    else:
        # processing or unknown — still pending
        return jsonify({"status": "pending", "success": True}), 200
