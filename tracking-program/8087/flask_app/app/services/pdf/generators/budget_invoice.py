"""Budget (Energy Usage) Invoice PDF generator. Ported from api/services/pdf/generators/budget-invoice.js."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image


def _safe(val, default=""):
    return val if val is not None else default


def _nested(d, *keys, default=""):
    for k in keys:
        d = (d or {}).get(k) if isinstance(d, dict) else None
    return d if d is not None else default


def generate(invoice_data, client_logo_path=None):
    """Generate budget invoice PDF. invoice_data is project.lastBudgetInvoice."""
    if not invoice_data or not isinstance(invoice_data, dict):
        invoice_data = {}

    company = invoice_data.get("company") or {}
    client = invoice_data.get("client") or {}
    invoice_number = _safe(invoice_data.get("invoiceNumber"), "N/A")
    invoice_date = _safe(invoice_data.get("invoiceDate"), "N/A")
    invoice_start = _safe(invoice_data.get("invoiceStartDate"), "N/A")
    invoice_end = _safe(invoice_data.get("invoiceEndDate"), "N/A")
    subtotal = _safe(invoice_data.get("subtotal"), "0")
    tax = _safe(invoice_data.get("tax"), "0")
    total_cost = _safe(invoice_data.get("totalCost"), "0")
    avg_kwh = _safe(invoice_data.get("avgKwh"), "--")
    hours_in_project = _safe(invoice_data.get("hoursInProject"), "--")
    kwh_usage = _safe(invoice_data.get("kwhUsage"), "--")
    kwh_rate = _safe(invoice_data.get("kwhRate"), "--")
    kwh_cost = _safe(invoice_data.get("kwhCost"), "--")
    kw_peak = _safe(invoice_data.get("kwPeak"), "--")
    kw_peak_rate = _safe(invoice_data.get("kwPeakRate"), "--")
    kw_peak_cost = _safe(invoice_data.get("kwPeakCost"), "--")
    electric_company = _nested(company, "electricCompany") or _nested(invoice_data, "company", "electricCompany") or ""

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter))
    story = []
    gray = colors.HexColor("#c0c0c0")

    # Header row: Logo | ENERGY USAGE INVOICE | Invoice #, Date, Project Date
    header_cells = []
    if client_logo_path:
        try:
            img = Image(client_logo_path, width=100, height=40)
            header_cells.append(img)
        except Exception:
            header_cells.append(Paragraph("", ParagraphStyle(name="Empty", fontSize=8)))
    else:
        header_cells.append(Paragraph("", ParagraphStyle(name="Empty", fontSize=8)))

    header_cells.append(Paragraph(
        "ENERGY USAGE INVOICE",
        ParagraphStyle(name="Header", fontSize=18, alignment=1),
    ))
    header_cells.append(Paragraph(
        f"Invoice #: {invoice_number}<br/>Invoice Date: {invoice_date}<br/>Project Date: {invoice_start} -- {invoice_end}",
        ParagraphStyle(name="InvMeta", fontSize=8),
    ))
    header_table = Table([header_cells], colWidths=[1.5 * inch, 4 * inch, 2 * inch])
    header_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, 0), "CENTER"),
        ("BACKGROUND", (1, 0), (1, 0), gray),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # Company / Client blocks
    company_name = _safe(company.get("legalName"), _safe(company.get("name")))
    company_location = _safe(company.get("location"))
    company_contact = _safe(company.get("contactName"))
    company_phone = _safe(company.get("phone"))
    client_name = _safe(client.get("name"))
    client_address = _safe(client.get("address"), "").replace("\n", ", ")
    client_phone = _safe(client.get("phone"))

    info_data = [
        [company_name, "", f"TO: {client_name}"],
        [company_location, "", client_address],
        [f"Contact: {company_contact}  Tel: {company_phone}", "", f"Tel: {client_phone}"],
    ]
    info_table = Table(info_data, colWidths=[3 * inch, 1 * inch, 3 * inch])
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, 2), "Helvetica-Bold"),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # Itemized Project Energy Usage
    story.append(Paragraph("Itemized Project Energy Usage", ParagraphStyle(name="Section", fontSize=10, alignment=1, backColor=gray, textColor=colors.white, spaceAfter=6)))

    # Bill table
    bill_data = [
        ["Demand", "", ""],
        ["Avg 15-Min Interval", str(avg_kwh), ""],
        ["Project Hours", str(hours_in_project), ""],
        ["Project kWh Used", str(kwh_usage), ""],
        ["kWh Rate", str(kwh_rate), ""],
        ["Total Project kWh Energy Cost:", "", str(kwh_cost)],
        [f"SUPPLIER   {electric_company}", "", ""],
        ["KW Peak (During Project Period)", str(kw_peak), ""],
        ["kW Peak Rate (During Project Hours)", str(kw_peak_rate), ""],
        ["Total Project kW Peak Energy Cost:", "", str(kw_peak_cost)],
    ]
    bill_table = Table(bill_data, colWidths=[3 * inch, 2.5 * inch, 2.5 * inch])
    bill_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), gray),
        ("BACKGROUND", (0, 6), (-1, 6), gray),
        ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 6), (0, 6), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ALIGN", (0, 5), (0, 5), "LEFT"),
        ("ALIGN", (2, 5), (2, 5), "CENTER"),
        ("ALIGN", (0, 9), (0, 9), "LEFT"),
        ("ALIGN", (2, 9), (2, 9), "CENTER"),
        ("FONTNAME", (0, 5), (0, 5), "Helvetica-Bold"),
        ("FONTNAME", (2, 5), (2, 5), "Helvetica-Bold"),
        ("FONTNAME", (0, 9), (0, 9), "Helvetica-Bold"),
        ("FONTNAME", (2, 9), (2, 9), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 8))

    # Subtotal, Tax, Total
    summary_data = [
        ["", "Subtotal:", subtotal],
        ["TERMS & CONDITIONS", "Tax:", tax],
        ["", "Total Project Amount Due:", total_cost],
    ]
    summary_table = Table(summary_data, colWidths=[4 * inch, 2 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (2, 0), colors.black),
        ("TEXTCOLOR", (1, 0), (2, 0), colors.white),
        ("BACKGROUND", (1, 1), (2, 1), gray),
        ("FONTNAME", (1, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("FONTSIZE", (0, 1), (0, 1), 8),
        ("GRID", (1, 0), (-1, -1), 0.5, colors.black),
    ]))
    story.append(summary_table)

    doc.build(story)
    buf.seek(0)
    return buf
