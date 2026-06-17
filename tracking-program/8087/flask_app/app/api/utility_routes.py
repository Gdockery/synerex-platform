"""
Utility Intelligence™ routes — Phase 10: uBillTracker™ + uBillForecast™

Spec: ECBS OS v4 §18, §65–66, Figure A-10, Appendix B-14, C-1

Purpose
───────
Utility bill tracking and forecasting workspace. Users (Finance, Operations)
upload or enter monthly utility bills; the engine forecasts future costs from
trailing data and CBI improvement trends.

Routes
──────
GET    /api/utility/accounts                  List utility accounts for a project
POST   /api/utility/accounts                  Create a utility account
GET    /api/utility/bills                     List bills (paginated + filtered)
GET    /api/utility/bills/<id>                Single bill detail
POST   /api/utility/bills                     Create / enter a bill manually
PUT    /api/utility/bills/<id>                Update a bill
DELETE /api/utility/bills/<id>                Delete a bill (soft)
POST   /api/utility/bills/upload              Upload + parse a bill from JSON payload
GET    /api/utility/forecast                  Forecast next month / quarter / year
POST   /api/utility/forecast/generate         (Re)generate forecast for a range of months
GET    /api/utility/summary                   uBillTracker™ KPI summary

[COMPAT] Does not touch /api/meter, /api/baseline, /api/savings, or /api/capacity.
"""
import time as _time

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.utility_bill import UtilityBill, UtilityAccount, UtilityForecast
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles
from app.helpers.decorators import require_active_license

utility_bp = Blueprint("utility", __name__, url_prefix="/api/utility")

# Finance, Operations, and Admin can create/edit bills
_BILL_ROLES  = {4, 5, 6, 7, 8}   # ops, finance, enterprise admin, oem admin, synerex admin
_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES | _BILL_ROLES


def _now_ms():
    return int(_time.time() * 1000)


def _can_access_project(sess, project_id: int) -> bool:
    from sqlalchemy import text
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    org = getattr(current_user, "org_id", None)
    if not org:
        return False
    row = sess.execute(
        text("SELECT id FROM project WHERE id=:pid AND org_id=:org AND isDeleted=0"),
        {"pid": project_id, "org": org},
    ).fetchone()
    return row is not None


def _bill_dict(b: UtilityBill) -> dict:
    return {
        "id":                    b.id,
        "project_id":            b.project_id,
        "site_id":               b.site_id,
        "account_id":            b.account_id,
        "bill_month":            b.bill_month,
        "bill_date":             b.bill_date,
        "due_date":              b.due_date,
        "energy_kwh":            b.energy_kwh,
        "demand_kw":             b.demand_kw,
        "demand_kva":            b.demand_kva,
        "power_factor":          b.power_factor,
        "energy_cost":           b.energy_cost,
        "demand_cost":           b.demand_cost,
        "taxes":                 b.taxes,
        "fees":                  b.fees,
        "total_cost":            b.total_cost,
        "effective_energy_rate": b.effective_energy_rate,
        "effective_demand_rate": b.effective_demand_rate,
        "is_paid":               b.is_paid,
        "is_estimated":          b.is_estimated,
        "source":                b.source,
        "notes":                 b.notes,
        "uploaded_at":           b.uploaded_at,
        "createdAt":             b.createdAt,
    }


def _acct_dict(a: UtilityAccount) -> dict:
    return {
        "id":              a.id,
        "project_id":      a.project_id,
        "site_id":         a.site_id,
        "account_number":  a.account_number,
        "meter_number":    a.meter_number,
        "utility_name":    a.utility_name,
        "tariff_code":     a.tariff_code,
        "service_address": a.service_address,
        "is_primary":      a.is_primary,
        "notes":           a.notes,
        "createdAt":       a.createdAt,
    }


def _fcast_dict(f: UtilityForecast) -> dict:
    return {
        "id":                   f.id,
        "project_id":           f.project_id,
        "forecast_month":       f.forecast_month,
        "forecast_energy_kwh":  f.forecast_energy_kwh,
        "forecast_demand_kw":   f.forecast_demand_kw,
        "forecast_energy_cost": f.forecast_energy_cost,
        "forecast_demand_cost": f.forecast_demand_cost,
        "forecast_taxes":       f.forecast_taxes,
        "forecast_fees":        f.forecast_fees,
        "forecast_total_cost":  f.forecast_total_cost,
        "budget_total_cost":    f.budget_total_cost,
        "variance_vs_budget":   f.variance_vs_budget,
        "variance_pct":         f.variance_pct,
        "prior_year_total_cost":f.prior_year_total_cost,
        "yoy_variance":         f.yoy_variance,
        "yoy_variance_pct":     f.yoy_variance_pct,
        "drivers_of_change":    f.drivers_of_change,
        "energy_rate":          f.energy_rate,
        "demand_rate":          f.demand_rate,
        "trailing_months_used": f.trailing_months_used,
        "confidence":           f.confidence,
        "calculated_at":        f.calculated_at,
    }


def _compute_effective_rates(b_data: dict) -> tuple:
    """Compute effective $/kWh and $/kW rates from bill data."""
    e_rate = d_rate = None
    ec = b_data.get("energy_cost")
    ek = b_data.get("energy_kwh")
    dc = b_data.get("demand_cost")
    dk = b_data.get("demand_kw")
    try:
        if ec and ek and float(ek) > 0:
            e_rate = round(float(ec) / float(ek), 6)
    except (TypeError, ValueError):
        pass
    try:
        if dc and dk and float(dk) > 0:
            d_rate = round(float(dc) / float(dk), 4)
    except (TypeError, ValueError):
        pass
    return e_rate, d_rate


# ── Accounts ──────────────────────────────────────────────────────────────────

@utility_bp.route("/accounts", methods=["GET"])
@login_required
def list_accounts():
    """GET /api/utility/accounts?project_id="""
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403
    accts = (UtilityAccount.query
             .filter_by(project_id=project_id, isDeleted=False)
             .order_by(UtilityAccount.is_primary.desc(), UtilityAccount.createdAt.asc())
             .all())
    return jsonify({"data": [_acct_dict(a) for a in accts]})


@utility_bp.route("/accounts", methods=["POST"])
@login_required
def create_account():
    """
    POST /api/utility/accounts
    Body: { project_id, account_number, meter_number, utility_name,
            tariff_code, service_address, is_primary, notes, [site_id] }
    """
    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now_ms = _now_ms()
    acct = UtilityAccount(
        project_id     = project_id,
        site_id        = body.get("site_id"),
        account_number = body.get("account_number", "").strip() or None,
        meter_number   = body.get("meter_number", "").strip() or None,
        utility_name   = body.get("utility_name", "").strip() or None,
        tariff_code    = body.get("tariff_code", "").strip() or None,
        service_address= body.get("service_address", "").strip() or None,
        is_primary     = bool(body.get("is_primary", True)),
        notes          = body.get("notes"),
        isDeleted      = False,
        createdAt      = now_ms,
        updatedAt      = now_ms,
    )
    sess.add(acct)
    sess.commit()
    return jsonify({"data": _acct_dict(acct)}), 201


# ── Bills — List ──────────────────────────────────────────────────────────────

@utility_bp.route("/bills", methods=["GET"])
@login_required
def list_bills():
    """
    GET /api/utility/bills
        ?project_id=&[account_id=]&[from_month=YYYY-MM]&[to_month=YYYY-MM]&[limit=24]
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    account_id = request.args.get("account_id", type=int)
    from_month = request.args.get("from_month")
    to_month   = request.args.get("to_month")
    limit      = min(request.args.get("limit", type=int, default=24), 120)

    q = UtilityBill.query.filter_by(project_id=project_id, isDeleted=False)
    if account_id:
        q = q.filter_by(account_id=account_id)
    if from_month:
        q = q.filter(UtilityBill.bill_month >= from_month)
    if to_month:
        q = q.filter(UtilityBill.bill_month <= to_month)

    bills = q.order_by(UtilityBill.bill_month.desc()).limit(limit).all()
    return jsonify({"data": [_bill_dict(b) for b in bills], "count": len(bills)})


@utility_bp.route("/bills/<int:bid>", methods=["GET"])
@login_required
def get_bill(bid: int):
    """GET /api/utility/bills/<id>"""
    sess  = get_session()
    bill  = UtilityBill.query.filter_by(id=bid, isDeleted=False).first()
    if not bill:
        return jsonify({"error": "Not found"}), 404
    if not _can_access_project(sess, bill.project_id):
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"data": _bill_dict(bill)})


# ── Bills — Create ────────────────────────────────────────────────────────────

@utility_bp.route("/bills", methods=["POST"])
@login_required
def create_bill():
    """
    POST /api/utility/bills
    Body: { project_id, bill_month (YYYY-MM), energy_kwh, demand_kw,
            energy_cost, demand_cost, taxes, fees, total_cost,
            [account_id], [bill_date], [due_date], [power_factor],
            [is_paid], [is_estimated], [notes] }

    Creates a single utility bill entry (manual entry path).
    """
    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    bill_month = (body.get("bill_month") or "").strip()

    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    if not bill_month or len(bill_month) != 7:
        return jsonify({"error": "bill_month required (YYYY-MM format)"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    # Prevent duplicate bill for same project+account+month
    account_id = body.get("account_id")
    existing = (UtilityBill.query
                .filter_by(project_id=project_id,
                           account_id=account_id,
                           bill_month=bill_month,
                           isDeleted=False)
                .first())
    if existing:
        return jsonify({"error": f"Bill for {bill_month} already exists (id={existing.id}). Use PUT to update."}), 409

    e_rate, d_rate = _compute_effective_rates(body)
    now_ms = _now_ms()

    bill = UtilityBill(
        project_id             = project_id,
        site_id                = body.get("site_id"),
        account_id             = account_id,
        bill_month             = bill_month,
        bill_date              = body.get("bill_date"),
        due_date               = body.get("due_date"),
        energy_kwh             = body.get("energy_kwh"),
        demand_kw              = body.get("demand_kw"),
        demand_kva             = body.get("demand_kva"),
        power_factor           = body.get("power_factor"),
        energy_cost            = body.get("energy_cost"),
        demand_cost            = body.get("demand_cost"),
        taxes                  = body.get("taxes"),
        fees                   = body.get("fees"),
        total_cost             = body.get("total_cost"),
        effective_energy_rate  = e_rate,
        effective_demand_rate  = d_rate,
        is_paid                = bool(body.get("is_paid", False)),
        is_estimated           = bool(body.get("is_estimated", False)),
        source                 = body.get("source", "manual"),
        notes                  = body.get("notes"),
        uploaded_at            = now_ms,
        uploaded_by            = current_user.id,
        isDeleted              = False,
        createdAt              = now_ms,
        updatedAt              = now_ms,
    )
    sess.add(bill)
    sess.commit()
    return jsonify({"data": _bill_dict(bill)}), 201


# ── Bills — Update ────────────────────────────────────────────────────────────

@utility_bp.route("/bills/<int:bid>", methods=["PUT"])
@login_required
def update_bill(bid: int):
    """PUT /api/utility/bills/<id> — update any mutable field."""
    sess = get_session()
    bill = UtilityBill.query.filter_by(id=bid, isDeleted=False).first()
    if not bill:
        return jsonify({"error": "Not found"}), 404
    if not _can_access_project(sess, bill.project_id):
        return jsonify({"error": "Unauthorized"}), 403

    body = request.get_json(force=True, silent=True) or {}
    UPDATABLE = [
        "bill_date", "due_date", "energy_kwh", "demand_kw", "demand_kva",
        "power_factor", "energy_cost", "demand_cost", "taxes", "fees",
        "total_cost", "is_paid", "is_estimated", "notes", "account_id",
    ]
    for k in UPDATABLE:
        if k in body:
            setattr(bill, k, body[k])

    # Recompute effective rates if cost/usage changed
    e_rate, d_rate = _compute_effective_rates({
        "energy_cost": bill.energy_cost, "energy_kwh": bill.energy_kwh,
        "demand_cost": bill.demand_cost, "demand_kw":  bill.demand_kw,
    })
    bill.effective_energy_rate = e_rate
    bill.effective_demand_rate = d_rate
    bill.updatedAt = _now_ms()
    sess.commit()
    return jsonify({"data": _bill_dict(bill)})


# ── Bills — Delete ────────────────────────────────────────────────────────────

@utility_bp.route("/bills/<int:bid>", methods=["DELETE"])
@login_required
@require_roles(ADMIN_ROLES)
def delete_bill(bid: int):
    """DELETE /api/utility/bills/<id> — soft delete. Admin only."""
    sess = get_session()
    bill = UtilityBill.query.filter_by(id=bid, isDeleted=False).first()
    if not bill:
        return jsonify({"error": "Not found"}), 404
    if not _can_access_project(sess, bill.project_id):
        return jsonify({"error": "Unauthorized"}), 403
    bill.isDeleted = True
    bill.updatedAt = _now_ms()
    sess.commit()
    return jsonify({"data": {"deleted": True, "id": bid}})


# ── Bills — Upload (JSON payload) ─────────────────────────────────────────────

@utility_bp.route("/bills/upload", methods=["POST"])
@login_required
def upload_bill():
    """
    POST /api/utility/bills/upload
    Body: same as POST /api/utility/bills.

    Alias for create_bill — designed for the 'Upload Bill' button flow where
    the client sends a parsed bill payload (e.g. from OCR or file picker).
    Upserts: updates existing bill for the same project+month if it exists.
    """
    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    bill_month = (body.get("bill_month") or "").strip()

    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    if not bill_month or len(bill_month) != 7:
        return jsonify({"error": "bill_month required (YYYY-MM format)"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    account_id = body.get("account_id")
    existing = (UtilityBill.query
                .filter_by(project_id=project_id,
                           account_id=account_id,
                           bill_month=bill_month,
                           isDeleted=False)
                .first())

    e_rate, d_rate = _compute_effective_rates(body)
    now_ms = _now_ms()

    FIELDS = [
        "site_id", "account_id", "bill_date", "due_date",
        "energy_kwh", "demand_kw", "demand_kva", "power_factor",
        "energy_cost", "demand_cost", "taxes", "fees", "total_cost",
        "is_paid", "is_estimated", "notes",
    ]

    if existing:
        for k in FIELDS:
            if k in body:
                setattr(existing, k, body[k])
        existing.effective_energy_rate = e_rate
        existing.effective_demand_rate = d_rate
        existing.source     = body.get("source", "upload")
        existing.uploaded_at= now_ms
        existing.uploaded_by= current_user.id
        existing.updatedAt  = now_ms
        sess.commit()
        return jsonify({"data": _bill_dict(existing), "action": "updated"})
    else:
        bill = UtilityBill(
            project_id            = project_id,
            bill_month            = bill_month,
            source                = body.get("source", "upload"),
            uploaded_at           = now_ms,
            uploaded_by           = current_user.id,
            effective_energy_rate = e_rate,
            effective_demand_rate = d_rate,
            isDeleted             = False,
            createdAt             = now_ms,
            updatedAt             = now_ms,
            **{k: body.get(k) for k in FIELDS if k in body},
        )
        sess.add(bill)
        sess.commit()
        return jsonify({"data": _bill_dict(bill), "action": "created"}), 201


# ── Forecast ──────────────────────────────────────────────────────────────────

@utility_bp.route("/forecast", methods=["GET"])
@login_required
def get_forecast():
    """
    GET /api/utility/forecast
        ?project_id=&[months_ahead=12]&[account_id=]

    Returns stored forecasts for next N months.
    If no forecasts exist, generates them on the fly (not persisted).
    """
    from app.services.utility_forecast_engine import compute_forecast_range

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    months_ahead = min(request.args.get("months_ahead", type=int, default=12), 36)

    # Try stored forecasts first
    from app.services.utility_forecast_engine import _current_yyyy_mm, _month_offset
    current_month = _current_yyyy_mm()
    stored = (UtilityForecast.query
              .filter_by(project_id=project_id, isDeleted=False)
              .filter(UtilityForecast.forecast_month > current_month)
              .order_by(UtilityForecast.forecast_month.asc())
              .limit(months_ahead)
              .all())

    if stored:
        return jsonify({
            "data":   [_fcast_dict(f) for f in stored],
            "source": "stored",
            "count":  len(stored),
        })

    # Generate on-the-fly (not persisted — user must call /forecast/generate to persist)
    try:
        forecasts = compute_forecast_range(project_id, months_ahead=months_ahead)
    except Exception as exc:
        return jsonify({"error": f"Forecast failed: {exc}"}), 500

    return jsonify({
        "data":   forecasts,
        "source": "computed",
        "count":  len(forecasts),
        "note":   "Call POST /api/utility/forecast/generate to persist these forecasts.",
    })


@utility_bp.route("/forecast/generate", methods=["POST"])
@login_required
def generate_forecast():
    """
    POST /api/utility/forecast/generate
    Body: { project_id, [months_ahead=12], [energy_rate], [demand_rate] }

    Generates and persists uBillForecast™ records for the next N months.
    Safe to re-run (upsert on project_id + forecast_month).
    """
    from app.services.utility_forecast_engine import compute_forecast_range

    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    months_ahead = min(int(body.get("months_ahead", 12)), 36)
    energy_rate  = body.get("energy_rate")
    demand_rate  = body.get("demand_rate")
    try:
        if energy_rate:
            energy_rate = float(energy_rate)
        if demand_rate:
            demand_rate = float(demand_rate)
    except (TypeError, ValueError):
        energy_rate = demand_rate = None

    try:
        forecasts = compute_forecast_range(
            project_id, months_ahead=months_ahead,
            energy_rate=energy_rate, demand_rate=demand_rate,
        )
    except Exception as exc:
        return jsonify({"error": f"Forecast failed: {exc}"}), 500

    now_ms   = _now_ms()
    upserted = 0
    for f in forecasts:
        existing = (UtilityForecast.query
                    .filter_by(project_id=project_id,
                               forecast_month=f["forecast_month"],
                               isDeleted=False)
                    .first())
        if existing:
            for k, v in f.items():
                if hasattr(existing, k) and k not in ("project_id", "forecast_month"):
                    setattr(existing, k, v)
            existing.updatedAt = now_ms
        else:
            sess.add(UtilityForecast(
                isDeleted=False,
                createdAt=now_ms,
                updatedAt=now_ms,
                **{k: v for k, v in f.items() if hasattr(UtilityForecast, k)},
            ))
        upserted += 1

    sess.commit()
    return jsonify({
        "meta":     {"computed": len(forecasts), "upserted": upserted},
        "response": {"status": "ok"},
    })


# ── Summary — uBillTracker™ KPI cards ─────────────────────────────────────────

@utility_bp.route("/summary", methods=["GET"])
@login_required
@require_active_license
def get_summary():
    """
    GET /api/utility/summary?project_id=&[months=12]

    Returns uBillTracker™ summary KPIs:
      total_cost_period, total_kwh_period, avg_demand_kw,
      avg_energy_rate, avg_demand_rate, vs_prior_period_pct,
      months_included, recent_bills
    """
    from app.services.utility_forecast_engine import tracker_summary

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    months  = min(request.args.get("months", type=int, default=12), 36)
    summary = tracker_summary(project_id, months=months)
    return jsonify({"data": summary})
