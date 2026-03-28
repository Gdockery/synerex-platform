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

    log_event(
        db,
        actor="stripe_webhook",
        action="payment.completed",
        ref_id=payment_intent_id,
        detail={"order_id": order.order_id, "license_id": license_rec.license_id, "gateway": "stripe"},
    )
    logger.info("[stripe] License issued: %s for order %s", license_rec.license_id, order.order_id)
