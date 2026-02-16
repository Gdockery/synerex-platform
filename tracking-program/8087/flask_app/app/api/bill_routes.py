"""
Bill routes - standalone bill scan for Scan Bill First flow.
POST /api/bill/analyze - extract bill data from PDF (no project required).
"""
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required

from app.helpers.decorators import license_required
from app.services.bill_pdf_extractor import extract_bill_data

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

    storage_path = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    temp_dir = storage_path / "temp" if storage_path else Path("/tmp") / "bill_analyze"
    temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = extract_bill_data(pdf_buffer, temp_dir)
    except Exception as e:
        current_app.logger.exception("Bill analysis error")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Failed to read PDF. The file may be corrupted or password-protected.",
                    "data": {},
                }
            ),
            500,
        )

    if result.get("error"):
        return jsonify(
            {
                "success": False,
                "error": result["error"],
                "data": result.get("data", {}),
            }
        ), 200

    return jsonify(
        {
            "success": result.get("success", True),
            "data": result.get("data", {}),
            "partial": result.get("partial", False),
        }
    ), 200
