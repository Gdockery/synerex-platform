"""
report_proposal_contract.py
Generates the ECBS Network-Wide Energy Optimization Proposal Contract PDF.

Usage:
    from app.services.report_proposal_contract import build_html, render_pdf
    html = build_html(data_dict)
    pdf_bytes = render_pdf(html)

render_pdf is shared — re-exported from report_network_assessment for convenience.
"""
import base64
import math
import pathlib

ASSETS_DIR = pathlib.Path(__file__).parent.parent / "static" / "report_assets"

def _b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()

_XECO_LOGO_WHITE_B64 = _b64(ASSETS_DIR / "xeco_logo_white.png")
_XECO_LOGO_COLOR_B64 = _b64(ASSETS_DIR / "xeco_logo_color.png")
_COVER_BG_B64        = _b64(ASSETS_DIR / "cover_bg.png")
_ECBS_ARCH_B64       = _b64(ASSETS_DIR / "ecbs_architecture.jpg")
_TRAD_VS_ECBS_B64    = _b64(ASSETS_DIR / "traditional_vs_ecbs.png")


# ── MDP helper functions (take buses as argument) ─────────────────────────────

def _network_wide_rows(buses):
    rows = []
    for b in buses:
        ecbs   = sum(c["n_ecbs"]   for c in b["circuits"])
        apf50  = sum(c["n_apf50"]  for c in b["circuits"])
        apf100 = sum(c["n_apf100"] for c in b["circuits"])
        total  = ecbs + apf50 + apf100
        parts = []
        if ecbs:   parts.append(f"{ecbs} &times; ECBS-600")
        if apf100: parts.append(f"{apf100} &times; APF-100")
        if apf50:  parts.append(f"{apf50} &times; APF-50")
        deploy = " &bull; ".join(parts) if parts else "—"
        rows.append(
            f'<tr><td><strong>{b["badge"]}</strong></td>'
            f'<td class="val-col">{deploy}</td>'
            f'<td class="val-col" style="font-weight:700;text-align:center;">{total}</td></tr>'
        )
    total_all = sum(
        sum(c["n_ecbs"] + c["n_apf50"] + c["n_apf100"] for c in b["circuits"])
        for b in buses
    )
    rows.append(
        f'<tr style="background:#e8f4ed;font-weight:700;">'
        f'<td>Total</td><td class="val-col"></td>'
        f'<td class="val-col" style="text-align:center;">{total_all}</td></tr>'
    )
    return "\n".join(rows)


def _mdp_summary_rows(buses):
    rows = []
    for b in buses:
        ecbs   = sum(c["n_ecbs"]   for c in b["circuits"])
        apf50  = sum(c["n_apf50"]  for c in b["circuits"])
        apf100 = sum(c["n_apf100"] for c in b["circuits"])
        parts = []
        if ecbs:   parts.append(f"{ecbs} &times; X600")
        if apf100: parts.append(f"{apf100} &times; APF-100")
        if apf50:  parts.append(f"{apf50} &times; APF-50")
        equip = " + ".join(parts) if parts else "—"
        total = ecbs + apf50 + apf100
        rows.append(
            f'<tr><td>{b["badge"]}</td>'
            f'<td class="val-col">{b.get("xf_kva","?")}</td>'
            f'<td class="val-col">{(str(int(b["main_a"])) + "A") if b.get("main_a") else ""}</td>'
            f'<td class="val-col">{equip}</td>'
            f'<td class="val-col" style="font-weight:700;">{total}</td></tr>'
        )
    return "\n".join(rows)


def _mdp_cards(buses):
    colors = ["#006644","#007a55","#008f62","#00a36e","#00b87a","#009960","#007050"]
    cards = []
    for i, b in enumerate(buses):
        ecbs   = sum(c["n_ecbs"]   for c in b["circuits"])
        apf50  = sum(c["n_apf50"]  for c in b["circuits"])
        apf100 = sum(c["n_apf100"] for c in b["circuits"])
        total  = ecbs + apf50 + apf100
        lines = []
        if ecbs:   lines.append(f"<span>{ecbs} &times; X600</span>")
        if apf100: lines.append(f"<span>{apf100} &times; APF-100</span>")
        if apf50:  lines.append(f"<span>{apf50} &times; APF-50</span>")
        equip_html = "<br>".join(lines)
        col = colors[i % len(colors)]
        cards.append(f"""
  <div style="background:{col};border-radius:6px;padding:10px 8px;text-align:center;color:#fff;min-width:0;">
    <div style="font-size:11pt;font-weight:700;letter-spacing:.03em;margin-bottom:4px;">{b["badge"]}</div>
    <div style="font-size:18pt;font-weight:800;line-height:1.1;">{total}</div>
    <div style="font-size:7pt;opacity:.85;margin-top:2px;">units</div>
    <div style="font-size:7.5pt;opacity:.9;margin-top:5px;line-height:1.5;">{equip_html}</div>
    <div style="font-size:7pt;opacity:.7;margin-top:4px;">{b.get("xf_kva","?")} kVA</div>
  </div>""")
    return "\n".join(cards)


# ── Payment schedule HTML helper ──────────────────────────────────────────────

def _payment_schedule_html(payment_schedule: list | None, customer: str, net_total: float) -> str:
    if not payment_schedule:
        return f"""  <p>Payment terms are to be agreed upon execution of the formal project agreement.
    SYNEREX will coordinate with {customer} to establish a payment schedule appropriate for
    the project scope and timeline.</p>"""

    rows = ""
    running = 0
    for m in payment_schedule:
        pct = float(m.get("pct", 0))
        desc = m.get("desc", "")
        amt = net_total * pct / 100
        running += pct
        rows += f"""<tr>
      <td>{desc}</td>
      <td class="val-col" style="text-align:center;">{pct:.0f}%</td>
      <td class="val-col" style="text-align:right;">${amt:,.0f}</td>
    </tr>"""

    return f"""<table class="doc-table">
  <thead><tr><th>Milestone</th><th style="text-align:center;">%</th><th style="text-align:right;">Amount (USD)</th></tr></thead>
  <tbody>
    {rows}
    <tr style="font-weight:700;background:#e8f4ed;">
      <td>Total Project Investment</td>
      <td style="text-align:center;">{running:.0f}%</td>
      <td style="text-align:right;">${net_total:,.0f}</td>
    </tr>
  </tbody>
</table>"""


def _insurance_html(insurance_policy: dict | None) -> str:
    if not insurance_policy:
        return """<p>SYNEREX maintains commercial general liability insurance coverage appropriate for its operations.
    Certificates of insurance may be provided upon request following project award.</p>"""

    carrier = insurance_policy.get("carrier", "")
    limits  = insurance_policy.get("limits", {})
    limit_rows = ""
    labels = [
        ("each_occurrence",        "Each Occurrence"),
        ("general_aggregate",      "General Aggregate"),
        ("products_comp_ops",      "Products/Completed Operations Aggregate"),
        ("personal_adv_injury",    "Personal &amp; Advertising Injury"),
        ("damage_to_premises",     "Damage to Rented Premises"),
        ("medical_expense",        "Medical Expense"),
    ]
    for key, label in labels:
        val = limits.get(key, "")
        if val:
            limit_rows += f"<tr><td>{label}</td><td class=\"val-col\">{val}</td></tr>"

    return f"""<p>SYNEREX maintains commercial general liability insurance through <strong>{carrier}</strong>.
    Certificates of insurance may be provided upon request following project award.</p>
<table class="doc-table" style="margin:.1in 0 .15in;">
  <thead><tr><th>Coverage Type</th><th>Limit</th></tr></thead>
  <tbody>{limit_rows}</tbody>
</table>"""


# ── Main build function ────────────────────────────────────────────────────────

def build_html(d: dict, doc_no: str | None = None) -> str:
    """Build the Proposal Contract HTML from a data dict."""

    # Identity / site
    customer           = d.get("customer", "")
    customer_legal     = d.get("customer_legal", customer)
    address            = d.get("address", "")
    address_street     = d.get("address_street", address)
    address_city       = d.get("address_city", "")
    contact_name       = d.get("contact_name", "")
    contact_title      = d.get("contact_title", "")
    contact_email      = d.get("contact_email", "")
    contact_phone      = d.get("contact_phone", "")
    contact_first      = contact_name.split()[0] if contact_name else "Sir/Madam"
    date_label         = d.get("date_label", "")
    cover_location     = d.get("cover_location", address)
    facility_type       = d.get("facility_type", "facility")
    facility_desc       = d.get("facility_desc", "")
    facility_site_label = d.get("facility_site_label", facility_type)
    facility_city       = d.get("facility_city", d.get("address_city", ""))
    sq_ft              = d.get("sq_ft", "")
    sld_source         = d.get("sld_source", "Site SLD")
    bus_amp_range      = d.get("bus_amp_range", "")
    billing_months     = d.get("billing_months_label", "3")
    overview_para      = d.get("overview_para", "")
    capacitor_bank_bullet = d.get("capacitor_bank_bullet", "")

    # Utility / billing
    utility_name       = d.get("utility_name", "")
    utility_short      = d.get("utility_short", utility_name)
    utility_tariff     = d.get("utility_tariff", "")
    utility_account    = d.get("utility_account", "")
    utility_acct_no    = d.get("utility_acct_no", utility_account)
    peak_kw            = float(d.get("peak_kw", 0))
    connected_kw       = float(d.get("connected_kw", peak_kw * 1.3))
    contracted_kw      = float(d.get("contracted_kw", peak_kw))
    avg_bill_usd       = float(d.get("avg_bill_usd", 0))
    pf_reference       = d.get("pf_reference", "≈1.0")
    pf_reference_month = d.get("pf_reference_month", "")
    pf_worst           = d.get("pf_worst", pf_reference)
    has_pf_penalty     = bool(d.get("has_pf_penalty", False))
    pf_penalty_usd     = float(d.get("pf_penalty_usd", 0))
    energy_savings     = float(d.get("energy_savings", 0))
    energy_pct         = d.get("energy_pct", "6")
    pf_savings         = float(d.get("pf_savings", 0))
    total_savings      = float(d.get("total_savings", energy_savings))

    # Topology
    buses              = d.get("buses", [])
    num_mdps           = int(d.get("num_mdps", len(buses)))

    # Equipment counts
    s600               = int(d.get("s600", sum(c["n_ecbs"]   for b in buses for c in b["circuits"])))
    apf100             = int(d.get("apf100", sum(c["n_apf100"] for b in buses for c in b["circuits"])))
    apf50              = int(d.get("apf50",  sum(c["n_apf50"]  for b in buses for c in b["circuits"])))
    n_meters           = int(d.get("n_meters", 1))
    total_units        = s600 + apf100 + apf50
    total_fu           = s600 + apf50 + 2 * apf100
    gw                 = math.ceil(total_units / 12) if total_units else 1
    srv                = 1

    # OEM location
    prepared_by_location = d.get("prepared_by_location", "Georgetown, Texas")

    # Customer owns meters flag
    customer_owns_meters = bool(d.get("customer_owns_meters", False))

    # Pricing
    pricing = d.get("pricing", {
        "ecbs600": 3625, "apf50": 7995, "apf100": 7500,
        "meter": 2500, "lc90": 780, "lc60": 620,
        "rocoil_ct": 150, "apf_ct": 300, "booster": 600,
        "gateway": 129, "server": 2475, "ethernet": 10,
        "sw_yr1": 2400, "shipping": 275,
    })
    lc60_qty     = max(0, s600 - 2 * n_meters)
    cost_ecbs    = s600    * pricing["ecbs600"]
    cost_apf50   = apf50   * pricing["apf50"]
    cost_apf100  = apf100  * pricing["apf100"]
    cost_meters  = n_meters * pricing["meter"]
    cost_lc90    = n_meters * pricing["lc90"]
    cost_lc60    = lc60_qty * pricing["lc60"]
    cost_cts     = (3*n_meters) * pricing["rocoil_ct"]
    cost_booster = n_meters * pricing.get("booster", 600)
    cost_apf_cts = (3 * (apf100 + apf50)) * pricing.get("apf_ct", 300)
    cost_gw      = gw * pricing["gateway"]
    cost_srv     = pricing["server"]
    cost_eth     = (gw + 1) * pricing["ethernet"]
    hw_total     = (cost_ecbs + cost_apf50 + cost_apf100
                    + cost_meters + cost_lc90 + cost_lc60
                    + cost_cts + cost_booster + cost_apf_cts
                    + cost_gw + cost_srv + cost_eth)
    _eng_override = d.get("engineering_fee_override")
    eng_fee     = int(_eng_override) if _eng_override is not None else round(hw_total * 0.15)
    _sw_override  = d.get("sw_yr1_override")
    sw_yr1      = int(_sw_override)  if _sw_override  is not None else int(d.get("sw_yr1", pricing.get("sw_yr1", 2400)))
    n_pallets   = (math.ceil(apf50/3) + math.ceil(apf100/3)
                   + math.ceil(s600/50) + 1)
    _ship_override = d.get("shipping_override")
    shipping    = int(_ship_override) if _ship_override is not None else int(d.get("shipping", n_pallets * pricing.get("shipping", 275)))
    _disc_override = d.get("discount_override")
    discount    = int(_disc_override) if _disc_override is not None else 0
    net_total   = hw_total + eng_fee + sw_yr1 + shipping - discount
    annual_savings = total_savings * 12

    # OEM branding
    prepared_by_org  = d.get("prepared_by_org", "SYNEREX Energy Corporation")
    preparer_name    = d.get("preparer_name", "")
    payment_schedule = d.get("payment_schedule")   # list of {pct, desc} or None
    insurance_policy = d.get("insurance_policy")   # dict or None

    # Logos
    customer_logo_b64 = d.get("customer_logo_b64")

    # ── Derived content ────────────────────────────────────────────────────────
    bus_range      = f"{buses[0]['badge']} through {buses[-1]['badge']}" if buses else ""
    apf100_buses   = [b for b in buses if any(c["n_apf100"] > 0 for c in b["circuits"])]
    apf100_bus_labels = " &amp; ".join(b["badge"] for b in apf100_buses)

    pf_penalty_bullet = (
        f'      <li>Power factor dropped to a <strong>previous 12-month low of {pf_worst}</strong>, '
        f'resulting in a confirmed {utility_short} power factor penalty of '
        f'<strong>${pf_penalty_usd:,} USD in {pf_reference_month}</strong>.</li>'
    ) if has_pf_penalty else ""

    pf_proposal_suffix  = f", eliminating {utility_short} PF penalties" if has_pf_penalty else ""

    pf_letter_fin_row = f"""      <tr>
        <td>Est. PF penalty elimination</td>
        <td class="amt">${pf_savings:,.0f} / mo</td>
        <td class="note">(12-mo avg penalty, excl. anomalous months)</td>
      </tr>""" if has_pf_penalty else ""

    pf_summary_para = f"""  <p>
    Review of recent utility billing data indicates ongoing power factor penalties under the current
    {utility_name} tariff structure. The proposed system is designed to reduce reactive demand, improve
    power factor performance, and improve overall electrical utilization efficiency across the facility.
  </p>""" if has_pf_penalty else ""

    pf_utility_row = (
        f'      <tr><td>Estimated PF Penalty ({pf_reference_month})</td>'
        f'<td class="val-col">${pf_penalty_usd:,.0f} USD</td></tr>'
    ) if has_pf_penalty else ""

    apf100_cobus_note = f"""  <div style="margin:.18in 0 .18in 0;background:#eef6ff;border:1px solid #90b8d8;border-left:4px solid #005fa3;border-radius:4px;padding:14px 16px;font-size:9pt;color:#1a2940;line-height:1.7;">
    <strong style="color:#005fa3;font-size:9.5pt;">Engineering Optimization Advantage — APF-100 Co-Bus Deployment</strong><br>
    Standard harmonic mitigation deployments typically assign one APF-100 unit per VFD-dominated circuit.
    At {apf100_bus_labels}, preliminary single-line diagram review confirmed multiple VFD-driven circuits share a common physical bus.
    SYNEREX substituted a single APF-100 system at each location — maintaining full harmonic mitigation while reducing hardware count.
  </div>""" if apf100_buses else ""

    generic_facility_sentence = (
        overview_para if overview_para
        else f"Review of the {utility_name} billing data for {customer_legal} identified significant demand-side optimization opportunities consistent with the operating profile typical of {facility_type} facilities at this load level."
    )

    # ── Logo tags ─────────────────────────────────────────────────────────────
    if customer_logo_b64:
        cust_logo_tag = f'<img src="data:image/png;base64,{customer_logo_b64}" alt="{customer}" style="height:48px;width:auto;mix-blend-mode:screen;">'
        cust_logo_body = f'<img src="data:image/png;base64,{customer_logo_b64}" alt="{customer}" style="height:44px;width:auto;">'
    else:
        cust_logo_tag  = f'<span style="font-size:18px;font-weight:700;color:#3a8fd4;">{customer}</span>'
        cust_logo_body = f'<span style="font-size:15px;font-weight:700;color:#1a3a6b;">{customer}</span>'

    # ── Build dynamic table sections ──────────────────────────────────────────
    nw_rows    = _network_wide_rows(buses)
    mdp_rows   = _mdp_summary_rows(buses)
    mdp_cards  = _mdp_cards(buses)
    n_bus_cols = len(buses)

    network_wide_table = f"""
<div class="subsubsection-title">Network-Wide Deployment Summary</div>
<table class="doc-table">
  <thead><tr><th>Distribution Location</th><th>Proposed Deployment</th><th style="text-align:center;">Total Units</th></tr></thead>
  <tbody>{nw_rows}</tbody>
</table>"""

    _infra_meter_rows = (
        f'<tr><td>Revenue Grade Meter (utility supply point)</td><td class="val-col">{n_meters}</td></tr>'
        if not customer_owns_meters else
        f'<tr><td>LC90 Communication Module (customer-provided meters)</td><td class="val-col">{n_meters}</td></tr>'
    )
    infra_table = f"""
<div class="subsubsection-title">Total Deployment Infrastructure</div>
<table class="doc-table">
  <thead><tr><th>Equipment Type</th><th>Quantity</th></tr></thead>
  <tbody>
    <tr><td>ECBS-600 Current Balancing Units</td><td class="val-col">{s600}</td></tr>
    {"<tr><td>APF-100 Power Filter Units</td><td class='val-col'>" + str(apf100) + "</td></tr>" if apf100 > 0 else ""}
    {"<tr><td>APF-50 Power Filter Units</td><td class='val-col'>" + str(apf50) + "</td></tr>" if apf50 > 0 else ""}
    {_infra_meter_rows}
    {"<tr><td>APF Current Transformers (3 per APF unit)</td><td class='val-col'>" + str(3*(apf100+apf50)) + "</td></tr>" if (apf100+apf50) > 0 else ""}
    <tr><td>Signal Booster (1 per meter location)</td><td class="val-col">{n_meters}</td></tr>
    <tr><td>IoT Communications Gateways</td><td class="val-col">{gw}</td></tr>
    <tr><td>Edge Energy Datalogger</td><td class="val-col">{srv}</td></tr>
  </tbody>
</table>"""

    mdp_summary_table = f"""
<div class="subsubsection-title">Distribution Board Equipment Summary</div>
<table class="doc-table">
  <thead><tr><th>Switchgear</th><th>Transformer</th><th>Main Breaker</th><th>Proposed Equipment</th><th style="text-align:center;">Units</th></tr></thead>
  <tbody>{mdp_rows}</tbody>
</table>
<p style="font-size:8.5pt;color:#5a7090;margin-top:4px;font-style:italic;">
  &#9432;&nbsp; Equipment quantities derived from ECBS Network Assessment. Subject to field verification prior to procurement release.
</p>"""

    mdp_card_visual = f"""
<div style="margin:.15in 0 .05in 0;">
  <div style="font-size:9pt;font-weight:700;color:#1a3a2a;letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px;">
    Proposed Deployment — Unit Summary by Switchgear
  </div>
  <div style="display:grid;grid-template-columns:repeat({n_bus_cols},1fr);gap:6px;">
    {mdp_cards}
  </div>
  <p style="font-size:8pt;color:#5a7090;margin-top:6px;font-style:italic;">
    &#9432;&nbsp; All quantities subject to field verification prior to procurement release.
  </p>
</div>"""

    payment_html   = _payment_schedule_html(payment_schedule, customer, net_total)
    insurance_html = _insurance_html(insurance_policy)

    # Pre-compute conditional HTML (no backslashes / nested f-strings allowed inside f-string expressions)
    _discount_row_1 = (
        f'<tr><td>Discount / Adjustment</td><td class="amt" style="color:#c00;">-${discount:,.0f}</td><td></td></tr>'
        if discount else ""
    )
    _discount_row_2 = (
        f'<tr><td>Discount / Adjustment</td><td class="val-col" style="color:#c00;">-${discount:,.0f} USD</td></tr>'
        if discount else ""
    )
    _vc = 'val-col'
    _mvv_meter_row = (
        f'<tr><td>Revenue Grade Meter (Synerex)</td><td class="{_vc}">Electrical usage and operating data collection at utility supply point</td></tr>'
        if not customer_owns_meters else
        f'<tr><td>LC90 Communication Module</td><td class="{_vc}">Communication interface integrating customer-owned utility meters into ECBS monitoring platform</td></tr>'
    )
    _mvv_ct_row = (
        f'<tr><td>Rocoil CTs (3&times;)</td><td class="{_vc}">Current sensing at meter location; no switchgear shutdown required</td></tr>'
        if not customer_owns_meters else ""
    )
    _customer_owns_note = (
        f'<p style="margin-top:.1in;font-size:9.5pt;color:#555;">Note: Existing utility revenue meters at this facility are owned and maintained by {customer}. SYNEREX will provide communication interfaces, Rocoil current sensing devices, and associated monitoring infrastructure necessary to integrate utility metering data into the ECBS monitoring platform.</p>'
        if customer_owns_meters else ""
    )

    # ── Timeline visual ───────────────────────────────────────────────────────
    timeline_labels = [
        "Engineering<br>Verification", "Site<br>Coordination", "Procurement",
        "Delivery", "Installation", "Commissioning", "Baseline<br>Validation"
    ]
    timeline_items = ""
    for i, label in enumerate(timeline_labels):
        connector = (
            "" if i == len(timeline_labels) - 1
            else '<div style="position:absolute;top:14px;left:calc(50% + 14px);right:calc(-50% + 14px);height:2px;background:#b0d4c0;z-index:0;"></div>'
        )
        bg  = "#007a55" if i == 0 else "#e8f4ed"
        col = "#fff"    if i == 0 else "#1a3a2a"
        timeline_items += f"""
      <div style="flex:1;text-align:center;position:relative;">
        <div style="background:{bg};color:{col};border-radius:50%;width:28px;height:28px;line-height:28px;font-size:8pt;font-weight:700;margin:0 auto 6px auto;">{i+1}</div>
        {connector}
        <div style="font-size:7.5pt;font-weight:700;color:#007a55;line-height:1.3;">{label}</div>
      </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{customer} — SYNEREX Proposal Contract</title>
<style>
@page {{ size: letter; margin: 1in; }}
@page cover {{ margin: 0; }}
{("@page { @top-right { content: '" + doc_no + "'; font-family: monospace; font-size: 8px; color: #aaaaaa; } }") if doc_no else ""}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
  font-size: 11pt;
  color: #000;
  background: #fff;
  line-height: 1.55;
}}
.cover-page {{ page: cover; width: 8.5in; height: 11in; position: relative; overflow: hidden; page-break-after: always; }}
.cover-bg {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center center; }}
.cover-overlay {{ position: absolute; inset: 0; background: transparent; display: flex; flex-direction: column; padding: .6in .65in .55in; color: #fff; }}
.cover-top {{ flex: 0 0 auto; }}
.cover-main-title {{ font-size: 36pt; font-weight: 900; line-height: 1.05; text-transform: uppercase; letter-spacing: .03em; color: #fff; margin-bottom: .18in; }}
.cover-rule {{ width: .45in; height: 3px; background: #3a8fd4; margin-bottom: .28in; }}
.cover-mid {{ flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; }}
.cover-customer-name {{ font-size: 20pt; font-weight: 700; color: #3a8fd4; margin-bottom: .06in; }}
.cover-location {{ font-size: 11pt; color: #ccc; margin-bottom: .2in; }}
.cover-divider {{ width: 3.5in; height: 1px; background: rgba(255,255,255,0.25); margin-bottom: .2in; }}
.cover-subtitle {{ font-size: 11.5pt; color: #e0e6f0; margin-bottom: .3in; }}
.cover-tags {{ font-size: 6pt; letter-spacing: .06em; text-transform: uppercase; color: #8aafd4; }}
.cover-tags span {{ margin: 0 .1in; color: #3a8fd4; }}
.cover-bottom {{ flex: 0 0 auto; border-top: 1px solid rgba(255,255,255,0.18); padding-top: .22in; margin-top: .25in; }}
.cover-bottom-cols {{ display: flex; gap: 0; margin-bottom: .2in; }}
.cover-bottom-col {{ flex: 1; padding-right: .3in; border-right: 1px solid rgba(255,255,255,0.2); margin-right: .3in; }}
.cover-bottom-col:last-child {{ border-right: none; margin-right: 0; }}
.cover-col-label {{ font-size: 7pt; letter-spacing: .15em; text-transform: uppercase; color: #3a8fd4; margin-bottom: .06in; }}
.cover-col-name {{ font-size: 11pt; font-weight: 700; color: #fff; margin-bottom: .03in; }}
.cover-col-sub {{ font-size: 8.5pt; color: #aac; }}
.cover-date {{ font-size: 11pt; font-weight: 700; color: #3a8fd4; margin-bottom: .06in; }}
.cover-date-rule {{ width: .3in; height: 2px; background: #3a8fd4; margin-bottom: .1in; }}
.cover-confidential {{ font-size: 7pt; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,0.75); }}
.page {{ page-break-after: always; padding: 0; }}
.page:last-child {{ page-break-after: avoid; }}
.letter-page {{ page-break-after: always; }}
.letter-header {{ display: flex; align-items: center; justify-content: space-between; padding-bottom: .18in; border-bottom: 2px solid #1a3a6b; margin-bottom: .3in; }}
.letter-header img {{ height: 36px; width: auto; }}
.letter-header-right {{ font-size: 8.5pt; color: #555; text-align: right; line-height: 1.5; }}
.letter-section-label {{ font-size: 8pt; letter-spacing: .2em; text-transform: uppercase; color: #1a3a6b; font-weight: 700; margin-bottom: .18in; }}
.letter-body {{ font-size: 10.5pt; line-height: 1.7; }}
.letter-body p {{ margin-bottom: .14in; }}
.letter-body ul {{ margin: 0 0 .14in .25in; padding: 0; }}
.letter-body li {{ margin-bottom: .06in; }}
.letter-fin-table {{ border-collapse: collapse; margin: .1in 0 .18in; font-size: 10.5pt; width: auto; }}
.letter-fin-table td {{ padding: 4px 16px 4px 0; vertical-align: top; }}
.letter-fin-table td.amt {{ font-weight: 600; padding-right: 12px; }}
.letter-fin-table td.note {{ font-size: 9.5pt; color: #555; }}
.letter-fin-table tr.total td {{ font-weight: 700; border-top: 1px solid #999; padding-top: 6px; }}
.section-title {{ font-size: 13pt; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: .06em; margin: .35in 0 .12in; padding-bottom: .06in; border-bottom: 1.5px solid #000; }}
.section-title:first-child {{ margin-top: 0; }}
.subsection-title {{ font-size: 11pt; font-weight: 700; margin: .22in 0 .08in; color: #000; }}
.subsubsection-title {{ font-size: 10.5pt; font-weight: 700; margin: .18in 0 .06in; color: #333; }}
p {{ margin-bottom: .1in; }}
.doc-table {{ width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: .1in 0 .2in; }}
.doc-table th {{ background: #1a3a6b; color: #fff; font-weight: 700; padding: 6px 10px; text-align: left; font-size: 9pt; }}
.doc-table td {{ padding: 6px 10px; border-bottom: 1px solid #ddd; vertical-align: top; }}
.doc-table tr:nth-child(even) td {{ background: #f5f7fa; }}
.doc-table tr:last-child td {{ border-bottom: none; }}
.doc-table td:first-child {{ font-weight: 600; color: #222; }}
.doc-table .val-col {{ font-weight: 400; color: #333; }}
.doc-table td.highlight {{ font-weight: 700; color: #1a3a6b; }}
.doc-table tr.total-row td {{ font-weight: 700; border-top: 2px solid #1a3a6b; border-bottom: none; background: #eef2fa; color: #1a3a6b; }}
ul.body-list {{ margin: .05in 0 .12in .25in; padding: 0; }}
ul.body-list li {{ margin-bottom: .05in; }}
.sig-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: .4in; margin-top: .2in; }}
.sig-block {{ padding-top: .1in; }}
.sig-party {{ font-weight: 700; font-size: 10pt; margin-bottom: .25in; }}
.sig-line {{ font-size: 10pt; margin-bottom: .18in; border-bottom: 1px solid #555; padding-bottom: .02in; }}
.sig-line-label {{ font-size: 8.5pt; color: #555; }}
</style>
</head>
<body>

<!-- ═══ COVER PAGE ═══════════════════════════════════════════════════════════ -->
<div class="cover-page">
  <img class="cover-bg" src="data:image/png;base64,{_COVER_BG_B64}" alt="">
  {('<div style="position:absolute;top:.25in;right:.3in;font-family:monospace;font-size:16px;color:#ffffff;opacity:0.9;z-index:10;">' + doc_no + '</div>') if doc_no else ''}
  <div class="cover-overlay">
    <div class="cover-top">
      <div style="margin-bottom:.3in;">
        <img src="data:image/png;base64,{_XECO_LOGO_WHITE_B64}" alt="Synerex Labs" style="height:42px;width:auto;filter:brightness(0) invert(1);">
      </div>
      <div class="cover-main-title">ECBS<br>Network-Wide<br>Energy<br>Optimization<br>Proposal</div>
      <div class="cover-rule"></div>
    </div>
    <div class="cover-mid">
      <div style="margin-bottom:.18in;">{cust_logo_tag}</div>
      <div class="cover-customer-name">{customer} Facility</div>
      <div class="cover-location">{cover_location}</div>
      <div class="cover-divider"></div>
      <div class="cover-subtitle">Proposed SYNEREX Electrical System Deployment</div>
      <div class="cover-tags">
        Patented ECBS Network Optimization Technology <span>&bull;</span> Current Balancing <span>&bull;</span> Harmonic Mitigation <span>&bull;</span> Power Quality Optimization
      </div>
    </div>
    <div class="cover-bottom">
      <div class="cover-bottom-cols">
        <div class="cover-bottom-col">
          <div class="cover-col-label">Prepared For</div>
          <div class="cover-col-name">{customer}</div>
          <div class="cover-col-sub">{customer_legal}</div>
        </div>
        <div class="cover-bottom-col">
          <div class="cover-col-label">Prepared By</div>
          <div class="cover-col-name">{prepared_by_org}</div>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:.06in;">
        <div class="cover-col-label" style="margin-bottom:.04in;">Service Location</div>
        <div style="font-size:8pt;color:rgba(255,255,255,0.6);">{address}</div>
      </div>
      <div class="cover-date">{date_label}</div>
      <div class="cover-date-rule"></div>
      <div class="cover-confidential">Confidential &amp; Proprietary</div>
      <div style="margin-top:.15in;font-size:6pt;color:rgba(255,255,255,0.75);line-height:1.5;text-align:center;">
        &copy; 2026 SYNEREX Energy Corporation. All rights reserved. ECBS&reg; Network Optimization Technology is proprietary intellectual property protected under applicable laws. Unauthorized use prohibited.
      </div>
    </div>
  </div>
</div>

<!-- ═══ EXECUTIVE SUMMARY LETTER ════════════════════════════════════════════ -->
<div class="letter-page">
  <div class="letter-header">
    <img src="data:image/png;base64,{_XECO_LOGO_COLOR_B64}" alt="Synerex Labs" style="height:52px;width:auto;">
    <div class="letter-header-right" style="display:flex;align-items:center;gap:18px;">
      <div style="text-align:right;">
        <div style="font-weight:700;color:#1a3a6b;">{prepared_by_org}</div>
      </div>
      {cust_logo_body}
    </div>
  </div>
  <div class="letter-section-label">Executive Summary Letter</div>
  <div class="letter-body">
    <p style="color:#555;font-size:10pt;margin-bottom:.2in;">{date_label}</p>
    <p style="margin-bottom:.2in;">
      <strong>{contact_name}</strong><br>
      {"" if not contact_title else f"{contact_title}<br>"}
      {"" if not contact_email else f"{contact_email}<br>"}
      {"" if not contact_phone else f"{contact_phone}<br>"}
      {customer_legal}<br>
      {address_street}<br>
      {address_city}
    </p>
    <p><strong>Re: Energy Optimization Proposal &mdash; {customer_legal} &mdash; {cover_location}</strong></p>
    <p>Dear {contact_first},</p>
    <p>
      Thank you for the opportunity to analyze the electrical infrastructure at your {customer} {facility_type}.
      After reviewing {billing_months} months of {utility_name} utility billing data ({utility_tariff} tariff,
      account {utility_acct_no}) and the site single-line diagrams for all {num_mdps} production switchgear sections,
      we are pleased to present this energy optimization proposal. <strong>This proposal is based on the
      accompanying ECBS Electrical Network-Wide Assessment &amp; Proposed Deployment Scope package, which includes
      utility bill analytics, preliminary single-line review, switchgear-level deployment analysis, and
      proposed equipment placement strategy for {bus_range}.</strong>
    </p>
    <p><strong>Key findings from our analysis:</strong></p>
    <ul>
      <li>Recorded peak demand of <strong>{peak_kw:,.0f} kW</strong> ({pf_reference_month} {utility_name} bill) under the {utility_tariff} demand tariff.</li>
      <li>Average monthly utility expense of approximately <strong>${avg_bill_usd:,.0f} USD/month</strong> ({billing_months}-month reference).</li>
{pf_penalty_bullet}
      <li>{num_mdps} production switchgear sections identified ({bus_range}){(", spanning " + bus_amp_range) if bus_amp_range else ""} across the {sq_ft} {facility_type}.</li>
      {"<li>" + capacitor_bank_bullet + "</li>" if capacitor_bank_bullet else ""}
    </ul>
    <p>
      <strong>Proposed solution:</strong> A full-facility deployment of <strong>{total_units} SYNEREX hardware units</strong>
      ({s600} &times; ECBS-600{(", " + str(apf100) + " &times; APF-100") if apf100 > 0 else ""}) sized to serve all {num_mdps} production switchgear sections, paired with a
      revenue-grade SYNEREX metering kit at the utility supply point. The equipment will correct reactive demand,
      suppress harmonics on VFD-driven circuits, and raise power factor to <strong>98%+</strong>{pf_proposal_suffix}.
    </p>
    <p><strong>Projected financial impact</strong> (conservative estimates):</p>
    <table class="letter-fin-table">
      <tr>
        <td>Est. energy efficiency savings</td>
        <td class="amt">${energy_savings:,.0f} / mo</td>
        <td class="note">({energy_pct}% of avg. monthly bill)</td>
      </tr>
{pf_letter_fin_row}
      <tr class="total">
        <td>Total est. monthly savings</td>
        <td class="amt">${total_savings:,.0f} / mo</td>
        <td></td>
      </tr>
      <tr>
        <td>Est. annual savings</td>
        <td class="amt">${annual_savings:,.0f} / yr</td>
        <td></td>
      </tr>
      <tr>
        <td>Hardware &amp; Monitoring</td>
        <td class="amt">${hw_total:,.0f}</td>
        <td></td>
      </tr>
      <tr>
        <td>Engineering</td>
        <td class="amt">${eng_fee:,.0f}</td>
        <td></td>
      </tr>
      <tr>
        <td>Software &amp; Shipping</td>
        <td class="amt">${sw_yr1 + shipping:,.0f}</td>
        <td></td>
      </tr>
      {_discount_row_1}
      <tr style="font-weight:700;background:#e8f4ed;">
        <td>Total Project Investment</td>
        <td class="amt">${net_total:,.0f}</td>
        <td></td>
      </tr>
    </table>
    <p>
      All pricing is in USD. Equipment ships FOB. {customer}&rsquo;s electricians will handle installation.
      No separate installation labor or standalone engineering consulting fees are included in the above total.
    </p>
    <p style="margin-bottom:.06in;">Sincerely,</p>
    <div style="height:.35in;"></div>
    {"<p style='margin-bottom:.04in;font-weight:700;'>" + preparer_name + "</p>" if preparer_name else ""}
    <p style="margin-bottom:.02in;">{prepared_by_org}</p>
    <p style="color:#555;font-size:9.5pt;">{date_label}</p>
  </div>
</div>

<!-- ═══ TABLE OF CONTENTS ════════════════════════════════════════════════════ -->
<div class="page" style="page-break-after:always;padding-top:.2in;">
  <div style="font-size:13pt;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:.06em;border-bottom:2pt solid #000;padding-bottom:.08in;margin-bottom:.3in;">Table of Contents</div>
  <table style="width:100%;border-collapse:collapse;font-size:11pt;">
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">1.&nbsp;&nbsp;Energy Optimization Proposal</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">5</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">2.&nbsp;&nbsp;Engineering &amp; Analytical Methodology</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">9</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">3.&nbsp;&nbsp;Existing Facility Electrical Overview</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">10</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">4.&nbsp;&nbsp;Proposed Equipment Deployment</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">11</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">5.&nbsp;&nbsp;Measurement, Verification &amp; Monitoring</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">13</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">6.&nbsp;&nbsp;Financial Summary</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">15</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">7.&nbsp;&nbsp;Project Execution Plan</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">17</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">8.&nbsp;&nbsp;Commercial Considerations</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">19</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;border-bottom:1px dotted #ccc;font-weight:700;white-space:nowrap;">9.&nbsp;&nbsp;Conclusion</td>
      <td style="border-bottom:1px dotted #ccc;width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;border-bottom:1px dotted #ccc;font-weight:700;text-align:right;white-space:nowrap;">23</td>
    </tr>
    <tr>
      <td style="padding:.09in 0 .07in 0;font-weight:700;white-space:nowrap;">10.&nbsp;&nbsp;Authorization &amp; Acceptance</td>
      <td style="width:100%;"></td>
      <td style="padding:.09in 0 .07in .12in;font-weight:700;text-align:right;white-space:nowrap;">24</td>
    </tr>
  </table>
</div>

<!-- ═══ BODY ═════════════════════════════════════════════════════════════════ -->

<!-- Project Overview -->
<div class="page">
  <div class="section-title" style="font-size:18pt;text-align:center;letter-spacing:.04em;">Energy Optimization Proposal</div>
  <div class="subsection-title">Project Overview</div>
  <p>{generic_facility_sentence} The proposed ECBS deployment was engineered specifically to
    address these conditions at the {customer_legal} {facility_site_label} through distributed current balancing,
    harmonic mitigation, and network-wide power quality optimization.
  </p>
  <p>
    SYNEREX has developed a proposed electrical system optimization deployment for the {customer_legal}
    facility based on preliminary review of utility billing data, facility operating characteristics,
    and available electrical distribution information from the {sld_source}.
  </p>
  <div class="subsection-title">Scope of Supply</div>
  <p>
    This document constitutes the combined commercial proposal and preliminary project scope for the
    SYNEREX ECBS Network-Wide Energy Optimization System deployment at the {customer_legal} {facility_site_label}.
    It should be read in conjunction with the accompanying ECBS Electrical Network-Wide Assessment &amp;
    Proposed Deployment Scope document, which provides the technical basis for all equipment quantities
    and deployment locations described in this proposal.
  </p>
  {mdp_card_visual}
</div>

<!-- ECBS Technology / Comparison Page -->
<div class="page">
  <div class="subsection-title">What Happens Inside Your Electrical System After ECBS Deployment</div>
  <p>
    The ECBS platform operates continuously across the electrical distribution network — at switchgear,
    panels, and dominant loads — to improve current balance, reduce harmonic distortion, and optimize
    overall power quality performance throughout the facility.
  </p>
  <p>
    By balancing phase current and mitigating harmonic-producing loads at the circuit level, the system
    reduces unnecessary circulating current, lowers thermal stress on transformers and distribution
    equipment, and improves utilization of existing electrical capacity. Unlike centralized correction
    systems, ECBS applies distributed optimization throughout the network, allowing the facility to
    operate more efficiently under real operating conditions.
  </p>
  <p>
    Together, these effects reduce non-productive current flow, improve electrical stability, and support
    more efficient operation of the existing infrastructure without requiring structural changes to the
    facility.
  </p>
  <div style="text-align:center;margin:.18in 0 .1in 0;page-break-inside:avoid;">
    <div style="position:relative;display:inline-block;max-width:100%;">
      <img src="data:image/jpeg;base64,{_ECBS_ARCH_B64}"
           alt="ECBS System Architecture Diagram"
           style="max-width:100%;height:auto;border:1px solid #d0d8d4;border-radius:4px;display:block;">
      <div style="position:absolute;top:10px;left:1.6in;background:rgba(255,200,0,0.88);color:#333;font-size:8pt;font-weight:700;letter-spacing:.1em;padding:3px 10px;border-radius:3px;text-transform:uppercase;">EXAMPLE</div>
    </div>
  </div>

  <div class="subsection-title">Comparison of Centralized vs Distributed Electrical Optimization Architectures</div>
  <div style="text-align:center;margin:.14in 0 .08in 0;page-break-inside:avoid;">
    <div style="position:relative;display:inline-block;max-width:100%;">
      <img src="data:image/png;base64,{_TRAD_VS_ECBS_B64}"
           alt="Traditional Cap Bank vs ECBS Comparison"
           style="max-width:100%;height:auto;border-radius:4px;display:block;">
      <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(255,200,0,0.88);color:#333;font-size:8pt;font-weight:700;letter-spacing:.1em;padding:3px 10px;border-radius:3px;text-transform:uppercase;">EXAMPLE</div>
    </div>
  </div>
  <table class="doc-table">
    <thead><tr><th>Traditional Centralized Correction</th><th>ECBS Distributed Optimization</th></tr></thead>
    <tbody>
      <tr><td>Centralized reactive compensation architecture</td><td class="val-col">Distributed network-wide optimization architecture</td></tr>
      <tr><td>Limited harmonic mitigation capability</td><td class="val-col">Circuit-level harmonic mitigation</td></tr>
      <tr><td>Increased thermal exposure under nonlinear load conditions</td><td class="val-col">Reduced thermal stress across electrical infrastructure</td></tr>
      <tr><td>Maintenance-intensive capacitor-based systems</td><td class="val-col">Reduced maintenance exposure</td></tr>
      <tr><td>Limited visibility into circuit-level behavior</td><td class="val-col">System-wide current balancing and monitoring capability</td></tr>
      <tr><td>Primarily focused on power factor correction</td><td class="val-col">Integrated power quality and demand-side optimization</td></tr>
    </tbody>
  </table>

  <div class="subsection-title">Engineering Basis of Deployment</div>
  <p>
    The proposed SYNEREX system architecture was developed using a structured engineering methodology
    applied to the specific electrical topology and load profile of the {customer_legal} {facility_site_label}
    using {sld_source}. The following engineering inputs were used to determine equipment type, quantity,
    and placement at each distribution location:
  </p>
  <table class="doc-table">
    <thead><tr><th>Engineering Input</th><th>Application</th></tr></thead>
    <tbody>
      <tr><td>Demand-Based Sizing</td><td class="val-col">Equipment quantities derived from recorded peak demand ({peak_kw:,.0f} kW) using ⌈kW ÷ 75⌉ budget methodology — allocated across {num_mdps} production switchgear sections per {sld_source}</td></tr>
      <tr><td>VFD Circuit Identification</td><td class="val-col">VFD-driven loads identified from {sld_source}; assigned active power filter harmonic filtering equipment at circuit level</td></tr>
      <tr><td>Harmonic Load Classification</td><td class="val-col">Non-linear loads classified separately from reactive loads; harmonic exposure drives active filter placement per {sld_source}</td></tr>
      <tr><td>Diversity Assumptions</td><td class="val-col">Operating amperage estimated at 50–65% of rated circuit capacity based on industrial manufacturing load diversity; all values subject to field verification</td></tr>
      <tr><td>Switchgear-Level Deployment Strategy</td><td class="val-col">{"ECBS-600 units placed at non-VFD feeder circuits; " if s600 > 0 else ""}Active filter units placed at VFD / harmonic circuit level per {sld_source}</td></tr>
    </tbody>
  </table>
  <p>
    This engineering-driven methodology distinguishes the SYNEREX deployment from generalized product
    offerings — each unit, at each location, serves a specific electrical function identified through
    the assessment process.
  </p>
</div>

<!-- Engineering Assessment -->
<div class="page">
  <div class="section-title">Engineering Assessment Basis</div>
  <p>
    The proposed deployment architecture was developed through a structured engineering assessment
    process using utility billing data, facility load analysis, and preliminary single-line diagram review.
  </p>
  <div class="subsubsection-title">Engineering Review Components</div>
  <table class="doc-table">
    <thead><tr><th>Engineering Activity</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>Utility Bill Analysis</td><td class="val-col">Review of historical utility demand and tariff conditions</td></tr>
      <tr><td>Power Factor Evaluation</td><td class="val-col">Review of operating PF conditions from {billing_months}-month billing data</td></tr>
      <tr><td>Harmonic Assessment</td><td class="val-col">Evaluation of non-linear load behavior and harmonic exposure from VFD-driven circuits</td></tr>
      <tr><td>Distribution Review</td><td class="val-col">Preliminary review of switchgear bus topology and circuit structure per {sld_source}</td></tr>
      <tr><td>Equipment Modeling</td><td class="val-col">Development of preliminary deployment architecture</td></tr>
      <tr><td>Monitoring Integration</td><td class="val-col">Identification of metering and analytics infrastructure locations</td></tr>
      <tr><td>Site Verification</td><td class="val-col">Final field review prior to deployment confirmation</td></tr>
    </tbody>
  </table>

  <div class="section-title">Existing Facility Electrical Overview</div>
  <table class="doc-table" style="margin-bottom:.15in;">
    <thead><tr><th>Demand Basis</th><th>Value</th><th>Definition</th></tr></thead>
    <tbody>
      <tr><td><strong>Connected Load</strong></td><td class="val-col">{connected_kw:,.0f} kW</td><td>Estimated total installed load capacity ({num_mdps} production switchgear XF feeds per {sld_source})</td></tr>
      <tr><td><strong>Contracted Demand</strong></td><td class="val-col">{contracted_kw:,.0f} kW</td><td>Reference demand registered with {utility_name} under {utility_tariff}</td></tr>
      <tr><td><strong>Recorded Peak Demand</strong></td><td class="val-col">{peak_kw:,.0f} kW</td><td>Peak demand from {billing_months}-month billing data ({pf_reference_month})</td></tr>
    </tbody>
  </table>
  <table class="doc-table">
    <thead><tr><th>Electrical Operating Characteristics</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Utility Tariff</td><td class="val-col">{utility_name} {utility_tariff}</td></tr>
      <tr><td>Connected Load</td><td class="val-col">{connected_kw:,.0f} kW</td></tr>
      <tr><td>Contracted Demand</td><td class="val-col">{contracted_kw:,.0f} kW</td></tr>
      <tr><td>Average Monthly Utility Cost</td><td class="val-col">${avg_bill_usd:,.0f} USD</td></tr>
      <tr><td>{pf_reference_month} Power Factor</td><td class="val-col">{pf_reference}</td></tr>
      <tr><td>Main Distribution Boards</td><td class="val-col">{num_mdps}</td></tr>
      <tr><td>Proposed ECBS-600 Units</td><td class="val-col">{s600}</td></tr>
      {"<tr><td>Proposed APF-100 Power Filter Units</td><td class='val-col'>" + str(apf100) + "</td></tr>" if apf100 > 0 else ""}
    </tbody>
  </table>
</div>

<!-- Proposed Equipment Deployment -->
<div class="page">
  <div class="section-title">Proposed Equipment Deployment</div>
  <p>
    Based on the preliminary engineering review for the {customer_legal} {facility_site_label}, SYNEREX developed
    a proposed deployment architecture spanning all {num_mdps} production switchgear sections ({bus_range}).
  </p>
  {network_wide_table}
  {infra_table}
  {mdp_summary_table}
  {apf100_cobus_note}
</div>

<!-- Measurement, Verification & Monitoring -->
<div class="page" style="page-break-before:always;">
  <div class="section-title">Measurement, Verification &amp; Monitoring</div>
  <p>
    The proposed SYNEREX deployment includes integrated monitoring and analytics infrastructure providing
    ongoing visibility into facility electrical operating conditions following system commissioning.
  </p>
  <div class="subsubsection-title">Monitoring Infrastructure Summary</div>
  <table class="doc-table">
    <thead><tr><th>Monitoring Component</th><th>Function</th></tr></thead>
    <tbody>
      {_mvv_meter_row}
      {_mvv_ct_row}
      <tr><td>Signal Booster</td><td class="val-col">Signal amplification for reliable telemetry at each meter location</td></tr>
      <tr><td>IoT Gateways</td><td class="val-col">Secure communications and data integration</td></tr>
      <tr><td>Edge Energy Datalogger</td><td class="val-col">On-site monitoring and analytics</td></tr>
      <tr><td>Monitoring Platform</td><td class="val-col">Real-time operational visibility</td></tr>
      <tr><td>Historical Data Logging</td><td class="val-col">Long-term operating trend analysis</td></tr>
      <tr><td>Baseline Verification</td><td class="val-col">Initial post-commissioning performance review</td></tr>
    </tbody>
  </table>
  {_customer_owns_note}
  <p>Industry standards referenced: IPMVP, IEEE 1459, IEEE 519, ANSI C12, IEC 61000, {utility_name} {utility_tariff}-based demand evaluation methodologies.</p>
</div>

<!-- Financial Summary -->
<div class="page">
  <div class="section-title">Financial Summary</div>
  {pf_summary_para}
  <div class="subsubsection-title">Bill of Materials &mdash; {cover_location}</div>
  <table class="doc-table" style="width:100%;">
    <thead>
      <tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Extended</th>
      </tr>
    </thead>
    <tbody>
      {"" if not s600   else f'<tr><td>ECBS-600 Power Quality Units</td><td style="text-align:center;">{s600}</td><td style="text-align:right;">${pricing["ecbs600"]:,.0f}</td><td style="text-align:right;">${s600 * pricing["ecbs600"]:,.0f}</td></tr>'}
      {"" if not apf100 else f'<tr><td>APF-100 Active Power Filter Units</td><td style="text-align:center;">{apf100}</td><td style="text-align:right;">${pricing["apf100"]:,.0f}</td><td style="text-align:right;">${apf100 * pricing["apf100"]:,.0f}</td></tr>'}
      {"" if not apf50  else f'<tr><td>APF-50 Active Power Filter Units</td><td style="text-align:center;">{apf50}</td><td style="text-align:right;">${pricing["apf50"]:,.0f}</td><td style="text-align:right;">${apf50 * pricing["apf50"]:,.0f}</td></tr>'}
      {"" if customer_owns_meters else f'<tr><td>Revenue Grade Meter (SYNEREX)</td><td style="text-align:center;">{n_meters}</td><td style="text-align:right;">${pricing["meter"]:,.0f}</td><td style="text-align:right;">${n_meters * pricing["meter"]:,.0f}</td></tr>'}
      <tr><td>LC90 Communication Module</td><td style="text-align:center;">{n_meters}</td><td style="text-align:right;">${pricing["lc90"]:,.0f}</td><td style="text-align:right;">${n_meters * pricing["lc90"]:,.0f}</td></tr>
      <tr><td>Signal Booster</td><td style="text-align:center;">{n_meters}</td><td style="text-align:right;">${pricing["booster"]:,.0f}</td><td style="text-align:right;">${n_meters * pricing["booster"]:,.0f}</td></tr>
      <tr><td>LC60 Communication Modules</td><td style="text-align:center;">{lc60_qty}</td><td style="text-align:right;">${pricing["lc60"]:,.0f}</td><td style="text-align:right;">${lc60_qty * pricing["lc60"]:,.0f}</td></tr>
      {"" if customer_owns_meters else f'<tr><td>Rocoil Current Transformers (3 per meter)</td><td style="text-align:center;">{3 * n_meters}</td><td style="text-align:right;">${pricing["rocoil_ct"]:,.0f}</td><td style="text-align:right;">${3 * n_meters * pricing["rocoil_ct"]:,.0f}</td></tr>'}
      <tr><td>IoT Communications Gateways</td><td style="text-align:center;">{gw}</td><td style="text-align:right;">${pricing["gateway"]:,.0f}</td><td style="text-align:right;">${gw * pricing["gateway"]:,.0f}</td></tr>
      <tr><td>Edge Energy Datalogger</td><td style="text-align:center;">{srv}</td><td style="text-align:right;">${pricing["server"]:,.0f}</td><td style="text-align:right;">${srv * pricing["server"]:,.0f}</td></tr>
      <tr style="font-weight:700;color:#1a7a3a;border-top:2px solid #1a7a3a;">
        <td><strong>Equipment Subtotal</strong></td>
        <td></td><td></td>
        <td style="text-align:right;"><strong>${hw_total:,.0f}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="subsubsection-title">Estimated Financial Impact</div>
  <table class="doc-table">
    <thead><tr><th>Description</th><th>Estimated Value</th></tr></thead>
    <tbody>
      <tr><td>Hardware &amp; Monitoring</td><td class="val-col">${hw_total:,.0f} USD</td></tr>
      <tr><td>Engineering</td><td class="val-col">${eng_fee:,.0f} USD</td></tr>
      <tr><td>Software &amp; Shipping</td><td class="val-col">${sw_yr1 + shipping:,.0f} USD</td></tr>
      {_discount_row_2}
      <tr style="font-weight:700;"><td>Total Project Investment</td><td class="val-col highlight">${net_total:,.0f} USD</td></tr>
      <tr><td>Estimated Monthly Electrical Efficiency Savings</td><td class="val-col">${energy_savings:,.0f} USD</td></tr>
      <tr class="total-row"><td>Total Estimated Monthly Savings</td><td class="val-col">${total_savings:,.0f} USD</td></tr>
      <tr><td>Estimated Annual Savings</td><td class="val-col">${annual_savings:,.0f} USD</td></tr>
      <tr><td>Estimated Simple Payback</td><td class="val-col">~{round(net_total/annual_savings*12) if annual_savings else "N/A"} months</td></tr>
    </tbody>
  </table>
  <div class="subsubsection-title">Utility Billing Reference</div>
  <table class="doc-table">
    <thead><tr><th>Electrical Operating Characteristic</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Utility Provider / Tariff</td><td class="val-col">{utility_name} {utility_tariff}</td></tr>
      <tr><td>Average Monthly Utility Cost</td><td class="val-col">${avg_bill_usd:,.0f} USD</td></tr>
      <tr><td>{pf_reference_month} Power Factor</td><td class="val-col">{pf_reference}</td></tr>
      {pf_utility_row}
      <tr><td>Connected Facility Load</td><td class="val-col">{connected_kw:,.0f} kW</td></tr>
      <tr><td>Contracted Demand</td><td class="val-col">{contracted_kw:,.0f} kW</td></tr>
    </tbody>
  </table>
</div>

<!-- Project Execution Plan -->
<div class="page" style="font-size:9.5pt;">
  <div class="section-title">Project Execution Plan</div>
  <p>Following project approval, SYNEREX will coordinate with {customer} facilities and engineering personnel to finalize deployment locations and installation requirements prior to procurement and commissioning activities.</p>
  <div class="subsubsection-title">Preliminary Project Sequence</div>
  <table class="doc-table">
    <thead><tr><th>Project Phase</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>Engineering Verification</td><td class="val-col">Final review of panel assignments and distribution topology</td></tr>
      <tr><td>Site Coordination</td><td class="val-col">Verification of installation clearances and routing requirements</td></tr>
      <tr><td>Procurement &amp; Logistics</td><td class="val-col">Equipment release, shipping coordination, and delivery scheduling</td></tr>
      <tr><td>Installation</td><td class="val-col">Deployment of X600, APF, and monitoring equipment</td></tr>
      <tr><td>Commissioning</td><td class="val-col">System startup, monitoring integration, and operational verification</td></tr>
      <tr><td>Baseline Validation</td><td class="val-col">Initial performance review and operating condition confirmation</td></tr>
    </tbody>
  </table>
  <div style="margin:.18in 0 .12in 0;">
    <div style="font-size:8.5pt;font-weight:700;color:#1a3a2a;text-transform:uppercase;margin-bottom:10px;">Project Implementation Timeline</div>
    <div style="display:flex;align-items:flex-start;gap:0;">{timeline_items}</div>
  </div>
  <div class="subsubsection-title">Excluded Scope</div>
  <table class="doc-table">
    <thead><tr><th>Excluded Item</th><th>Responsibility</th></tr></thead>
    <tbody>
      <tr><td>Conduit installation and cable routing</td><td class="val-col">{customer} / Designated Electrical Contractor</td></tr>
      <tr><td>Breaker additions or panel modifications</td><td class="val-col">{customer} / Designated Electrical Contractor</td></tr>
      <tr><td>Electrical tie-ins and terminations</td><td class="val-col">{customer} / Designated Electrical Contractor</td></tr>
      <tr><td>Installation labor (mechanical mounting and wiring)</td><td class="val-col">{customer} / Designated Electrical Contractor</td></tr>
      <tr><td>Permits and local authority approvals</td><td class="val-col">{customer}</td></tr>
      <tr><td>Arc flash studies and electrical safety studies</td><td class="val-col">{customer} / Third-Party Engineer</td></tr>
      <tr><td>Utility coordination and interconnection approvals</td><td class="val-col">{customer}</td></tr>
    </tbody>
  </table>
</div>

<!-- Commercial Considerations -->
<div class="page">
  <div class="section-title">Commercial Considerations</div>
  <div class="subsection-title">Commercial Integration Summary</div>
  <p>
    The ECBS Electrical Network-Wide Assessment &amp; Proposed Deployment Scope document reflects
    preliminary hardware deployment sizing and associated base equipment costs derived from utility
    analytics, electrical network review, and engineering evaluation. The base hardware cost identified
    in the assessment represents the primary SYNEREX electrical optimization equipment only, including
    ECBS-600 current balancing units, APF-100 active harmonic filtering equipment, and revenue-grade
    metering hardware.
  </p>
  <p>
    The final proposal investment additionally includes the following infrastructure, services, and
    project support activities necessary for a fully commissioned deployment:
  </p>
  <table class="doc-table">
    <thead><tr><th>Item</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>Revenue-Grade Metering Hardware</td><td class="val-col">Revenue-grade meters and Rocoil CT sets installed at utility supply points</td></tr>
      <tr><td>IoT Communications Gateways</td><td class="val-col">Network-wide telemetry and communications infrastructure</td></tr>
      <tr><td>Edge Energy Datalogger</td><td class="val-col">On-site data aggregation, monitoring, and analytics platform</td></tr>
      <tr><td>Installation Coordination</td><td class="val-col">Pre-installation site verification, deployment planning, and design finalization</td></tr>
      <tr><td>Commissioning Support</td><td class="val-col">System startup, integration testing, and baseline validation</td></tr>
      <tr><td>Logistics &amp; Project Administration</td><td class="val-col">Freight coordination, procurement management, and deployment scheduling</td></tr>
    </tbody>
  </table>
  <p>
    Accordingly, the commercial proposal investment supersedes preliminary hardware-only estimates
    contained within the engineering assessment package. The assessment document should be considered
    the technical deployment scope, while this proposal represents the complete commercial engagement,
    including all equipment, infrastructure, services, coordination, commissioning support, and
    integration activities required for a fully commissioned system.
  </p>
  <div class="subsection-title">Estimates Disclaimer</div>
  <p>
    Projected savings, performance improvements, and operating benefits represent engineering estimates
    derived from historical operating data, utility billing information, site observations, and
    preliminary system analysis. Actual results may vary based on facility loading conditions,
    production schedules, utility tariffs, operating practices, seasonal conditions, and other factors
    beyond SYNEREX&rsquo;s control. Accordingly, projected savings and performance estimates are not
    intended as a guarantee of future utility cost reduction or operational performance.
  </p>
  <div class="subsection-title">Installation Responsibilities</div>
  <p>
    Equipment pricing reflected within this proposal includes proposed SYNEREX hardware deployment,
    monitoring infrastructure, mounting hardware, commissioning support, and associated project
    coordination activities.
  </p>
  <p>
    Electrical tie-in work, breaker modifications, shutdown coordination, and final installation
    activities shall be coordinated between SYNEREX Energy Corporation and facility personnel.
    SYNEREX&rsquo;s installation team will manage equipment installation, inspection, wiring,
    commissioning, and startup activities. Hot-wire connections, breaker additions, panel
    modifications, and any facility-specific electrical work required beyond the proposed SYNEREX scope
    shall remain the responsibility of the facility and/or its designated electrical contractor
    unless otherwise agreed in writing.
  </p>
  <div class="subsection-title">Excluded Scope</div>
  <p>The following items are specifically excluded from SYNEREX&rsquo;s scope of supply and services
  unless otherwise identified within this proposal or authorized through a written change order:</p>
  <ul class="body-list">
    <li>Ethernet cable routing beyond designated SYNEREX equipment locations</li>
    <li>Breaker additions, panel modifications, and facility electrical upgrades</li>
    <li>Shutdown coordination and production outage scheduling</li>
    <li>Facility network infrastructure modifications</li>
    <li>Customer IT support and network administration activities</li>
    <li>Utility service modifications</li>
    <li>Site-specific permitting requirements unless otherwise identified herein</li>
  </ul>
  <div class="subsection-title">Proposal Validity</div>
  <p>
    Unless otherwise agreed in writing, the pricing, equipment quantities, scope of work, and
    associated commercial terms contained within this proposal shall remain valid for thirty (30)
    days from the proposal date.
  </p>
  <div class="subsection-title">Change Orders</div>
  <p>
    The proposed deployment scope, equipment quantities, installation requirements, and project
    pricing have been developed based upon available utility billing data, engineering assumptions,
    site information, and electrical drawings available at the time of proposal preparation.
  </p>
  <p>
    Should field verification, site conditions, customer-requested modifications, operational
    requirements, code requirements, or changes to the facility electrical infrastructure result in
    a material change to the project scope, equipment quantities, installation requirements,
    monitoring infrastructure, commissioning requirements, or project schedule, SYNEREX reserves the
    right to issue a written Change Order reflecting any necessary adjustment to equipment
    quantities, installation requirements, project pricing, project schedule, or commissioning
    activities. No Change Order shall become effective until accepted by both parties.
  </p>
  <div class="subsection-title">Termination and Cancellation</div>
  <p>
    Following acceptance of this proposal and issuance of a purchase order, either party may
    terminate the project upon written notice.
  </p>
  <p>
    In the event of termination by the customer, the customer shall remain responsible for payment
    of all engineering services performed, equipment procured, manufacturing costs incurred,
    software configuration activities completed, project administration costs incurred, and any
    non-cancelable commitments made by SYNEREX prior to the effective date of termination.
  </p>
  <p>
    Any completed work, delivered equipment, or services rendered prior to termination shall be
    invoiced and payable in accordance with the payment terms of this proposal. Any
    custom-manufactured or non-returnable equipment shall remain the responsibility of the customer.
  </p>
  <div class="subsection-title">Limitation of Liability</div>
  <p>
    To the fullest extent permitted by applicable law, SYNEREX Energy Corporation&rsquo;s total
    liability arising from or relating to the products, services, engineering activities,
    installation support, monitoring systems, software, or this proposal shall not exceed the total
    amount paid to SYNEREX under the applicable purchase order or agreement.
  </p>
  <p>
    In no event shall SYNEREX Energy Corporation be liable for any indirect, incidental, consequential,
    special, exemplary, or punitive damages, including but not limited to lost profits, lost revenue,
    loss of production, business interruption, loss of data, loss of goodwill, increased operating
    costs, or other consequential losses.
  </p>
  <div class="subsection-title">Force Majeure</div>
  <p>
    Neither party shall be liable for delays or failure to perform resulting from causes beyond its
    reasonable control, including but not limited to acts of God, natural disasters, severe weather
    events, fire, flood, labor disputes, transportation disruptions, supply chain interruptions,
    material shortages, governmental actions, regulatory changes, pandemics, utility interruptions,
    acts of terrorism, civil disturbances, or other events beyond the reasonable control of the
    affected party.
  </p>
  <p>
    In the event of such delay, project schedules, delivery dates, and performance obligations shall
    be extended for a period reasonably necessary to accommodate the impact of the force majeure
    event.
  </p>
  <div class="subsection-title">Customer Access &amp; Cooperation</div>
  <p>
    Customer shall provide reasonable access to electrical rooms, switchgear, network access points,
    utility metering locations, and authorized personnel necessary to support installation,
    commissioning, verification, and monitoring activities. Delays caused by restricted access,
    unavailable personnel, or customer scheduling constraints may result in adjustments to project
    schedules.
  </p>
  <div class="subsection-title">Intellectual Property Rights</div>
  <p>
    Upon full payment, title to all equipment supplied under this proposal shall transfer to the
    customer. The customer shall have the unrestricted right to own, operate, maintain, repair,
    replace, and utilize the equipment within its facilities.
  </p>
  <p>
    The purchase of equipment does not transfer ownership of any SYNEREX patents, patent rights,
    trademarks, copyrights, trade secrets, software source code, proprietary methodologies,
    engineering processes, deployment architectures, technical designs, or other intellectual
    property associated with the equipment or services provided.
  </p>
  <p>
    The customer may use the equipment and associated documentation for its internal business
    operations but shall not manufacture, reproduce for commercial sale, reverse engineer for
    commercial purposes, license, sublicense, market, or resell SYNEREX intellectual property without
    the prior written consent of SYNEREX Energy Corporation.
  </p>
  <p>
    Nothing contained herein shall restrict the customer&rsquo;s ownership and normal use of the
    equipment purchased under this proposal.
  </p>
  <div class="subsection-title">Shipping Terms</div>
  <p>
    Unless otherwise stated herein, equipment shall be shipped FOB Georgetown, Texas. Freight,
    customs, import duties, taxes, permits, and any site-specific installation requirements are
    excluded unless specifically identified within this proposal.
  </p>
  <div class="subsubsection-title">Commercial Summary</div>
  <table class="doc-table">
    <thead><tr><th>Description</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Hardware &amp; Monitoring</td><td class="val-col">${hw_total:,.0f} USD</td></tr>
      <tr><td>Engineering</td><td class="val-col">${eng_fee:,.0f} USD</td></tr>
      <tr><td>Software &amp; Shipping</td><td class="val-col">${sw_yr1 + shipping:,.0f} USD</td></tr>
      {_discount_row_2}
      <tr style="font-weight:700;"><td>Total Project Investment</td><td class="val-col">${net_total:,.0f} USD</td></tr>
      <tr><td>Shipping Terms</td><td class="val-col">FOB Georgetown, Texas</td></tr>
      <tr><td>Proposal Validity</td><td class="val-col">30 Days</td></tr>
      <tr><td>Estimated Lead Time</td><td class="val-col">Approximately 2&ndash;6 Weeks</td></tr>
      <tr><td>Commissioning Support</td><td class="val-col">Provided by SYNEREX</td></tr>
      <tr><td>Payment Schedule</td><td class="val-col">30% at Execution &bull; 30% on Completion of Install &bull; 40% Net 60 at Final Commissioning</td></tr>
    </tbody>
  </table>
  <div class="subsection-title">Payment Terms</div>
  <p>
    The Contract Price shall be paid by Client to Contractor in accordance with the following schedule:
  </p>
  <p>
    <strong>a.</strong> Thirty percent (30%) of the Contract Price shall be due upon execution of
    this Agreement and issuance of Client Purchase Order and receipt of Contractor&rsquo;s initial
    invoice to support procurement of equipment and project mobilization.
  </p>
  <p>
    <strong>b.</strong> Thirty percent (30%) of the Contract Price shall be due upon Completion of
    Install of the equipment and systems described in the Scope of Work.
  </p>
  <p>
    <strong>c.</strong> The remaining forty percent (40%) of the Contract Price shall be due Net 60
    (within sixty (60) days) from the date of Contractor&rsquo;s final invoice following
    commissioning of the system.
  </p>
  <p>
    All invoices shall be payable within the timeframes stated above. Any amounts not paid when due
    may, at Contractor&rsquo;s option, accrue interest at the rate of one and one-half percent
    (1.5%) per month, or the maximum rate permitted by law, whichever is less.
  </p>
  <p>
    <strong>Completion of Install</strong> shall mean the stage at which the equipment and systems
    are installed and operational for their intended use, notwithstanding minor punch list items
    that do not materially affect functionality or performance, as reasonably determined by
    Contractor in coordination with Client.
  </p>
  <p>
    Contractor reserves the right, upon written notice to Client, to suspend work, withhold delivery
    of equipment, and/or delay commissioning in the event of non-payment until such time as payment
    is brought current. Any delays resulting from such suspension shall not be the responsibility of
    the Contractor.
  </p>
  <div class="subsection-title">Warranty &amp; Insurance</div>
  <p>
    SYNEREX equipment included within the proposed deployment is manufactured and tested prior to
    shipment and is intended for installation within commercial and industrial electrical
    environments operating under standard electrical conditions. SYNEREX will provide a standard
    manufacturer warranty covering defects in materials and workmanship for the equipment supplied
    under the final project agreement.
  </p>
  <p>
    The warranty applies to equipment operating under normal use and installed in accordance with
    applicable electrical codes, manufacturer recommendations, and approved installation practices.
    Warranty coverage does not extend to damage resulting from improper use of controls,
    unauthorized modifications, or improper electrical connection.
  </p>
  <p>
    During the commissioning period, SYNEREX will provide reasonable remote engineering support
    associated with system startup, monitoring integration, and initial operational verification of
    the deployed equipment.
  </p>
  <p>
    SYNEREX maintains commercial general liability insurance coverage appropriate for its operations.
    Certificates of insurance may be provided upon request following project award and execution of
    the final project agreement.
  </p>
  <div class="subsubsection-title">Preliminary Warranty &amp; Coverage Summary</div>
  <table class="doc-table">
    <thead><tr><th>Description</th><th>Coverage</th></tr></thead>
    <tbody>
      <tr><td>Equipment Warranty</td><td class="val-col">Manufacturer defect coverage</td></tr>
      <tr><td>Warranty Scope</td><td class="val-col">Materials and workmanship</td></tr>
      <tr><td>Commissioning Support</td><td class="val-col">Included</td></tr>
      <tr><td>Remote Engineering Support</td><td class="val-col">Included during startup</td></tr>
      <tr><td>Commercial Liability Insurance</td><td class="val-col">Maintained by {prepared_by_org}</td></tr>
      <tr><td>Certificates of Insurance</td><td class="val-col">Available upon request</td></tr>
    </tbody>
  </table>
</div>

<!-- Conclusion -->
<div class="page" style="font-size:9pt;">
  <div class="section-title">Conclusion</div>
  <p>
    This deployment establishes a scalable, network-wide electrical optimization platform across the
    {customer_legal} {facility_site_label} — addressing reactive demand, harmonic distortion, current imbalance, and
    power quality degradation at the distribution level.
  </p>
  <p>
    The proposed system is grounded in {billing_months} month(s) of {utility_name} utility billing data, SLD-level
    switchgear topology review, and circuit-level equipment placement logic. {total_units} SYNEREX units deployed
    across {num_mdps} main distribution boards represent a comprehensive, engineering-driven response to the
    specific load profile and distribution architecture of this facility.
  </p>
  <p>
    Estimated annual savings of <strong>${annual_savings:,.0f} USD</strong> represent a conservative baseline
    derived from electrical efficiency improvement potential. Actual performance may exceed these estimates
    as the system optimizes across the full facility load profile over time.
  </p>
  <p style="margin-top:.3in;">Sincerely,</p>
  <div style="height:.35in;"></div>
  {"<p style='font-weight:700;font-size:11pt;'>" + preparer_name + "</p>" if preparer_name else ""}
  <p>{prepared_by_org}</p>
</div>

<!-- Authorization & Acceptance -->
<div class="page" style="font-size:9pt;">
  <div class="section-title">Authorization &amp; Acceptance</div>
  <p>
    This document constitutes a formal proposal from {prepared_by_org} for the deployment of the
    ECBS Electrical Network-Wide Optimization System at the {customer_legal} {facility_site_label}. By executing this
    acceptance, the undersigned parties confirm mutual agreement to proceed with final engineering
    verification, procurement planning, and project coordination.
  </p>
  <table class="doc-table" style="margin:.2in 0 .25in 0;">
    <thead><tr><th>Proposal Reference</th><th></th></tr></thead>
    <tbody>
      <tr><td>Prepared For</td><td class="val-col">{customer} — {customer_legal}</td></tr>
      <tr><td>Proposed By</td><td class="val-col">{prepared_by_org}</td></tr>
      <tr><td>Proposal Scope</td><td class="val-col">ECBS Network-Wide Energy Optimization Deployment — {customer_legal} {facility_site_label}</td></tr>
      <tr><td>Total Project Investment</td><td class="val-col" style="font-weight:700;">${net_total:,.0f} USD</td></tr>
      <tr><td>Proposal Valid For</td><td class="val-col">60 days from date of issuance</td></tr>
    </tbody>
  </table>
  <div class="subsubsection-title">Proposal Acceptance — Authorized Signatures</div>
  <div class="sig-grid">
    <div class="sig-block">
      <div class="sig-party">{prepared_by_org.upper()}<br>
        <span style="font-size:8pt;font-weight:400;opacity:.75;">{prepared_by_location}</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:.1in;margin-bottom:.04in;">
        <div style="flex:1;border-bottom:1px solid #555;padding-bottom:.02in;">&nbsp;</div>
        <div style="font-size:8.5pt;color:#555;white-space:nowrap;">Date __________</div>
      </div>
      <div class="sig-line-label" style="margin-bottom:.22in;">Authorized Signature</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-line-label">Printed Name / Title</div>
    </div>
    <div class="sig-block">
      <div class="sig-party">{(customer_legal.upper() if customer_legal else customer.upper())}<br>
        <span style="font-size:8pt;font-weight:400;opacity:.75;">{facility_city}</span>
      </div>
      <div style="display:flex;align-items:flex-end;gap:.1in;margin-bottom:.04in;">
        <div style="flex:1;border-bottom:1px solid #555;padding-bottom:.02in;">&nbsp;</div>
        <div style="font-size:8.5pt;color:#555;white-space:nowrap;">Date __________</div>
      </div>
      <div class="sig-line-label" style="margin-bottom:.22in;">Authorized Signature</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-line-label">Printed Name / Title</div>
    </div>
  </div>
</div>

</body>
</html>"""


# Re-export render_pdf from the shared module
from app.services.report_network_assessment import render_pdf  # noqa: F401,E402
