
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from PyPDF2 import PdfReader, PdfWriter
from datetime import datetime

def watermark_pdf(input_pdf, output_pdf, *, recipient_type, recipient_id, version):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page in reader.pages:
        packet = canvas.Canvas(None, pagesize=LETTER)
        text = f"SYNEREX CONFIDENTIAL | {recipient_type.upper()} | {recipient_id} | v{version} | {datetime.utcnow().isoformat()}Z"
        packet.setFont("Helvetica", 8)
        packet.setFillGray(0.7)
        packet.drawString(40, 20, text)
        packet.save()

        watermark_page = PdfReader(packet.getpdfdata()).pages[0]
        page.merge_page(watermark_page)
        writer.add_page(page)

    with open(output_pdf, "wb") as f:
        writer.write(f)
