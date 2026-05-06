"""
proposal_routes.py — ECBS Proposal generation routes.

POST /api/project/<id>/proposal/facility-context
    Proxy to GPU /facility/context to get a descriptive phrase about the facility.
    Saves the result to project.proposalData.facilityContext.

POST /api/project/<id>/proposal/save
    Save proposal input overrides (savingsPct, overrides, n_meters, etc.)
    to project.proposalData.

GET  /api/project/<id>/proposal/preview
    Returns the computed values (no PDF, just numbers) for a quick preview.

GET  /api/project/<id>/proposal/pdf
    Generates and streams the ECBS Proposal PDF (WeasyPrint).
"""
import base64
import io
import logging
import os
import time

import requests as _requests
from flask import Blueprint, current_app, jsonify, request, Response
from flask_login import current_user, login_required
from pathlib import Path

from app.extensions import db
from app.db.request_session import get_session
from app.models.project import Project
from app.models.client import Client
from app.models.user import User

logger = logging.getLogger(__name__)

proposal_bp = Blueprint("proposal", __name__, url_prefix="")

GPU_PLATFORM_URL = os.environ.get("BILL_PLATFORM_URL", "http://100.106.19.30:8000")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_project_for_user(project_id):
    """Return (session, project) if current user has access, else (None, None)."""
    from app.api.web_routes import _user_can_access_project
    sess = get_session()
    p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if p is None:
        return None, None
    user = sess.query(User).get(current_user.id)
    if not _user_can_access_project(sess, user, p):
        return None, None
    return sess, p


def _load_logo_b64(logo_src: str, logo_type: str) -> str | None:
    """Try to load a logo from STORAGE_LOCAL_PATH and return base64, or None."""
    storage = current_app.config.get("STORAGE_LOCAL_PATH", "")
    if not storage or not logo_src:
        return None
    try:
        path = Path(storage) / "images" / logo_type / logo_src
        if path.exists():
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode()
    except Exception:
        pass
    return None


def _load_xeco_logo_b64() -> str:
    """Load the Xeco logo from assets."""
    # Try Flask app static assets folder
    assets_candidates = [
        Path(current_app.root_path).parent / "8087" / "assets" / "img" / "xeco-logo.png",
        Path(current_app.root_path).parent / "assets" / "img" / "xeco-logo.png",
        Path(current_app.root_path) / "assets" / "xeco-logo.png",
    ]
    for p in assets_candidates:
        if p.exists():
            try:
                with open(p, "rb") as f:
                    return base64.b64encode(f.read()).decode()
            except Exception:
                pass
    return ""


def _assemble_proposal_data(project: Project, overrides: dict) -> dict:
    """
    Build the full input dict for xeco_proposal from project + client data + overrides.
    overrides: dict from proposalData (saved user customisations).
    """
    client: Client | None = Client.query.get(project.client) if project.client else None

    # Preparer info: from user record
    user = current_user
    prepared_by_org = getattr(user, "company", None) or "Xeco Energy Corporation"
    preparer_name = (getattr(user, "name", None) or
                     f"{getattr(user, 'firstName', '') or ''} {getattr(user, 'lastName', '') or ''}".strip()
                     or "")

    # Bill analytic data (used for bill fields)
    bill = getattr(project, "electricBillAnalysis", None) or {}
    sld  = getattr(project, "sldAnalysis", None) or {}
    eba  = bill  # shorthand
    meter_bills = bill.get("meterBills") or []
    primary_mb  = meter_bills[0] if meter_bills else bill

    # Legal name from the bill takes priority over the internal client/project label
    customer   = (primary_mb.get("customerName") or bill.get("customerName") or "").strip()
    if not customer:
        customer = (client.name if client else project.name) or ""
    address    = " ".join(filter(None, [
        getattr(client, "address", None) or "",
        getattr(client, "city", None) or "",
        getattr(client, "state", None) or "",
        getattr(client, "zip", None) or "",
    ])).strip() if client else (project.location or "")
    country    = getattr(client, "country", None) or "USA"
    contact_name  = getattr(client, "contactName", None) or ""
    contact_title = getattr(client, "contactTitle", None) or ""
    contact_phone = getattr(client, "contactPhone", None) or ""
    facility_type = getattr(client, "marketSegment", None) or ""

    # Logo: customer
    cust_logo_b64 = None
    if client and getattr(client, "logoImgSrc", None):
        cust_logo_b64 = _load_logo_b64(client.logoImgSrc, "client_company_logo")

    # Bill fields
    meter_bills = eba.get("meterBills") or []
    primary     = meter_bills[0] if meter_bills else eba

    peak_kw     = float(overrides.get("peakKw") or primary.get("kwPeak") or eba.get("kwPeak") or 0)
    kwh         = float(overrides.get("kwh") or primary.get("totalKwh") or eba.get("totalKwh") or 0)
    monthly_bill = float(overrides.get("monthlyBill") or primary.get("billAmount") or eba.get("billAmount") or 0)
    days        = int(overrides.get("days") or primary.get("daysBilled") or eba.get("daysBilled") or 30)
    demand_rate = float(overrides.get("demandRate") or primary.get("kwRatePerTariff") or eba.get("kwRatePerTariff") or 0)
    blended     = monthly_bill / kwh if kwh else 0
    energy_prov = overrides.get("energyProvider") or primary.get("electricCompanyName") or eba.get("electricCompanyName") or ""
    tariff_name = overrides.get("tariffName") or primary.get("tariff") or eba.get("tariff") or ""
    meter_num   = overrides.get("meterNumber") or primary.get("meterNumber") or eba.get("meterNumber") or ""
    billing_period = overrides.get("billingPeriod") or eba.get("billingPeriod") or ""

    # SLD overrides
    s600_override   = sld.get("s600Count") or None
    apf100_override = sld.get("apf100Count") or None
    apf50_override  = sld.get("apf50Count") or None
    # User can override further via proposalData
    if overrides.get("s600Override") is not None:
        s600_override = overrides["s600Override"]
    if overrides.get("apf100Override") is not None:
        apf100_override = overrides["apf100Override"]
    if overrides.get("apf50Override") is not None:
        apf50_override = overrides["apf50Override"]

    from app.services.xeco_proposal import DEFAULT_SAVINGS_PCT
    data = {
        "customer":        customer,
        "site_name":       overrides.get("siteName") or project.location or customer,
        "address":         overrides.get("address") or address,
        "country":         overrides.get("country") or country,
        "region":          overrides.get("region") or "North America",
        "facility_type":   overrides.get("facilityType") or facility_type,
        "energy_provider": energy_prov,
        "tariff_name":     tariff_name,
        "meter_number":    meter_num,
        "billing_period":  billing_period,
        "proposal_month":  overrides.get("proposalMonth") or "",

        "peak_kw":         peak_kw,
        "peak_source":     overrides.get("peakSource") or "Explicit",
        "kwh":             kwh,
        "days":            days,
        "monthly_bill":    monthly_bill,
        "demand_rate_usd": demand_rate,
        "blended_rate_usd": blended,

        "n_meters":        int(overrides.get("nMeters") or 1),
        "excluded_meters": overrides.get("excludedMeters") or [],

        "s600_override":   s600_override,
        "apf100_override": apf100_override,
        "apf50_override":  apf50_override,

        "savings_pct":     float(overrides.get("savingsPct") or DEFAULT_SAVINGS_PCT),
        "shipping_rate":   float(overrides.get("shippingRate") or 275.0),
        "ramp_up_note":    overrides.get("rampUpNote") or None,
        "facility_context": overrides.get("facilityContext") or "",

        "prepared_by_org": prepared_by_org,
        "preparer_name":   preparer_name,
        "contact_name":    overrides.get("contactName") or contact_name,
        "contact_title":   overrides.get("contactTitle") or contact_title,
        "contact_phone":   overrides.get("contactPhone") or contact_phone,

        "xeco_logo_b64":       _load_xeco_logo_b64(),
        "customer_logo_b64":   cust_logo_b64,
    }
    return data


# ── Routes ───────────────────────────────────────────────────────────────────

@proposal_bp.route("/api/project/<int:project_id>/proposal/facility-context", methods=["POST"])
@login_required
def get_facility_context(project_id):
    """
    POST /api/project/<id>/proposal/facility-context
    Body: {} (uses existing client/address data from project)
    Calls GPU /facility/context, saves to project.proposalData.facilityContext.
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    bill = getattr(project, "electricBillAnalysis", None) or {}
    meter_bills = bill.get("meterBills") or []
    primary_bill = meter_bills[0] if meter_bills else bill

    # Prefer the legal name on the bill, fall back to client/project label
    customer = (primary_bill.get("customerName") or bill.get("customerName") or "").strip()
    client = sess.query(Client).get(project.client) if project.client else None
    if not customer:
        customer = (client.name if client else project.name) or ""

    address  = " ".join(filter(None, [
        getattr(client, "address", None) or "",
        getattr(client, "city", None) or "",
        getattr(client, "state", None) or "",
        getattr(client, "country", None) or "",
    ])).strip() if client else (project.location or "")

    if not customer:
        return jsonify({"error": "No customer name available on this project"}), 400

    try:
        resp = _requests.post(
            f"{GPU_PLATFORM_URL}/facility/context",
            headers={"Content-Type": "application/json"},
            json={"customer": customer, "address": address},
            timeout=25,
        )
        resp.raise_for_status()
        result = resp.json()
        facility_context = result.get("facility_context", "")
    except _requests.exceptions.Timeout:
        return jsonify({"error": "GPU server timed out. Try again."}), 504
    except _requests.exceptions.RequestException as e:
        logger.error("GPU facility-context error: %s", e)
        return jsonify({"error": "Could not fetch facility context from GPU server"}), 502

    # Save to project.proposalData
    pd = dict(project.proposalData or {})
    pd["facilityContext"] = facility_context
    project.proposalData = pd
    sess.add(project)
    sess.commit()

    return jsonify({"facilityContext": facility_context})


@proposal_bp.route("/api/project/<int:project_id>/proposal/save", methods=["POST"])
@login_required
def save_proposal_data(project_id):
    """
    POST /api/project/<id>/proposal/save
    Body: { savingsPct, nMeters, s600Override, apf100Override, apf50Override,
            facilityContext, rampUpNote, siteName, region, peakSource, shippingRate, ... }
    Merges into project.proposalData.
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    body = request.get_json(force=True) or {}
    pd = dict(project.proposalData or {})
    allowed = {
        "savingsPct", "nMeters", "s600Override", "apf100Override", "apf50Override",
        "facilityContext", "rampUpNote", "siteName", "region", "peakSource",
        "shippingRate", "energyProvider", "tariffName", "meterNumber", "billingPeriod",
        "proposalMonth", "contactName", "contactTitle", "contactPhone",
        "facilityType", "country", "address", "peakKw", "kwh",
        "monthlyBill", "days", "demandRate", "excludedMeters",
    }
    for k, v in body.items():
        if k in allowed:
            pd[k] = v
    project.proposalData = pd
    sess.add(project)
    sess.commit()
    return jsonify({"ok": True, "proposalData": pd})


@proposal_bp.route("/api/project/<int:project_id>/proposal/preview", methods=["GET"])
@login_required
def preview_proposal(project_id):
    """
    GET /api/project/<id>/proposal/preview
    Returns computed values (equipment counts, costs, ROI) without generating PDF.
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    overrides = dict(project.proposalData or {})
    try:
        data = _assemble_proposal_data(project, overrides)
        from app.services.xeco_proposal import build_proposal_computed
        computed = build_proposal_computed(data)
        return jsonify({"ok": True, "computed": computed, "inputs": {
            k: data[k] for k in ("peak_kw", "kwh", "monthly_bill", "savings_pct", "n_meters",
                                  "energy_provider", "customer", "facility_context")
        }})
    except Exception as e:
        logger.exception("Proposal preview error")
        return jsonify({"error": str(e)}), 500


@proposal_bp.route("/api/project/<int:project_id>/proposal/pdf", methods=["GET", "POST"])
@login_required
def generate_proposal_pdf(project_id):
    """
    GET /api/project/<id>/proposal/pdf
    Generates and streams the ECBS Proposal PDF.
    Optional query/body param: inline=1 to view in browser (default: attachment).
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    overrides = dict(project.proposalData or {})
    # Allow one-off body overrides without saving (e.g. preview with different savings %)
    if request.method == "POST":
        body = request.get_json(force=True) or {}
        overrides.update(body)

    try:
        data = _assemble_proposal_data(project, overrides)
        from app.services.xeco_proposal import build_proposal_pdf
        pdf_bytes = build_proposal_pdf(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.exception("Proposal PDF generation error")
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500

    inline = request.args.get("inline", "0") in ("1", "true", "yes")
    disp   = "inline" if inline else "attachment"
    slug   = project.slug or str(project.id)
    fname  = f"ecbs-proposal-{slug}.pdf"

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'{disp}; filename="{fname}"'},
    )
