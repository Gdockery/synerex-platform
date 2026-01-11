"""Export routes for CSV/Excel data."""
import csv
import io
from typing import List
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.license import License
from ..models.org import Organization
from ..models.billing import BillingOrder
from ..admin.ui import require_admin

router = APIRouter(prefix="/api/exports", tags=["exports"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _export_to_csv(data: List[dict], filename: str) -> StreamingResponse:
    """Export data to CSV."""
    if not data:
        return Response(content="No data to export", media_type="text/plain")
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/licenses")
def export_licenses(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Export all licenses to CSV."""
    licenses = db.query(License).all()
    data = [{
        "license_id": l.license_id,
        "org_id": l.org_id,
        "program_id": l.program_id,
        "issued_at": l.issued_at.isoformat() if l.issued_at else "",
        "expires_at": l.expires_at.isoformat() if l.expires_at else "",
        "revoked": l.revoked,
        "suspended": l.suspended,
        "is_trial": getattr(l, 'is_trial', False),
        "auto_renew": getattr(l, 'auto_renew', False)
    } for l in licenses]
    
    return _export_to_csv(data, "licenses_export.csv")

@router.get("/organizations")
def export_organizations(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Export all organizations to CSV."""
    orgs = db.query(Organization).all()
    data = [{
        "org_id": o.org_id,
        "org_name": o.org_name,
        "org_type": o.org_type,
        "email": getattr(o, 'email', '') or "",
        "contact_name": getattr(o, 'contact_name', '') or "",
        "phone": getattr(o, 'phone', '') or ""
    } for o in orgs]
    
    return _export_to_csv(data, "organizations_export.csv")

@router.get("/billing")
def export_billing(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Export billing orders to CSV."""
    orders = db.query(BillingOrder).all()
    data = [{
        "order_id": o.order_id,
        "org_id": o.org_id,
        "program_id": o.program_id,
        "plan": o.plan,
        "amount_total": o.amount_total,
        "currency": o.currency,
        "status": o.status,
        "due_at": o.due_at.isoformat() if o.due_at else "",
        "paid_at": getattr(o, 'paid_at', None).isoformat() if hasattr(o, 'paid_at') and o.paid_at else ""
    } for o in orders]
    
    return _export_to_csv(data, "billing_export.csv")


