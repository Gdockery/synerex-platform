from __future__ import annotations
import io
from datetime import datetime, timezone
from typing import Optional

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter

def watermark_pdf_bytes(
    input_pdf_bytes: bytes,
    *,
    recipient_type: str,
    recipient_id: str,
    version: str,
    program_id: str,
    role: str,
    license_id: str,
    doc_id: str,
) -> bytes:
    reader = PdfReader(io.BytesIO(input_pdf_bytes))
    writer = PdfWriter()

    stamp = (
        f"SYNEREX CONFIDENTIAL | doc:{doc_id} | v{version} | "
        f"{recipient_type.upper()}:{recipient_id} | program:{program_id} | role:{role} | "
        f"license:{license_id} | {datetime.now(timezone.utc).replace(microsecond=0).isoformat()}Z"
    )

    for page in reader.pages:
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        c.setFont("Helvetica", 8)
        c.setFillGray(0.7)
        c.drawString(40, 20, stamp)
        c.save()
        packet.seek(0)

        wm = PdfReader(packet).pages[0]
        page.merge_page(wm)
        writer.add_page(page)

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()
