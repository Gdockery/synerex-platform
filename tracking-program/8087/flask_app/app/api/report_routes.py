"""
report_routes.py — Network Assessment and Proposal Contract PDF generation.

GET /api/project/<id>/report/network-assessment
    Generates and streams the Electrical Network Assessment PDF.

GET /api/project/<id>/report/proposal-contract
    Generates and streams the Proposal Contract PDF.
"""
import json
import logging
import math
import os
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request, Response
from flask_login import current_user, login_required

from app.extensions import db
from app.db.request_session import get_session
from app.models.project import Project
from app.models.client import Client
from app.models.user import User
import base64

logger = logging.getLogger(__name__)

report_bp = Blueprint("report", __name__, url_prefix="")

DEFAULT_PRICING = {
    "ecbs600": 3625, "apf50": 7995, "apf100": 7500,
    "meter": 2500, "lc90": 780, "lc60": 620,
    "rocoil_ct": 150, "apf_ct": 300, "booster": 600,
    "gateway": 129, "server": 2475, "ethernet": 10,  # server = Edge Energy Datalogger
    "sw_yr1": 2400, "shipping": 275,
}

DEFAULT_SAVINGS_PCT = 0.06


def _get_project_for_user(project_id):
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
    from flask import current_app
    storage = current_app.config.get("STORAGE_LOCAL_PATH", "")
    if not storage or not logo_src:
        return None
    try:
        path = Path(storage) / "images" / logo_type / logo_src
        if path.exists():
            return base64.b64encode(path.read_bytes()).decode()
    except Exception:
        pass
    return None


def _get_oem_data():
    """Return (prepared_by_org, preparer_name, insurance_policy, payment_schedule, prepared_by_location)."""
    prepared_by_org = "Xeco Energy Corporation"
    preparer_name   = ""
    insurance_policy = None
    payment_schedule = None
    prepared_by_location = "Georgetown, Texas"
    try:
        from app.models.oem_branding import OemBranding as _Branding
        org_id = getattr(current_user, "org_id", None)
        if org_id:
            b = _Branding.query.filter_by(org_id=org_id).first()
            if b and b.brand_name:
                prepared_by_org = b.brand_name
            import requests as _req
            _ls_url = os.environ.get("LICENSE_SERVICE_URL", "http://license-service:8000")
            try:
                r = _req.get(f"{_ls_url}/api/orgs/{org_id}", timeout=3)
                if r.ok:
                    org_d = r.json()
                    raw_ins = org_d.get("insurance_policy") or None
                    if raw_ins:
                        try:
                            insurance_policy = json.loads(raw_ins)
                        except Exception:
                            insurance_policy = {"carrier": raw_ins}
                    raw_pay = org_d.get("payment_schedule") or None
                    if raw_pay:
                        try:
                            rows = json.loads(raw_pay)
                            payment_schedule = [r2 for r2 in rows if r2.get("pct") or r2.get("desc")]
                        except Exception:
                            pass
                    _org_city  = org_d.get("city", "") or ""
                    _org_state = org_d.get("state", "") or ""
                    prepared_by_location = ", ".join(filter(None, [_org_city, _org_state])) or "Georgetown, Texas"
            except Exception:
                pass
    except Exception:
        pass

    u = current_user
    preparer_name = (
        getattr(u, "name", None)
        or f"{getattr(u,'firstName','') or ''} {getattr(u,'lastName','') or ''}".strip()
        or ""
    )
    return prepared_by_org, preparer_name, insurance_policy, payment_schedule, prepared_by_location


def _assemble_report_data(project: Project) -> dict:
    """
    Build the data dict for both report types from project/client/SLD/bill records.
    The caller can further supplement with query-string overrides if needed.
    """
    client: Client | None = Client.query.get(project.client) if project.client else None

    bill = getattr(project, "electricBillAnalysis", None) or {}
    sld  = getattr(project, "sldAnalysis", None) or {}
    pd   = getattr(project, "proposalData", None) or {}  # saved proposal overrides

    meter_bills  = bill.get("meterBills") or []
    primary_mb   = meter_bills[0] if meter_bills else bill

    # Legal customer name from bill
    customer = (
        primary_mb.get("customerName") or bill.get("customerName") or ""
    ).strip() or (client.name if client else project.name or "")

    customer_legal = (
        pd.get("customerLegal")
        or getattr(client, "legalName", None)
        or customer
    )

    # Address
    if client:
        addr_parts = [
            getattr(client, "address", None) or "",
            getattr(client, "city", None) or "",
            getattr(client, "state", None) or "",
            getattr(client, "zip", None) or "",
        ]
        address       = " ".join(p for p in addr_parts if p).strip()
        address_street = getattr(client, "address", None) or ""
        city_state     = " ".join(p for p in [
            getattr(client, "city", None) or "",
            getattr(client, "state", None) or "",
            getattr(client, "zip", None) or "",
        ] if p)
    else:
        address = address_street = project.location or ""
        city_state = ""

    contact_name  = getattr(client, "contactName", None) or ""
    contact_title = getattr(client, "contactTitle", None) or ""
    facility_type = getattr(client, "marketSegment", None) or "industrial facility"

    # Bill data
    peak_kw       = float(pd.get("peakKw") or primary_mb.get("kwPeak") or bill.get("kwPeak") or 0)
    avg_bill_usd  = float(pd.get("monthlyBill") or primary_mb.get("billAmount") or bill.get("billAmount") or 0)
    kwh           = float(primary_mb.get("totalKwh") or bill.get("totalKwh") or 0)
    utility_name  = (primary_mb.get("electricCompanyName") or bill.get("electricCompanyName") or "").strip()
    utility_short = utility_name.split()[0] if utility_name else ""
    utility_tariff = (primary_mb.get("tariff") or bill.get("tariff") or "").strip()
    utility_account = (primary_mb.get("meterNumber") or bill.get("meterNumber") or bill.get("accountNumber") or "").strip()
    utility_acct_no = utility_account

    # Savings
    savings_pct   = float(pd.get("savingsPct") or DEFAULT_SAVINGS_PCT)
    energy_savings = round(avg_bill_usd * savings_pct)
    total_savings  = energy_savings  # no PF penalty assumed unless flagged

    # Power factor — prefer user-edited values from proposalData
    _pf_ref_raw  = pd.get("pfReference")
    pf_reference = str(_pf_ref_raw) if _pf_ref_raw is not None else (bill.get("powerFactor") or "≈1.0")
    pf_month     = pd.get("pfReferenceMonth") or primary_mb.get("billPeriod") or bill.get("billingPeriod") or ""
    pf_worst_raw = pd.get("pfWorst")
    pf_worst     = str(pf_worst_raw) if pf_worst_raw is not None else pf_reference
    has_pf_penalty = bool(pd.get("hasPfPenalty", False))
    pf_penalty_usd = float(pd.get("pfPenaltyUsd") or 0)

    # SLD / topology — prefer user-edited buses from proposalData over GPU result
    buses = pd.get("buses") or sld.get("buses") or []

    # Connected / contracted demand estimates
    connected_kw  = float(sld.get("connectedKw") or peak_kw * 1.3)
    contracted_kw = float(sld.get("contractedKw") or peak_kw)

    # n_meters
    n_meters = int(pd.get("nMeters") or sld.get("nMeters") or 1)

    # Equipment counts: topology first, then manual overrides, then auto-size
    if buses and not pd.get("s600Override") and not pd.get("apf100Override") and not pd.get("apf50Override"):
        s600   = sum(c.get("n_ecbs",   0) for b in buses for c in b.get("circuits", []))
        apf100 = sum(c.get("n_apf100", 0) for b in buses for c in b.get("circuits", []))
        apf50  = sum(c.get("n_apf50",  0) for b in buses for c in b.get("circuits", []))
    else:
        s600   = int(pd.get("s600Override")   or (sum(c.get("n_ecbs",   0) for b in buses for c in b.get("circuits", [])) if buses else 0) or sld.get("s600Count")   or math.ceil(0.60 * peak_kw / 75))
        apf100 = int(pd.get("apf100Override") or (sum(c.get("n_apf100", 0) for b in buses for c in b.get("circuits", [])) if buses else 0) or sld.get("apf100Count") or math.ceil(0.20 * peak_kw / 150))
        apf50  = int(pd.get("apf50Override")  or (sum(c.get("n_apf50",  0) for b in buses for c in b.get("circuits", [])) if buses else 0) or sld.get("apf50Count")  or math.ceil(0.20 * peak_kw / 75))

    num_mdps              = int(sld.get("numMdps") or len(buses) or 1)
    bus_amp_range         = sld.get("busAmpRange") or ""
    capacitor_bank_bullet = pd.get("capacitorBankBullet") or sld.get("capacitorBankBullet") or ""
    sld_source            = pd.get("sldSource") or sld.get("sldSource") or "Preliminary SLD review"
    facility_context      = pd.get("facilityContext") or ""
    overview_para         = pd.get("overviewPara") or facility_context
    facility_site_label   = pd.get("facilitySiteLabel") or ""
    billing_months_label  = pd.get("billingMonthsLabel") or ""
    engineering_fee_override = pd.get("engineeringFee")
    sw_yr1_override          = pd.get("swYr1")
    discount_override        = pd.get("discount")
    shipping_override        = pd.get("shipping")
    customer_owns_meters     = bool(pd.get("customerOwnsMeters", False))
    is_upgrade               = bool(pd.get("isUpgrade", False))

    # Date / heading
    date_label     = datetime.now().strftime("%B %Y")
    billing_months = str(bill.get("billingMonths") or len(meter_bills) or 3)
    cover_location = f"{customer} · {city_state}" if city_state else address

    meter_loc_desc = (
        f"{utility_short} utility supply point ({utility_account})"
        if utility_account else f"{utility_name} utility supply point"
    )
    facility_city = getattr(client, "city", None) or city_state or address

    # Customer logo
    cust_logo_b64 = None
    if client and getattr(client, "logoImgSrc", None):
        cust_logo_b64 = _load_logo_b64(client.logoImgSrc, "client_company_logo")

    # OEM branding
    prepared_by_org, preparer_name, insurance_policy, payment_schedule, prepared_by_location = _get_oem_data()

    return {
        "customer":          customer,
        "customer_legal":    customer_legal,
        "address":           address,
        "address_street":    address_street,
        "address_city":      city_state,
        "contact_name":      contact_name,
        "contact_title":     contact_title,
        "date_label":        date_label,
        "cover_location":    cover_location,
        "facility_type":     pd.get("facilityType") or facility_type,
        "facility_desc":     overview_para or facility_context,
        "facility_site_label": facility_site_label or (facility_type + " facility"),
        "sq_ft":             getattr(client, "sqFt", None) or "",
        "sld_source":        sld_source,
        "bus_amp_range":     bus_amp_range,
        "billing_months_label": billing_months_label or billing_months,
        "overview_para":     overview_para or facility_context,

        "utility_name":      utility_name,
        "utility_short":     utility_short,
        "utility_tariff":    utility_tariff,
        "utility_account":   utility_account,
        "utility_acct_no":   utility_acct_no,
        "peak_kw":           peak_kw,
        "connected_kw":      connected_kw,
        "contracted_kw":     contracted_kw,
        "avg_bill_usd":      avg_bill_usd,
        "pf_reference":      pf_reference,
        "pf_reference_month": pf_month,
        "pf_worst":          pf_worst,
        "has_pf_penalty":    has_pf_penalty,
        "pf_penalty_usd":    pf_penalty_usd,
        "energy_savings":    energy_savings,
        "energy_pct":        str(round(savings_pct * 100)),
        "pf_savings":        pf_penalty_usd if has_pf_penalty else 0.0,
        "total_savings":     total_savings + (pf_penalty_usd if has_pf_penalty else 0),

        "buses":             buses,
        "num_mdps":          num_mdps,
        "n_meters":          n_meters,
        "facility_city":     facility_city,
        "capacitor_bank_bullet": capacitor_bank_bullet,
        "meter_location_desc":   meter_loc_desc,

        "s600":              s600,
        "apf100":            apf100,
        "apf50":             apf50,
        "pricing":           DEFAULT_PRICING,

        "customer_owns_meters":    customer_owns_meters,
        "is_upgrade":              is_upgrade,
        "engineering_fee_override": engineering_fee_override,
        "sw_yr1_override":          sw_yr1_override,
        "discount_override":        discount_override,
        "shipping_override":        shipping_override,

        "prepared_by_org":      prepared_by_org,
        "prepared_by_location": prepared_by_location,
        "preparer_name":        preparer_name,
        "insurance_policy":     insurance_policy,
        "payment_schedule":     payment_schedule,

        "customer_logo_b64": cust_logo_b64,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@report_bp.route("/api/project/<int:project_id>/report/network-assessment", methods=["GET"])
@login_required
def network_assessment_pdf(project_id):
    import random as _random
    sess, project = _get_project_for_user(project_id)
    if project is None:
        return jsonify({"error": "Not found"}), 404

    try:
        from app.services.report_network_assessment import build_html, render_pdf
        data = _assemble_report_data(project)

        # Doc number — persist so re-renders use the same number
        pd = getattr(project, "proposalData", None) or {}
        na_doc_no = pd.get("naDocNo")
        if not na_doc_no:
            _prefix = (data.get("customer", "XX")[:2]).upper()
            na_doc_no = f"{_prefix}-A{_random.randint(10000000, 99999999)}"
            pd["naDocNo"] = na_doc_no
            project.proposalData = pd
            sess.commit()
        data["doc_no"] = na_doc_no

        html = build_html(data)

        inline = request.args.get("inline", "0") == "1"
        if inline:
            return Response(html, status=200, content_type="text/html; charset=utf-8")

        pdf_bytes = render_pdf(html)
        slug = (data["customer"] or "").replace(" ", "-").lower()
        fname = f"ecbs-assessment-{slug} {na_doc_no}.pdf"
        return Response(
            pdf_bytes,
            status=200,
            content_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{fname}"'},
        )
    except Exception as e:
        logger.exception("Network assessment PDF error: %s", e)
        return jsonify({"error": str(e)}), 500


@report_bp.route("/api/project/<int:project_id>/report/proposal-contract", methods=["GET"])
@login_required
def proposal_contract_pdf(project_id):
    import random as _random
    sess, project = _get_project_for_user(project_id)
    if project is None:
        return jsonify({"error": "Not found"}), 404

    try:
        from app.services.report_proposal_contract import build_html, render_pdf
        data = _assemble_report_data(project)

        # Doc number — persist so re-renders use the same number
        pd = getattr(project, "proposalData", None) or {}
        doc_no = pd.get("docNo")
        if not doc_no:
            _prefix = (data.get("customer", "XX")[:2]).upper()
            doc_no = f"{_prefix}-P{_random.randint(10000000, 99999999)}"
            pd["docNo"] = doc_no
            project.proposalData = pd
            sess.commit()

        html = build_html(data, doc_no=doc_no)

        inline = request.args.get("inline", "0") == "1"
        if inline:
            return Response(html, status=200, content_type="text/html; charset=utf-8")

        pdf_bytes = render_pdf(html)

        # Mark proposal as generated so pipeline stage turns green
        project.proposalSrc = f"/api/project/{project_id}/report/proposal-contract"
        sess.commit()

        slug = (data["customer"] or "").replace(" ", "-").lower()
        fname = f"ecbs-proposal-{slug} {doc_no}.pdf"
        return Response(
            pdf_bytes,
            status=200,
            content_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{fname}"'},
        )
    except Exception as e:
        logger.exception("Proposal contract PDF error: %s", e)
        return jsonify({"error": str(e)}), 500
