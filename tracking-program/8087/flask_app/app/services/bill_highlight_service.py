"""
Bill Highlight Service - generates PDF page images with color-coded highlights per extraction category.
Colors: Energy=blue, Demand=orange, Charges=green, Metadata=purple.
"""
import base64
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# Field to category mapping (matches plan)
FIELD_CATEGORY = {
    "totalKwh": "energy",
    "kwhRate": "energy",
    "kwPeak": "demand",
    "kwRatePerTariff": "demand",
    "billAmount": "charges",
    "customerCharge": "charges",
    "taxAmount": "charges",
    "billDate": "metadata",
    "billReference": "metadata",
    "accountNumber": "metadata",
    "meterNumber": "metadata",
    "electricCompanyName": "metadata",
    "electricCompanyAddress": "metadata",
    "electricCompanyCity": "metadata",
    "electricCompanyState": "metadata",
    "electricCompanyZip": "metadata",
    "serviceAddress": "metadata",
    "serviceCity": "metadata",
    "serviceState": "metadata",
    "serviceZip": "metadata",
    "daysBilled": "metadata",
    "tariff": "metadata",
    "voltage": "metadata",
}

# Category to (R,G,B) and opacity
CATEGORY_COLORS = {
    "energy": ((0.2, 0.4, 0.9), 0.4),    # blue
    "demand": ((0.9, 0.5, 0.2), 0.4),    # orange
    "charges": ((0.2, 0.7, 0.3), 0.4),   # green
    "metadata": ((0.6, 0.3, 0.8), 0.4),  # purple
}


def _value_variants(value: str) -> list[str]:
    """Return search variants for better matching (e.g. 6968.95 -> [6968.95, 6,968.95])."""
    if not value or len(value) < 2:
        return []
    v = str(value).strip()
    variants = [v]
    if "," not in v and re.search(r"\d{4,}", v):
        # Add comma-separated: 6968.95 -> 6,968.95
        try:
            n = float(v.replace(",", ""))
            if n >= 1000:
                variants.append(f"{n:,.2f}" if "." in v else f"{int(n):,}")
        except ValueError:
            pass
    if v.replace(",", "").replace(".", "").isdigit():
        variants.append(v.replace(",", ""))  # no commas
    return variants


def generate_highlighted_pages(
    pdf_buffer: bytes, extraction: dict[str, Any], dpi: int = 150
) -> list[dict[str, Any]]:
    """
    Generate list of { page: 1-based index, imageBase64: "..." }.
    Always returns PDF page images; adds colored highlights when extracted values are found.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.warning("PyMuPDF not available; skipping highlight generation")
        return []

    if not pdf_buffer:
        return []

    pages_result: list[dict[str, Any]] = []
    extraction = extraction or {}

    try:
        doc = fitz.open(stream=pdf_buffer, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Add highlight annotations for each extracted value found on this page
            for field, value in extraction.items():
                if value is None or value == "" or field == "lineItems":
                    continue
                value_str = str(value).strip()
                if len(value_str) < 2:
                    continue
                category = FIELD_CATEGORY.get(field, "metadata")
                rgb, opacity = CATEGORY_COLORS.get(category, CATEGORY_COLORS["metadata"])

                for search_str in _value_variants(value_str):
                    try:
                        rects = page.search_for(search_str, quads=False)
                        for r in rects:
                            try:
                                annot = page.add_rect_annot(r)
                                annot.set_colors(fill=rgb, stroke=rgb)
                                annot.set_opacity(opacity)
                                annot.update()
                            except Exception:
                                pass
                    except Exception:
                        pass

            # Always render page to image (with or without highlights)
            try:
                pix = page.get_pixmap(dpi=dpi, alpha=False)
                img_bytes = pix.tobytes("png")
                img_b64 = base64.b64encode(img_bytes).decode("ascii")
                pages_result.append({"page": page_num + 1, "imageBase64": img_b64})
            except Exception as e:
                logger.debug("Page render failed: %s", e)

        doc.close()
    except Exception as e:
        logger.warning("Highlight generation failed: %s", e)

    return pages_result
