"""Proposal PDF generator (simplified). Full port from client-proposal.js would need many images."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer


def _safe(val, default=""):
    return val if val is not None else default


def generate(proposal_data, logo_path=None, brand_name="Xeco"):
    """Generate proposal PDF. proposal_data from data mapper."""
    if not proposal_data or not isinstance(proposal_data, dict):
        proposal_data = {}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    story = []

    story.append(Paragraph(
        f"Proposal No.: {_safe(proposal_data.get('proposalNumber'))}-P",
        ParagraphStyle("Title", fontSize=14, spaceAfter=12),
    ))
    story.append(Paragraph(f"Prepared for: {_safe(proposal_data.get('clientName'))}", ParagraphStyle("H", fontSize=11)))
    story.append(Paragraph(_safe(proposal_data.get("clientAddress")), ParagraphStyle("Normal", fontSize=10)))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"Location: {_safe(proposal_data.get('location'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Proposal Date: {_safe(proposal_data.get('proposalDate'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Paragraph(f"Bill Date: {_safe(proposal_data.get('billDate'))}", ParagraphStyle("Normal", fontSize=10)))
    story.append(Spacer(1, 12))

    est = proposal_data.get("estimatedSavings") or {}
    story.append(Paragraph("Estimated Savings", ParagraphStyle("H2", fontSize=12, spaceAfter=6)))
    for k, v in est.items():
        if isinstance(v, str):
            story.append(Paragraph(f"{k}: {v}", ParagraphStyle("Normal", fontSize=9)))
    story.append(Spacer(1, 8))

    ident = proposal_data.get("identifiedEquipment") or {}
    if ident:
        story.append(Paragraph("Identified Equipment", ParagraphStyle("H2", fontSize=12, spaceAfter=6)))
        items = ident.get("items") or []
        if items:
            data = [["Name", "Qty", "Price", "Cost"]]
            for i in items:
                data.append([_safe(i.get("name")), str(i.get("quantity", "")), _safe(i.get("price")), _safe(i.get("cost"))])
            tbl = Table(data, colWidths=[2*inch, 0.6*inch, 1*inch, 1*inch])
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            story.append(tbl)
        story.append(Paragraph(f"Total: {_safe(ident.get('totalProjectCost'))}", ParagraphStyle("Normal", fontSize=10)))

    doc.build(story)
    buf.seek(0)
    return buf
