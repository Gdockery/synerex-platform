"""Test Report PDF generator (simplified)."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer


def _safe(val, default=""):
    return val if val is not None else default


def generate(report_data, logo_path=None, brand_name="Xeco"):
    """Generate test report PDF."""
    if not report_data or not isinstance(report_data, dict):
        report_data = {}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = []

    story.append(Paragraph("Test Report", ParagraphStyle("Title", fontSize=16, spaceAfter=12)))
    story.append(Paragraph(f"Client: {_safe(report_data.get('clientName'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Location: {_safe(report_data.get('location'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Report Number: {_safe(report_data.get('reportNumber'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Date: {_safe(report_data.get('date'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Test Start: {_safe(report_data.get('testStartAt'))}", ParagraphStyle("Normal", fontSize=9)))
    story.append(Paragraph(f"Test End: {_safe(report_data.get('testEndAt'))}", ParagraphStyle("Normal", fontSize=9)))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Summary", ParagraphStyle("H2", fontSize=12, spaceAfter=6)))
    story.append(Paragraph(f"Bill Amount: {_safe(report_data.get('billAmount'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Savings: {_safe(report_data.get('savings'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Actual Savings: {_safe(report_data.get('actualSavings'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Customer Charge: {_safe(report_data.get('customerCharge'))}", ParagraphStyle("Normal", fontSize=10)))

    charges = report_data.get("charges") or []
    if charges:
        story.append(Spacer(1, 8))
        data = [["Description", "Amount", "Savings", "Type"]]
        for c in charges[:20]:
            data.append([
                _safe(c.get("description"))[:40],
                _safe(c.get("amount")),
                _safe(c.get("savingsAmount")) if isinstance(c.get("savingsAmount"), str) else str(c.get("savingsAmount", "")),
                _safe(c.get("type")),
            ])
        tbl = Table(data, colWidths=[2.5*72, 1*72, 1*72, 0.6*72])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(tbl)

    doc.build(story)
    buf.seek(0)
    return buf
