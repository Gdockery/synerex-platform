"""Simple PDF generators for document types that share a common summary layout."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer


def _safe(val, default=""):
    return val if val is not None else default


def generate_summary(document_title, data, rows=None):
    """Generate a simple summary PDF with title and key-value rows."""
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = []

    story.append(Paragraph(document_title, ParagraphStyle("Title", fontSize=16, spaceAfter=12)))
    story.append(Paragraph(f"Date: {_safe(data.get('date'))}", ParagraphStyle("Normal", fontSize=10)))
    if data.get("clientName"):
        story.append(Paragraph(f"Client: {_safe(data.get('clientName'))}", ParagraphStyle("Normal", fontSize=10)))
    if data.get("location"):
        story.append(Paragraph(f"Location: {_safe(data.get('location'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Spacer(1, 12))

    if rows:
        table_data = [["Field", "Value"]]
        for k, v in rows:
            table_data.append([str(k), str(_safe(v))])
        tbl = Table(table_data, colWidths=[2*72, 4*72])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(tbl)

    doc.build(story)
    buf.seek(0)
    return buf
