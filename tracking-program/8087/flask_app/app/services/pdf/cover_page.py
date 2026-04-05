"""
Cover page generator for Proposal and Bill Analytic PDFs.

Produces a single-page PDF (BytesIO) with:
  1. A full-bleed grayscale background image
  2. OEM primary color painted as a semi-transparent overlay (50% opacity)
  3. Text in OEM secondary color: doc type, OEM name, client name, project, date
"""
from io import BytesIO
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfgen import canvas as rl_canvas

# Default fallback colors when OEM branding is not set
DEFAULT_PRIMARY   = "#1a4f8a"   # deep blue overlay
DEFAULT_SECONDARY = "#ffffff"   # white text


def _hex_to_reportlab(hex_str, fallback_hex):
    """Parse '#rrggbb' → ReportLab HexColor, falling back on error."""
    try:
        if hex_str and hex_str.startswith("#") and len(hex_str) in (7, 9):
            return HexColor(hex_str)
    except Exception:
        pass
    return HexColor(fallback_hex)


def build_cover(
    doc_type: str,          # "Proposal" or "Bill Analytic"
    oem_name: str,
    client_name: str,
    project_name: str,
    date_str: str,
    doc_number: str = "",
    cover_image_path: str | None = None,
    primary_color: str = DEFAULT_PRIMARY,
    secondary_color: str = DEFAULT_SECONDARY,
    overlay_alpha: float = 0.50,
    logo_path: str | None = None,
) -> BytesIO:
    """Return a single-page cover PDF as a BytesIO buffer."""

    buf = BytesIO()
    W, H = letter   # 612 × 792 pts
    c = rl_canvas.Canvas(buf, pagesize=letter)

    # ── 1. Grayscale background image ──────────────────────────────────────
    if cover_image_path and Path(cover_image_path).exists():
        try:
            from PIL import Image as PILImage
            img = PILImage.open(cover_image_path).convert("L").convert("RGB")
            # Save to temp BytesIO so ReportLab can read it
            tmp = BytesIO()
            img.save(tmp, format="PNG")
            tmp.seek(0)
            from reportlab.lib.utils import ImageReader
            c.drawImage(ImageReader(tmp), 0, 0, width=W, height=H,
                        preserveAspectRatio=False)
        except Exception:
            # Graceful fallback: solid dark background
            c.setFillColor(HexColor("#222222"))
            c.rect(0, 0, W, H, fill=1, stroke=0)
    else:
        c.setFillColor(HexColor("#222222"))
        c.rect(0, 0, W, H, fill=1, stroke=0)

    # ── 2. OEM primary color transparent overlay ───────────────────────────
    primary_rl = _hex_to_reportlab(primary_color, DEFAULT_PRIMARY)
    c.saveState()
    c.setFillColor(primary_rl)
    c.setFillAlpha(overlay_alpha)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()

    # ── 3. OEM logo (top-left) ────────────────────────────────────────────
    if logo_path and Path(logo_path).exists():
        try:
            c.drawImage(logo_path, 0.6*inch, H - 1.7*inch,
                        width=2.8*inch, height=1.0*inch,
                        preserveAspectRatio=True, mask="auto")
        except Exception:
            pass

    # ── 4. Text ────────────────────────────────────────────────────────────
    secondary_rl = _hex_to_reportlab(secondary_color, DEFAULT_SECONDARY)
    c.setFillColor(secondary_rl)

    # Subtle horizontal rule just above the text block
    c.saveState()
    c.setStrokeColor(secondary_rl)
    c.setLineWidth(1)
    rule_y = H * 0.48
    c.line(0.6*inch, rule_y, W - 0.6*inch, rule_y)
    c.restoreState()

    # Document type (large)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(0.6*inch, H * 0.42, doc_type.upper())

    # Doc number (if present)
    if doc_number:
        c.setFont("Helvetica", 14)
        c.drawString(0.6*inch, H * 0.38, f"No. {doc_number}")

    # Prepared by / from OEM
    c.setFont("Helvetica-Bold", 13)
    c.drawString(0.6*inch, H * 0.33, f"Prepared by:  {oem_name}")

    # Prepared for / client
    c.setFont("Helvetica", 13)
    c.drawString(0.6*inch, H * 0.29, f"Prepared for:  {client_name}")

    # Project name
    if project_name:
        c.setFont("Helvetica", 12)
        c.drawString(0.6*inch, H * 0.25, f"Project:  {project_name}")

    # Date (bottom strip)
    c.setFont("Helvetica", 11)
    c.drawString(0.6*inch, 0.6*inch, date_str)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf
