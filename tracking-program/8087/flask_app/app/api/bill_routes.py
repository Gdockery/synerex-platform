"""
Bill routes - standalone bill scan for Scan Bill First flow.
POST /api/bill/analyze - extract bill data from PDF using AI vision (qwen2.5vl).
"""
import base64
import logging

import fitz  # PyMuPDF — page rendering only, not text extraction
from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required
from app.services.bill_ai_extractor import extract_bill_from_images, find_meters_from_images

logger = logging.getLogger(__name__)

bill_bp = Blueprint("bill", __name__, url_prefix="")


@bill_bp.route("/api/bill/analyze", methods=["POST"])
@login_required
@license_required
def analyze_bill():
    """
    POST /api/bill/analyze
    Multipart form: 'bill' = PDF file.
    Returns: { success, data?, error?, partial? }
    """
    if "bill" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded", "data": {}}), 400

    file = request.files["bill"]
    if not file or not file.filename:
        return jsonify({"success": False, "error": "No file selected", "data": {}}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "File must be a PDF", "data": {}}), 400

    # 10MB max
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

    # Render each PDF page to a PNG image (no text extraction)
    try:
        doc = fitz.open(stream=pdf_buffer, filetype="pdf")
        image_b64_list = []
        for page in doc:
            pix = page.get_pixmap(dpi=150)
            image_b64_list.append(base64.b64encode(pix.tobytes("png")).decode())
        doc.close()
    except Exception as e:
        current_app.logger.exception("PDF render error")
        return jsonify({
            "success": False,
            "error": "Failed to render PDF pages. The file may be corrupted or password-protected.",
            "data": {},
        }), 500

    if not image_b64_list:
        return jsonify({"success": False, "error": "PDF has no pages", "data": {}}), 400

    # AI vision extraction — no fallback
    try:
        meters = find_meters_from_images(image_b64_list)
        result = extract_bill_from_images(image_b64_list, selected_meters=meters or None)
    except TimeoutError as e:
        return jsonify({"success": False, "error": str(e), "data": {}}), 500
    except Exception as e:
        current_app.logger.exception("AI bill extraction error")
        return jsonify({
            "success": False,
            "error": "AI extraction failed. Please try again.",
            "data": {},
        }), 500

    if not result:
        return jsonify({
            "success": False,
            "error": "AI could not extract bill data from this PDF. Please enter the information manually.",
            "data": {},
        }), 200

    meaningful = [k for k in result if k != "lineItems" and result[k] not in (None, "", [])]
    return jsonify({
        "success": True,
        "data": result,
        "partial": len(meaningful) < 5,
    }), 200
