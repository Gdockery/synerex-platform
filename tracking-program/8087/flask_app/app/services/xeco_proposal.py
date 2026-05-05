"""
xeco_proposal.py — ECBS Proposal Generator

Builds a 9-page HTML proposal from an input dict (see ECBS_PROPOSAL_MODULE_SPEC.md)
and converts it to PDF using WeasyPrint.

Usage:
    from app.services.xeco_proposal import build_proposal_pdf
    pdf_bytes = build_proposal_pdf(data)   # returns bytes

Input dict keys: see ECBS_PROPOSAL_MODULE_SPEC.md for the complete spec.
"""
import math
import io
from datetime import datetime

# ── Colour palette (hardcoded — WeasyPrint doesn't support CSS custom properties) ──
BG       = "#08101f"
SURFACE  = "#0f1e35"
ACCENT   = "#00aaff"
GREEN    = "#00e5a0"
WHITE    = "#e8eef5"
MUTED    = "#6b8099"
BORDER   = "#1c3a5e"
BG2      = "#0c1929"
BG3      = "#0a1828"
BG4      = "#0d1f36"

# ── Engineering constants ────────────────────────────────────────────────────────
KW_PER_600    = 75
KW_PER_APF50  = 75
KW_PER_APF100 = 150
GW_CAPACITY   = 12

# ── Pricing constants (USD) ───────────────────────────────────────────────────────
DEFAULT_P = dict(
    s600=4665, apf100=10995,
    apf50=7995,       # default; pass apf50_price override for customer discounts
    lc60=620, lc90=780, lc5a=180,
    meter=1995, rocoil=150, apf_ct=250,
    gw=129, srv=2475, misc=126.65,
    strut=300, apf_rack=400, eth=10,
    # Wire/conduit (internal only):
    thhn2=2000, thhn4=50, thhn6=252,
    w14=10, w20=5, f34=175, c34=5, f1=10, c1=6,
)
SOFTWARE_RATE       = 799.00
ENGINEERING_RATE    = 0.15
DEFAULT_SHIP_RATE   = 275.00
DEFAULT_SAVINGS_PCT = 0.060   # 6% default


# ── Helpers ──────────────────────────────────────────────────────────────────────
def _ceil(x):
    return math.ceil(x)

def fmt_k(n):
    return f"${n/1000:.0f}K" if n >= 1000 else f"${n:,.0f}"

def fmt_d(n):
    return f"${n:,.0f}"

def fmt_d2(n):
    return f"${n:,.2f}"

def fmt_pct(f):
    return f"{f*100:.1f}%"


def _compute(d: dict) -> dict:
    """Run all equipment sizing + cost calculations. Returns a dict of all computed values."""
    peak_kw      = float(d["peak_kw"])
    monthly_bill = float(d["monthly_bill"])
    n_meters     = max(int(d.get("n_meters", 1)), 1)
    savings_pct  = float(d.get("savings_pct", DEFAULT_SAVINGS_PCT))
    ship_rate    = float(d.get("shipping_rate", DEFAULT_SHIP_RATE))

    # Apply APF-50 price override
    P = dict(DEFAULT_P)
    if d.get("apf50_price") is not None:
        P["apf50"] = float(d["apf50_price"])

    # Equipment sizing
    s600   = int(d["s600_override"])   if d.get("s600_override")   is not None else _ceil(0.60 * peak_kw / KW_PER_600)
    apf100 = int(d["apf100_override"]) if d.get("apf100_override") is not None else _ceil(0.20 * peak_kw / KW_PER_APF100)
    apf50  = int(d["apf50_override"])  if d.get("apf50_override")  is not None else _ceil(0.20 * peak_kw / KW_PER_APF50)

    total_apf = apf100 + apf50
    budget    = s600 + apf50 + apf100

    lc90      = n_meters
    lc60      = max(0, s600 - 2 * n_meters)
    lc5a      = total_apf
    rocoil    = 3 * n_meters
    apf_ct    = 3 * total_apf
    gw        = max(1, _ceil(budget / GW_CAPACITY))
    srv       = 1
    eth       = gw + srv
    struts    = n_meters
    apf_racks = total_apf
    misc_qty  = s600 + total_apf
    sw_pts    = max(n_meters, 1)
    total_racks = struts + apf_racks

    # Wire/conduit quantities
    thhn2 = _ceil(total_apf * 50 / 500)
    thhn4 = lc90
    thhn6 = _ceil(s600 * 50 / 500)
    w14   = apf_ct
    w20   = rocoil
    f34   = _ceil(s600 * 15 / 100)
    c34   = s600 * 2
    f1    = lc90 + total_apf
    c1    = 2 * (lc90 + total_apf)

    hw = (s600*P['s600'] + apf100*P['apf100'] + apf50*P['apf50'] +
          gw*P['gw'] + n_meters*P['meter'] + lc90*P['lc90'] + lc60*P['lc60'] +
          lc5a*P['lc5a'] + rocoil*P['rocoil'] + apf_ct*P['apf_ct'] +
          eth*P['eth'] + thhn2*P['thhn2'] + thhn4*P['thhn4'] + thhn6*P['thhn6'] +
          w14*P['w14'] + w20*P['w20'] + f34*P['f34'] + c34*P['c34'] +
          f1*P['f1'] + c1*P['c1'] + misc_qty*P['misc'] +
          struts*P['strut'] + apf_racks*P['apf_rack'] + srv*P['srv'])

    engineering = round(hw * ENGINEERING_RATE, 2)
    sw_yr1      = sw_pts * SOFTWARE_RATE
    pallets     = _ceil(total_apf/3) + _ceil(s600/50) + _ceil(total_racks/8) + 1
    shipping    = pallets * ship_rate
    yr1_total   = hw + engineering + sw_yr1 + shipping
    sw_yr2plus  = sw_pts * SOFTWARE_RATE
    mo_sav      = monthly_bill * savings_pct
    roi_mo      = yr1_total / mo_sav

    install_days = ("2–3 days" if budget <= 10
                    else "5–7 days" if budget <= 25
                    else "7–14 days")

    # Customer-facing BOM (zero-qty rows omitted)
    bom_items = [
        ("ECBS-600 (XPS600)",     s600,      P['s600'],    s600*P['s600']),
        ("APF-100",               apf100,    P['apf100'],  apf100*P['apf100']),
        ("APF-50 (XPF480-50)",    apf50,     P['apf50'],   apf50*P['apf50']),
        ("LC90",                  lc90,      P['lc90'],    lc90*P['lc90']),
        ("LC60",                  lc60,      P['lc60'],    lc60*P['lc60']),
        ("XPF480-RC5A",           lc5a,      P['lc5a'],    lc5a*P['lc5a']),
        ("Revenue Grade Meter",   n_meters,  P['meter'],   n_meters*P['meter']),
        ("Rocoil CTs",            rocoil,    P['rocoil'],  rocoil*P['rocoil']),
        ("APF CTs",               apf_ct,    P['apf_ct'],  apf_ct*P['apf_ct']),
        ("Gateway",               gw,        P['gw'],      gw*P['gw']),
        ("Computer Server",       srv,       P['srv'],     srv*P['srv']),
        ("MISC PARTS",            misc_qty,  P['misc'],    misc_qty*P['misc']),
        ("Metal Strut Rack",      struts,    P['strut'],   struts*P['strut']),
        ("APF Rack",              apf_racks, P['apf_rack'],apf_racks*P['apf_rack']),
        ("Ethernet Cable",        eth,       P['eth'],     eth*P['eth']),
    ]
    bom_items_visible = [(name, qty, up, tp) for name, qty, up, tp in bom_items if qty > 0]
    bom_subtotal = sum(tp for _, _, _, tp in bom_items_visible)

    pallet_calc_a = _ceil(total_apf/3)
    pallet_calc_b = _ceil(s600/50)
    pallet_calc_c = _ceil(total_racks/8)

    return dict(
        P=P, s600=s600, apf100=apf100, apf50=apf50,
        total_apf=total_apf, budget=budget, n_meters=n_meters,
        lc90=lc90, lc60=lc60, lc5a=lc5a, rocoil=rocoil, apf_ct=apf_ct,
        gw=gw, srv=srv, eth=eth, struts=struts, apf_racks=apf_racks,
        misc_qty=misc_qty, sw_pts=sw_pts, total_racks=total_racks,
        hw=hw, engineering=engineering, sw_yr1=sw_yr1,
        pallets=pallets, shipping=shipping, ship_rate=ship_rate,
        yr1_total=yr1_total, sw_yr2plus=sw_yr2plus,
        mo_sav=mo_sav, roi_mo=roi_mo, savings_pct=savings_pct,
        install_days=install_days,
        bom_items_visible=bom_items_visible, bom_subtotal=bom_subtotal,
        pallet_calc_a=pallet_calc_a, pallet_calc_b=pallet_calc_b, pallet_calc_c=pallet_calc_c,
    )


def _plural(word, n):
    return word if n == 1 else word + "s"


def _build_html(d: dict, c: dict) -> str:
    """Render the 9-page HTML proposal. d=input dict, c=computed values."""

    customer       = d.get("customer", "")
    site_name      = d.get("site_name", "")
    address        = d.get("address", "")
    country        = d.get("country", "USA")
    region         = d.get("region", "North America")
    facility_type  = d.get("facility_type", "")
    energy_prov    = d.get("energy_provider", "")
    tariff_name    = d.get("tariff_name", "")
    meter_number   = d.get("meter_number", "")
    billing_period = d.get("billing_period", "")
    proposal_month = d.get("proposal_month", datetime.now().strftime("%B %Y"))
    peak_kw        = float(d.get("peak_kw", 0))
    peak_source    = d.get("peak_source", "Explicit")
    kwh            = float(d.get("kwh", 0))
    monthly_bill   = float(d.get("monthly_bill", 0))
    demand_rate    = float(d.get("demand_rate_usd", 0))
    blended_rate   = float(d.get("blended_rate_usd", monthly_bill / kwh if kwh else 0))
    excluded       = d.get("excluded_meters", []) or []
    ramp_note      = (d.get("ramp_up_note") or "").strip()
    facility_ctx   = (d.get("facility_context") or "").strip()
    preparer_org   = d.get("prepared_by_org", "Xeco Energy Corporation")
    preparer_name  = d.get("preparer_name", "")
    contact_name   = d.get("contact_name", "")
    contact_title  = d.get("contact_title", "")
    contact_phone  = d.get("contact_phone", "")
    xeco_logo      = d.get("xeco_logo_b64", "")
    cust_logo      = d.get("customer_logo_b64", "")

    # Facility context phrase
    fc_phrase = facility_ctx if facility_ctx else "handling high-horsepower industrial equipment"

    # Logo HTML helpers
    if xeco_logo:
        logo_cover  = f'<img src="data:image/png;base64,{xeco_logo}" style="height:52px;" alt="Xeco">'
        logo_header = f'<img src="data:image/png;base64,{xeco_logo}" style="height:28px;" alt="Xeco">'
    else:
        logo_cover  = f'<span style="font-size:22pt;font-weight:800;color:{ACCENT};">{preparer_org}</span>'
        logo_header = f'<span style="font-size:14pt;font-weight:800;color:{ACCENT};">{preparer_org}</span>'

    if cust_logo:
        cust_logo_html = f'<img src="data:image/jpeg;base64,{cust_logo}" style="height:80px;" alt="{customer}">'
    else:
        cust_logo_html = f'<div style="font-size:18pt;font-weight:700;color:{WHITE};">{customer}</div>'

    # Unpack computed values
    s600        = c["s600"];  apf100 = c["apf100"];  apf50 = c["apf50"]
    total_apf   = c["total_apf"];  budget = c["budget"]
    n_meters    = c["n_meters"]
    lc90        = c["lc90"];  lc60 = c["lc60"];  lc5a = c["lc5a"]
    rocoil      = c["rocoil"];  apf_ct = c["apf_ct"]
    gw          = c["gw"];  srv = c["srv"];  eth = c["eth"]
    struts      = c["struts"];  apf_racks = c["apf_racks"]
    misc_qty    = c["misc_qty"];  sw_pts = c["sw_pts"]
    total_racks = c["total_racks"]
    hw          = c["hw"];  engineering = c["engineering"]
    sw_yr1      = c["sw_yr1"];  shipping = c["shipping"]
    yr1_total   = c["yr1_total"];  sw_yr2plus = c["sw_yr2plus"]
    mo_sav      = c["mo_sav"];  roi_mo = c["roi_mo"]
    savings_pct = c["savings_pct"];  ship_rate = c["ship_rate"]
    install_days = c["install_days"]
    bom_items_visible = c["bom_items_visible"];  bom_subtotal = c["bom_subtotal"]
    pallet_a = c["pallet_calc_a"];  pallet_b = c["pallet_calc_b"];  pallet_c = c["pallet_calc_c"]
    pallets   = c["pallets"]
    P         = c["P"]

    # ── BOM rows ──────────────────────────────────────────────────────────────────
    bom_rows = ""
    for i, (name, qty, unit_p, total_p) in enumerate(bom_items_visible):
        row_bg = BG2 if i % 2 == 1 else "transparent"
        bom_rows += f"""
        <tr style="background:{row_bg};">
          <td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">{name}</td>
          <td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{qty}</td>
          <td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(unit_p)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(total_p)}</td>
        </tr>"""

    # ── Excluded meters ───────────────────────────────────────────────────────────
    excl_html = ""
    if excluded:
        excl_rows = "".join(
            f'<div style="font-size:8.5pt;line-height:1.8;color:{WHITE};">'
            f'<strong>{e.get("item","")}</strong> — {e.get("description","")} — {e.get("reason","")}'
            f'</div>'
            for e in excluded
        )
        excl_html = f"""
        <div style="background:{SURFACE};border:1px solid {BORDER};border-radius:6px;padding:0.15in 0.2in;margin-bottom:0.12in;">
          <div style="font-size:9pt;color:{MUTED};margin-bottom:6px;">EXCLUDED METERS (this account)</div>
          {excl_rows}
        </div>"""

    # ── Ramp-up note ─────────────────────────────────────────────────────────────
    ramp_html = ""
    if ramp_note:
        ramp_html = f"""
        <div style="background:{SURFACE};border-left:3px solid {GREEN};border-radius:6px;
                    display:flex;align-items:flex-start;gap:0.15in;padding:0.15in 0.2in;margin-top:0.12in;">
          <div style="flex-shrink:0;font-size:18pt;line-height:1.1;color:{GREEN};">&#x2191;</div>
          <div style="font-size:8.5pt;line-height:1.6;color:{WHITE};">{ramp_note}</div>
        </div>"""

    # ── Portfolio category rows ───────────────────────────────────────────────────
    lc_total  = lc60 * P['lc60'] + lc90 * P['lc90']
    gw_total  = gw * P['gw'] + srv * P['srv']
    cts_total = rocoil*P['rocoil'] + apf_ct*P['apf_ct'] + struts*P['strut'] + apf_racks*P['apf_rack'] + misc_qty*P['misc']

    def row(label, qty, unit, subtotal, i):
        bg = BG2 if i % 2 == 1 else "transparent"
        return (f'<tr style="background:{bg};">'
                f'<td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">{label}</td>'
                f'<td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{qty}</td>'
                f'<td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{unit}</td>'
                f'<td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{subtotal}</td>'
                f'</tr>')

    portfolio_rows = (
        row("ECBS-600 Power Quality Units",    s600,         fmt_d(P['s600']),    fmt_d(s600*P['s600']),    0) +
        row("APF-100 Active Power Filter",     apf100,       fmt_d(P['apf100']),  fmt_d(apf100*P['apf100']),1) +
        row("APF-50 Active Power Filter",      apf50,        fmt_d(P['apf50']),   fmt_d(apf50*P['apf50']),  2) +
        row("Revenue Grade Meters",            n_meters,     fmt_d(P['meter']),   fmt_d(n_meters*P['meter']),3) +
        row("Load Controllers (LC60 + LC90)",  lc60+lc90,    "—",                 fmt_d(lc_total),           4) +
        row("Gateways + Server",               gw+srv,       "—",                 fmt_d(gw_total),           5) +
        row("CTs, Racks, Misc Hardware",       "—",          "—",                 fmt_d(cts_total),          6)
    )

    # ── Page header/footer helpers ────────────────────────────────────────────────
    def page_header():
        return (f'<div style="display:flex;justify-content:space-between;align-items:center;'
                f'border-bottom:1px solid {BORDER};padding-bottom:0.1in;margin-bottom:0.25in;">'
                f'<div style="font-size:16pt;font-weight:800;color:{ACCENT};">{logo_header}</div>'
                f'<div style="font-size:9pt;color:{MUTED};">{customer} &nbsp;&#183;&nbsp; {proposal_month}</div>'
                f'</div>')

    def page_footer(page_num):
        return (f'<div style="position:absolute;bottom:0.35in;left:0.65in;right:0.65in;'
                f'display:flex;justify-content:space-between;border-top:1px solid {BORDER};'
                f'padding-top:8px;font-size:8pt;color:{MUTED};">'
                f'<span>{customer} &#8212; ECBS Optimization Proposal</span>'
                f'<span>Page {page_num} of 9 &nbsp;&#183;&nbsp; Confidential</span>'
                f'</div>')

    def slabel(text):
        return (f'<div style="font-size:10pt;font-weight:700;letter-spacing:0.12em;'
                f'text-transform:uppercase;color:{ACCENT};border-bottom:1px solid {BORDER};'
                f'padding-bottom:4px;margin-bottom:0.18in;">{text}</div>')

    def card(content, accent_color=None, extra_style=""):
        border = f"border-left:3px solid {accent_color};" if accent_color else ""
        return (f'<div style="background:{SURFACE};border:1px solid {BORDER};{border}'
                f'border-radius:6px;padding:0.18in 0.2in;{extra_style}">{content}</div>')

    # ═══════════════════════════ HTML ═══════════════════════════════════════════
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{customer} &#8212; ECBS Optimization Proposal</title>
<style>
*, *::before, *::after {{ box-sizing:border-box; margin:0; padding:0; }}
body {{
  background:{BG}; color:{WHITE};
  font-family: Arial, Helvetica, sans-serif;
  font-size:10pt; line-height:1.5;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}}
.page {{
  width:8.5in; min-height:11in; background:{BG};
  padding:0.55in 0.65in; position:relative; overflow:hidden;
}}
@media print {{
  @page {{ size:letter; margin:0; }}
  .page {{ page-break-after:always; break-after:page; min-height:11in; }}
  .page:last-child {{ page-break-after:avoid; break-after:avoid; }}
}}
h2 {{ font-size:22pt; font-weight:700; color:{WHITE}; margin-bottom:0.18in; }}
table {{ width:100%; border-collapse:collapse; font-size:9.5pt; }}
th {{ background:{BG3}; color:{MUTED}; font-weight:600; font-size:8pt;
      text-transform:uppercase; letter-spacing:0.06em;
      padding:7px 10px; text-align:left; border-bottom:1px solid {BORDER}; }}
.total-row td {{ background:{BG3} !important; font-weight:700; color:{GREEN}; border-top:1px solid {BORDER}; }}
.subtotal-row td {{ background:{BG4} !important; font-weight:600; color:{WHITE} !important; }}
</style>
</head>
<body>

<!-- PAGE 1 · EXECUTIVE SUMMARY -->
<div class="page" style="display:flex;flex-direction:column;justify-content:space-between;padding:0.75in 0.9in;">
  <div>
    <div style="margin-bottom:0.45in;">{logo_header}</div>
    <div style="font-size:9pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.08in;">Prepared for</div>
    <div style="font-weight:800;font-size:28pt;color:{WHITE};line-height:1.05;margin-bottom:0.35in;">
      {customer}<br>
      <span style="font-size:16pt;font-weight:600;color:{MUTED};">{site_name}</span>
    </div>
    <p style="font-size:10.5pt;line-height:1.75;color:{WHITE};margin-bottom:0.25in;">
      Thank you for the opportunity to present this analysis. We have reviewed your {energy_prov}
      account and identified a clear path to meaningful, sustained reductions in your monthly energy costs.
    </p>
    {slabel("The Opportunity")}
    <p style="font-size:9.5pt;line-height:1.75;color:{WHITE};margin-bottom:0.25in;">
      Your {site_name} facility is operating at <strong>{peak_kw:,.0f} kW peak demand</strong>
      with a monthly utility bill of approximately <strong>{fmt_d(monthly_bill)}</strong>.
      Facilities {fc_phrase} at this load level consistently carry measurable harmonic distortion
      and reactive power inefficiencies that inflate both demand and consumption charges without adding output.
    </p>
    {slabel("How ECBS Addresses It")}
    <p style="font-size:9.5pt;line-height:1.75;color:{WHITE};margin-bottom:0.25in;">
      The ECBS system reduces total electrical load across the facility network by correcting power factor,
      filtering harmonics, and balancing phase currents &#8212; without any changes to operations or equipment.
      Based on your current bill, we project an annual reduction of approximately
      <strong>{fmt_pct(savings_pct)}</strong>, or <strong>{fmt_d(mo_sav * 12)} per year</strong>.
    </p>
    {slabel("Savings Verification &#8212; IPMVP Option C")}
    <p style="font-size:9.5pt;line-height:1.75;color:{WHITE};margin:0;">
      Savings are measured and verified using <strong>IPMVP Option C</strong> (Whole Facility) &#8212;
      a comparison of utility bills before and after installation, normalized for production and weather
      where applicable. Monthly reports are delivered through the ECBS cloud platform, providing
      transparent, auditable performance data.
    </p>
  </div>
  <div style="border-top:1px solid {BORDER};padding-top:0.18in;display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;color:{MUTED};">
    <span>Confidential &nbsp;&#183;&nbsp; {proposal_month} &nbsp;&#183;&nbsp; Prepared by {preparer_org}</span>
    <span>{preparer_name} &nbsp;&#183;&nbsp; {contact_name} &nbsp;&#183;&nbsp; {contact_phone}</span>
  </div>
</div>

<!-- PAGE 2 · COVER -->
<div class="page" style="display:flex;flex-direction:column;justify-content:space-between;padding:0.6in 0.75in;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>{logo_cover}</div>
    <div style="text-align:right;">
      <div style="font-size:9pt;color:{MUTED};">Prepared by</div>
      <div style="font-size:10pt;font-weight:600;color:{WHITE};">{preparer_org}</div>
      <div style="font-size:9pt;color:{MUTED};">{preparer_name}</div>
    </div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:0.5in 0;">
    <div style="display:flex;justify-content:center;margin-bottom:0.12in;">{cust_logo_html}</div>
    <div style="color:{ACCENT};font-size:11pt;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.2in;font-weight:600;">ECBS Optimization Proposal</div>
    <div style="color:{WHITE};font-weight:800;font-size:40pt;line-height:1.05;">{customer}</div>
    <div style="color:{MUTED};font-size:11pt;margin-top:0.15in;">{site_name} &nbsp;&#183;&nbsp; {energy_prov} &nbsp;&#183;&nbsp; {proposal_month}</div>
    <!-- KPI grid -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.12in;margin:0.35in 0 0.3in;">
      <div style="background:{SURFACE};border:1px solid {BORDER};border-radius:6px;padding:0.18in 0.15in;text-align:center;">
        <div style="font-weight:800;font-size:24pt;color:{WHITE};line-height:1;">{fmt_k(hw)}</div>
        <div style="font-size:8pt;color:{MUTED};margin-top:5px;text-transform:uppercase;letter-spacing:0.08em;">Hardware Cost</div>
      </div>
      <div style="background:{SURFACE};border:1px solid {BORDER};border-radius:6px;padding:0.18in 0.15in;text-align:center;">
        <div style="font-weight:800;font-size:24pt;color:{WHITE};line-height:1;">{fmt_k(yr1_total)}</div>
        <div style="font-size:8pt;color:{MUTED};margin-top:5px;text-transform:uppercase;letter-spacing:0.08em;">Year 1 All-In</div>
      </div>
      <div style="background:{SURFACE};border:1px solid {BORDER};border-color:{GREEN};border-radius:6px;padding:0.18in 0.15in;text-align:center;">
        <div style="font-weight:800;font-size:24pt;color:{GREEN};line-height:1;">{fmt_d(mo_sav)}/mo</div>
        <div style="font-size:8pt;color:{MUTED};margin-top:5px;text-transform:uppercase;letter-spacing:0.08em;">Est. Monthly Savings</div>
      </div>
      <div style="background:{SURFACE};border:1px solid {BORDER};border-radius:6px;padding:0.18in 0.15in;text-align:center;">
        <div style="font-weight:800;font-size:24pt;color:{WHITE};line-height:1;">~{roi_mo:.0f} mo</div>
        <div style="font-size:8pt;color:{MUTED};margin-top:5px;text-transform:uppercase;letter-spacing:0.08em;">Payback Period</div>
      </div>
    </div>
    {card(f'<p style="font-size:9pt;line-height:1.6;text-align:center;color:{WHITE};">This ECBS solution is sized based on the <strong>power quality profile of the facility\'s current load</strong> &#8212; derived directly from the utility electric bill, including peak demand, consumption history, and rate structure.</p>', extra_style="max-width:5.5in;margin:0 auto;")}
  </div>
  <div style="border-top:1px solid {BORDER};padding-top:0.15in;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:9.5pt;color:{MUTED};">Submitted to <span style="color:{WHITE};font-weight:500;">{customer}</span> &nbsp;&#183;&nbsp; {contact_name}, {contact_title}</div>
    <div style="font-size:9pt;color:{MUTED};text-align:right;">Confidential &nbsp;&#183;&nbsp; {proposal_month}</div>
  </div>
</div>

<!-- PAGE 3 · SCOPE & INVESTMENT -->
<div class="page">
  {page_header()}
  <h2>Scope &amp; Investment at a Glance</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;margin-bottom:0.25in;">
    <div>
      {slabel("Cost Breakdown")}
      <table>
        <tr><th>Component</th><th style="text-align:right;">Amount</th></tr>
        <tr style="background:{BG2};"><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Hardware &amp; Equipment</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(hw)}</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Engineering &amp; Installation (15%)</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(engineering)}</td></tr>
        <tr style="background:{BG2};"><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Software Subscription &#8212; /meter/Year 1</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(sw_yr1)}</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Freight &amp; Logistics ({pallets} pallet{"s" if pallets>1 else ""})</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(shipping)}</td></tr>
        <tr class="total-row"><td style="padding:7px 10px;border-bottom:1px solid {BORDER};"><strong>Year 1 Total Investment</strong></td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};text-align:right;"><strong>{fmt_d2(yr1_total)}</strong></td></tr>
      </table>
      <div style="margin-top:0.1in;font-size:8.5pt;color:{MUTED};">Annual software fee (Year 2+): <strong style="color:{WHITE};">{fmt_d(sw_yr2plus)}/meter/year</strong></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.15in;">
      {card(f'<div style="font-weight:800;font-size:30pt;color:{GREEN};line-height:1;">{fmt_d(mo_sav)}</div><div style="font-size:8.5pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Estimated Monthly Savings</div><div style="font-size:8.5pt;color:{MUTED};margin-top:6px;">Based on {fmt_pct(savings_pct)} reduction of avg monthly bill</div>', GREEN)}
      {card(f'<div style="font-weight:800;font-size:30pt;color:{ACCENT};line-height:1;">~{roi_mo:.1f} months</div><div style="font-size:8.5pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Payback Period</div>', ACCENT)}
      {card(f'<div style="font-size:9pt;color:{MUTED};margin-bottom:6px;">EQUIPMENT SCOPE SUMMARY <span style="font-size:8pt;">(see BOM for details)</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:9pt;"><div><span style="color:{MUTED};">Sites:</span> <strong>1</strong></div><div><span style="color:{MUTED};">Units:</span> <strong>{budget}</strong></div><div><span style="color:{MUTED};">ECBS-600:</span> <strong>{s600}</strong></div><div><span style="color:{MUTED};">APF Units:</span> <strong>{total_apf}</strong></div><div><span style="color:{MUTED};">Peak kW:</span> <strong>{peak_kw:,.0f}</strong></div><div><span style="color:{MUTED};">Meters:</span> <strong>{n_meters}</strong></div></div>')}
    </div>
  </div>
  {slabel("How ECBS Delivers Savings")}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.2in;margin-bottom:0.18in;">
    {card(f'<h3 style="font-size:11pt;color:{ACCENT};margin-bottom:8px;">What It Is</h3><p style="font-size:8.5pt;line-height:1.7;color:{WHITE};">ECBS optimizes how electricity flows across your entire facility by balancing current across all three phases, reducing kVA losses, eliminating harmonics, and improving overall system efficiency &#8212; resulting in lower demand, less waste, and smoother operation.</p>', ACCENT)}
    {card(f'<h3 style="font-size:11pt;color:{ACCENT};margin-bottom:8px;">How It Works</h3><p style="font-size:8.5pt;line-height:1.7;color:{WHITE};">Think of ECBS like balancing water in pipes &#8212; when power flows unevenly across phases, it creates turbulence (harmonics) and inefficiency, so ECBS redistributes and smooths the flow across the network, resulting in clean, even, optimized power.</p>', ACCENT)}
    {card(f'<h3 style="font-size:11pt;color:{ACCENT};margin-bottom:8px;">What It\'s Doing</h3><p style="font-size:8.5pt;line-height:1.7;color:{WHITE};">Behind the scenes, ECBS dynamically balances phase currents, filters harmonics from non-linear loads, improves power factor by aligning voltage and current, and stabilizes voltage under changing conditions &#8212; all as a coordinated, network-wide system.</p>', ACCENT)}
  </div>
  <div style="text-align:center;margin-top:0.18in;font-size:9pt;color:{MUTED};line-height:1.7;padding:0 0.3in;">
    ECBS delivers network-wide optimization by reducing kVA demand and utility costs, improving efficiency without operational changes, minimizing stress on electrical equipment, and providing cleaner, more stable power quality.
  </div>
  {page_footer(3)}
</div>

<!-- PAGE 4 · SITE OVERVIEW -->
<div class="page">
  {page_header()}
  <h2>Site Overview</h2>
  {slabel("Facility Profile")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;margin-bottom:0.2in;">
    {card(f"""<table style="width:100%;font-size:9pt;border-collapse:collapse;">
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Site</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{site_name}</strong></td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Address</td><td style="border:none;background:transparent;padding:3px 0;">{address}</td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Country</td><td style="border:none;background:transparent;padding:3px 0;">{country}</td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Facility Type</td><td style="border:none;background:transparent;padding:3px 0;">{facility_type}</td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Utility</td><td style="border:none;background:transparent;padding:3px 0;">{energy_prov}</td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Peak Demand</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{peak_kw:,.0f} kW</strong></td></tr>
    </table>""")}
    {card(f"""<table style="width:100%;font-size:9pt;border-collapse:collapse;">
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">ECBS-600 Units</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{s600}</strong></td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">APF-100 Units</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{apf100}</strong></td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">APF-50 Units</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{apf50}</strong></td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Total Units</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{budget}</strong></td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Metered Points</td><td style="border:none;background:transparent;padding:3px 0;">{n_meters}</td></tr>
      <tr><td style="color:{MUTED};white-space:nowrap;padding:3px 12px 3px 0;border:none;background:transparent;">Region</td><td style="border:none;background:transparent;padding:3px 0;">{region}</td></tr>
    </table>""")}
  </div>
  {slabel("Utility Account Details")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;margin-bottom:0.22in;">
    {card(f"""<div style="font-size:9pt;color:{MUTED};margin-bottom:0.1in;">{tariff_name}</div>
    <table style="width:100%;font-size:9pt;border-collapse:collapse;">
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Meter #</td><td style="border:none;background:transparent;padding:3px 0;">{meter_number}</td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Period</td><td style="border:none;background:transparent;padding:3px 0;">{billing_period}</td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Monthly kWh</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{kwh:,.0f}</strong></td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Peak Demand</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{peak_kw:,.0f} kW</strong></td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Demand Rate</td><td style="border:none;background:transparent;padding:3px 0;">${demand_rate:.2f}/kW/mo</td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Blended Rate</td><td style="border:none;background:transparent;padding:3px 0;">${blended_rate:.4f}/kWh</td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Monthly Bill</td><td style="border:none;background:transparent;padding:3px 0;"><strong>{fmt_d2(monthly_bill)}</strong></td></tr>
      <tr><td style="color:{MUTED};padding:3px 10px 3px 0;border:none;background:transparent;">Region</td><td style="border:none;background:transparent;padding:3px 0;">{region}</td></tr>
    </table>""", ACCENT)}
    <div>
      {excl_html}
      {card(f'<div style="font-size:9pt;color:{MUTED};margin-bottom:4px;">EST. ANNUAL SAVINGS</div><div style="font-weight:800;font-size:24pt;color:{GREEN};line-height:1;">{fmt_d(mo_sav * 12)}</div><div style="font-size:8.5pt;color:{MUTED};">Based on {fmt_pct(savings_pct)} reduction &middot; current bill</div>', GREEN)}
    </div>
  </div>
  {ramp_html}
  {page_footer(4)}
</div>

<!-- PAGE 5 · BILL OF MATERIALS -->
<div class="page">
  {page_header()}
  <h2>Bill of Materials &#8212; {region}</h2>
  {slabel(f"{site_name} &#8212; Equipment List")}
  <table>
    <tr><th>Line Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Line Total</th></tr>
    {bom_rows}
    <tr class="subtotal-row">
      <td style="padding:7px 10px;" colspan="3"><strong>Equipment Subtotal</strong></td>
      <td style="padding:7px 10px;text-align:right;"><strong>{fmt_d2(bom_subtotal)}</strong></td>
    </tr>
    <tr class="total-row">
      <td style="padding:7px 10px;" colspan="3"><strong>Hardware Total (incl. wire &amp; conduit)</strong></td>
      <td style="padding:7px 10px;text-align:right;"><strong>{fmt_d2(hw)}</strong></td>
    </tr>
  </table>
  <div style="margin-top:0.15in;font-size:8.5pt;color:{MUTED};">
    Wire, conduit, couplers, and installation materials included in hardware total but itemized separately in the internal cost sheet.
    Price does not include electrical connections to breakers and fuse disconnects.
    All prices in USD. Equipment ships from Georgetown, TX.
  </div>
  {page_footer(5)}
</div>

<!-- PAGE 6 · PORTFOLIO TOTAL -->
<div class="page">
  {page_header()}
  <h2>Portfolio Equipment Total</h2>
  {slabel("Equipment Count by Category")}
  <table style="margin-bottom:0.25in;">
    <tr><th>Category</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit</th><th style="text-align:right;">Subtotal</th></tr>
    {portfolio_rows}
    <tr class="total-row">
      <td style="padding:7px 10px;" colspan="3"><strong>Portfolio Hardware Total</strong></td>
      <td style="padding:7px 10px;text-align:right;"><strong>{fmt_d2(hw)}</strong></td>
    </tr>
  </table>
  {slabel("Capacity Summary")}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.2in;">
    {card(f'<div style="text-align:center;"><div style="font-weight:800;font-size:36pt;color:{ACCENT};line-height:1;">{budget}</div><div style="font-size:8.5pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Total ECBS Units</div><div style="font-size:8pt;color:{MUTED};margin-top:4px;">{s600} &#215; ECBS-600 &nbsp;|&nbsp; {apf100} &#215; APF-100 &nbsp;|&nbsp; {apf50} &#215; APF-50</div></div>', ACCENT)}
    {card(f'<div style="text-align:center;"><div style="font-weight:800;font-size:36pt;color:{GREEN};line-height:1;">{peak_kw:,.0f}</div><div style="font-size:8.5pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">kW Peak Demand Served</div><div style="font-size:8pt;color:{MUTED};margin-top:4px;">{peak_source} from {energy_prov} bill</div></div>', GREEN)}
    {card(f'<div style="text-align:center;"><div style="font-weight:800;font-size:36pt;color:{ACCENT};line-height:1;">{n_meters}</div><div style="font-size:8.5pt;color:{MUTED};text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Monitored Service Points</div><div style="font-size:8pt;color:{MUTED};margin-top:4px;">Revenue-grade metering per point</div></div>')}
  </div>
  {page_footer(6)}
</div>

<!-- PAGE 7 · INVESTMENT SUMMARY -->
<div class="page">
  {page_header()}
  <h2>Investment Summary</h2>
  {slabel(f"Year 1 Investment &#8212; {site_name}")}
  <table style="margin-bottom:0.25in;">
    <tr><th>Component</th><th style="text-align:right;">Amount</th></tr>
    <tr style="background:{BG2};"><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Hardware &amp; Equipment</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(hw)}</td></tr>
    <tr><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Engineering &amp; Installation (15%)</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(engineering)}</td></tr>
    <tr style="background:{BG2};"><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Software Subscription &#8212; /meter/Year 1</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(sw_yr1)}</td></tr>
    <tr><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">Freight &amp; Logistics ({pallets} pallets)</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(shipping)}</td></tr>
    <tr class="total-row"><td style="padding:7px 10px;"><strong>Year 1 Total Investment</strong></td><td style="padding:7px 10px;text-align:right;"><strong>{fmt_d2(yr1_total)}</strong></td></tr>
  </table>
  {slabel("Ongoing Annual Fee (Year 2+)")}
  <table style="margin-bottom:0.25in;">
    <tr><th>Site</th><th style="text-align:right;">Meters</th><th style="text-align:right;">Rate / Meter / Year</th><th style="text-align:right;">Annual Fee</th></tr>
    <tr><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};">{site_name}</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{sw_pts}</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">$799.00</td><td style="padding:7px 10px;border-bottom:1px solid {BORDER};color:{WHITE};text-align:right;">{fmt_d2(sw_yr2plus)}</td></tr>
    <tr class="total-row"><td style="padding:7px 10px;" colspan="3"><strong>Total Annual Subscription</strong></td><td style="padding:7px 10px;text-align:right;"><strong>{fmt_d2(sw_yr2plus)}</strong></td></tr>
  </table>
  {slabel("Shipping Detail")}
  {card(f'<div style="font-size:9pt;color:{WHITE};">Shipping from Georgetown, TX &nbsp;&#183;&nbsp; USA domestic rate ${ship_rate:.0f}/pallet<br><strong>{pallets} pallets</strong> estimated for {site_name} &nbsp;(calc: &#x2308;{total_apf}/3&#x2309; + &#x2308;{s600}/50&#x2309; + &#x2308;{total_racks}/8&#x2309; + 1 misc = {pallet_a} + {pallet_b} + {pallet_c} + 1) &nbsp;=&nbsp; <strong>{fmt_d2(shipping)}</strong></div>')}
  {page_footer(7)}
</div>

<!-- PAGE 8 · EQUIPMENT DETAILS -->
<div class="page">
  {page_header()}
  <h2>ECBS Equipment Details</h2>
  {slabel("What Each Unit Does")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.18in;margin-bottom:0.18in;">
    {card(f'<div style="display:inline-block;background:#0d2a44;color:{ACCENT};font-size:8pt;padding:2px 8px;border-radius:3px;margin-bottom:8px;font-weight:600;">ECBS-600 &middot; XPS600</div><h4 style="font-size:14pt;color:{ACCENT};margin-bottom:6px;">Power Line Conditioner/Extractor</h4><p style="font-size:9pt;color:{WHITE};line-height:1.55;">The ECBS-600 is the core power quality unit, combining narrow-band tuning (extraction) and reactive power compensation in a single 480V cabinet. Each unit serves up to 75 kW of load. At this site, <strong>{s600} {_plural("unit", s600)}</strong> {_plural("is", s600) if s600==1 else "are"} deployed, {fc_phrase}. Reduces harmonics to IEEE 519 compliance levels and cuts resistive heat losses.</p>')}
    {card(f'<div style="display:inline-block;background:#0d2a44;color:{ACCENT};font-size:8pt;padding:2px 8px;border-radius:3px;margin-bottom:8px;font-weight:600;">APF-100 &middot; Active Power Filter</div><h4 style="font-size:14pt;color:{ACCENT};margin-bottom:6px;">High-Capacity Active Power Filter</h4><p style="font-size:9pt;color:{WHITE};line-height:1.55;">The APF-100 delivers double the capacity of the APF-50 and is deployed when two APF units would serve the same electrical bus. At this site, <strong>{apf100} APF-100 {_plural("unit", apf100)}</strong> provide{"s" if apf100==1 else ""} continuous real-time harmonic cancellation for non-linear loads including VFDs, rectifiers, and CNC-controlled equipment. Corrects up to the 51st harmonic order.</p>')}
    {card(f'<div style="display:inline-block;background:#0d2a44;color:{ACCENT};font-size:8pt;padding:2px 8px;border-radius:3px;margin-bottom:8px;font-weight:600;">APF-50 &middot; XPF480-50</div><h4 style="font-size:14pt;color:{ACCENT};margin-bottom:6px;">Active Power Filter &#8212; Standard</h4><p style="font-size:9pt;color:{WHITE};line-height:1.55;">The APF-50 provides active harmonic mitigation for 480V distribution panels with moderate non-linear load density. <strong>{apf50} APF-50 {_plural("unit", apf50)}</strong> supplement the APF-100s, targeting sub-panels and ancillary machinery. Each unit includes a built-in power quality energy meter, functioning as a monitored sub-point when deployed without a dedicated revenue meter upstream.</p>')}
    {card(f'<div style="display:inline-block;background:#0d2a44;color:{ACCENT};font-size:8pt;padding:2px 8px;border-radius:3px;margin-bottom:8px;font-weight:600;">Gateway + Server</div><h4 style="font-size:14pt;color:{ACCENT};margin-bottom:6px;">Communication &amp; Cloud Infrastructure</h4><p style="font-size:9pt;color:{WHITE};line-height:1.55;"><strong>{gw} {_plural("gateway", gw)}</strong> collect real-time data from all ECBS units via Modbus/RS-485 and transmit to the ECBS cloud platform over LTE/Ethernet. The on-site <strong>server</strong> provides local data buffering, site-level dashboards, and supports utility reporting exports. The platform supports 12 units per gateway &#8212; this site uses {gw} to cover all {budget} deployed units.</p>')}
  </div>
  {slabel("Performance Standards")}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.2in;">
    {card(f'<div style="text-align:center;"><div style="font-size:10pt;color:{MUTED};margin-bottom:4px;">TOTAL HARMONIC DISTORTION</div><div style="font-weight:800;font-size:28pt;color:{ACCENT};line-height:1;">&lt; 5%</div><div style="font-size:8.5pt;color:{MUTED};margin-top:4px;">IEEE 519 compliant &middot; up to 85% compensation</div></div>')}
    {card(f'<div style="text-align:center;"><div style="font-size:10pt;color:{MUTED};margin-bottom:4px;">EST. POWER FACTOR</div><div style="font-weight:800;font-size:28pt;color:{ACCENT};line-height:1;">0.98+</div><div style="font-size:8.5pt;color:{MUTED};margin-top:4px;">Continuous dynamic correction</div></div>')}
    {card(f'<div style="text-align:center;"><div style="font-size:10pt;color:{MUTED};margin-bottom:4px;">RESPONSE TIME</div><div style="font-weight:800;font-size:28pt;color:{ACCENT};line-height:1;">&lt; 20&#x3bc;s</div><div style="font-size:8.5pt;color:{MUTED};margin-top:4px;">Real-time compensation cycle</div></div>')}
  </div>
  {page_footer(8)}
</div>

<!-- PAGE 9 · NEXT STEPS -->
<div class="page">
  {page_header()}
  <h2>Next Steps</h2>
  {slabel("Path to Commissioning")}
  <div style="margin-bottom:0.3in;">
    <div style="display:flex;gap:0.18in;margin-bottom:0.22in;">
      <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:{ACCENT};color:#000;font-weight:800;font-size:14pt;display:flex;align-items:center;justify-content:center;">1</div>
      <div><h4 style="font-size:13pt;color:{WHITE};margin-bottom:3px;">Scope Confirmation</h4><p style="font-size:9pt;color:{WHITE};line-height:1.5;">Review and approve this proposal. Confirm equipment placement approach for {site_name}. Xeco will issue a formal Scope of Work document for signature.</p></div>
    </div>
    <div style="display:flex;gap:0.18in;margin-bottom:0.22in;">
      <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:{ACCENT};color:#000;font-weight:800;font-size:14pt;display:flex;align-items:center;justify-content:center;">2</div>
      <div><h4 style="font-size:13pt;color:{WHITE};margin-bottom:3px;">Contract &amp; Purchase Order</h4><p style="font-size:9pt;color:{WHITE};line-height:1.5;">Execute the Master Services Agreement. Issue PO for equipment. Hardware lead time is typically 2&#8211;4 weeks from order confirmation. Freight coordinated from Georgetown, TX to {site_name}.</p></div>
    </div>
    <div style="display:flex;gap:0.18in;margin-bottom:0.22in;">
      <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:{ACCENT};color:#000;font-weight:800;font-size:14pt;display:flex;align-items:center;justify-content:center;">3</div>
      <div><h4 style="font-size:13pt;color:{WHITE};margin-bottom:3px;">Installation &amp; Commissioning</h4><p style="font-size:9pt;color:{WHITE};line-height:1.5;">Xeco-certified technicians install and commission all {budget} units. Baseline and post-install power quality readings are captured. Gateway and server are configured and connected to the ECBS cloud platform. Typical install duration: {install_days} for a site of this scale ({budget} units).</p></div>
    </div>
    <div style="display:flex;gap:0.18in;margin-bottom:0.22in;">
      <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:{ACCENT};color:#000;font-weight:800;font-size:14pt;display:flex;align-items:center;justify-content:center;">4</div>
      <div><h4 style="font-size:13pt;color:{WHITE};margin-bottom:3px;">Monitoring &amp; Ongoing Support</h4><p style="font-size:9pt;color:{WHITE};line-height:1.5;">Live energy dashboard activated. Monthly energy reports delivered to {customer}. Annual software subscription ({fmt_d(sw_yr2plus)}/meter/year from Year 1) covers platform access, remote diagnostics, and performance guarantees.</p></div>
    </div>
  </div>
  {slabel("Warranty")}
  {card(f'<p style="font-size:9pt;line-height:1.6;color:{WHITE};">The ECBS system is covered by a <strong>5-year manufacturer\'s warranty</strong> from commissioning, covering all major components against defects in materials and workmanship. If an issue arises, Xeco provides remote diagnostics and will repair or replace defective components to ensure continued performance.</p>', ACCENT)}
  <div style="position:absolute;bottom:0.35in;left:0.65in;right:0.65in;display:flex;justify-content:space-between;border-top:1px solid {BORDER};padding-top:8px;font-size:8pt;color:{MUTED};">
    <span>{customer} &#8212; ECBS Optimization Proposal</span>
    <span>Page 9 of 9 &nbsp;&#183;&nbsp; Confidential &nbsp;&#183;&nbsp; Prepared by {preparer_org}</span>
  </div>
</div>

</body>
</html>"""
    return html


def build_proposal_html(data: dict) -> str:
    """Return the rendered HTML string for the proposal."""
    computed = _compute(data)
    return _build_html(data, computed)


def build_proposal_pdf(data: dict) -> bytes:
    """Render the proposal and convert to PDF using WeasyPrint. Returns PDF bytes."""
    try:
        from weasyprint import HTML as WP_HTML
    except ImportError as e:
        raise RuntimeError("WeasyPrint is not installed. Add weasyprint to requirements.txt.") from e

    html_str = build_proposal_html(data)
    pdf = WP_HTML(string=html_str).write_pdf()
    return pdf


def build_proposal_computed(data: dict) -> dict:
    """Return just the computed values (for API preview/validation)."""
    c = _compute(data)
    return {
        "s600": c["s600"], "apf100": c["apf100"], "apf50": c["apf50"],
        "total_apf": c["total_apf"], "budget": c["budget"], "n_meters": c["n_meters"],
        "hw": round(c["hw"], 2), "engineering": round(c["engineering"], 2),
        "sw_yr1": c["sw_yr1"], "pallets": c["pallets"],
        "shipping": round(c["shipping"], 2), "yr1_total": round(c["yr1_total"], 2),
        "sw_yr2plus": c["sw_yr2plus"], "mo_sav": round(c["mo_sav"], 2),
        "annual_savings": round(c["mo_sav"] * 12, 2), "roi_mo": round(c["roi_mo"], 1),
        "install_days": c["install_days"],
    }
