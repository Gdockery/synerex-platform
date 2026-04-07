"""Stripe payment integration endpoints."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..models.billing import BillingOrder
from ..models.payment import Payment
from ..models.authorization import ProgramAuthorization
from ..models.org import Organization
from ..audit.events import log_event
from ..licensing.issuer import issue_license_record
from ..licensing import build_license_payload
from ..templates_loader import load_template

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/register/payment/stripe", tags=["stripe"])


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _stripe_available() -> bool:
    return bool(settings.stripe_secret_key)


# ---------------------------------------------------------------------------
# POST /register/payment/stripe/intent
# ---------------------------------------------------------------------------

@router.post("/intent")
async def create_payment_intent(request: Request, db: Session = Depends(db_session)):
    """Create a Stripe PaymentIntent and return the client_secret for the frontend."""
    if not _stripe_available():
        raise HTTPException(503, "Stripe is not configured on this server")

    import stripe as _stripe
    _stripe.api_key = settings.stripe_secret_key

    body = await request.json()
    order_id: Optional[str] = body.get("order_id")
    if not order_id:
        raise HTTPException(400, "order_id is required")

    order = db.get(BillingOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status == "paid":
        raise HTTPException(409, "Order is already paid")

    try:
        amount_cents = int(float(order.amount_total) * 100)
        intent = _stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=(order.currency or "usd").lower(),
            metadata={
                "order_id": order_id,
                "org_id": order.org_id,
                "program_id": order.program_id,
                "plan": order.plan,
            },
            description=f"Synerex {order.program_id.upper()} License — {order.plan}",
        )
    except _stripe.error.StripeError as exc:
        logger.error("[stripe] PaymentIntent creation failed: %s", exc)
        raise HTTPException(502, f"Stripe error: {exc.user_message or str(exc)}")

    return JSONResponse({
        "client_secret": intent.client_secret,
        "publishable_key": settings.stripe_publishable_key or "",
        "amount_cents": amount_cents,
        "currency": (order.currency or "usd").lower(),
    })


# ---------------------------------------------------------------------------
# POST /register/payment/stripe/webhook
# ---------------------------------------------------------------------------

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(db_session)):
    """Handle Stripe webhook events — verify signature, mark payment, issue license."""
    if not _stripe_available():
        raise HTTPException(503, "Stripe is not configured on this server")

    import stripe as _stripe
    _stripe.api_key = settings.stripe_secret_key

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature if secret is configured
    event = None
    if settings.stripe_webhook_secret:
        try:
            event = _stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except _stripe.error.SignatureVerificationError:
            logger.warning("[stripe] Webhook signature verification failed")
            raise HTTPException(400, "Invalid webhook signature")
        except Exception as exc:
            logger.error("[stripe] Webhook parse error: %s", exc)
            raise HTTPException(400, "Invalid webhook payload")
    else:
        # No webhook secret configured — parse but do not verify
        try:
            event = _stripe.Event.construct_from(
                json.loads(payload), _stripe.api_key
            )
        except Exception as exc:
            logger.error("[stripe] Webhook parse error: %s", exc)
            raise HTTPException(400, "Invalid webhook payload")

    event_type = event["type"]
    logger.info("[stripe] Webhook event received: %s", event_type)

    if event_type == "payment_intent.succeeded":
        intent = event["data"]["object"]
        order_id = intent.get("metadata", {}).get("order_id")
        if not order_id:
            return JSONResponse({"received": True, "note": "No order_id in metadata"})

        order = db.get(BillingOrder, order_id)
        if not order:
            logger.warning("[stripe] Webhook: order %s not found", order_id)
            return JSONResponse({"received": True, "note": "Order not found"})

        if order.status == "paid":
            return JSONResponse({"received": True, "note": "Already paid"})

        _issue_license_for_stripe(db, order, intent)

    elif event_type == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        order_id = intent.get("metadata", {}).get("order_id")
        logger.warning("[stripe] Payment failed for order %s", order_id)
        # Mark any pending payment as failed
        if order_id:
            failed_pay = (
                db.query(Payment)
                .filter(Payment.order_id == order_id, Payment.gateway == "stripe")
                .first()
            )
            if failed_pay and failed_pay.status == "pending":
                failed_pay.status = "failed"
                db.commit()

    return JSONResponse({"received": True})


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

_TEMPLATE_MAP = {
    "emv": {"single_report": "emv_single_report", "annual": "emv_annual"},
    "tracking": {
        "basic": "tracking_basic",
        "pro": "tracking_pro",
        "enterprise": "tracking_enterprise",
    },
}


def _issue_license_for_stripe(db: Session, order: BillingOrder, intent: dict) -> None:
    """Record the Stripe payment as completed and issue the license."""
    payment_intent_id = intent.get("id", f"pi_{order.order_id}")

    # Upsert payment record
    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.order_id, Payment.gateway == "stripe")
        .first()
    )
    if payment is None:
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
            completed_at=datetime.utcnow(),
        )
        db.add(payment)
    else:
        payment.status = "completed"
        payment.gateway_transaction_id = payment_intent_id
        payment.completed_at = datetime.utcnow()
    db.commit()

    # Determine template
    template_id = _TEMPLATE_MAP.get(order.program_id, {}).get(order.plan)
    if not template_id:
        logger.error("[stripe] No template for %s/%s", order.program_id, order.plan)
        return

    # Upsert authorization
    auth_id = f"AUTH-{order.program_id.upper()}-{order.org_id}-{order.order_id}"
    auth = db.get(ProgramAuthorization, auth_id)
    if auth is None:
        auth = ProgramAuthorization(
            authorization_id=auth_id,
            program_id=order.program_id,
            org_id=order.org_id,
            template_id=template_id,
            status="active",
            starts_at=order.term_start,
            ends_at=order.term_end,
            scope_json=json.dumps({}),
            constraints_json=json.dumps({"plan": order.plan, "seat_limit": order.seat_count, "meter_limit": order.meter_count}),
            bindings_override_json=json.dumps({}),
            issued_by="stripe_webhook",
        )
        db.add(auth)
        db.commit()
    else:
        auth.status = "active"
        db.commit()

    org = db.get(Organization, order.org_id)
    if not org:
        logger.error("[stripe] Organization %s not found", order.org_id)
        return

    template = load_template(order.program_id, template_id)
    license_id = f"SYX-LIC-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"

    program_env = {
        "program_id": order.program_id,
        "authorization_id": auth_id,
        "status": "active",
        "policy_version": template.get("policy_version", "2026.01"),
    }

    license_payload = build_license_payload(
        license_id=license_id,
        issuer=settings.issuer_name,
        org={"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
        term_start=order.term_start,
        term_end=order.term_end,
        program=program_env,
        template=template,
    )

    license_rec, _ = issue_license_record(db, authorization=auth, license_payload=license_payload)

    order.status = "paid"
    order.paid_at = datetime.utcnow()
    order.license_id = license_rec.license_id
    db.commit()

    # Auto-activate the organization — mark as approved so license_required gate passes
    if org.approval_status != "approved":
        org.approval_status = "approved"
        db.commit()
        logger.info("[stripe] Org %s auto-approved after payment", org.org_id)

    log_event(
        db,
        actor="stripe_webhook",
        action="payment.completed",
        ref_id=payment_intent_id,
        detail={"order_id": order.order_id, "license_id": license_rec.license_id, "gateway": "stripe"},
    )
    logger.info("[stripe] License issued: %s for order %s", license_rec.license_id, order.order_id)

    # Auto-charge OEM platform fee if this is a renewal order (ORD-RENEW-*) and OEM has a card on file
    if order.order_id.startswith("ORD-RENEW-") and org.sponsor_org_id:
        _charge_oem_renewal_fee(db, org, order, license_rec.license_id)


# ---------------------------------------------------------------------------
# OEM auto-charge on renewal
# ---------------------------------------------------------------------------

_OEM_PLATFORM_FEES = {
    "basic": 240000,    # $2,400.00 in cents
    "pro": 480000,      # $4,800.00 in cents
    "enterprise": 960000,  # $9,600.00 in cents
}


def _charge_oem_renewal_fee(
    db,
    client_org: Organization,
    order: BillingOrder,
    license_id: str,
) -> None:
    """Charge the OEM's saved Stripe card for the platform fee when their client renews."""
    from ..models.oem_invoice import OemInvoice
    from datetime import datetime as _dt

    oem_org = db.get(Organization, client_org.sponsor_org_id)
    if not oem_org or not oem_org.stripe_customer_id:
        # OEM has no card on file — create a pending invoice for manual collection
        _create_pending_oem_invoice(db, oem_org, client_org, order, license_id)
        logger.info("[oem_billing] OEM %s has no Stripe card — pending invoice created", client_org.sponsor_org_id)
        return

    amount_cents = _OEM_PLATFORM_FEES.get(order.plan, 0)
    if amount_cents == 0:
        logger.warning("[oem_billing] Unknown plan '%s' — skipping OEM charge", order.plan)
        return

    if not settings.stripe_secret_key:
        _create_pending_oem_invoice(db, oem_org, client_org, order, license_id)
        return

    try:
        import stripe as _stripe
        _stripe.api_key = settings.stripe_secret_key

        # Retrieve default payment method for the customer
        customer = _stripe.Customer.retrieve(oem_org.stripe_customer_id)
        default_pm = (customer.get("invoice_settings") or {}).get("default_payment_method")
        if not default_pm:
            _create_pending_oem_invoice(db, oem_org, client_org, order, license_id)
            logger.warning("[oem_billing] OEM %s has no default PM — pending invoice created", oem_org.org_id)
            return

        intent = _stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=oem_org.stripe_customer_id,
            payment_method=default_pm,
            confirm=True,
            off_session=True,
            description=f"Synerex platform fee — {client_org.org_name} ({order.plan}) renewal",
            metadata={
                "oem_org_id": oem_org.org_id,
                "client_org_id": client_org.org_id,
                "license_id": license_id,
                "order_id": order.order_id,
                "event_type": "renewal",
            },
        )

        status = "paid" if intent.status == "succeeded" else "pending"
        invoice_id = f"INV-OEM-{oem_org.org_id}-{client_org.org_id}-{int(_dt.utcnow().timestamp())}"
        inv = OemInvoice(
            invoice_id=invoice_id,
            oem_org_id=oem_org.org_id,
            client_org_id=client_org.org_id,
            license_id=license_id,
            plan=order.plan,
            event_type="renewal",
            amount=f"{amount_cents / 100:.2f}",
            currency="USD",
            status=status,
            paid_at=_dt.utcnow() if status == "paid" else None,
            notes=f"Stripe charge: {intent.id}",
        )
        db.add(inv)
        db.commit()
        log_event(db, actor="stripe_webhook", action="oem_invoice.auto_charged", ref_id=invoice_id,
                  detail={"oem_org_id": oem_org.org_id, "intent_id": intent.id, "status": status})
        logger.info("[oem_billing] OEM %s charged %s cents for renewal of %s", oem_org.org_id, amount_cents, client_org.org_id)

    except Exception as exc:
        logger.error("[oem_billing] Failed to charge OEM %s: %s", oem_org.org_id, exc)
        # Fall back to pending invoice so Synerex Admin can collect manually
        _create_pending_oem_invoice(db, oem_org, client_org, order, license_id)


def _create_pending_oem_invoice(db, oem_org, client_org, order, license_id):
    """Create a pending OEM invoice for manual collection (fallback when Stripe charge fails)."""
    from ..models.oem_invoice import OemInvoice
    from datetime import datetime as _dt

    if not oem_org:
        return
    amount_cents = _OEM_PLATFORM_FEES.get(order.plan, 0)
    invoice_id = f"INV-OEM-{oem_org.org_id}-{client_org.org_id}-{int(_dt.utcnow().timestamp())}"
    inv = OemInvoice(
        invoice_id=invoice_id,
        oem_org_id=oem_org.org_id,
        client_org_id=client_org.org_id,
        license_id=license_id,
        plan=order.plan,
        event_type="renewal",
        amount=f"{amount_cents / 100:.2f}",
        currency="USD",
        status="pending",
        notes="No card on file — manual collection required.",
    )
    db.add(inv)
    db.commit()
