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


def _scalar(v) -> str:
    """Return a plain string from a value that might be a list (GPU returns list for multi-meter fields)."""
    if isinstance(v, list):
        return ", ".join(str(x) for x in v if x)
    return str(v).strip() if v else ""


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

    contact_name  = pd.get("contact_name")  or getattr(client, "contactName",  None) or ""
    contact_title = pd.get("contact_title") or getattr(client, "contactTitle", None) or ""
    contact_email = pd.get("contact_email") or getattr(client, "financeEmail",  None) or ""
    contact_phone = pd.get("contact_phone") or getattr(client, "contactPhone",  None) or ""
    facility_type = getattr(client, "marketSegment", None) or "industrial facility"

    # Bill data
    peak_kw       = float(pd.get("peakKw") or primary_mb.get("kwPeak") or bill.get("kwPeak") or 0)
    avg_bill_usd  = float(pd.get("monthlyBill") or primary_mb.get("billAmount") or bill.get("billAmount") or 0)
    kwh           = float(primary_mb.get("totalKwh") or bill.get("totalKwh") or 0)
    utility_name  = _scalar(primary_mb.get("electricCompanyName") or bill.get("electricCompanyName") or "")
    utility_short = utility_name.split()[0] if utility_name else ""
    utility_tariff = _scalar(primary_mb.get("tariff") or bill.get("tariff") or "")
    utility_account = _scalar(primary_mb.get("meterNumber") or bill.get("meterNumber") or bill.get("accountNumber") or "")
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

    # Per-meter kWh distribution ──────────────────────────────────────────────
    # If topoMeters has a meter→bus mapping and the bill has per-meter lineItems,
    # fetch kWh per meter from the GPU bill and store for the report to use.
    _topo_meters = pd.get("topoMeters") or []
    _bill_gpu_id = (bill.get("gpuJobId") or "") if isinstance(bill, dict) else ""
    _meter_kwh: dict = {}   # {meterNo: kwh}

    if _topo_meters and _bill_gpu_id:
        try:
            import requests as _req
            _gpu_url = os.environ.get("GPU_PLATFORM_URL", "http://100.106.19.30:8000")
            _r = _req.get(f"{_gpu_url}/bills/{_bill_gpu_id}", timeout=10)
            if _r.ok:
                _raw_items = (_r.json().get("initial_parse") or {}).get("lineItems") or []
                _seen: set = set()
                for _li in _raw_items:
                    _mn = str(_li.get("meterNumber") or "")
                    if _mn and _mn not in _seen:
                        _meter_kwh[_mn] = int(_li.get("meterKwh") or 0)
                        _seen.add(_mn)
        except Exception:
            pass  # fall back to equal split

    # Connected / contracted demand estimates
    connected_kw  = float(sld.get("connectedKw") or peak_kw * 1.3)
    contracted_kw = float(sld.get("contractedKw") or peak_kw)

    # n_meters
    n_meters = int(pd.get("nMeters") or sld.get("nMeters") or 1)

    # Equipment counts — check None explicitly so 0 overrides are respected
    def _equip(override_key, bus_key, sld_key, formula_val):
        ov = pd.get(override_key)
        if ov is not None:              # user-set override (0 = "none", still valid)
            return int(ov)
        if buses:                       # sum from topology tree
            total = sum(c.get(bus_key, 0) for b in buses for c in b.get("circuits", []))
            if total:
                return total
        sld_val = sld.get(sld_key)
        if sld_val:
            return int(sld_val)
        return formula_val              # auto-size from peak kW

    s600   = _equip("s600Override",   "n_ecbs",   "s600Count",   math.ceil(0.60 * peak_kw / 75))
    apf100 = _equip("apf100Override", "n_apf100", "apf100Count", math.ceil(0.20 * peak_kw / 150))
    apf50  = _equip("apf50Override",  "n_apf50",  "apf50Count",  math.ceil(0.20 * peak_kw / 75))

    # Auto-distribute equipment into buses when topology has no circuit detail ─
    # (bill-only autofill: buses exist but circuits are empty)
    # Runs here so BOTH proposal and network assessment reports benefit.
    _has_circuit_equip = any(
        c.get("n_ecbs", 0) or c.get("n_apf100", 0) or c.get("n_apf50", 0)
        for b in buses for c in b.get("circuits", [])
    )
    if buses and not _has_circuit_equip and (s600 or apf100 or apf50):
        # Build bus→kWh weight from topoMeters + GPU bill lineItems
        _bus_kwh: dict = {}
        if _meter_kwh and _topo_meters:
            for _tm in _topo_meters:
                _mn = str(_tm.get("meterNo") or "")
                _kwh = _meter_kwh.get(_mn, 0)
                for _b in (_tm.get("buses") or []):
                    _badge = _b.get("badge") or ""
                    if _badge:
                        _bus_kwh[_badge] = _bus_kwh.get(_badge, 0) + _kwh
        _total_kwh = sum(_bus_kwh.get(b.get("badge", ""), 0) for b in buses)

        def _proportional(total_units: int) -> list:
            if not total_units:
                return [0] * len(buses)
            fracs = (
                [_bus_kwh.get(b.get("badge", ""), 0) / _total_kwh for b in buses]
                if _total_kwh > 0
                else [1 / len(buses)] * len(buses)
            )
            floored = [math.floor(f * total_units) for f in fracs]
            remainder = total_units - sum(floored)
            order = sorted(range(len(buses)),
                           key=lambda i: fracs[i] * total_units - floored[i],
                           reverse=True)
            for i in range(remainder):
                floored[order[i]] += 1
            return floored

        _ecbs_per   = _proportional(s600)
        _apf100_per = _proportional(apf100)
        _apf50_per  = _proportional(apf50)

        for i, bus in enumerate(buses):
            ne, na, nf = _ecbs_per[i], _apf100_per[i], _apf50_per[i]
            if ne or na or nf:
                label = bus.get("badge") or f"MDP-{i+1}"
                bus.setdefault("circuits", []).append({
                    "name":    label,
                    "amps":    int(bus.get("main_a") or 0),
                    "type":    "Mixed",
                    "n_ecbs":   ne,
                    "n_apf100": na,
                    "n_apf50":  nf,
                    "note":    "auto-distributed by kWh",
                })

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
        "contact_email":     contact_email,
        "contact_phone":     contact_phone,
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
        "topo_meters":       _topo_meters,
        "meter_kwh":         _meter_kwh,
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

        pdf_bytes = render_pdf(html, doc_no=na_doc_no)
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

        pdf_bytes = render_pdf(html, doc_no=doc_no)

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
