from __future__ import annotations
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.billing import BillingOrder
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..audit.events import log_event
from ..licensing.issuer import issue_license_record

router = APIRouter(prefix="/admin/billing", tags=["billing"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _today_iso():
    return datetime.utcnow().date().isoformat()

@router.get("/orders")
def list_orders(
    org_id: Optional[str] = Query(None, description="Filter by organization ID"),
    program_id: Optional[str] = Query(None, description="Filter by program ID (emv or tracking)"),
    status: Optional[str] = Query(None, description="Filter by status (pending, paid, overdue)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List all billing orders with optional filtering."""
    query = db.query(BillingOrder)
    
    if org_id:
        query = query.filter(BillingOrder.org_id == org_id)
    if program_id:
        if program_id not in ("emv", "tracking"):
            raise HTTPException(400, "program_id must be emv or tracking")
        query = query.filter(BillingOrder.program_id == program_id)
    if status:
        if status not in ("pending", "paid", "overdue"):
            raise HTTPException(400, "status must be pending, paid, or overdue")
        query = query.filter(BillingOrder.status == status)
    
    total = query.count()
    orders = query.order_by(BillingOrder.order_id.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "orders": [{
            "order_id": o.order_id,
            "org_id": o.org_id,
            "program_id": o.program_id,
            "plan": o.plan,
            "status": o.status,
            "amount_total": o.amount_total,
            "currency": o.currency,
            "due_at": o.due_at.isoformat() if o.due_at else None,
            "paid_at": o.paid_at.isoformat() if o.paid_at else None,
            "license_id": o.license_id
        } for o in orders]
    }

@router.post("/orders")
def create_order(body: Dict[str, Any], db: Session = Depends(db_session)):
    """Create a billing order (pending) that will gate license issuance/activation."""
    order_id = body.get("order_id")
    if not order_id:
        raise HTTPException(400, "order_id_required")
    if db.get(BillingOrder, order_id):
        raise HTTPException(409, "order_id_exists")

    org_id = body.get("org_id")
    program_id = body.get("program_id")  # emv|tracking
    plan = body.get("plan")
    if not org_id or program_id not in {"emv","tracking"} or not plan:
        raise HTTPException(400, "org_id_program_id_plan_required")

    term_start = body.get("term_start") or _today_iso()
    term_end = body.get("term_end")
    if not term_end:
        raise HTTPException(400, "term_end_required")

    seat_count = int(body.get("seat_count") or 0)
    meter_count = int(body.get("meter_count") or 0)

    unit_price = str(body.get("unit_price") or "0")
    amount_total = str(body.get("amount_total") or "0")
    currency = body.get("currency") or "USD"

    due_days = int(body.get("due_days") or 30)
    due_at = datetime.utcnow() + timedelta(days=due_days)

    rec = BillingOrder(
        order_id=order_id,
        org_id=org_id,
        program_id=program_id,
        plan=plan,
        term_start=term_start,
        term_end=term_end,
        seat_count=seat_count,
        meter_count=meter_count,
        unit_price=unit_price,
        amount_total=amount_total,
        currency=currency,
        status="pending",
        due_at=due_at,
        notes=body.get("notes"),
    )
    db.add(rec)
    db.commit()

    log_event(db, actor="admin", action="billing.order.create", ref_id=order_id, detail={"org_id": org_id, "program_id": program_id, "plan": plan, "amount_total": amount_total, "currency": currency})
    return {"ok": True, "order_id": order_id, "status": rec.status, "due_at": rec.due_at.isoformat()}

@router.get("/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(db_session)):
    """Get a single billing order."""
    rec = db.get(BillingOrder, order_id)
    if not rec:
        raise HTTPException(404, "Not found")
    return {
        "order_id": rec.order_id,
        "org_id": rec.org_id,
        "program_id": rec.program_id,
        "plan": rec.plan,
        "term_start": rec.term_start,
        "term_end": rec.term_end,
        "seat_count": rec.seat_count,
        "meter_count": rec.meter_count,
        "unit_price": rec.unit_price,
        "amount_total": rec.amount_total,
        "currency": rec.currency,
        "status": rec.status,
        "due_at": rec.due_at.isoformat() if rec.due_at else None,
        "paid_at": rec.paid_at.isoformat() if rec.paid_at else None,
        "license_id": rec.license_id,
        "notes": rec.notes,
    }

@router.patch("/orders/{order_id}")
def update_order(
    order_id: str,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """Update a billing order."""
    order = db.get(BillingOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    
    # Update allowed fields
    if "notes" in body:
        order.notes = body["notes"]
    if "amount_total" in body:
        order.amount_total = str(body["amount_total"])
    if "unit_price" in body:
        order.unit_price = str(body["unit_price"])
    if "currency" in body:
        order.currency = body["currency"]
    if "term_start" in body:
        order.term_start = body["term_start"]
    if "term_end" in body:
        order.term_end = body["term_end"]
    if "due_at" in body:
        try:
            order.due_at = datetime.fromisoformat(body["due_at"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(400, "Invalid due_at format (use ISO 8601)")
    
    db.commit()
    log_event(db, actor="admin", action="billing.order.update", ref_id=order_id, detail=body)
    return {"ok": True, "order_id": order_id}

@router.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    force: bool = Query(False, description="Force delete even if paid"),
    db: Session = Depends(db_session)
):
    """Delete a billing order."""
    order = db.get(BillingOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    
    if not force and order.status == "paid":
        raise HTTPException(409, "Cannot delete paid order. Use force=true to override.")
    
    db.delete(order)
    db.commit()
    log_event(db, actor="admin", action="billing.order.delete", ref_id=order_id, detail={"force": force})
    return {"ok": True, "order_id": order_id}

@router.post("/orders/{order_id}/mark-paid")
def mark_paid_and_issue(order_id: str, body: Dict[str, Any] = {}, db: Session = Depends(db_session)):
    """Mark order as paid and issue (or activate) the license. Only call this after payment has been verified and cleared."""
    from ..models.payment import Payment
    
    order = db.get(BillingOrder, order_id)
    if not order:
        raise HTTPException(404, "Not found")
    if order.status == "paid" and order.license_id:
        return {"ok": True, "order_id": order_id, "status": "paid", "license_id": order.license_id}
    
    # Verify that payment exists and is completed
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(400, "No payment found for this order. Payment must be created before marking as paid.")
    if payment.status != "completed":
        raise HTTPException(400, f"Payment status is '{payment.status}', not 'completed'. Payment must be verified and cleared before issuing license.")

    # ensure authorization exists and is active for the term
    auth = ProgramAuthorization(
        authorization_id=body.get("authorization_id") or f"AUTH-{order_id}",
        org_id=order.org_id,
        program_id=order.program_id,
        plan=order.plan,
        status="active",
        starts_at=order.term_start,
        ends_at=order.term_end,
        seat_limit=order.seat_count,
        meter_limit=order.meter_count,
    )
    # If auth exists, reuse
    existing = db.get(ProgramAuthorization, auth.authorization_id)
    if existing:
        auth = existing
        auth.status = "active"
        auth.starts_at = order.term_start
        auth.ends_at = order.term_end
        auth.seat_limit = order.seat_count
        auth.meter_limit = order.meter_count
        db.commit()
    else:
        db.add(auth)
        db.commit()

    # Build license payload
    license_payload = {
        "license_id": body.get("license_id") or f"LIC-{order.program_id.upper()}-{order_id}",
        "subject": {"org_id": order.org_id},
        "program": {"program_id": order.program_id, "plan": order.plan},
        "roles": body.get("roles") or (["oem_engineer"] if order.program_id == "emv" else ["customer_admin"]),
        "entitlements": {
            "plan": order.plan,
            "features": body.get("features") or [],
            "limits": {
                "seat_limit": order.seat_count,
                "meter_limit": order.meter_count,
            },
        },
        "term": {"start": order.term_start, "end": order.term_end},
        "revocation": {"cache_ttl_sec": 30, "grace_seconds": 300},
        "bindings": body.get("bindings") or {},
    }

    # Tracking requires lineage if you choose to enforce at issuance time for paid orders;
    # existing enforcement is in authorizations route for tracking authorizations. Here we allow
    # bindings.baseline_lineage if provided by body.
    rec, signed = issue_license_record(db, authorization=auth, license_payload=license_payload)

    # Update payment to completed if not already (should already be completed from verification above)
    if payment.status != "completed":
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()
        if not payment.gateway_transaction_id:
            payment.gateway_transaction_id = f"TXN-{order_id}-{int(datetime.utcnow().timestamp())}"

    # Update order
    order.status = "paid"
    order.paid_at = datetime.utcnow()
    order.license_id = rec.license_id
    db.commit()

    log_event(db, actor="admin", action="billing.order.paid", ref_id=order_id, detail={"license_id": rec.license_id, "org_id": order.org_id, "program_id": order.program_id, "payment_id": payment.id})
    return {"ok": True, "order_id": order_id, "status": "paid", "license": signed}

@router.post("/payments/{payment_id}/verify")
def verify_payment_and_issue_license(payment_id: str, body: Dict[str, Any] = {}, db: Session = Depends(db_session)):
    """
    Verify a payment (mark as completed) and issue license.
    This is used for EFT payments or when manually verifying credit card/PayPal payments.
    """
    from ..models.payment import Payment
    from ..models.org import Organization
    from ..templates_loader import load_template
    from ..config import settings
    from ..licensing import build_license_payload
    
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    
    if payment.status == "completed":
        # Payment already verified, check if license exists
        order = db.get(BillingOrder, payment.order_id)
        if order and order.license_id:
            return {"ok": True, "message": "Payment already verified and license issued", "payment_id": payment_id, "license_id": order.license_id}
        # Payment verified but no license - continue to issue
    
    # Mark payment as completed
    payment.status = "completed"
    payment.completed_at = datetime.utcnow()
    if not payment.gateway_transaction_id:
        payment.gateway_transaction_id = body.get("transaction_id") or f"TXN-{payment_id}-{int(datetime.utcnow().timestamp())}"
    db.commit()
    
    # Get order
    order = db.get(BillingOrder, payment.order_id)
    if not order:
        raise HTTPException(404, "Order not found for this payment")
    
    # Issue license using the mark_paid_and_issue logic
    # This will verify payment is completed and issue license
    return mark_paid_and_issue(payment.order_id, body, db)

@router.post("/orders/{order_id}/mark-overdue")
def mark_overdue_and_suspend(order_id: str, reason: str = "nonpayment", db: Session = Depends(db_session)):
    order = db.get(BillingOrder, order_id)
    if not order:
        raise HTTPException(404, "Not found")
    order.status = "overdue"
    db.commit()

    # suspend related license if exists
    if order.license_id:
        lic = db.get(License, order.license_id)
        if lic and (not lic.revoked):
            lic.suspended = True
            lic.suspended_at = datetime.utcnow()
            lic.suspended_reason = reason
            db.commit()
            log_event(db, actor="system", action="license.suspend", ref_id=lic.license_id, detail={"reason": reason, "order_id": order_id})

    log_event(db, actor="admin", action="billing.order.overdue", ref_id=order_id, detail={"reason": reason})
    return {"ok": True, "order_id": order_id, "status": "overdue"}

@router.post("/run-suspension-scan")
def run_suspension_scan(db: Session = Depends(db_session)):
    """Automation endpoint: scan pending orders past due_at and suspend linked licenses."""
    now = datetime.utcnow()
    orders = db.query(BillingOrder).filter(BillingOrder.status == "pending").all()
    suspended = 0
    overdue = 0
    for o in orders:
        if o.due_at and o.due_at < now:
            o.status = "overdue"
            overdue += 1
            if o.license_id:
                lic = db.get(License, o.license_id)
                if lic and (not lic.revoked):
                    lic.suspended = True
                    lic.suspended_at = now
                    lic.suspended_reason = "nonpayment"
                    suspended += 1
            log_event(db, actor="system", action="billing.order.auto_overdue", ref_id=o.order_id, detail={"license_id": o.license_id})
    db.commit()
    return {"ok": True, "overdue": overdue, "licenses_suspended": suspended}
