"""
Bill PDF Extractor - extracts text/data from electric bill PDFs.
Pipeline: 1) AcroForm fields, 2) PyMuPDF text, 3) OCR fallback for scanned PDFs.
Ported from analyze-electric-bill.js + pdf-form-extractor + pdf-ocr.
"""
import logging
import re
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MIN_TEXT_LENGTH_FOR_OCR = 80
OCR_TIMEOUT_SEC = 120


def _should_use_ocr(text: str) -> bool:
    """Return True if extracted text is too short and we should try OCR."""
    if not text or not isinstance(text, str):
        return True
    trimmed = re.sub(r"\s", "", text).strip()
    return len(trimmed) < MIN_TEXT_LENGTH_FOR_OCR


def _extract_from_form_fields(pdf_buffer: bytes) -> dict[str, Any]:
    """Extract bill data from PDF AcroForm fields (fillable PDFs)."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_buffer, filetype="pdf")
        result = {}

        # PyMuPDF form field iteration
        for page in doc:
            for widget in page.widgets():
                if widget is None:
                    continue
                try:
                    name = widget.field_name or ""
                    value = widget.field_value
                    if value is None or (isinstance(value, str) and not value.strip()):
                        continue

                    val_str = str(value).strip() if value else ""

                    # Map common field names to our keys (from pdf-form-extractor.js)
                    name_lower = name.lower().replace(" ", "").replace("_", "").replace("-", "")
                    if "usage" in name_lower or "kwh" in name_lower or "totalkwh" in name_lower:
                        m = re.search(r"[\d.]+", val_str.replace(",", ""))
                        if m and "totalKwh" not in result:
                            result["totalKwh"] = m.group(0)
                    elif "demand" in name_lower or "kw" in name_lower or "peak" in name_lower:
                        m = re.search(r"[\d.]+", val_str.replace(",", ""))
                        if m and "kwPeak" not in result:
                            result["kwPeak"] = m.group(0)
                    elif "total" in name_lower or "due" in name_lower or "amount" in name_lower or "balance" in name_lower:
                        m = re.search(r"[\d.]+", val_str.replace("$", "").replace(",", ""))
                        if m and "billAmount" not in result:
                            result["billAmount"] = m.group(0)
                    elif "account" in name_lower or "acct" in name_lower:
                        if val_str and "accountNumber" not in result:
                            result["accountNumber"] = val_str
                    elif "meter" in name_lower:
                        if val_str and "meterNumber" not in result:
                            result["meterNumber"] = val_str
                    elif "service" in name_lower and "address" in name_lower:
                        if val_str and "serviceAddress" not in result:
                            result["serviceAddress"] = val_str
                    elif "utility" in name_lower or "company" in name_lower:
                        if val_str and "electricCompanyName" not in result:
                            result["electricCompanyName"] = val_str
                except Exception:
                    continue
        doc.close()

        has_min = result.get("totalKwh") or result.get("kwPeak") or result.get("billAmount")
        return {
            "success": bool(has_min),
            "data": result,
            "partial": has_min and not (
                result.get("totalKwh") and result.get("kwPeak") and result.get("billAmount")
            ),
        }
    except Exception as e:
        logger.debug("Form field extraction failed: %s", e)
        return {"success": False, "data": {}}


def _extract_text_pymupdf(pdf_buffer: bytes) -> str:
    """Extract raw text from PDF using PyMuPDF."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_buffer, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts).strip()
    except Exception as e:
        logger.warning("PyMuPDF text extraction failed: %s", e)
        return ""


def _extract_text_via_ocr(pdf_buffer: bytes, temp_dir: Path, base_name: str) -> str:
    """Extract text from PDF using pdf2image + pytesseract (for scanned/image PDFs)."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract

        images = convert_from_bytes(
            pdf_buffer,
            dpi=200,
            fmt="png",
        )
        if not images:
            return ""

        full_text = []
        for i, img in enumerate(images):
            page_path = temp_dir / f"{base_name}-{i + 1}.png"
            try:
                img.save(str(page_path))
                text = pytesseract.image_to_string(page_path)
                full_text.append(text or "")
            finally:
                if page_path.exists():
                    page_path.unlink(missing_ok=True)

        return "\n".join(full_text).strip()
    except ImportError as e:
        logger.warning("OCR dependencies not available: %s. Install pdf2image and pytesseract.", e)
        return ""
    except Exception as e:
        logger.warning("OCR extraction failed: %s", e)
        return ""


def extract_bill_data(pdf_buffer: bytes, temp_dir: Path | None = None) -> dict[str, Any]:
    """
    Extract bill data from PDF. Pipeline:
    1. Try AcroForm fields
    2. Try PyMuPDF text extraction + parser
    3. If text too short, try OCR
    Returns: { success, data, partial? }
    """
    base_name = f"analyze-bill-standalone-{hash(pdf_buffer) % 10**8}"
    use_temp = temp_dir or Path(tempfile.gettempdir()) / "bill_analyze"
    use_temp.mkdir(parents=True, exist_ok=True)

    from app.services.electric_bill_parser import parse as parse_text

    def finish_with_text(text: str):
        parsed = parse_text(text or "")
        if parsed.get("success"):
            return {
                "success": True,
                "data": parsed["data"],
                "partial": parsed.get("partial", False),
            }
        if parsed.get("data") and parsed["data"]:
            return {
                "success": True,
                "data": parsed["data"],
                "partial": True,
            }
        return {
            "success": False,
            "error": "Could not extract bill data from PDF. Please enter the information manually.",
            "data": {},
        }

    # 1. Try form fields first
    form_result = _extract_from_form_fields(pdf_buffer)
    if form_result.get("success") and (
        form_result.get("data", {}).get("totalKwh")
        or form_result.get("data", {}).get("billAmount")
        or form_result.get("data", {}).get("kwPeak")
    ):
        logger.info("Bill PDF: extracted data from form fields")
        return {
            "success": True,
            "data": form_result["data"],
            "partial": form_result.get("partial", False),
        }

    # 2. PyMuPDF text extraction
    text = _extract_text_pymupdf(pdf_buffer)
    if not _should_use_ocr(text):
        return finish_with_text(text)

    # 3. OCR fallback
    logger.info("Bill PDF has little text, trying OCR for scanned/image PDF...")
    ocr_text = _extract_text_via_ocr(pdf_buffer, use_temp, base_name)
    return finish_with_text(ocr_text or text)
