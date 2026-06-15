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


def _to_float(value):
    """Strip currency formatting ($, commas) and return float, or None on failure."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace("$", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return None


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

    # Preparer info: from user record + OEM branding
    user = current_user
    prepared_by_org = getattr(user, "company", None) or "Xeco Energy Corporation"
    preparer_name = (getattr(user, "name", None) or
                     f"{getattr(user, 'firstName', '') or ''} {getattr(user, 'lastName', '') or ''}".strip()
                     or "")

    # OEM branding — pull brand name, insurance policy, and payment schedule from license service
    insurance_policy = None
    payment_schedule = None
    try:
        from app.models.oem_branding import OemBranding as _OemBranding
        org_id = getattr(user, "org_id", None)
        if org_id:
            # Brand name from local oem_branding table
            _b = _OemBranding.query.filter_by(org_id=org_id).first()
            if _b and _b.brand_name:
                prepared_by_org = _b.brand_name

            # COI + payment schedule from license service org profile (source of truth)
            import requests as _ls_req, json as _json
            _ls_url = os.environ.get("LICENSE_SERVICE_URL", "http://license-service:8000")
            payment_schedule = None
            try:
                _r = _ls_req.get(f"{_ls_url}/api/orgs/{org_id}", timeout=3)
                if _r.ok:
                    _org_data = _r.json()
                    _raw_ins = _org_data.get("insurance_policy") or None
                    if _raw_ins:
                        try:
                            insurance_policy = _json.loads(_raw_ins)
                        except Exception:
                            insurance_policy = {"carrier": _raw_ins}
                    _raw_pay = _org_data.get("payment_schedule") or None
                    if _raw_pay:
                        try:
                            _rows = _json.loads(_raw_pay)
                            payment_schedule = [r for r in _rows if r.get("pct") or r.get("desc")]
                        except Exception:
                            pass
            except Exception:
                pass
    except Exception:
        pass

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

        "insurance_policy": insurance_policy,
        "payment_schedule": payment_schedule,

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
    Body (all optional overrides):
      { "customer": str, "address": str }
    Calls GPU /facility/context → returns facility_type + facility_context.
    Also derives billingMonthsLabel from bill date, sldSource + capacitorBankBullet
    from accepted SLD analysis. Saves all to project.proposalData.
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    body = request.get_json(silent=True) or {}

    bill = getattr(project, "electricBillAnalysis", None) or {}
    meter_bills = bill.get("meterBills") or []
    primary_bill = meter_bills[0] if meter_bills else bill

    # customer: accept from request body, otherwise pull from bill / client
    customer = (body.get("customer") or "").strip()
    if not customer:
        customer = (primary_bill.get("customerName") or bill.get("customerName") or "").strip()
    client = sess.query(Client).get(project.client) if project.client else None
    if not customer:
        customer = (client.name if client else project.name) or ""

    # address: accept from request body, otherwise build from client record
    address = (body.get("address") or "").strip()
    if not address:
        address = " ".join(filter(None, [
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
        facility_type    = result.get("facility_type", "")
    except _requests.exceptions.Timeout:
        return jsonify({"error": "GPU server timed out. Try again."}), 504
    except _requests.exceptions.RequestException as e:
        logger.error("GPU facility-context error: %s", e)
        return jsonify({"error": "Could not fetch facility context from GPU server"}), 502

    # Derive billing period label from bill date
    billing_months_label = ""
    try:
        bill_date_ms = primary_bill.get("billDate") or bill.get("billDate")
        if bill_date_ms:
            from datetime import datetime as _dt
            bd = _dt.utcfromtimestamp(int(bill_date_ms) / 1000)
            billing_months_label = bd.strftime("%b %Y")
    except Exception:
        pass

    # Derive SLD drawing reference and capacitor bank note from accepted SLD
    sld_source            = ""
    capacitor_bank_bullet = ""
    sld = getattr(project, "sldAnalysis", None) or {}
    if sld.get("status") == "accepted":
        buses = sld.get("buses") or []
        if buses:
            sld_source = buses[0].get("dwg") or sld.get("sldSource") or ""
        capacitor_bank_bullet = sld.get("capacitorBankBullet") or ""

    # Save all to project.proposalData
    pd = dict(project.proposalData or {})
    pd["facilityContext"]      = facility_context
    pd["overviewPara"]         = facility_context   # seed overview paragraph
    if facility_type:
        pd["facilityType"]     = facility_type
    if billing_months_label:
        pd["billingMonthsLabel"] = billing_months_label
    if sld_source:
        pd["sldSource"]        = sld_source
    if capacitor_bank_bullet:
        pd["capacitorBankBullet"] = capacitor_bank_bullet

    project.proposalData = pd
    sess.add(project)
    sess.commit()

    return jsonify({
        "facilityContext":      facility_context,
        "facilityType":         facility_type,
        "overviewPara":         facility_context,
        "billingMonthsLabel":   billing_months_label,
        "sldSource":            sld_source,
        "capacitorBankBullet":  capacitor_bank_bullet,
    })


@proposal_bp.route("/api/project/<int:project_id>/proposal/autofill", methods=["POST"])
@login_required
def autofill_proposal(project_id):
    """
    POST /api/project/<id>/proposal/autofill
    Body (all optional):
      { "bill_id": int, "sld_id": int, "customer": str, "address": str }

    Calls GPU /proposal/autofill, maps the full response, and saves everything
    to project.proposalData + project.reportFields in one shot.
    Returns the full mapped payload + a sources dict telling the UI which
    sections were actually filled (has_bill, has_sld, has_context_ai).
    """
    sess, project = _get_project_for_user(project_id)
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    body = request.get_json(silent=True) or {}

    # Resolve bill_id: request body > electricBillAnalysis.gpuJobId
    bill_id = body.get("bill_id")
    eba = getattr(project, "electricBillAnalysis", None) or {}
    if not bill_id:
        bill_id = eba.get("gpuJobId") or eba.get("gpu_job_id")

    # Resolve sld_id: request body > sldAnalysis.gpuJobId
    sld_id = body.get("sld_id")
    sld = getattr(project, "sldAnalysis", None) or {}
    if not sld_id:
        sld_id = sld.get("gpuJobId") or sld.get("gpu_job_id")

    logger.warning(
        "autofill project=%s body_bill=%s body_sld=%s eba_gpuJobId=%s resolved bill_id=%s sld_id=%s",
        project_id, body.get("bill_id"), body.get("sld_id"),
        eba.get("gpuJobId"), bill_id, sld_id
    )

    # Resolve customer / address fallbacks from project data
    customer = (body.get("customer") or "").strip()
    address  = (body.get("address") or "").strip()
    if not customer or not address:
        client = sess.query(Client).get(project.client) if project.client else None
        eba = getattr(project, "electricBillAnalysis", None) or {}
        if not customer:
            customer = (
                eba.get("customerName") or
                (client.name if client else None) or
                project.name or ""
            ).strip()
        if not address:
            address = " ".join(filter(None, [
                eba.get("serviceAddress") or (getattr(client, "address", None) or ""),
                eba.get("serviceZip")     or (getattr(client, "zip", None) or ""),
            ])).strip()

    # Build GPU request payload
    gpu_body = {}
    if bill_id:
        gpu_body["bill_id"] = int(bill_id)
    if sld_id:
        gpu_body["sld_id"] = int(sld_id)
    if customer:
        gpu_body["customer"] = customer
    if address:
        gpu_body["address"] = address

    if not gpu_body:
        return jsonify({"error": "No bill_id, sld_id, customer, or address available"}), 400

    try:
        resp = _requests.post(
            f"{GPU_PLATFORM_URL}/proposal/autofill",
            headers={"Content-Type": "application/json"},
            json=gpu_body,
            timeout=40,
        )
        resp.raise_for_status()
        result = resp.json()
    except _requests.exceptions.Timeout:
        return jsonify({"error": "GPU server timed out. Try again."}), 504
    except _requests.exceptions.RequestException as e:
        logger.error("GPU autofill error: %s", e)
        return jsonify({"error": "Could not reach GPU server"}), 502

    sources = result.get("sources", {})
    identity = result.get("identity", {})
    narrative = result.get("facility_narrative", {})
    utility = result.get("utility_billing", {})
    commercial = result.get("commercial", {})
    equip = result.get("equipment_counts", {})
    _topo_raw = result.get("topology", {})
    # GPU may return topology as a list (buses array) or as {"buses": [...]}
    if isinstance(_topo_raw, list):
        topo = {"buses": _topo_raw}
    else:
        topo = _topo_raw or {}

    # ── Update proposalData ─────────────────────────────────────────────────
    pd = dict(project.proposalData or {})

    # Facility Narrative
    if narrative.get("facility_type"):      pd["facilityType"]         = narrative["facility_type"]
    if narrative.get("overview_paragraph"): pd["overviewPara"]         = narrative["overview_paragraph"]
    if narrative.get("facility_context"):   pd["facilityContext"]      = narrative["facility_context"]
    if narrative.get("sld_drawing_ref"):    pd["sldSource"]            = narrative["sld_drawing_ref"]
    if narrative.get("billing_period_label"): pd["billingMonthsLabel"] = narrative["billing_period_label"]
    if narrative.get("capacitor_bank_bullet"): pd["capacitorBankBullet"] = narrative["capacitor_bank_bullet"]
    if narrative.get("facility_site_label"): pd["facilitySiteLabel"]   = narrative["facility_site_label"]

    # Power Factor (from utility_billing)
    pf_current     = _to_float(utility.get("pf_current"))
    pf_worst       = _to_float(utility.get("pf_worst"))
    pf_penalty_usd = _to_float(utility.get("pf_penalty_usd"))
    if pf_current     is not None: pd["pfReference"]  = pf_current
    if pf_worst       is not None: pd["pfWorst"]       = pf_worst
    if pf_penalty_usd is not None:
        pd["pfPenaltyUsd"] = pf_penalty_usd
        pd["hasPfPenalty"] = pf_penalty_usd > 0

    # Meters
    n_meters = commercial.get("qualifying_meters") or equip.get("n_meters")
    if n_meters:
        pd["nMeters"] = int(n_meters)

    # Equipment overrides (only set if SLD not present — SLD buses take precedence)
    if equip.get("s600") is not None and not topo.get("buses"):
        pd["s600Override"]   = int(equip["s600"])
    if equip.get("apf100") is not None and not topo.get("buses"):
        pd["apf100Override"] = int(equip["apf100"])
    if equip.get("apf50") is not None and not topo.get("buses"):
        pd["apf50Override"]  = int(equip["apf50"])

    # Topology buses
    buses = topo.get("buses") or []
    if buses:
        pd["buses"] = buses
        # Build topoMeters tree: group buses under meter_numbers
        meter_numbers = (commercial.get("meter_numbers") or "").split(",") if commercial.get("meter_numbers") else [""]
        pd["topoMeters"] = [{"meterNo": m.strip(), "buses": []} for m in meter_numbers if m.strip()]
        if not pd["topoMeters"]:
            pd["topoMeters"] = [{"meterNo": "", "buses": []}]
        # Assign all buses to the first meter for now (user can reassign)
        pd["topoMeters"][0]["buses"] = [
            {
                "badge":    b.get("badge", ""),
                "dwg":      b.get("dwg", ""),
                "xfKva":    b.get("xf_kva", ""),
                "mainA":    b.get("main_a", ""),
                "pctLoad":  b.get("pct_load", ""),
                "varc":     b.get("varc", ""),
                "circuits": [
                    {
                        "name":     c.get("name", ""),
                        "amps":     c.get("amps", ""),
                        "nEcbs":    c.get("n_ecbs", 0),
                        "nApf50":   c.get("n_apf50", 0),
                        "nApf100":  c.get("n_apf100", 0),
                        "note":     c.get("note", ""),
                    }
                    for c in b.get("circuits", [])
                ],
            }
            for b in buses
        ]

    project.proposalData = pd

    # ── Update reportFields ─────────────────────────────────────────────────
    rf = dict(project.reportFields or {})

    if identity.get("customer"):      rf["company"]          = identity["customer"]
    if identity.get("address_street"): rf["facility_address"] = identity["address_street"]
    if identity.get("address_city"):   rf["facility_city"]    = identity["address_city"]
    if identity.get("date_label"):     rf["billing_period"]   = identity["date_label"]

    if utility.get("utility_name"):   rf["utility"]          = utility["utility_name"]
    if utility.get("utility_tariff"): rf["tariff"]           = utility["utility_tariff"]
    if utility.get("utility_account"): rf["account"]         = utility["utility_account"]
    energy_rate_f = _to_float(utility.get("energy_rate"))
    demand_rate_f = _to_float(utility.get("demand_rate"))
    peak_kw_f     = _to_float(utility.get("peak_kw"))
    avg_bill_f    = _to_float(utility.get("avg_bill_usd"))

    if energy_rate_f is not None: rf["energy_rate"] = energy_rate_f
    if demand_rate_f is not None: rf["demand_rate"] = demand_rate_f
    if commercial.get("meter_numbers"): rf["meter_numbers"]  = commercial["meter_numbers"]
    if n_meters:                        rf["numberOfMeters"] = str(n_meters)

    project.reportFields = rf

    # ── Update electricBillAnalysis with peak_kw + avg_bill if from bill ───
    if sources.get("has_bill"):
        eba2 = dict(getattr(project, "electricBillAnalysis", None) or {})
        if peak_kw_f  is not None: eba2["kwPeak"]    = peak_kw_f
        if avg_bill_f is not None: eba2["billAmount"] = avg_bill_f
        project.electricBillAnalysis = eba2

    sess.add(project)
    sess.commit()

    # Build the full UI-ready response
    return jsonify({
        "sources":    sources,
        # Identity
        "customer":          identity.get("customer", ""),
        "addressStreet":     identity.get("address_street", ""),
        "addressCity":       identity.get("address_city", ""),
        "dateLabel":         identity.get("date_label", ""),
        "coverLocation":     identity.get("cover_location", ""),
        # Facility Narrative
        "facilityType":         narrative.get("facility_type", ""),
        "overviewPara":         narrative.get("overview_paragraph") or narrative.get("facility_context", ""),
        "facilityContext":      narrative.get("facility_context", ""),
        "sldSource":            narrative.get("sld_drawing_ref", ""),
        "billingMonthsLabel":   narrative.get("billing_period_label", ""),
        "capacitorBankBullet":  narrative.get("capacitor_bank_bullet", ""),
        "facilitySiteLabel":    narrative.get("facility_site_label", ""),
        # Utility / Billing
        "utilityName":    utility.get("utility_name", ""),
        "utilityTariff":  utility.get("utility_tariff", ""),
        "utilityAccount": utility.get("utility_account", ""),
        "energyRate":     energy_rate_f if energy_rate_f is not None else utility.get("energy_rate", ""),
        "demandRate":     demand_rate_f if demand_rate_f is not None else utility.get("demand_rate", ""),
        "peakKw":         peak_kw_f    if peak_kw_f    is not None else utility.get("peak_kw", ""),
        "avgBillUsd":     avg_bill_f   if avg_bill_f   is not None else utility.get("avg_bill_usd", ""),
        "pfCurrent":      pf_current,
        "pfWorst":        pf_worst,
        "pfPenaltyUsd":   pf_penalty_usd,
        # Commercial
        "nMeters":        n_meters or "",
        "meterNumbers":   commercial.get("meter_numbers", ""),
        # Equipment
        "s600":    equip.get("s600", ""),
        "apf100":  equip.get("apf100", ""),
        "apf50":   equip.get("apf50", ""),
        # Topology
        "buses":      buses,
        "topoMeters": pd.get("topoMeters", []),
    })


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
