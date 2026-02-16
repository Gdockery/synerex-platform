"""Budget Report PDF generator (ReportLab). Ported from api/services/pdf/generators/budget-report.js."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer


def _safe(val, default=""):
    """Return val if not None, else default."""
    return val if val is not None else default


def generate(invoice_data):
    """Generate budget report PDF. invoice_data is project.lastBudget (dict)."""
    if not invoice_data or not isinstance(invoice_data, dict):
        invoice_data = {}

    company = invoice_data.get("company") or {}
    company_name = _safe(company.get("name"), "Company")
    start_date = _safe(invoice_data.get("startDate"), "N/A")
    to_date = _safe(invoice_data.get("toDate"), "N/A")
    kw_peak_rate = _safe(invoice_data.get("kwPeakRate"), "N/A")
    kwh_rate = _safe(invoice_data.get("kwhRate"), "N/A")
    subtotal = _safe(invoice_data.get("subtotal"), "0")
    tax = _safe(invoice_data.get("tax"), "0")
    total_cost = _safe(invoice_data.get("totalCost"), "0")
    kw_peak = _safe(invoice_data.get("kwPeak"), "--")
    avg_daily_kwh = _safe(invoice_data.get("avgDailyKwhUsage"), "--")
    kwh_usage = _safe(invoice_data.get("kwhUsage"), "--")
    kw_peak_cost = _safe(invoice_data.get("kwPeakCost"), "--")
    kwh_cost = _safe(invoice_data.get("kwhCost"), "--")

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter))
    styles = getSampleStyleSheet()
    story = []

    # Header table: [company name + BUDGET REPORT | BUDGET DATE + rates]
    header_cell1 = Paragraph(
        f"<b>{company_name}</b><br/><b>BUDGET REPORT</b>",
        ParagraphStyle(name="Header", fontSize=14, alignment=1, spaceAfter=4),
    )
    header_cell2 = Paragraph(
        f"<b>BUDGET DATE</b><br/>"
        f"{start_date} -- {to_date}<br/>"
        f"<b>KW PEAK Rate: {kw_peak_rate}       KWH Rate: {kwh_rate}</b>",
        ParagraphStyle(name="H2", fontSize=9, alignment=1),
    )
    header_table = Table(
        [[header_cell1, header_cell2]],
        colWidths=[4 * inch, 4 * inch],
        hAlign="CENTER",
    )
    header_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # Section title
    story.append(Paragraph(
        "ESTIMATED COST BREAKDOWN",
        ParagraphStyle(name="Section", fontSize=14, alignment=1, spaceAfter=8),
    ))

    # Bill table: Estimated Energy Usage | Actual Daily Avg | Estimated Budget Results | Estimated Cost
    bill_header = [
        "Estimated Energy Usage",
        "Actual Daily Avg",
        "Estimated Budget Results",
        "Estimated Cost",
    ]
    bill_rows = [
        ["KW Peak", "--", str(kw_peak), str(kw_peak_cost)],
        ["KWH", str(avg_daily_kwh), str(kwh_usage), str(kwh_cost)],
    ]
    bill_data = [bill_header] + bill_rows
    bill_table = Table(bill_data, colWidths=[2.5 * inch, 2 * inch, 2 * inch, 2 * inch])
    gray = colors.HexColor("#c0c0c0")
    bill_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), gray),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("ALIGN", (3, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 8))

    # Summary: Subtotal, Tax, Total Cost
    summary_data = [
        ["", "", "Subtotal:", str(subtotal)],
        ["", "", "Tax:", str(tax)],
        ["", "", "Total Cost", str(total_cost)],
    ]
    summary_table = Table(summary_data, colWidths=[2.5 * inch, 2 * inch, 2 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (2, 0), (2, 0), colors.black),
        ("BACKGROUND", (3, 0), (3, 0), colors.black),
        ("TEXTCOLOR", (2, 0), (3, 0), colors.white),
        ("BACKGROUND", (2, 1), (2, 1), gray),
        ("BACKGROUND", (3, 1), (3, 1), gray),
        ("FONTNAME", (2, 0), (3, -1), "Helvetica-Bold"),
        ("FONTSIZE", (2, 0), (-1, -1), 11),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (2, 2), (3, 2), 12),
        ("GRID", (2, 0), (-1, -1), 0.5, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)

    doc.build(story)
    buf.seek(0)
    return buf
