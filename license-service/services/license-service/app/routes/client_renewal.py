"""Client-facing renewal and subscription management endpoints.

Routes
------
GET  /client/renew            — OEM-branded renewal page (Stripe Checkout)
POST /client/api/renew/order  — Create a renewal BillingOrder
GET  /client/subscription     — Subscription management page (status, auto-renew)
POST /client/api/subscription/toggle-auto-renew — Toggle auto_renew on active license
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..models.billing import BillingOrder
from ..models.license import License
from ..models.org import Organization
from ..models.user import User
from ..audit.events import log_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/client", tags=["client"])

_path = lambda p: f"{settings.root_path.rstrip('/')}{p}" if settings.root_path else p


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _is_user_logged_in(request: Request) -> bool:
    try:
        return bool(request.session.get("user_logged_in", False))
    except Exception:
        return False


def _get_active_license(db: Session, org_id: str, program_id: str = "tracking") -> Optional[License]:
    """Return the most recent active (non-revoked, non-suspended) license for org+program."""
    return (
        db.query(License)
        .filter(
            License.org_id == org_id,
            License.program_id == program_id,
            License.revoked == False,
            License.suspended == False,
        )
        .order_by(License.issued_at.desc())
        .first()
    )


def _get_oem_branding(db: Session, client_org: Organization) -> dict:
    """Return display name, color, and logo URL for the OEM that sponsors this client."""
    brand = {
        "brand_name": "Synerex",
        "brand_color": "#1976d2",
        "brand_logo_url": None,
    }
    if not client_org.sponsor_org_id:
        return brand

    oem_org = db.get(Organization, client_org.sponsor_org_id)
    if not oem_org:
        return brand

    brand["brand_name"] = oem_org.org_name or "Synerex"

    # Try to fetch OEM logo from Tracking program
    try:
        import urllib.request as _ur
        # Use Docker-internal service name — Tailscale/public URL not reachable from containers.
        _tracking = "http://tracking-program:8087"
        _url = f"{_tracking}/api/whitelabel/oem-branding-by-org?org_id={oem_org.org_id}"
        with _ur.urlopen(_url, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            logo = data.get("logo_url")
            if logo and logo.startswith("/"):
                base = (settings.website_url or "").rstrip("/")
                logo = f"{base}/tracking{logo}"
            brand["brand_logo_url"] = logo or None
    except Exception:
        pass

    return brand


def _renewal_amount(lic: License, order: Optional[BillingOrder]) -> dict:
    """Calculate the renewal amount based on the current plan / order."""
    plan = (order.plan if order else None) or "basic"
    program_id = lic.program_id if lic else "tracking"
    try:
        from ..services.pricing import calculate_price
        pricing = calculate_price(program_id, plan, term_days=365,
                                  seat_count=int(order.seat_count or 0) if order else 0,
                                  meter_count=int(order.meter_count or 0) if order else 0)
        return {"plan": plan, "amount_total": pricing["amount_total"], "currency": pricing["currency"]}
    except Exception:
        return {"plan": plan, "amount_total": "0.00", "currency": "USD"}


# ---------------------------------------------------------------------------
# GET /client/renew
# ---------------------------------------------------------------------------

@router.get("/renew", response_class=HTMLResponse)
def renewal_page(request: Request, db: Session = Depends(db_session)):
    """OEM-branded client renewal page with Stripe card checkout."""
    if not _is_user_logged_in(request):
        login_url = _path("/auth/login")
        return_url = _path("/client/renew")
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "customer":
        return HTMLResponse("<h2>Renewal is only available for client accounts.</h2>", status_code=403)

    branding = _get_oem_branding(db, org)

    # Clients only ever have Tracking licenses — EM&V is OEM/engineer-only
    lic = _get_active_license(db, org_id, "tracking")

    # Get most recent paid order for context
    paid_order = (
        db.query(BillingOrder)
        .filter(BillingOrder.org_id == org_id, BillingOrder.status == "paid")
        .order_by(BillingOrder.created_at.desc())
        .first()
    )

    renewal_info = _renewal_amount(lic, paid_order) if lic else {"plan": "basic", "amount_total": "0.00", "currency": "USD"}

    stripe_pub = settings.stripe_publishable_key or ""
    path_prefix = (settings.root_path or "").rstrip("/")
    brand_color = branding["brand_color"]
    brand_name = branding["brand_name"]

    logo_html = ""
    if branding["brand_logo_url"]:
        logo_html = f'<img src="{branding["brand_logo_url"]}" alt="{brand_name}" class="brand-logo"/>'

    if lic:
        expires_str = lic.expires_at.strftime("%B %d, %Y") if lic.expires_at else "Unknown"
        today = datetime.utcnow().date()
        is_expired = lic.expires_at.date() < today if lic.expires_at else False
        expiry_label = "Expired" if is_expired else "Expires"
        expiry_class = "tag-danger" if is_expired else "tag-info"
        status_msg = (
            '<span class="tag tag-danger">Expired — renewal will reactivate your access</span>'
            if is_expired else
            '<span class="tag tag-ok">Active</span>'
        )
        program_label = (lic.program_id or "").upper()
        prev_lic_id = lic.license_id
        prev_program = lic.program_id
        auto_renew_checked = "checked" if lic.auto_renew else ""
    else:
        expires_str = "—"
        expiry_label = "Expires"
        expiry_class = "tag-info"
        status_msg = '<span class="tag tag-warn">No active license found</span>'
        program_label = "—"
        prev_lic_id = ""
        prev_program = "tracking"
        auto_renew_checked = ""

    amount_display = f"${renewal_info['amount_total']} {renewal_info['currency']}/year"

    stripe_section = ""
    if stripe_pub and lic:
        stripe_section = f"""
        <div class="section">
          <div class="section-title">Payment</div>
          <div id="card-element"></div>
          <div id="card-errors" class="error-msg" role="alert"></div>
          <div class="auto-renew-row">
            <input type="checkbox" id="auto_renew" {auto_renew_checked}/>
            <label for="auto_renew">Enable auto-renewal — renew automatically each year</label>
          </div>
          <button id="pay-btn" class="btn" onclick="submitRenewal()">
            Renew Now &mdash; {amount_display}
          </button>
          <div id="pay-status" class="pay-status"></div>
        </div>
        <script src="https://js.stripe.com/v3/"></script>
        <script>
          const _stripe = Stripe('{stripe_pub}');
          const _elements = _stripe.elements();
          const _card = _elements.create('card', {{
            style: {{
              base: {{
                fontSize: '16px',
                color: '#2c3e50',
                '::placeholder': {{ color: '#a0aec0' }},
              }}
            }}
          }});
          _card.mount('#card-element');
          _card.on('change', function(e) {{
            document.getElementById('card-errors').textContent = e.error ? e.error.message : '';
          }});

          async function submitRenewal() {{
            const btn = document.getElementById('pay-btn');
            const statusEl = document.getElementById('pay-status');
            btn.disabled = true;
            btn.textContent = 'Processing…';
            statusEl.textContent = '';
            statusEl.className = 'pay-status';

            const autoRenew = document.getElementById('auto_renew').checked;

            // 1 — create renewal order
            let orderId;
            try {{
              const r = await fetch('{path_prefix}/client/api/renew/order', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                credentials: 'same-origin',
                body: JSON.stringify({{
                  license_id: '{prev_lic_id}',
                  program_id: '{prev_program}',
                  auto_renew: autoRenew,
                }}),
              }});
              const d = await r.json();
              if (!r.ok) throw new Error(d.detail || d.error || 'Failed to create order');
              orderId = d.order_id;
            }} catch(e) {{
              statusEl.textContent = 'Error: ' + e.message;
              statusEl.className = 'pay-status error';
              btn.disabled = false;
              btn.innerHTML = 'Renew Now &mdash; {amount_display}';
              return;
            }}

            // 2 — create PaymentIntent
            let clientSecret;
            try {{
              const r = await fetch('{path_prefix}/register/payment/stripe/intent', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                credentials: 'same-origin',
                body: JSON.stringify({{ order_id: orderId }}),
              }});
              const d = await r.json();
              if (!r.ok) throw new Error(d.detail || d.error || 'Failed to create payment');
              clientSecret = d.client_secret;
            }} catch(e) {{
              statusEl.textContent = 'Error: ' + e.message;
              statusEl.className = 'pay-status error';
              btn.disabled = false;
              btn.innerHTML = 'Renew Now &mdash; {amount_display}';
              return;
            }}

            // 3 — confirm card payment
            const result = await _stripe.confirmCardPayment(clientSecret, {{
              payment_method: {{ card: _card }},
            }});

            if (result.error) {{
              statusEl.textContent = result.error.message;
              statusEl.className = 'pay-status error';
              btn.disabled = false;
              btn.innerHTML = 'Renew Now &mdash; {amount_display}';
            }} else if (result.paymentIntent.status === 'succeeded') {{
              statusEl.textContent = '✓ Payment successful! Your license has been renewed. This page will refresh shortly.';
              statusEl.className = 'pay-status ok';
              setTimeout(() => location.href = '{path_prefix}/client/subscription', 3500);
            }}
          }}
        </script>
        """
    elif not stripe_pub:
        stripe_section = """
        <div class="section notice">
          <p>Online payment is not enabled for this account. Please contact your account manager to arrange renewal.</p>
        </div>
        """
    else:
        stripe_section = """
        <div class="section notice">
          <p>No active license was found for your account. Please contact your account manager.</p>
        </div>
        """

    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Renew Subscription — {brand_name}</title>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box}}
    body{{font-family:system-ui,sans-serif;background:#f5f7fa;color:#2c3e50;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}}
    .card{{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);width:100%;max-width:520px;overflow:hidden}}
    .card-header{{background:{brand_color};color:#fff;padding:2rem;text-align:center}}
    .brand-logo{{height:48px;max-width:200px;margin-bottom:.75rem;display:block;margin-inline:auto}}
    .card-header h1{{font-size:1.4rem;font-weight:700;margin-bottom:.25rem}}
    .card-header p{{opacity:.85;font-size:.9rem}}
    .card-body{{padding:2rem}}
    .section{{margin-bottom:1.5rem}}
    .section-title{{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#718096;margin-bottom:.75rem}}
    .info-row{{display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid #edf2f7}}
    .info-row:last-child{{border-bottom:none}}
    .info-label{{color:#718096;font-size:.9rem}}
    .info-value{{font-weight:600;font-size:.9rem}}
    .tag{{display:inline-block;padding:.2rem .65rem;border-radius:999px;font-size:.78rem;font-weight:600}}
    .tag-ok{{background:#c6f6d5;color:#22543d}}
    .tag-danger{{background:#fed7d7;color:#c53030}}
    .tag-warn{{background:#fefcbf;color:#744210}}
    .tag-info{{background:#bee3f8;color:#2a4365}}
    #card-element{{border:1px solid #e2e8f0;border-radius:8px;padding:.85rem;background:#fff;margin-bottom:.75rem}}
    .error-msg{{color:#c53030;font-size:.85rem;min-height:1.2em;margin-bottom:.5rem}}
    .auto-renew-row{{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;font-size:.9rem;color:#4a5568}}
    .auto-renew-row input{{accent-color:{brand_color};width:16px;height:16px;flex-shrink:0}}
    .btn{{display:block;width:100%;padding:.8rem;background:{brand_color};color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity .2s}}
    .btn:hover:not(:disabled){{opacity:.88}}
    .btn:disabled{{opacity:.55;cursor:not-allowed}}
    .pay-status{{margin-top:.85rem;font-size:.9rem;font-weight:500;text-align:center;min-height:1.2em}}
    .pay-status.ok{{color:#22543d}}
    .pay-status.error{{color:#c53030}}
    .notice{{background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:1rem;color:#2a4365;font-size:.9rem}}
    .back-link{{display:block;text-align:center;margin-top:1rem;font-size:.85rem;color:{brand_color};text-decoration:none}}
    .back-link:hover{{text-decoration:underline}}
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      {logo_html}
      <h1>Renew Your Subscription</h1>
      <p>Extend access to your programs for another year</p>
    </div>
    <div class="card-body">
      <div class="section">
        <div class="section-title">Current License</div>
        <div class="info-row"><span class="info-label">Organization</span><span class="info-value">{org.org_name}</span></div>
        <div class="info-row"><span class="info-label">Program</span><span class="info-value">{program_label}</span></div>
        <div class="info-row"><span class="info-label">Plan</span><span class="info-value">{renewal_info['plan'].title()}</span></div>
        <div class="info-row"><span class="info-label">{expiry_label}</span><span class="info-value">{expires_str}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value">{status_msg}</span></div>
      </div>
      <div class="section">
        <div class="section-title">Renewal Summary</div>
        <div class="info-row"><span class="info-label">Renewal Period</span><span class="info-value">12 months</span></div>
        <div class="info-row"><span class="info-label">Amount Due</span><span class="info-value">{amount_display}</span></div>
      </div>
      {stripe_section}
      <a href="{path_prefix}/client/subscription" class="back-link">← Back to My Subscription</a>
    </div>
  </div>
</body>
</html>""")


# ---------------------------------------------------------------------------
# POST /client/api/renew/order
# ---------------------------------------------------------------------------

@router.post("/api/renew/order")
async def create_renewal_order(request: Request, db: Session = Depends(db_session)):
    """Create a BillingOrder for license renewal (called by the renew page JS)."""
    if not _is_user_logged_in(request):
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    org_id = request.session.get("org_id")
    if not org_id:
        return JSONResponse(status_code=401, content={"error": "Session missing org_id"})

    org = db.get(Organization, org_id)
    if not org or org.org_type != "customer":
        return JSONResponse(status_code=403, content={"error": "Only client accounts can renew"})

    try:
        body = await request.json()
    except Exception:
        body = {}

    license_id: str = body.get("license_id") or ""
    program_id: str = body.get("program_id") or "tracking"
    auto_renew: bool = bool(body.get("auto_renew", False))

    # Clients (customer orgs) are only ever licensed for Tracking.
    # EM&V is an OEM/engineer tool — block any attempt to renew an EMV license here.
    if program_id != "tracking":
        return JSONResponse(status_code=403, content={
            "error": "Client accounts are only licensed for the Tracking program."
        })

    # Look up current license
    if license_id:
        lic = db.get(License, license_id)
    else:
        lic = _get_active_license(db, org_id, "tracking")

    if not lic:
        return JSONResponse(status_code=404, content={"error": "No active Tracking license found"})

    if lic.org_id != org_id:
        return JSONResponse(status_code=403, content={"error": "License does not belong to this account"})

    # Additional safety: the license itself must be for Tracking
    if lic.program_id != "tracking":
        return JSONResponse(status_code=403, content={
            "error": "Client accounts are only licensed for the Tracking program."
        })

    # Get current paid order for plan / meter info
    current_order = (
        db.query(BillingOrder)
        .filter(BillingOrder.org_id == org_id,
                BillingOrder.program_id == lic.program_id,
                BillingOrder.status == "paid")
        .order_by(BillingOrder.created_at.desc())
        .first()
    )

    plan = current_order.plan if current_order else "basic"
    seat_count = int(current_order.seat_count or 0) if current_order else 0
    meter_count = int(current_order.meter_count or 0) if current_order else 0

    from ..services.pricing import calculate_price
    try:
        pricing = calculate_price(lic.program_id, plan, term_days=365,
                                  seat_count=seat_count, meter_count=meter_count)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"error": str(exc)})

    # Renewal term starts the day after current expiry (or today if expired)
    today = datetime.utcnow().date()
    if lic.expires_at and lic.expires_at.date() > today:
        term_start = (lic.expires_at.date() + timedelta(days=1)).isoformat()
    else:
        term_start = today.isoformat()
    term_end = (datetime.fromisoformat(term_start) + timedelta(days=365)).date().isoformat()

    order_id = f"ORD-RENEW-{uuid.uuid4().hex[:12].upper()}"
    notes = f"RENEWAL_OF:{lic.license_id}|AUTO_RENEW:{'true' if auto_renew else 'false'}"

    order = BillingOrder(
        order_id=order_id,
        org_id=org_id,
        program_id=lic.program_id,
        plan=plan,
        term_start=term_start,
        term_end=term_end,
        seat_count=seat_count,
        meter_count=meter_count,
        unit_price=pricing["base_price"],
        amount_total=pricing["amount_total"],
        currency=pricing["currency"],
        status="pending",
        due_at=datetime.utcnow() + timedelta(days=7),
        notes=notes,
    )
    db.add(order)
    db.commit()

    log_event(db, actor=org_id, action="billing.renewal.order_created", ref_id=order_id,
              detail={"license_id": lic.license_id, "plan": plan, "amount_total": pricing["amount_total"],
                      "auto_renew": auto_renew})

    return JSONResponse({
        "ok": True,
        "order_id": order_id,
        "plan": plan,
        "amount_total": pricing["amount_total"],
        "currency": pricing["currency"],
        "term_start": term_start,
        "term_end": term_end,
    })


# ---------------------------------------------------------------------------
# GET /client/subscription
# ---------------------------------------------------------------------------

@router.get("/subscription", response_class=HTMLResponse)
def subscription_page(request: Request, db: Session = Depends(db_session)):
    """Client subscription management — view status, toggle auto-renew, link to renew."""
    if not _is_user_logged_in(request):
        login_url = _path("/auth/login")
        return_url = _path("/client/subscription")
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "customer":
        return HTMLResponse("<h2>Subscription management is only available for client accounts.</h2>", status_code=403)

    branding = _get_oem_branding(db, org)
    path_prefix = (settings.root_path or "").rstrip("/")
    brand_color = branding["brand_color"]
    brand_name = branding["brand_name"]

    logo_html = ""
    if branding["brand_logo_url"]:
        logo_html = f'<img src="{branding["brand_logo_url"]}" alt="{brand_name}" class="brand-logo"/>'

    # Gather all active licenses (tracking + emv)
    licenses = (
        db.query(License)
        .filter(License.org_id == org_id, License.revoked == False)
        .order_by(License.issued_at.desc())
        .all()
    )

    # Dedupe by program_id — keep most recent per program
    seen_programs: set = set()
    active_licenses = []
    for l in licenses:
        if l.program_id not in seen_programs:
            seen_programs.add(l.program_id)
            active_licenses.append(l)

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")
    msg_html = ""
    if message:
        cls = "ok" if message_type != "error" else "error"
        msg_html = f'<div class="msg {cls}">{message}</div>'

    today = datetime.utcnow().date()

    license_rows = ""
    for lic in active_licenses:
        if lic.expires_at:
            exp_date = lic.expires_at.date()
            days_left = (exp_date - today).days
            exp_str = lic.expires_at.strftime("%b %d, %Y")
            if lic.suspended:
                status_tag = '<span class="tag tag-danger">Suspended</span>'
            elif days_left < 0:
                status_tag = '<span class="tag tag-danger">Expired</span>'
            elif days_left <= 30:
                status_tag = f'<span class="tag tag-warn">Expiring in {days_left}d</span>'
            else:
                status_tag = '<span class="tag tag-ok">Active</span>'
        else:
            exp_str = "—"
            status_tag = '<span class="tag tag-ok">Active</span>'

        auto_renew_label = "On" if lic.auto_renew else "Off"
        auto_renew_btn_label = "Disable" if lic.auto_renew else "Enable"
        auto_renew_next = "false" if lic.auto_renew else "true"

        paid_order = (
            db.query(BillingOrder)
            .filter(BillingOrder.org_id == org_id,
                    BillingOrder.program_id == lic.program_id,
                    BillingOrder.status == "paid")
            .order_by(BillingOrder.created_at.desc())
            .first()
        )
        plan_label = (paid_order.plan.title() if paid_order else "—")

        license_rows += f"""
        <div class="lic-card">
          <div class="lic-header">
            <span class="lic-program">{lic.program_id.upper()}</span>
            {status_tag}
          </div>
          <div class="info-row"><span class="info-label">Plan</span><span class="info-value">{plan_label}</span></div>
          <div class="info-row"><span class="info-label">License ID</span><span class="info-value mono">{lic.license_id}</span></div>
          <div class="info-row"><span class="info-label">Expires</span><span class="info-value">{exp_str}</span></div>
          <div class="info-row"><span class="info-label">Auto-Renew</span>
            <span class="info-value">
              {auto_renew_label}
              <button class="btn-inline" onclick="toggleAutoRenew('{lic.license_id}', {auto_renew_next}, this)">
                {auto_renew_btn_label}
              </button>
            </span>
          </div>
          <a href="{path_prefix}/client/renew" class="renew-link">Renew Now →</a>
        </div>
        """

    if not license_rows:
        license_rows = '<p class="empty-msg">No active licenses found for your account. Contact your account manager to set up a subscription.</p>'

    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>My Subscription — {brand_name}</title>
  <style>
    *{{margin:0;padding:0;box-sizing:border-box}}
    body{{font-family:system-ui,sans-serif;background:#f5f7fa;color:#2c3e50;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem}}
    .card{{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);width:100%;max-width:600px;overflow:hidden}}
    .card-header{{background:{brand_color};color:#fff;padding:1.75rem 2rem;display:flex;align-items:center;gap:1rem}}
    .brand-logo{{height:40px;max-width:160px;object-fit:contain}}
    .card-header h1{{font-size:1.35rem;font-weight:700}}
    .card-body{{padding:1.75rem 2rem}}
    .msg{{padding:.75rem 1rem;border-radius:8px;margin-bottom:1.25rem;font-size:.9rem;font-weight:500}}
    .msg.ok{{background:#c6f6d5;color:#22543d;border:1px solid #9ae6b4}}
    .msg.error{{background:#fed7d7;color:#c53030;border:1px solid #fc8181}}
    .lic-card{{border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem}}
    .lic-header{{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem}}
    .lic-program{{font-weight:700;font-size:.95rem;color:#2d3748}}
    .info-row{{display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid #edf2f7;gap:1rem}}
    .info-row:last-of-type{{border-bottom:none}}
    .info-label{{color:#718096;font-size:.85rem}}
    .info-value{{font-weight:600;font-size:.85rem;display:flex;align-items:center;gap:.5rem}}
    .mono{{font-family:monospace;font-size:.78rem;color:#4a5568}}
    .tag{{display:inline-block;padding:.18rem .55rem;border-radius:999px;font-size:.75rem;font-weight:600}}
    .tag-ok{{background:#c6f6d5;color:#22543d}}
    .tag-danger{{background:#fed7d7;color:#c53030}}
    .tag-warn{{background:#fefcbf;color:#744210}}
    .btn-inline{{background:transparent;border:1px solid {brand_color};color:{brand_color};border-radius:5px;padding:.15rem .55rem;font-size:.78rem;cursor:pointer;margin-left:.25rem;transition:all .15s}}
    .btn-inline:hover{{background:{brand_color};color:#fff}}
    .btn-inline:disabled{{opacity:.5;cursor:not-allowed}}
    .renew-link{{display:inline-block;margin-top:.9rem;color:{brand_color};font-size:.88rem;font-weight:600;text-decoration:none}}
    .renew-link:hover{{text-decoration:underline}}
    .empty-msg{{color:#718096;font-size:.9rem;padding:1rem 0}}
    .footer-links{{margin-top:1.5rem;display:flex;gap:1.5rem;font-size:.85rem}}
    .footer-links a{{color:{brand_color};text-decoration:none}}
    .footer-links a:hover{{text-decoration:underline}}
    .section-title{{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#718096;margin-bottom:.75rem}}
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      {logo_html}
      <h1>My Subscription</h1>
    </div>
    <div class="card-body">
      {msg_html}
      <div class="section-title" style="margin-bottom:1rem">Active Licenses for {org.org_name}</div>
      {license_rows}
      <div class="footer-links">
        <a href="{path_prefix}/auth/client-portal">← Manage Users</a>
        <a href="{path_prefix}/auth/change-password">Change Password</a>
        <a href="{path_prefix}/auth/logout">Sign Out</a>
      </div>
    </div>
  </div>
  <script>
    async function toggleAutoRenew(licId, newValue, btn) {{
      btn.disabled = true;
      btn.textContent = '…';
      try {{
        const r = await fetch('{path_prefix}/client/api/subscription/toggle-auto-renew', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          credentials: 'same-origin',
          body: JSON.stringify({{ license_id: licId, auto_renew: newValue }}),
        }});
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed');
        location.href = location.pathname + '?message=Auto-renew+updated&message_type=success';
      }} catch(e) {{
        alert('Error: ' + e.message);
        btn.disabled = false;
      }}
    }}
  </script>
</body>
</html>""")


# ---------------------------------------------------------------------------
# POST /client/api/subscription/toggle-auto-renew
# ---------------------------------------------------------------------------

@router.post("/api/subscription/toggle-auto-renew")
async def toggle_auto_renew(request: Request, db: Session = Depends(db_session)):
    """Set auto_renew flag on the specified license (must belong to the logged-in org)."""
    if not _is_user_logged_in(request):
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    org_id = request.session.get("org_id")
    if not org_id:
        return JSONResponse(status_code=401, content={"error": "Session missing org_id"})

    try:
        body = await request.json()
    except Exception:
        body = {}

    license_id: str = body.get("license_id") or ""
    new_value: bool = bool(body.get("auto_renew", False))

    if not license_id:
        return JSONResponse(status_code=400, content={"error": "license_id required"})

    lic = db.get(License, license_id)
    if not lic:
        return JSONResponse(status_code=404, content={"error": "License not found"})
    if lic.org_id != org_id:
        return JSONResponse(status_code=403, content={"error": "License does not belong to this account"})

    lic.auto_renew = new_value
    db.commit()

    log_event(db, actor=org_id, action="license.auto_renew.toggled", ref_id=license_id,
              detail={"auto_renew": new_value})

    return JSONResponse({"ok": True, "license_id": license_id, "auto_renew": new_value})
