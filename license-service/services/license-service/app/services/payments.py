"""Payment gateway integration service."""
from typing import Optional, Dict, Any
from ..config import settings
from ..models.payment import Payment, Invoice
from ..models.billing import BillingOrder
from ..db import SessionLocal
from datetime import datetime
import json

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

def generate_invoice(order: BillingOrder, payment: Optional[Payment], db) -> Invoice:
    """Generate an invoice for an order."""
    from ..models.org import Organization
    
    org = db.get(Organization, order.org_id)
    if not org:
        raise ValueError(f"Organization {order.org_id} not found")
    
    # Generate invoice number
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
    
    # Generate PDF (would use reportlab in production)
    # For now, just store the path
    invoice.pdf_path = f"invoices/{invoice_id}.pdf"
    db.commit()
    
    return invoice


