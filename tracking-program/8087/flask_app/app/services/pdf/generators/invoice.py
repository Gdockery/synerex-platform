"""Invoice PDF generator (Deposit, Installation, Final, Total). Ported from api/services/pdf/generators/invoice.js."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image


def _safe(val, default=""):
    return val if val is not None else default


def generate(invoice_data, logo_path=None, brand_name="Xeco"):
    """Generate invoice PDF. invoice_data from data_mappers.map_invoice_data."""
    if not invoice_data or not isinstance(invoice_data, dict):
        invoice_data = {}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter))
    story = []
    gray = colors.HexColor("#c0c0c0")

    # Header: logo | INVOICE TYPE | Invoice #, Date
    inv_type = _safe(invoice_data.get("invoiceType"), "Invoice").upper()
    inv_num = _safe(invoice_data.get("invoiceNumber"))
    inv_date = _safe(invoice_data.get("invoiceDate"))

    header_cells = []
    if logo_path:
        try:
            from pathlib import Path
            if Path(logo_path).exists():
                header_cells.append(Image(logo_path, width=60, height=20))
            else:
                header_cells.append(Paragraph("", ParagraphStyle("E", fontSize=8)))
        except Exception:
            header_cells.append(Paragraph("", ParagraphStyle("E", fontSize=8)))
    else:
        header_cells.append(Paragraph("", ParagraphStyle("E", fontSize=8)))

    header_cells.append(Paragraph(
        f"{inv_type} INVOICE",
        ParagraphStyle("H", fontSize=14, alignment=1),
    ))
    header_cells.append(Paragraph(
        f"INVOICE NO.<br/>{inv_num}<br/>DATE: {inv_date}",
        ParagraphStyle("H2", fontSize=9),
    ))
    ht = Table([header_cells], colWidths=[1 * inch, 5 * inch, 2 * inch])
    ht.setStyle(TableStyle([("ALIGN", (1, 0), (1, 0), "CENTER")]))
    story.append(ht)
    story.append(Spacer(1, 12))

    # Company / Bill To / Ship To
    xeco_addr = (_safe(invoice_data.get("xecoAddress")) or "").split("\n")
    xeco_line1 = xeco_addr[0] if xeco_addr else ""
    xeco_line2 = xeco_addr[1] if len(xeco_addr) > 1 else ""
    xeco_city = _safe(invoice_data.get("xecoCity"))
    contact = _safe(invoice_data.get("contact"))
    phone = _safe(invoice_data.get("phone"))
    client_name = _safe(invoice_data.get("clientName"))
    bill_to = _safe(invoice_data.get("billToAddress"))
    ship_to = _safe(invoice_data.get("shipToAddress"))
    attn = _safe(invoice_data.get("clientAttn"))
    rfc = _safe(invoice_data.get("clientRfcCode"))
    client_phone = _safe(invoice_data.get("clientPhone"))
    po = _safe(invoice_data.get("clientCompanyPo"))

    info_data = [
        [f"{brand_name} Energy Corporation", "BILL TO:", "SHIP TO:"],
        [xeco_line1, client_name, client_name],
        [xeco_line2 or xeco_city, bill_to.split("\n")[0] if bill_to else "", ship_to.split("\n")[0] if ship_to else ""],
        [f"Contact: {contact}  Tel: {phone}", f"Attn: {attn}  RFC: {rfc}", f"Tel: {client_phone}"],
        ["", f"Tel: {client_phone}  PO#: {po}", ""],
    ]
    info_tbl = Table(info_data, colWidths=[2.5 * inch, 2.5 * inch, 2.5 * inch])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), gray),
        ("BACKGROUND", (1, 0), (1, 0), colors.black),
        ("BACKGROUND", (2, 0), (2, 0), colors.black),
        ("TEXTCOLOR", (1, 0), (2, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 8))

    # Itemized estimate
    story.append(Paragraph(
        "Installed XECO POWER SYSTEMS on all recommended equipment. Costs include parts and labor.",
        ParagraphStyle("Note", fontSize=6, alignment=1),
    ))
    story.append(Paragraph(
        f"ITEMIZED ESTIMATE: TIME AND MATERIALS (Currency: {invoice_data.get('currencyCode', 'USD')})",
        ParagraphStyle("Sect", fontSize=8, alignment=1, backColor=gray),
    ))
    story.append(Spacer(1, 4))

    # Items/parts/services table
    items = invoice_data.get("items") or []
    parts = invoice_data.get("parts") or []
    services = invoice_data.get("services") or []

    table_data = [["DESCRIPTION", "Qty", "Status", "TAX", "COST", "AMOUNT"]]
    for item in items:
        table_data.append([
            item.get("name", ""),
            str(item.get("quantity", "")),
            item.get("status", ""),
            item.get("tax", ""),
            item.get("cost", ""),
            item.get("cost", ""),
        ])
    if parts:
        table_data.append(["Parts:", "", "", "", "", ""])
        for p in parts:
            table_data.append([p.get("name", ""), str(p.get("quantity", "")), "", p.get("tax", ""), p.get("cost", ""), p.get("cost", "")])
    if services:
        table_data.append(["Services:", "", "", "", "", ""])
        for s in services:
            table_data.append([s.get("name", ""), str(s.get("quantity", "")), "", s.get("tax", ""), s.get("cost", ""), s.get("cost", "")])

    if len(table_data) > 1:
        bill_tbl = Table(table_data, colWidths=[2 * inch, 0.6 * inch, 0.6 * inch, 0.9 * inch, 0.9 * inch, 1.2 * inch])
        bill_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.black),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(bill_tbl)
    story.append(Spacer(1, 8))

    # Totals
    est = invoice_data.get("estimatedSavings") or {}
    inv_type = invoice_data.get("invoiceType", "Invoice")
    cost_mult = invoice_data.get("costMultiplier", 100)
    amt_due_label = f"{inv_type} Amount Due ({cost_mult}%):" if inv_type != "Total" else "Total Amount Due:"

    summary_data = [
        ["Thank you for your business. Payment terms: " + _safe(invoice_data.get("paymentTerms")), "Subtotal:", _safe(est.get("subtotal"))],
        ["", "Tax:", _safe(est.get("salesTax"))],
        ["", "Total Cost:", _safe(est.get("totalCost"))],
        ["", amt_due_label, _safe(invoice_data.get("invoiceTotal"))],
    ]
    sum_tbl = Table(summary_data, colWidths=[4 * inch, 1.5 * inch, 1.5 * inch])
    sum_tbl.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (2, 0), colors.black),
        ("BACKGROUND", (1, 1), (2, 1), gray),
        ("TEXTCOLOR", (1, 0), (2, 0), colors.white),
        ("FONTNAME", (1, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (0, 0), 6),
        ("GRID", (1, 0), (-1, -1), 0.5, colors.black),
    ]))
    story.append(sum_tbl)

    doc.build(story)
    buf.seek(0)
    return buf
