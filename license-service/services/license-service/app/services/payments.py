"""Payment gateway integration service."""
from __future__ import annotations

import io
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from ..config import settings
from ..models.payment import Payment, Invoice
from ..models.billing import BillingOrder
from ..db import SessionLocal

logger = logging.getLogger(__name__)

# Invoices are stored under static/invoices/ so they are served as static files
INVOICE_DIR = Path(__file__).resolve().parents[2] / "static" / "invoices"


def create_stripe_payment(order: BillingOrder, payment_intent_id: str, db) -> Payment:
    """Create a payment record for Stripe."""
    payment = Payment(
        id=payment_intent_id,
        order_id=order.order_id,
        org_id=order.org_id,
        amount=order.amount_total,
        currency=order.currency,
        gateway="stripe",
        gateway_transaction_id=payment_intent_id,
        status="completed",
        payment_method="card",
        completed_at=datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    return payment


def create_paypal_payment(order: BillingOrder, transaction_id: str, db) -> Payment:
    """Create a payment record for PayPal."""
    payment = Payment(
        id=transaction_id,
        order_id=order.order_id,
        org_id=order.org_id,
        amount=order.amount_total,
        currency=order.currency,
        gateway="paypal",
        gateway_transaction_id=transaction_id,
        status="completed",
        payment_method="paypal",
        completed_at=datetime.utcnow()
    )
    db.add(payment)
    db.commit()
    return payment


# ---------------------------------------------------------------------------
# Invoice PDF generation
# ---------------------------------------------------------------------------

def _build_invoice_pdf(
    invoice_number: str,
    org_name: str,
    org_address: str,
    order: BillingOrder,
    payment: Optional[Payment],
) -> bytes:
    """Render a professional invoice PDF and return the raw bytes."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    brand = HexColor("#4f46e5")   # indigo
    grey  = HexColor("#718096")
    light = HexColor("#f7fafc")
    dark  = HexColor("#2d3748")

    h1 = ParagraphStyle("h1", parent=styles["Normal"], fontSize=28, textColor=brand, leading=34, spaceAfter=2)
    h2 = ParagraphStyle("h2", parent=styles["Normal"], fontSize=11, textColor=dark, fontName="Helvetica-Bold", spaceAfter=4)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=9, textColor=grey, leading=13)
    normal = ParagraphStyle("normal", parent=styles["Normal"], fontSize=10, textColor=dark, leading=14)
    right = ParagraphStyle("right", parent=styles["Normal"], fontSize=10, textColor=dark, alignment=TA_RIGHT)

    story = []

    # ── Header row: company name (left) + INVOICE label (right)
    header_data = [
        [
            Paragraph("<b>Synerex Laboratories, LLC</b>", h2),
            Paragraph("INVOICE", h1),
        ]
    ]
    header_tbl = Table(header_data, colWidths=["60%", "40%"])
    header_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN",  (1, 0), (1, 0),  "RIGHT"),
    ]))
    story.append(header_tbl)
    story.append(HRFlowable(width="100%", thickness=2, color=brand, spaceAfter=12))

    # ── Invoice meta (right-aligned) + Bill-To (left)
    invoice_date = (payment.completed_at or datetime.utcnow()).strftime("%B %d, %Y") if payment else datetime.utcnow().strftime("%B %d, %Y")
    due_date_str = order.due_at.strftime("%B %d, %Y") if order.due_at else "Upon Receipt"
    status_text = "PAID" if (payment and payment.status == "completed") else "DUE"
    status_color = HexColor("#16a34a") if status_text == "PAID" else HexColor("#dc2626")

    meta_data = [
        [
            [
                Paragraph("<b>Bill To:</b>", h2),
                Paragraph(org_name or "—", normal),
                Paragraph(org_address.replace("\n", "<br/>") if org_address else "", small),
            ],
            [
                Paragraph(f"<b>Invoice #:</b> {invoice_number}", normal),
                Spacer(1, 4),
                Paragraph(f"<b>Date:</b> {invoice_date}", normal),
                Spacer(1, 4),
                Paragraph(f"<b>Due:</b> {due_date_str}", normal),
                Spacer(1, 4),
                Paragraph(f'<b><font color="{status_color.hexval()}">● {status_text}</font></b>', normal),
            ],
        ]
    ]
    meta_tbl = Table(meta_data, colWidths=["55%", "45%"])
    meta_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN",  (1, 0), (1, 0),  "RIGHT"),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 20))

    # ── Line items table
    gateway_label = (payment.gateway.title() if payment else "—") or "—"
    if payment and payment.gateway_transaction_id:
        gateway_label += f" ({payment.gateway_transaction_id[:24]})"

    rows = [
        ["Description", "Program", "Plan", "Term", "Amount"],
        [
            "Software License",
            order.program_id.upper(),
            order.plan.replace("_", " ").title(),
            f"{order.term_start} → {order.term_end}",
            f"${order.amount_total} {order.currency}",
        ],
    ]
    if order.seat_count and int(order.seat_count) > 0:
        rows.append(["  Seats included", "", "", str(order.seat_count), ""])
    if order.meter_count and int(order.meter_count) > 0:
        rows.append(["  Meters included", "", "", str(order.meter_count), ""])

    item_tbl = Table(rows, colWidths=["30%", "12%", "14%", "26%", "18%"])
    item_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0),  brand),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  white),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, 0),  9),
        ("ALIGN",       (4, 0), (4, -1),  "RIGHT"),
        ("ALIGN",       (0, 0), (3, -1),  "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [light, white]),
        ("FONTSIZE",    (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",   (0, 1), (-1, -1), dark),
        ("GRID",        (0, 0), (-1, -1), 0.4, HexColor("#e2e8f0")),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(item_tbl)
    story.append(Spacer(1, 12))

    # ── Totals block (right-aligned)
    totals_data = [
        ["", "Subtotal:", f"${order.amount_total} {order.currency}"],
        ["", "Tax (0%):", "$0.00"],
        ["", Paragraph("<b>Total Due:</b>", normal), Paragraph(f"<b>${order.amount_total} {order.currency}</b>", right)],
    ]
    totals_tbl = Table(totals_data, colWidths=["55%", "25%", "20%"])
    totals_tbl.setStyle(TableStyle([
        ("ALIGN",  (1, 0), (2, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), dark),
        ("LINEABOVE", (1, 2), (2, 2), 1, brand),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_tbl)
    story.append(Spacer(1, 24))

    # ── Payment info
    if payment and payment.status == "completed":
        story.append(Paragraph(f"<b>Payment received via {gateway_label} on {invoice_date}.</b>", small))
    else:
        story.append(Paragraph("<b>Payment Instructions:</b> Please remit via EFT or contact support for assistance.", small))
    story.append(Spacer(1, 8))

    # ── Footer
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#e2e8f0"), spaceBefore=8, spaceAfter=6))
    footer_text = (
        "Synerex Laboratories, LLC  •  noreply@synerexlabs.com  •  "
        "Questions? Contact us at support@synerexlabs.com"
    )
    story.append(Paragraph(footer_text, ParagraphStyle("footer", parent=small, alignment=TA_CENTER, textColor=grey)))

    doc.build(story)
    buf.seek(0)
    return buf.read()


def generate_invoice(order: BillingOrder, payment: Optional[Payment], db) -> Invoice:
    """Generate an invoice record and write the PDF to disk."""
    from ..models.org import Organization

    org = db.get(Organization, order.org_id)
    if not org:
        raise ValueError(f"Organization {order.org_id} not found")

    invoice_number = f"INV-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"
    invoice_id = f"INV-{order.order_id}"

    invoice = Invoice(
        invoice_id=invoice_id,
        order_id=order.order_id,
        org_id=order.org_id,
        invoice_number=invoice_number,
        amount=order.amount_total,
        currency=order.currency,
        status="paid" if payment and payment.status == "completed" else "sent",
        due_date=order.due_at,
        paid_at=payment.completed_at if payment else None,
        created_at=datetime.utcnow()
    )
    db.add(invoice)
    db.commit()

    # Build PDF
    try:
        address_parts = [
            org.company_address or org.address or "",
            ", ".join(filter(None, [org.company_city, org.company_state, org.company_zip])),
        ]
        org_address = "\n".join(p for p in address_parts if p)

        pdf_bytes = _build_invoice_pdf(
            invoice_number=invoice_number,
            org_name=org.org_name,
            org_address=org_address,
            order=order,
            payment=payment,
        )

        INVOICE_DIR.mkdir(parents=True, exist_ok=True)
        pdf_filename = f"{invoice_id}.pdf"
        pdf_path = INVOICE_DIR / pdf_filename
        pdf_path.write_bytes(pdf_bytes)

        invoice.pdf_path = f"invoices/{pdf_filename}"
        db.commit()
        logger.info("[invoice] PDF written: %s (%d bytes)", pdf_path, len(pdf_bytes))
    except Exception as exc:
        logger.error("[invoice] PDF generation failed for %s: %s", invoice_id, exc, exc_info=True)
        invoice.pdf_path = f"invoices/{invoice_id}.pdf"  # store expected path even if write fails
        db.commit()

    return invoice
