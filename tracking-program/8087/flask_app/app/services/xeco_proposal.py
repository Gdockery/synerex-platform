"""
xeco_proposal.py — ECBS Proposal Generator

Calculates equipment sizing, costs, and ROI from an input dict,
then renders the 9-page proposal via Jinja2 + WeasyPrint.

Usage:
    from app.services.xeco_proposal import build_proposal_pdf
    pdf_bytes = build_proposal_pdf(data)
"""
import math
from datetime import datetime
from pathlib import Path

DEFAULT_SAVINGS_PCT = 0.060   # 6%
ENGINEERING_RATE    = 0.15
SOFTWARE_RATE       = 799.00
DEFAULT_SHIP_RATE   = 275.00
GW_CAPACITY         = 12      # units per gateway

P = dict(
    s600=4665, apf100=10995, apf50=7995,
    lc60=620, lc90=780, lc5a=180,
    meter=1995, rocoil=150, apf_ct=250,
    gw=129, srv=2475, misc=126.65,
    strut=300, apf_rack=400, eth=10,
    # wire/conduit (hidden from BOM, included in hw_cost)
    thhn2=2000, thhn4=50, thhn6=252,
    w14=10, w20=5, f34=175, c34=5, f1=10, c1=6,
)


def _c(x): return math.ceil(x)
def _d2(n): return "${:,.2f}".format(n)
def _d(n):  return "${:,.0f}".format(n)
def _k(n):  return "${:.0f}K".format(n / 1000) if n >= 1000 else _d(n)
def _pct(f): return "{:.1f}%".format(f * 100)


def compute(data):
    """Return all sizing, cost, and display variables for the template."""
    pk = data
    peak_kw      = float(pk["peak_kw"])
    monthly_bill = float(pk["monthly_bill"])
    n_meters     = max(int(pk.get("n_meters", 1)), 1)
    savings_pct  = float(pk.get("savings_pct", DEFAULT_SAVINGS_PCT))
    ship_rate    = float(pk.get("shipping_rate", DEFAULT_SHIP_RATE))
    kwh          = float(pk.get("kwh", 0))
    demand_rate  = float(pk.get("demand_rate_usd", 0))
    blended      = monthly_bill / kwh if kwh else 0

    prices = dict(P)
    if pk.get("apf50_price") is not None:
        prices["apf50"] = float(pk["apf50_price"])

    s600   = int(pk["s600_override"])   if pk.get("s600_override")   is not None else _c(0.60 * peak_kw / 75)
    apf100 = int(pk["apf100_override"]) if pk.get("apf100_override") is not None else _c(0.20 * peak_kw / 150)
    apf50  = int(pk["apf50_override"])  if pk.get("apf50_override")  is not None else _c(0.20 * peak_kw / 75)

    total_apf = apf100 + apf50
    budget    = s600 + total_apf
    lc90      = n_meters
    lc60      = max(0, s600 - 2 * n_meters)
    lc5a      = total_apf
    rocoil    = 3 * n_meters
    apf_ct    = 3 * total_apf
    gw        = max(1, _c(budget / GW_CAPACITY))
    srv       = 1
    eth       = gw + srv
    struts    = n_meters
    apf_racks = total_apf
    misc_qty  = s600 + total_apf
    sw_pts    = max(n_meters, 1)
    total_racks = struts + apf_racks

    thhn2 = _c(total_apf * 50 / 500)
    thhn4 = lc90
    thhn6 = _c(s600 * 50 / 500)
    w14   = apf_ct
    w20   = rocoil
    f34   = _c(s600 * 15 / 100)
    c34   = s600 * 2
    f1    = lc90 + total_apf
    c1    = 2 * (lc90 + total_apf)

    Q = prices
    hw = (s600*Q['s600'] + apf100*Q['apf100'] + apf50*Q['apf50'] +
          gw*Q['gw'] + n_meters*Q['meter'] + lc90*Q['lc90'] + lc60*Q['lc60'] +
          lc5a*Q['lc5a'] + rocoil*Q['rocoil'] + apf_ct*Q['apf_ct'] +
          eth*Q['eth'] + thhn2*Q['thhn2'] + thhn4*Q['thhn4'] + thhn6*Q['thhn6'] +
          w14*Q['w14'] + w20*Q['w20'] + f34*Q['f34'] + c34*Q['c34'] +
          f1*Q['f1'] + c1*Q['c1'] + misc_qty*Q['misc'] +
          struts*Q['strut'] + apf_racks*Q['apf_rack'] + srv*Q['srv'])

    engineering = round(hw * ENGINEERING_RATE, 2)
    sw_yr1      = sw_pts * SOFTWARE_RATE
    pallets     = _c(total_apf / 3) + _c(s600 / 50) + _c(total_racks / 8) + 1
    shipping    = pallets * ship_rate
    yr1_total   = hw + engineering + sw_yr1 + shipping
    sw_yr2plus  = sw_pts * SOFTWARE_RATE
    mo_sav      = monthly_bill * savings_pct
    roi_mo      = yr1_total / mo_sav

    install_days = ("2–3 days" if budget <= 10 else "5–7 days" if budget <= 25 else "7–14 days")

    lc_total  = lc60 * Q['lc60'] + lc90 * Q['lc90']
    gw_total  = gw * Q['gw'] + srv * Q['srv']
    cts_total = (rocoil*Q['rocoil'] + apf_ct*Q['apf_ct'] +
                 struts*Q['strut'] + apf_racks*Q['apf_rack'] + misc_qty*Q['misc'])

    bom_raw = [
        ("ECBS-600 (XPS600)",    s600,       Q['s600']),
        ("APF-100",              apf100,     Q['apf100']),
        ("APF-50 (XPF480-50)",  apf50,      Q['apf50']),
        ("LC90",                 lc90,       Q['lc90']),
        ("LC60",                 lc60,       Q['lc60']),
        ("XPF480-RC5A",          lc5a,       Q['lc5a']),
        ("Revenue Grade Meter",  n_meters,   Q['meter']),
        ("Rocoil CTs",           rocoil,     Q['rocoil']),
        ("APF CTs",              apf_ct,     Q['apf_ct']),
        ("Gateway",              gw,         Q['gw']),
        ("Computer Server",      srv,        Q['srv']),
        ("MISC PARTS",           misc_qty,   Q['misc']),
        ("Metal Strut Rack",     struts,     Q['strut']),
        ("APF Rack",             apf_racks,  Q['apf_rack']),
        ("Ethernet Cable",       eth,        Q['eth']),
    ]
    bom_items = [
        {"name": name, "qty": qty, "unit_fmt": _d2(up), "total_fmt": _d2(qty * up)}
        for name, qty, up in bom_raw if qty > 0
    ]
    bom_subtotal = sum(qty * up for name, qty, up in bom_raw if qty > 0)

    portfolio_rows = [
        {"label": "ECBS-600 Power Quality Units",  "qty": s600,       "unit": _d(Q['s600']),  "subtotal": _d(s600*Q['s600'])},
        {"label": "APF-100 Active Power Filter",   "qty": apf100,     "unit": _d(Q['apf100']),"subtotal": _d(apf100*Q['apf100'])},
        {"label": "APF-50 Active Power Filter",    "qty": apf50,      "unit": _d(Q['apf50']), "subtotal": _d(apf50*Q['apf50'])},
        {"label": "Revenue Grade Meters",          "qty": n_meters,   "unit": _d(Q['meter']), "subtotal": _d(n_meters*Q['meter'])},
        {"label": "Load Controllers (LC60+LC90)",  "qty": lc60+lc90,  "unit": "—",            "subtotal": _d(lc_total)},
        {"label": "Gateways + Server",             "qty": gw+srv,     "unit": "—",            "subtotal": _d(gw_total)},
        {"label": "CTs, Racks, Misc Hardware",     "qty": "—",        "unit": "—",            "subtotal": _d(cts_total)},
    ]

    return dict(
        # customer/site (passed through from data)
        customer       = pk.get("customer", ""),
        site_name      = pk.get("site_name", pk.get("customer", "")),
        address        = pk.get("address", ""),
        country        = pk.get("country", "USA"),
        region         = pk.get("region", "North America"),
        facility_type  = pk.get("facility_type", ""),
        energy_provider= pk.get("energy_provider", ""),
        tariff_name    = pk.get("tariff_name", ""),
        meter_number   = pk.get("meter_number", ""),
        billing_period = pk.get("billing_period", ""),
        proposal_month = pk.get("proposal_month", None) or datetime.now().strftime("%B %Y"),
        peak_source    = pk.get("peak_source", "Explicit"),
        facility_context = (pk.get("facility_context") or "").strip() or "handling high-horsepower industrial equipment",
        ramp_up_note   = pk.get("ramp_up_note") or None,
        excluded_meters= pk.get("excluded_meters") or [],
        prepared_by_org= pk.get("prepared_by_org", "Xeco Energy Corporation"),
        preparer_name  = pk.get("preparer_name", ""),
        contact_name   = pk.get("contact_name", ""),
        contact_title  = pk.get("contact_title", ""),
        contact_phone  = pk.get("contact_phone", ""),
        # sizing
        s600=s600, apf100=apf100, apf50=apf50,
        total_apf=total_apf, budget=budget, n_meters=n_meters,
        gw=gw, sw_pts=sw_pts, total_racks=total_racks,
        pallet_a=_c(total_apf/3), pallet_b=_c(s600/50), pallet_c=_c(total_racks/8),
        pallets=pallets, install_days=install_days,
        # bom / portfolio
        bom_items=bom_items, portfolio_rows=portfolio_rows,
        # formatted display strings
        peak_kw_fmt     = "{:,.0f}".format(peak_kw),
        kwh_fmt         = "{:,.0f}".format(kwh),
        demand_fmt      = "${:.2f}".format(demand_rate),
        blended_fmt     = "${:.4f}".format(blended),
        monthly_bill_fmt= _d2(monthly_bill),
        bom_subtotal_fmt= _d2(bom_subtotal),
        hw_fmt          = _d2(hw),
        hw_k_fmt        = _k(hw),
        engineering_fmt = _d2(engineering),
        sw_yr1_fmt      = _d2(sw_yr1),
        sw_yr2_fmt      = _d2(sw_yr2plus),
        shipping_fmt    = _d2(shipping),
        ship_rate_fmt   = "${:.0f}".format(ship_rate),
        yr1_fmt         = _d2(yr1_total),
        yr1_k_fmt       = _k(yr1_total),
        mo_sav_fmt      = _d(mo_sav),
        annual_savings_fmt = _d(mo_sav * 12),
        roi_cover_fmt   = "~{:.0f} mo".format(roi_mo),
        roi_body_fmt    = "~{:.1f}".format(roi_mo),
        savings_pct_fmt = _pct(savings_pct),
        # raw numbers for preview API
        _hw=round(hw, 2), _yr1=round(yr1_total, 2),
        _mo_sav=round(mo_sav, 2), _roi_mo=round(roi_mo, 1),
    )


def build_proposal_html(data: dict) -> str:
    from jinja2 import Environment, FileSystemLoader
    tpl_dir = Path(__file__).parent.parent / "templates"
    env = Environment(loader=FileSystemLoader(str(tpl_dir)))
    tpl = env.get_template("ecbs_proposal.html")
    ctx = compute(data)
    return tpl.render(**ctx)


def build_proposal_pdf(data: dict) -> bytes:
    try:
        from weasyprint import HTML as WP
    except ImportError as e:
        raise RuntimeError("WeasyPrint not installed.") from e
    html = build_proposal_html(data)
    return WP(string=html).write_pdf()


def build_proposal_computed(data: dict) -> dict:
    c = compute(data)
    return {k.lstrip("_"): v for k, v in c.items() if k.startswith("_") or k in
            ("s600","apf100","apf50","total_apf","budget","n_meters","pallets","install_days")}
