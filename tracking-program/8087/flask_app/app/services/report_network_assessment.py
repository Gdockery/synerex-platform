"""
report_network_assessment.py
Generates the ECBS Electrical Network-Wide Assessment PDF.

Usage:
    from app.services.report_network_assessment import build_html, render_pdf
    html = build_html(data_dict)
    pdf_bytes = render_pdf(html)

data_dict keys: see _unpack() for full schema. All site-specific values come
from the caller (Flask route) which assembles them from project/bill/SLD records.
"""
import base64
import math
import pathlib

ASSETS_DIR = pathlib.Path(__file__).parent.parent / "static" / "report_assets"

# Load brand assets once at import time
def _b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()

_XECO_LOGO_B64   = _b64(ASSETS_DIR / "xeco_logo_color.png")
_COVER_HERO_B64  = _b64(ASSETS_DIR / "ecbs_cover_hero.png")


# ── SVG helpers ───────────────────────────────────────────────────────────────

def _svg_circuit(cx, name_lines, amps, n_ecbs, n_apf50, n_apf100):
    parts = []
    parts.append(f'<line x1="{cx}" y1="105" x2="{cx}" y2="140" stroke="#2a4060" stroke-width="2"/>')
    parts.append(f'<rect x="{cx-11}" y="140" width="22" height="12" fill="#0b1c2e" stroke="#2a4060" stroke-width="1.5" rx="2"/>')
    parts.append(f'<line x1="{cx}" y1="152" x2="{cx}" y2="162" stroke="#2a4060" stroke-width="2"/>')

    if n_apf100 > 0:
        for dx in [-5, 0, 5]:
            parts.append(f'<path d="M{cx+dx},163 A4,4 0 0,1 {cx+dx},171" fill="none" stroke="#a855f7" stroke-width="1.4"/>')
        parts.append(f'<line x1="{cx}" y1="162" x2="{cx}" y2="178" stroke="#2a4060" stroke-width="2"/>')
        sq_w = 16
        sx = cx - sq_w // 2
        parts.append(f'<rect x="{sx}" y="178" width="{sq_w}" height="{sq_w}" fill="#0d1a0a" stroke="#a855f7" stroke-width="2" rx="1"/>')
        parts.append(f'<text x="{cx}" y="{178+sq_w//2+4}" text-anchor="middle" font-size="7" fill="#a855f7" font-weight="700">100</text>')
    elif n_apf50 > 0:
        for dx in [-5, 0, 5]:
            parts.append(f'<path d="M{cx+dx},163 A4,4 0 0,1 {cx+dx},171" fill="none" stroke="#a855f7" stroke-width="1.4"/>')
        parts.append(f'<line x1="{cx}" y1="162" x2="{cx}" y2="178" stroke="#2a4060" stroke-width="2"/>')
        d_half = 7
        gap = 3
        total_w = n_apf50 * (d_half*2) + (n_apf50-1) * gap
        start_x = cx - total_w // 2
        for i in range(n_apf50):
            dx2 = start_x + i*(d_half*2 + gap) + d_half
            pts = f"{dx2},{178} {dx2+d_half},{178+d_half} {dx2},{178+d_half*2} {dx2-d_half},{178+d_half}"
            parts.append(f'<polygon points="{pts}" fill="#f3eeff" stroke="#7c3aed" stroke-width="1.5"/>')
        if n_apf50 > 1:
            parts.append(f'<text x="{cx}" y="206" text-anchor="middle" font-size="10" fill="#a855f7" font-weight="700">×{n_apf50}</text>')
    elif n_ecbs > 0:
        tri_w, gap = 14, 2
        total_w = n_ecbs * tri_w + (n_ecbs-1) * gap
        start_x = cx - total_w // 2
        for i in range(n_ecbs):
            tx = start_x + i*(tri_w+gap) + tri_w // 2
            pts = f"{tx},{168} {tx-7},{181} {tx+7},{181}"
            parts.append(f'<polygon points="{pts}" fill="#ddeeff" stroke="#005fa3" stroke-width="1.5"/>')
        if n_ecbs > 1:
            parts.append(f'<text x="{cx}" y="196" text-anchor="middle" font-size="10" fill="#00aaff" font-weight="700">×{n_ecbs}</text>')

    y_top = 85 - 12 * (len(name_lines) - 1)
    for li, line in enumerate(name_lines):
        parts.append(f'<text x="{cx}" y="{y_top + li*12}" text-anchor="middle" font-size="9" fill="#1a2940" font-weight="500">{line}</text>')
    amp_col = "#7c3aed" if (n_apf50 or n_apf100) else "#005fa3"
    parts.append(f'<text x="{cx}" y="100" text-anchor="middle" font-size="9" fill="{amp_col}" font-weight="600">{amps}A*</text>')

    if n_apf100:
        eq_str, eq_col = f"{n_apf100}×APF-100", "#a855f7"
    elif n_apf50:
        eq_str, eq_col = f"{n_apf50}×APF-50", "#a855f7"
    else:
        eq_str, eq_col = f"{n_ecbs}×XPS 600", "#00aaff"
    parts.append(f'<text x="{cx}" y="212" text-anchor="middle" font-size="8" fill="{eq_col}" font-weight="600">{eq_str}</text>')

    return "\n".join(parts)


def _make_bus_svg(bus):
    circuits = bus["circuits"]
    n = len(circuits)
    margin = 90
    svg_w = margin + n * 140 + 40
    cx_list = [margin + i*140 + 50 for i in range(n)]

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} 222" preserveAspectRatio="xMinYMid meet"'
        f' style="background:#f4f7fb;border-radius:5px;font-family:Barlow,sans-serif;display:block;width:100%;max-width:{svg_w}px;height:auto;">',
        f'<rect x="55" y="100" width="{svg_w-70}" height="5" fill="#b0c8e0" rx="2"/>',
        f'<text x="8"  y="14" font-size="8" fill="#005fa3">▲ XPS 600</text>',
        f'<text x="{svg_w//3}" y="14" font-size="8" fill="#a855f7">◆ APF-50</text>',
        f'<text x="{svg_w*2//3}" y="14" font-size="8" fill="#a855f7">■ APF-100</text>',
        f'<text x="30" y="103" text-anchor="middle" font-size="9" fill="#005fa3" font-weight="700">{bus["badge"]}</text>',
        f'<text x="30" y="115" text-anchor="middle" font-size="7" fill="#5a7090">{bus["main_a"]}A</text>',
    ]

    for i, c in enumerate(circuits):
        cx = cx_list[i]
        name = c["name"]
        if len(name) > 20:
            words = name.split()
            line1, line2 = "", ""
            for w in words:
                if len(line1) + len(w) + 1 <= 20:
                    line1 = (line1 + " " + w).strip()
                else:
                    line2 = (line2 + " " + w).strip()
            name_lines = [line1, line2] if line2 else [line1]
        else:
            name_lines = [name]
        lines.append(_svg_circuit(cx, name_lines, c["amps"],
                                  c["n_ecbs"], c["n_apf50"], c["n_apf100"]))

    lines.append("</svg>")
    return "\n".join(lines)


# ── Main build function ────────────────────────────────────────────────────────

def build_html(d: dict) -> str:
    """Build the Network Assessment HTML from a data dict."""

    # Identity / site
    customer          = d.get("customer", "")
    customer_legal    = d.get("customer_legal", customer)
    address           = d.get("address", "")
    contact_name      = d.get("contact_name", "")
    contact_title     = d.get("contact_title", "")
    date_label        = d.get("date_label", "")
    cover_location    = d.get("cover_location", address)
    facility_type     = d.get("facility_type", "")
    sq_ft             = d.get("sq_ft", "")
    sld_source        = d.get("sld_source", "Site SLD")
    bus_amp_range     = d.get("bus_amp_range", "")
    billing_months    = d.get("billing_months_label", "3")

    # Utility / billing
    utility_name      = d.get("utility_name", "")
    utility_short     = d.get("utility_short", utility_name)
    utility_tariff    = d.get("utility_tariff", "")
    utility_account   = d.get("utility_account", "")
    peak_kw           = float(d.get("peak_kw", 0))
    connected_kw      = float(d.get("connected_kw", peak_kw * 1.3))
    contracted_kw     = float(d.get("contracted_kw", peak_kw))
    avg_bill_usd      = float(d.get("avg_bill_usd", 0))
    pf_reference      = float(d.get("pf_reference", 0.95))
    pf_reference_month = d.get("pf_reference_month", "")
    pf_worst          = float(d.get("pf_worst", pf_reference))
    pf_range_label    = d.get("pf_range_label", f"~{pf_reference}")
    has_pf_penalty    = bool(d.get("has_pf_penalty", False))
    pf_penalty_usd    = float(d.get("pf_penalty_usd", 0))
    energy_savings    = float(d.get("energy_savings", 0))
    pf_savings        = float(d.get("pf_savings", 0))
    total_savings     = float(d.get("total_savings", energy_savings))

    # Topology (from GPU SLD extended output)
    buses             = d.get("buses", [])
    num_mdps          = int(d.get("num_mdps", len(buses)))
    capacitor_bank_bullet = d.get("capacitor_bank_bullet", "")
    meter_location_desc   = d.get("meter_location_desc", f"{utility_short} utility supply point ({utility_account})")

    # Pricing
    pricing = d.get("pricing", {
        "ecbs600": 3625, "apf50": 7995, "apf100": 7500,
        "meter": 2500, "lc90": 780, "lc60": 620,
        "rocoil_ct": 150, "gateway": 129, "server": 2475, "ethernet": 10,
    })

    # Logos
    customer_logo_b64 = d.get("customer_logo_b64")

    # ── Derived totals ────────────────────────────────────────────────────────
    total_ecbs   = sum(c["n_ecbs"]   for b in buses for c in b["circuits"])
    total_apf50  = sum(c["n_apf50"]  for b in buses for c in b["circuits"])
    total_apf100 = sum(c["n_apf100"] for b in buses for c in b["circuits"])
    total_hw     = total_ecbs + total_apf50 + total_apf100
    total_fu     = total_ecbs + total_apf50 + 2 * total_apf100

    N_METERS = int(d.get("n_meters", 1))
    LC60_QTY = max(0, total_ecbs - 2 * N_METERS)
    GW       = math.ceil(total_hw / 12) if total_hw else 1

    bus_range       = f"{buses[0]['badge']} through {buses[-1]['badge']}" if buses else ""
    apf100_buses    = [b for b in buses if any(c["n_apf100"] > 0 for c in b["circuits"])]
    apf100_bus_labels = " &amp; ".join(b["badge"] for b in apf100_buses)

    cost_ecbs    = total_ecbs   * pricing["ecbs600"]
    cost_apf50   = total_apf50  * pricing["apf50"]
    cost_apf100  = total_apf100 * pricing["apf100"]
    cost_meters  = N_METERS     * pricing["meter"]
    cost_lc90    = N_METERS     * pricing["lc90"]
    cost_lc60    = LC60_QTY     * pricing["lc60"]
    cost_cts     = (3*N_METERS) * pricing["rocoil_ct"]
    cost_gw      = GW           * pricing["gateway"]
    cost_srv     =                pricing["server"]
    cost_eth     = (GW + 1)     * pricing["ethernet"]
    cost_monitor = cost_meters + cost_lc90 + cost_lc60 + cost_cts + cost_gw + cost_srv + cost_eth
    cost_total   = cost_ecbs + cost_apf50 + cost_apf100 + cost_monitor

    monthly_savings = total_savings
    roi_months      = (cost_total / monthly_savings) if monthly_savings else 0

    # ── Inner helpers (closures over local vars) ───────────────────────────────
    def zone_card(bus):
        n_ecbs   = sum(c["n_ecbs"]   for c in bus["circuits"])
        n_apf50  = sum(c["n_apf50"]  for c in bus["circuits"])
        n_apf100 = sum(c["n_apf100"] for c in bus["circuits"])
        n_hw     = n_ecbs + n_apf50 + n_apf100
        n_fu     = n_ecbs + n_apf50 + 2 * n_apf100

        pills = ""
        if n_apf100: pills += f'<span class="pill apf100">{n_apf100} APF-100</span>\n'
        if n_apf50:  pills += f'<span class="pill apf50">{n_apf50} APF-50</span>\n'
        if n_ecbs:   pills += f'<span class="pill s6">{n_ecbs} ECBS-600</span>\n'
        pills += f'<span class="pill tot">{n_hw} hardware · {n_fu} formula units</span>'

        pct     = bus.get("pct_load", 0)
        pct_col = "#a855f7" if pct >= 20 else "#00e5a0"
        pct_kw  = round(peak_kw * pct / 100)

        varc_warn = ""
        if bus.get("varc"):
            varc_warn = f"""<div style="margin:8px 0;background:#fff8e8;border:1px solid #e8c060;
              border-left:3px solid #b45309;border-radius:4px;padding:8px 12px;font-size:11px;color:#3a2a00;">
              <strong style="color:#b45309">⚠ Capacitor Bank on this bus —</strong> {bus["varc"]}
            </div>"""

        rows = ""
        for c in bus["circuits"]:
            c_fu = c["n_ecbs"] + c["n_apf50"] + 2 * c["n_apf100"]
            if c["n_apf100"]:   eq_col, eq_str = "#a855f7", f'{c["n_apf100"]}×APF-100'
            elif c["n_apf50"]:  eq_col, eq_str = "#a855f7", f'{c["n_apf50"]}×APF-50'
            else:               eq_col, eq_str = "#00aaff", f'{c["n_ecbs"]}×ECBS-600'
            rows += f"""<tr>
              <td>{c["name"]}</td>
              <td class="tc amber">{c["amps"]}A<span class="est">*</span></td>
              <td class="tc">{c["type"]}</td>
              <td class="tc muted" style="font-size:10px;color:#5a7090">{c.get("existing","—")}</td>
              <td class="tc fw" style="color:{eq_col}">{eq_str}</td>
              <td class="tc muted" style="font-size:10px">{c_fu}</td>
              <td class="tn">{c.get("note","")}</td>
            </tr>"""

        return f"""<div class="zone-card avoid-break">
  <div class="zone-hdr">
    <div class="zone-left">
      <span class="zone-badge">{bus["badge"]}</span>
      <span class="zone-title">{bus["title"]}</span>
      <span class="zone-dwg">{bus.get("dwg","")}</span>
    </div>
    <div class="zone-pills">{pills}</div>
  </div>
  <div style="margin:8px 0 4px">
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#5a7090;margin-bottom:3px">
      <span>EST. SHARE OF SITE LOAD</span>
      <span style="color:{pct_col};font-weight:700">{pct}% of site demand</span>
    </div>
    <div style="background:#0a1828;border-radius:3px;height:8px;overflow:hidden">
      <div style="width:{pct}%;height:100%;background:{pct_col};border-radius:3px"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#5a7090;margin-top:2px">
      <span>XF capacity: {bus.get("xf_kva","?")} kVA · Main: {bus["main_a"]:,}A · est. load {pct_kw:,} kW</span>
      <span>Site total: {peak_kw:,.0f} kW</span>
    </div>
  </div>
  {varc_warn}
  <div class="svg-wrap">{_make_bus_svg(bus)}</div>
  <table class="ct">
    <thead><tr>
      <th>Circuit (SLD ref.)</th><th>Amps</th><th>Type</th>
      <th>Existing</th><th>New Equipment</th><th>FU</th><th>Notes</th>
    </tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <p class="tfoot">
    * Amp values from SLD panel ratings. Estimated running current = 60% diversity.
    Type = load classification for APF (VFD/harmonic) vs XPS 600 (reactive) selection.
  </p>
</div>
<div style="margin-top:16px;font-size:11.5px;color:#1a1a1a;line-height:1.9">
  <p style="margin:0 0 7px"><strong>Step 1 — Identify the Switchgear:</strong> This page identifies the MDP, transformer feed, voltage, breaker size, and estimated share of facility demand for this section of the electrical network.</p>
  <p style="margin:0 0 7px"><strong>Step 2 — Review the Load Share:</strong> The load share shows the estimated percentage of facility demand flowing through this switchgear and its potential impact on efficiency improvements.</p>
  <p style="margin:0 0 7px"><strong>Step 3 — Follow the Equipment Placement Diagram:</strong> The placement diagram shows where XECO equipment is recommended across the main bus and downstream circuits.</p>
  <p style="margin:0 0 7px"><strong>Step 4 — Understand the Equipment Type:</strong> XPS 600 units are assigned to reactive/non-VFD loads, while APF systems are assigned to VFD-driven or harmonic-producing loads.</p>
  <p style="margin:0"><strong>Step 5 — Verify During Site Survey:</strong> All amperage values, breaker configurations, and final equipment locations should be verified during the field site survey prior to installation.</p>
</div>"""

    def bom_table():
        rows = ""
        for bus in buses:
            rows += f'<tr class="sub-row"><td colspan="5">{bus["title"]}</td></tr>'
            for c in bus["circuits"]:
                if c["n_apf100"]:   eq_str = f'{c["n_apf100"]}×APF-100'
                elif c["n_apf50"]:  eq_str = f'{c["n_apf50"]}×APF-50'
                else:               eq_str = f'{c["n_ecbs"]}×ECBS-600'
                cc = (c["n_ecbs"]*pricing["ecbs600"] + c["n_apf50"]*pricing["apf50"]
                      + c["n_apf100"]*pricing["apf100"])
                rows += f"""<tr>
                  <td style="padding-left:22px">{c["name"]}</td>
                  <td class="tc">{c["amps"]}A*</td>
                  <td class="tc">{eq_str}</td>
                  <td class="tc" style="font-size:10px;color:#5a7090">{c.get("existing","—")}</td>
                  <td class="tr">${cc:,.0f}</td>
                </tr>"""

        n_cts = 3 * N_METERS
        n_eth = GW + 1
        total_hw_units = total_ecbs + total_apf50 + total_apf100

        return f"""<table class="bom">
  <thead><tr>
    <th>Circuit / Item</th><th>Est. Amps</th><th>New Equipment</th><th>Existing (ref.)</th><th class="tr">Cost</th>
  </tr></thead>
  <tbody>
    {rows}
    <tr class="sub-row"><td colspan="5">Monitoring &amp; Communications Infrastructure</td></tr>
    <tr><td style="padding-left:22px">Revenue Grade Meter (Xeco) — utility supply point</td>
      <td class="tc">—</td><td class="tc">{N_METERS} Meter</td><td class="tc">—</td>
      <td class="tr">${cost_meters:,.0f}</td></tr>
    <tr><td style="padding-left:22px">LC90 Communication Module</td>
      <td class="tc">—</td><td class="tc">{N_METERS} Unit</td><td class="tc">—</td>
      <td class="tr">${cost_lc90:,.0f}</td></tr>
    <tr><td style="padding-left:22px">LC60 Communication Modules</td>
      <td class="tc">—</td><td class="tc">{LC60_QTY} Units</td><td class="tc">—</td>
      <td class="tr">${cost_lc60:,.0f}</td></tr>
    <tr><td style="padding-left:22px">Rocoil Current Transformers (3 per meter)</td>
      <td class="tc">—</td><td class="tc">{n_cts} CTs</td><td class="tc">—</td>
      <td class="tr">${cost_cts:,.0f}</td></tr>
    <tr><td style="padding-left:22px">IoT Communications Gateways</td>
      <td class="tc">—</td><td class="tc">{GW} Gateways</td><td class="tc">—</td>
      <td class="tr">${cost_gw:,.0f}</td></tr>
    <tr><td style="padding-left:22px">Local Monitoring Server</td>
      <td class="tc">—</td><td class="tc">1 Server</td><td class="tc">—</td>
      <td class="tr">${cost_srv:,.0f}</td></tr>
    <tr><td style="padding-left:22px">Ethernet Cables</td>
      <td class="tc">—</td><td class="tc">{n_eth} Runs</td><td class="tc">—</td>
      <td class="tr">${cost_eth:,.0f}</td></tr>
    <tr class="grand-row">
      <td colspan="3">TOTAL — {total_ecbs} ECBS-600 · {total_apf100} APF-100 · {N_METERS} Meter · {GW} Gateways · 1 Server</td>
      <td class="tc">{total_hw_units} hw / {total_fu} FU</td>
      <td class="tr">${cost_total:,.0f}</td>
    </tr>
  </tbody>
</table>
<p style="font-size:9px;color:#6b7e96;margin-top:6px;line-height:1.5;font-style:italic;">
  &#9432;&nbsp; The above Bill of Materials reflects primary electrical optimization hardware and complete monitoring infrastructure.
</p>
<div style="margin-top:.25in;border-top:2px solid var(--blue);padding-top:.15in;">
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:var(--blue);letter-spacing:.03em;margin-bottom:8px;text-transform:uppercase;">Monitoring Architecture Overview</div>
  <table style="width:100%;border-collapse:collapse;font-size:10.5px;color:var(--text);">
    <thead>
      <tr style="background:var(--surface);border-bottom:2px solid var(--dim);">
        <th style="text-align:left;padding:6px 10px;font-weight:700;">Component</th>
        <th style="text-align:center;padding:6px 10px;font-weight:700;">Qty</th>
        <th style="text-align:left;padding:6px 10px;font-weight:700;">Function</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--dim);">
        <td style="padding:6px 10px;">Revenue-Grade Meter (Xeco)</td>
        <td style="text-align:center;padding:6px 10px;font-weight:700;">{N_METERS}</td>
        <td style="padding:6px 10px;">Installed at {meter_location_desc}; measures kW, kVAR, kWh, PF, and harmonic data</td>
      </tr>
      <tr style="border-bottom:1px solid var(--dim);background:var(--surface);">
        <td style="padding:6px 10px;">Rocoil Current Transformers</td>
        <td style="text-align:center;padding:6px 10px;font-weight:700;">{3*N_METERS}</td>
        <td style="padding:6px 10px;">3 CTs per meter location; flexible Rogowski coil design for installation in existing switchgear without service interruption</td>
      </tr>
      <tr style="border-bottom:1px solid var(--dim);">
        <td style="padding:6px 10px;">IoT Communications Gateways</td>
        <td style="text-align:center;padding:6px 10px;font-weight:700;">{GW}</td>
        <td style="padding:6px 10px;">Aggregate meter and unit data; transmit to local server; one gateway per 12-unit zone; wired Ethernet communication</td>
      </tr>
      <tr style="border-bottom:1px solid var(--dim);background:var(--surface);">
        <td style="padding:6px 10px;">Local Monitoring Server</td>
        <td style="text-align:center;padding:6px 10px;font-weight:700;">1</td>
        <td style="padding:6px 10px;">On-site data aggregation and analytics platform; stores real-time and historical performance data; accessible on facility network</td>
      </tr>
    </tbody>
  </table>
</div>"""

    # ── Build image tags ───────────────────────────────────────────────────────
    xeco_img = f'<img src="data:image/png;base64,{_XECO_LOGO_B64}" alt="Xeco" style="height:40px;object-fit:contain">'
    if customer_logo_b64:
        cust_img = f'<img src="data:image/png;base64,{customer_logo_b64}" alt="{customer}" style="height:40px;object-fit:contain">'
    else:
        cust_img = f'<span style="font-weight:700;font-size:14px;">{customer}</span>'

    zone_cards = "\n".join(zone_card(b) for b in buses)
    bom_html   = bom_table()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{customer} — Electrical Network Assessment</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{{
  --bg:#ffffff; --surf:#f4f7fb; --surf2:#eef2f8; --surface:#f4f7fb;
  --blue:#005fa3; --green:#007a55; --amber:#7c3aed;
  --text:#1a2940; --muted:#5a7090; --dim:#d0dae8;
}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;font-size:13px;line-height:1.55}}
.cover{{background:#ffffff;border-bottom:2px solid var(--blue)}}
.logo-bar{{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 44px;border-bottom:1px solid var(--dim)}}
.logo-group{{display:flex;align-items:center;gap:24px}}
.report-tag{{text-align:right}}
.report-tag .tag{{display:inline-block;padding:3px 11px;border-radius:3px;background:#e8f0f8;border:1px solid #b0c8e0;font-size:10px;color:var(--blue);font-family:'Barlow Condensed',sans-serif;letter-spacing:.08em;font-weight:700}}
.report-tag .dt{{font-size:10px;color:var(--muted);margin-top:5px}}
.cover-body{{padding:28px 44px 24px}}
.cover-body h1{{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:800;color:var(--text);line-height:1.1;margin-bottom:4px}}
.cover-body h1 em{{color:var(--blue);font-style:normal}}
.cover-body .sub{{font-size:13px;color:var(--muted);margin-bottom:20px}}
.info-grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}}
.ig{{background:var(--surf);border:1px solid var(--dim);border-radius:6px;padding:11px 13px}}
.ig .lbl{{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;font-family:'Barlow Condensed',sans-serif}}
.ig .val{{font-size:13px;font-weight:600;color:var(--text)}}
.budget-strip{{display:flex;align-items:stretch;background:var(--surf2);border:1px solid var(--dim);border-radius:6px;overflow:hidden;margin-bottom:14px}}
.bs-item{{flex:1;padding:11px 14px;border-right:1px solid var(--dim)}}
.bs-item:last-child{{border-right:none}}
.bs-item .lbl{{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-family:'Barlow Condensed',sans-serif;margin-bottom:2px}}
.bs-item .val{{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;line-height:1}}
.bs-item .sub{{font-size:9px;color:var(--muted);margin-top:2px}}
.method-box{{background:#f0f7f4;border:1px solid #b0d8c8;border-radius:6px;padding:12px 15px;margin-bottom:14px;font-size:11px;color:#1a3a2a;line-height:1.7}}
.method-box strong{{color:#005a40}}
.section{{padding:0 44px 26px}}
.sec-title{{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;color:var(--blue);letter-spacing:.04em;border-bottom:1px solid var(--dim);padding-bottom:7px;margin-bottom:14px}}
.zone-card{{background:var(--surf);border:1px solid var(--dim);border-radius:7px;padding:16px 18px;margin-bottom:18px}}
.zone-hdr{{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px}}
.zone-left{{display:flex;align-items:baseline;flex-wrap:wrap;gap:7px}}
.zone-badge{{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;color:#004a80;background:#ddeeff;border:1px solid #90c0e0;border-radius:3px;padding:1px 7px}}
.zone-title{{font-size:14px;font-weight:600;color:var(--text)}}
.zone-dwg{{font-size:11px;color:var(--muted)}}
.zone-pills{{display:flex;gap:5px;flex-wrap:wrap}}
.pill{{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;font-family:'Barlow Condensed',sans-serif;letter-spacing:.04em}}
.pill.apf100{{background:#ede8fb;color:#5b21b6;border:1px solid #c4b5fd}}
.pill.apf50{{background:#f3eeff;color:#7c3aed;border:1px solid #d8b4fe}}
.pill.s6{{background:#ddeeff;color:#004a80;border:1px solid #90c0e0}}
.pill.tot{{background:#d4f0e4;color:#005a40;border:1px solid #90ccb0}}
.svg-wrap{{overflow-x:auto;margin:8px 0 10px;max-width:100%}}
.ct{{width:100%;border-collapse:collapse;font-size:11px}}
.ct th{{background:#e8f0f8;color:#3a5a80;font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:6px 9px;border-bottom:1px solid var(--dim);font-family:'Barlow Condensed',sans-serif}}
.ct td{{padding:5px 9px;border-bottom:1px solid #e0e8f0;color:var(--text)}}
.ct tr:last-child td{{border-bottom:none}}
.tc{{text-align:center}}.tr{{text-align:right}}.fw{{font-weight:700}}
.tn{{font-size:10px;color:var(--muted)}}.amber{{color:var(--amber)}}.muted{{color:var(--muted)}}
.est{{color:var(--amber);font-size:9px}}
.tfoot{{font-size:10px;color:var(--muted);margin-top:6px;line-height:1.6}}
.bom{{width:100%;border-collapse:collapse;font-size:12px}}
.bom th{{background:#e8f0f8;color:#3a5a80;font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:7px 11px;border-bottom:1px solid var(--dim)}}
.bom td{{padding:6px 11px;border-bottom:1px solid #e8eef5;color:var(--text)}}
.bom .sub-row td{{background:#ddeeff;color:#004a80;font-weight:700;border-top:1px solid #b0c8e0;font-size:13px}}
.bom .grand-row td{{background:#d4f0e4;color:#005a40;font-weight:800;border-top:2px solid #90ccb0;font-size:14px}}
.sum-grid{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-top:13px}}
.sum-card{{background:var(--surf);border:1px solid var(--dim);border-radius:7px;padding:17px 19px}}
.sum-card .lbl{{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-family:'Barlow Condensed',sans-serif;margin-bottom:4px}}
.sum-card .val{{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;color:var(--green);line-height:1}}
.sum-card .sub{{font-size:10px;color:var(--muted);margin-top:3px}}
.rpt-footer{{background:#f4f7fb;border-top:1px solid var(--dim);padding:14px 44px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--muted)}}
.avoid-break{{page-break-inside:avoid}}
.page-break{{page-break-before:always}}
</style>
</head>
<body>

<!-- COVER — full-page image with overlay -->
<div style="position:relative;width:8.5in;height:11in;overflow:hidden;page-break-after:always;font-family:'Barlow Condensed','Barlow',sans-serif;">
  <img src="data:image/png;base64,{_COVER_HERO_B64}" alt=""
       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;">
  <div style="position:absolute;inset:0;background:linear-gradient(105deg,rgba(4,12,30,0.82) 0%,rgba(4,12,30,0.60) 38%,rgba(4,12,30,0.10) 60%,rgba(4,12,30,0.00) 100%);"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:.42in .48in .32in;max-width:5.2in;">
    <div style="display:flex;align-items:center;gap:.15in;font-size:9.5px;color:rgba(255,255,255,0.6);letter-spacing:.09em;text-transform:uppercase;margin-bottom:.12in;">
      <span>{date_label}</span>
      <span style="width:1px;height:11px;background:rgba(255,255,255,0.35);display:inline-block;"></span>
      <span>Confidential</span>
    </div>
    <div style="width:.38in;height:2.5px;background:#3ab4ff;margin-bottom:.28in;"></div>
    <div style="margin-bottom:.15in;">
      <img src="data:image/png;base64,{_XECO_LOGO_B64}" alt="Xeco Energy"
           style="height:44px;width:auto;filter:brightness(0) invert(1);opacity:0.92;">
    </div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:86px;font-weight:800;color:#3ab4ff;line-height:0.92;letter-spacing:-.01em;margin-top:.5in;margin-bottom:.06in;">ECBS<sup style="font-size:32px;vertical-align:super;line-height:0;">&trade;</sup></div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:40px;font-weight:800;color:#ffffff;line-height:1.06;letter-spacing:.01em;text-transform:uppercase;margin-bottom:.22in;">
      Electrical<br>Network-Wide<br>Assessment &amp;<br>Proposed Deployment Scope
    </div>
    <div style="margin-bottom:.18in;">{cust_img}</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:#3ab4ff;letter-spacing:.07em;text-transform:uppercase;margin-bottom:.07in;">
      {customer} &mdash; {customer_legal}
    </div>
    <div style="font-size:11.5px;color:rgba(255,255,255,0.65);font-family:'Barlow',sans-serif;font-weight:300;line-height:1.5;margin-bottom:.18in;">
      {cover_location}<br>Patented ECBS Network Optimization Technology
    </div>
    <div style="width:100%;height:1px;background:rgba(255,255,255,0.18);margin-bottom:.22in;"></div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;">
      <div style="background:rgba(4,12,30,0.55);border:1px solid rgba(58,180,255,0.30);border-radius:5px;padding:10px 11px;">
        <div style="font-size:7px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Facility Peak Demand</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#fff;line-height:1;">{peak_kw:,.0f} kW</div>
      </div>
      <div style="background:rgba(4,12,30,0.55);border:1px solid rgba(58,180,255,0.30);border-radius:5px;padding:10px 11px;">
        <div style="font-size:7px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Avg. Monthly Bill</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#fff;line-height:1;">${avg_bill_usd:,.0f}</div>
      </div>
      <div style="background:rgba(4,12,30,0.55);border:1px solid rgba(58,180,255,0.45);border-radius:5px;padding:10px 11px;">
        <div style="font-size:7px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Est. Monthly Savings</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#3ab4ff;line-height:1;">${monthly_savings:,.0f}</div>
      </div>
      <div style="background:rgba(4,12,30,0.55);border:1px solid rgba(58,180,255,0.45);border-radius:5px;padding:10px 11px;">
        <div style="font-size:7px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">ECBS Deployment</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#3ab4ff;line-height:1;">{total_hw} Units</div>
        <div style="font-size:7px;color:rgba(255,255,255,0.45);margin-top:3px;">{total_ecbs} ECBS-600 · {total_apf100} APF-100 · {total_fu} FU</div>
      </div>
      <div style="background:rgba(4,12,30,0.55);border:1px solid rgba(58,180,255,0.30);border-radius:5px;padding:10px 11px;">
        <div style="font-size:7px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Est. Simple Payback</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;color:#fff;line-height:1;">{roi_months:.0f} Mo</div>
      </div>
    </div>
    <div style="margin-top:.18in;font-size:6px;color:rgba(255,255,255,0.3);line-height:1.6;">
      &copy; 2026 Xeco Energy Corporation. All rights reserved. ECBS&reg; Network Optimization Technology is proprietary intellectual property protected under applicable laws.
    </div>
  </div>
</div>

<!-- PAGE 2 — Summary / Overview -->
<div class="cover" style="page-break-after:always;">
  <div class="logo-bar">
    <div class="logo-group">{xeco_img}</div>
    <div class="report-tag">
      <div class="tag">NETWORK ASSESSMENT</div>
      <div class="dt">Prepared {date_label} &nbsp;&middot;&nbsp; Confidential &nbsp;&middot;&nbsp; XECO Energy Corporation</div>
    </div>
    <div class="logo-group">{cust_img}</div>
  </div>
  <div class="cover-body">
    <h1>{customer}<br><em>Electrical Network Assessment &amp; Proposed Deployment Scope</em></h1>
    <p class="sub">{address} &nbsp;&middot;&nbsp; {utility_account}</p>
    <div class="info-grid">
      <div class="ig"><div class="lbl">Connected Load</div><div class="val">{connected_kw:,.0f} kW</div></div>
      <div class="ig"><div class="lbl">Contracted Demand</div><div class="val">{contracted_kw:,.0f} kW</div></div>
      <div class="ig"><div class="lbl">Recorded Peak Demand</div><div class="val">{peak_kw:,.0f} kW</div></div>
      <div class="ig"><div class="lbl">Avg Monthly Bill</div><div class="val">${avg_bill_usd:,.0f}</div></div>
    </div>
    <div class="budget-strip">
      <div class="bs-item">
        <div class="lbl">Total Unit Budget</div>
        <div class="val" style="color:var(--blue)">{total_hw}</div>
        <div class="sub">&#8968;{peak_kw:,.0f} kW &divide; 75&#8969; = {math.ceil(peak_kw/75) if peak_kw else 0}</div>
      </div>
      <div class="bs-item">
        <div class="lbl">ECBS-600 Units</div>
        <div class="val" style="color:var(--blue)">{total_ecbs}</div>
        <div class="sub">Reactive comp &middot; non-VFD circuits</div>
      </div>
      <div class="bs-item">
        <div class="lbl">APF-100 Units</div>
        <div class="val" style="color:var(--amber)">{total_apf100}</div>
        <div class="sub">{total_apf100} hw &middot; {2*total_apf100} FU &middot; VFD / harmonic circuits</div>
      </div>
      <div class="bs-item">
        <div class="lbl">Est. Monthly Savings</div>
        <div class="val" style="color:var(--green)">${monthly_savings:,.0f}</div>
        <div class="sub">Electrical efficiency &middot; Payback {roi_months:.0f} mo</div>
      </div>
    </div>
    <div class="method-box">
      <strong>Sizing Methodology — SLD-Based ({num_mdps} production switchgears, {sld_source}):</strong>
      Formula unit budget = <strong>{total_fu} FU</strong> = &#8968;{peak_kw:,.0f} kW &divide; 75&#8969; &rarr; {total_hw} hardware pieces.
      <strong>APF-100 co-bus rule: 1 APF-100 = 2 formula units</strong> — deployed on all VFD circuits.
      <strong>APF-100 (&#9632;)</strong> assigned to VFD-driven / harmonic-producing circuits.
      <strong>ECBS-600 (&#9650;)</strong> assigned to reactive/inductive non-VFD circuits.
      {"⚠ " + capacitor_bank_bullet if capacitor_bank_bullet else ""}
      All amp values to be confirmed with clamp meter during site survey before final installation.
    </div>
  </div>
  <p style="margin:14px 44px 0;font-size:10px;color:var(--muted);line-height:1.6;font-style:italic;border-top:1px solid var(--dim);padding-top:10px;">
    Preliminary deployment architecture derived from facility operating demand, switchgear topology review, and network-wide optimization analysis. Final equipment placement and integration subject to field verification prior to deployment.
  </p>
</div>

<!-- ZONE ASSESSMENTS -->
<div class="section">
  <div class="sec-title">Zone-by-Zone Assessment — {num_mdps} Production Switchgears</div>
  <p style="font-size:12px;color:var(--muted);margin-bottom:16px">
    <span style="display:inline-flex;align-items:center;gap:4px;color:#005fa3">&#9650; ECBS-600 (triangle, blue)</span> &nbsp;&middot;&nbsp;
    <span style="display:inline-flex;align-items:center;gap:4px;color:#7c3aed">&#9632; APF-100 (square, purple) = 2 formula units each</span> &nbsp;&middot;&nbsp;
    * = SLD breaker rating &times; 0.50&ndash;0.65 diversity &nbsp;&middot;&nbsp; {sld_source}
  </p>
  {zone_cards}
</div>

<!-- BOM + SUMMARY -->
<div class="section page-break">
  <div class="sec-title">Investment Summary &amp; Bill of Materials</div>
  {bom_html}
  <div class="sum-grid">
    <div class="sum-card">
      <div class="lbl">Hardware Cost</div>
      <div class="val" style="color:var(--blue)">${cost_total:,.0f}</div>
      <div class="sub">{total_ecbs} ECBS-600 &middot; {total_apf100} APF-100 &middot; {N_METERS} Meter &middot; {GW} Gateways &middot; 1 Server</div>
    </div>
    <div class="sum-card">
      <div class="lbl">Total Monthly Savings</div>
      <div class="val">${monthly_savings:,.0f}</div>
      <div class="sub">Est. electrical efficiency savings based on {billing_months}-month bill review</div>
    </div>
    <div class="sum-card">
      <div class="lbl">Est. Simple Payback (Hardware Cost Only)</div>
      <div class="val">{roi_months:.0f} mo</div>
      <div class="sub">~{roi_months/12:.1f} yrs</div>
    </div>
  </div>
</div>

<div class="rpt-footer">
  <span>{customer} ({customer_legal}) &middot; {address}</span>
  <span>XECO Energy Corporation &middot; {date_label} &middot; Prepared for {contact_name}, {contact_title}</span>
</div>

</body>
</html>"""


def render_pdf(html: str) -> bytes:
    """Render HTML to PDF bytes using Playwright headless Chromium."""
    import tempfile, os
    from playwright.sync_api import sync_playwright

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(html)
        tmp_path = f.name

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page()
            page.goto(f"file://{tmp_path}", wait_until="networkidle")
            pdf_bytes = page.pdf(
                format="Letter",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )
            browser.close()
        return pdf_bytes
    finally:
        os.unlink(tmp_path)
