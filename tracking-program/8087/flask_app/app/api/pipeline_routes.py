"""
pipeline_routes.py — Project pipeline / commercial-workflow tracking.

GET  /api/pipeline/projects
    List all pipeline projects (bill scanned, not yet installed).
    ops_admin sees all; OEM users see their own org's projects only.

GET  /api/pipeline/project/<id>
    Full stage detail for one project.

POST /api/pipeline/project/<id>/mark
    Generic "mark stage" action.
    Body: { "field": "<column_name>", "value": <timestamp_ms | str | null> }

POST /api/pipeline/project/<id>/approve-proposal
    Set proposal_status = "approved" and email landon@synerexlabs.com.

POST /api/pipeline/project/<id>/release
    Set release_status = 1 + released_at, then notify the Deploy app.

GET  /api/pipeline/installed
    List installed projects (installationConfirmedAt IS NOT NULL).
"""
import logging
import os
import time

import requests as _requests
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import or_

from app.extensions import db
from app.db.request_session import get_session
from app.models.project import Project
from app.models.client import Client
from app.models.user import User
from app.services.alert_service import _send_alert_email

logger = logging.getLogger(__name__)

pipeline_bp = Blueprint("pipeline", __name__, url_prefix="")

DEPLOY_URL          = os.environ.get("DEPLOY_URL",          "http://172.18.1.21:8092")
INTERNAL_API_TOKEN  = os.environ.get("INTERNAL_API_TOKEN",  "")
LANDON_EMAIL        = "landon@synerexlabs.com"

CARRIER_TRACK_URLS = {
    "arcbest":   "https://www.arcb.com/tools/tracking.html?pro={number}",
    "freightos": "https://www.freightos.com/track/?trackingNumber={number}",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _is_ops_admin():
    role = getattr(current_user, "role", None)
    # Accept both string role names and numeric roles >= 8 (OEM Admin and above)
    if role in ("ops_admin", "synerex_admin", "admin"):
        return True
    try:
        return int(role) >= 8
    except (TypeError, ValueError):
        return False


def _user_org_id():
    return getattr(current_user, "org_id", None)


def _project_query(sess, installed=False, any_status=False):
    """Return a query for pipeline or installed projects filtered to the current user.
    Pass any_status=True to skip the installed/pipeline filter (used for detail views
    so an installed project can still be viewed on its pipeline page)."""
    q = sess.query(Project, Client).join(Client, Project.client == Client.id).filter(
        Project.isDeleted == False,
        Project.electricBillAnalysis.isnot(None),
    )
    if not any_status:
        if installed:
            q = q.filter(Project.installationConfirmedAt.isnot(None))
        else:
            q = q.filter(Project.installationConfirmedAt.is_(None))

    if not _is_ops_admin():
        org_id = _user_org_id()
        if org_id:
            q = q.filter(or_(
                Client.org_id == org_id,
                Project.org_id == org_id,
                Client.sponsor_org_id == org_id,
            ))
        else:
            q = q.filter(False)
    return q


def _ms():
    return int(time.time() * 1000)


def _stage_summary(p: Project) -> dict:
    """Derive the current pipeline stage name and whether it's waiting on customer."""
    stages = [
        ("Bill Scanned",              p.electricBillAnalysis is not None,    False),
        ("SLD Uploaded",              p.sldAnalysis is not None,             False),
        ("Proposal Generated",        p.proposalData is not None,            False),
        ("Proposal Sent",             p.proposal_sent_at is not None,        True),
        ("Proposal Approved",         p.proposal_status == "approved",       True),
        ("Deposit Invoice Sent",      p.deposit_invoice_sent_at is not None, True),
        ("Deposit Paid",              p.deposit_paid_at is not None,         True),
        ("PO Received",               p.po_received_at is not None,         True),
        ("Shipped",                   p.tracking_number is not None,         False),
        ("Delivered",                 p.delivered_at is not None,            False),
        ("Released to Deploy",        p.release_status == 1,                 False),
        ("Installation Complete",     p.installationConfirmedAt is not None, False),
        ("Install Invoice Sent",      p.install_invoice_sent_at is not None, True),
        ("EM&V Report Generated",     p.active_emv_analysis_id is not None,  False),
        ("Final Invoice Sent",        p.final_invoice_sent_at is not None,   True),
    ]
    current_stage = "Pending"
    waiting = False
    for name, done, waits in stages:
        if done:
            current_stage = name
        else:
            # First incomplete stage tells us if we're waiting on customer
            waiting = waits
            break
    return {"current_stage": current_stage, "waiting_on_customer": waiting}


def _project_detail(p: Project, client: Client) -> dict:
    summary = _stage_summary(p)
    track_url = None
    if p.tracking_number and p.carrier:
        tmpl = CARRIER_TRACK_URLS.get(p.carrier)
        if tmpl:
            track_url = tmpl.format(number=p.tracking_number)

    return {
        "id":                       p.id,
        "name":                     p.name,
        "client_name":              client.name if client else "",
        "client_id":                p.client,
        "location":                 p.location,
        "current_stage":            summary["current_stage"],
        "waiting_on_customer":      summary["waiting_on_customer"],
        # Document links
        "proposal_src":             p.proposalSrc,
        "deposit_invoice_src":      p.depositInvoiceSrc,
        "install_invoice_src":      p.installationInvoiceSrc,
        "final_invoice_src":        p.finalInvoiceSrc,
        # Stage timestamps
        "bill_scanned_at":          p.electricBillAnalysisUpdatedAt if p.electricBillAnalysisUpdatedAt else (1 if p.electricBillAnalysis is not None else None),
        "sld_uploaded":             p.sldAnalysis is not None,
        "proposal_generated":       bool(p.proposalSrc),
        "proposal_sent_at":         p.proposal_sent_at,
        "proposal_status":          p.proposal_status,
        "deposit_invoice_sent_at":  p.deposit_invoice_sent_at,
        "deposit_paid_at":          p.deposit_paid_at,
        "purchase_order":           p.purchaseOrder,
        "po_received_at":           p.po_received_at,
        "install_invoice_sent_at":  p.install_invoice_sent_at,
        "final_invoice_sent_at":    p.final_invoice_sent_at,
        "tracking_number":          p.tracking_number,
        "carrier":                  p.carrier,
        "tracking_url":             track_url,
        "delivered_at":             p.delivered_at,
        "release_status":           p.release_status,
        "released_at":              p.released_at,
        "installation_confirmed_at": p.installationConfirmedAt,
        "emv_analysis_id":          p.active_emv_analysis_id,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@pipeline_bp.get("/api/pipeline/projects")
@login_required
def list_pipeline_projects():
    sess = get_session()
    rows = _project_query(sess, installed=False).order_by(Project.id.desc()).all()
    return jsonify([_project_detail(p, c) for p, c in rows])


@pipeline_bp.get("/api/pipeline/installed")
@login_required
def list_installed_projects():
    sess = get_session()
    rows = _project_query(sess, installed=True).order_by(Project.installationConfirmedAt.desc()).all()
    return jsonify([_project_detail(p, c) for p, c in rows])


@pipeline_bp.get("/api/pipeline/project/<int:project_id>")
@login_required
def get_pipeline_project(project_id):
    sess = get_session()
    row = _project_query(sess, any_status=True).filter(Project.id == project_id).first()
    if not row:
        return jsonify({"error": "Not found"}), 404
    p, c = row
    return jsonify(_project_detail(p, c))


@pipeline_bp.post("/api/pipeline/project/<int:project_id>/mark")
@login_required
def mark_pipeline_stage(project_id):
    """Generic mark endpoint. Body: {field, value, note?}."""
    ALLOWED_FIELDS = {
        "proposal_sent_at", "deposit_invoice_sent_at", "deposit_paid_at",
        "po_received_at", "install_invoice_sent_at", "final_invoice_sent_at",
        "tracking_number", "carrier", "delivered_at", "purchaseOrder",
    }
    sess = get_session()
    row = _project_query(sess, any_status=True).filter(Project.id == project_id).first()
    if not row:
        return jsonify({"error": "Not found"}), 404
    p, _ = row

    body  = request.get_json(silent=True) or {}
    field = body.get("field")
    value = body.get("value")

    if field not in ALLOWED_FIELDS:
        return jsonify({"error": f"Field '{field}' not allowed"}), 400

    # Timestamp fields: if value is True, stamp now; if None/False, clear
    timestamp_fields = {
        "proposal_sent_at", "deposit_invoice_sent_at", "deposit_paid_at",
        "po_received_at", "install_invoice_sent_at", "final_invoice_sent_at",
        "delivered_at",
    }
    if field in timestamp_fields:
        value = _ms() if value else None

    setattr(p, field, value)
    sess.commit()
    return jsonify({"ok": True})


@pipeline_bp.post("/api/pipeline/project/<int:project_id>/approve-proposal")
@login_required
def approve_proposal(project_id):
    if not _is_ops_admin():
        return jsonify({"error": "Forbidden"}), 403

    sess = get_session()
    row = _project_query(sess).filter(Project.id == project_id).first()
    if not row:
        return jsonify({"error": "Not found"}), 404
    p, c = row

    p.proposal_status = "approved"
    sess.commit()

    # Email Landon
    client_name = c.name if c else "Unknown Client"
    peak_kw = ""
    if p.electricBillAnalysis and isinstance(p.electricBillAnalysis, dict):
        peak_kw = p.electricBillAnalysis.get("peakKw") or p.electricBillAnalysis.get("peak_kw") or ""

    body = f"""
    <h2>Proposal Approved</h2>
    <p><strong>Project:</strong> {p.name}</p>
    <p><strong>Client:</strong> {client_name}</p>
    {f'<p><strong>Peak kW:</strong> {peak_kw}</p>' if peak_kw else ''}
    <p>The proposal has been marked as approved in the Tracking system.
       Please generate the sales order and invoice forms.</p>
    <p><a href="https://synerexlabs.com/tracking/#/project/pipeline/{p.id}">
       View project pipeline →</a></p>
    """
    try:
        _send_alert_email(LANDON_EMAIL, f"Proposal Approved — {p.name} ({client_name})", body)
    except Exception as e:
        logger.warning("Failed to email Landon on proposal approval: %s", e)

    return jsonify({"ok": True})


@pipeline_bp.post("/api/pipeline/project/<int:project_id>/release")
@login_required
def release_project(project_id):
    if not _is_ops_admin():
        return jsonify({"error": "Forbidden"}), 403

    sess = get_session()
    row = _project_query(sess).filter(Project.id == project_id).first()
    if not row:
        return jsonify({"error": "Not found"}), 404
    p, _ = row

    p.release_status = 1
    p.released_at    = _ms()
    sess.commit()

    # Notify deploy app to unlock the site
    deploy_result = None
    if INTERNAL_API_TOKEN:
        try:
            resp = _requests.post(
                f"{DEPLOY_URL}/api/internal/sites/release",
                json={"tracking_project_id": p.id},
                headers={"X-Internal-Token": INTERNAL_API_TOKEN},
                timeout=5,
            )
            deploy_result = resp.json()
        except Exception as e:
            logger.warning("Could not notify deploy app of release: %s", e)
            deploy_result = {"error": str(e)}

    return jsonify({"ok": True, "deploy": deploy_result})
