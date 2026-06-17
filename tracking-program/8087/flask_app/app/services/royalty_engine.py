"""
Synerex Royalty Engine™ — Phase 13

Spec: ECBS OS v4 §41, §7 "Royalty Management™", Appendix B-25

Purpose
───────
Automatically calculate royalties owed to Synerex Laboratories by each OEM
based on their active licensed meters and contracted royalty rate.

Two calculation modes (per §7.2):
  1. Revenue-based  — royalty_due = revenue × royalty_rate (e.g. 8%)
                      Used when OEM revenue is tracked.
  2. Per-meter fee  — royalty_due = active_meters × meter_fee (e.g. $15/meter/month)
                      Used when revenue is not tracked (most common for initial deployment).

Workflow (per §7.4):
  Licensed Meter → Revenue Generated → Royalty Calculated →
  Royalty Report Generated → Invoice Generated

This engine handles steps 1-3. Invoice generation is a separate manual step
(or future automation).
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from time import time
from typing import Optional

logger = logging.getLogger(__name__)

# Default per-meter monthly fee when revenue is not tracked
DEFAULT_METER_FEE_PER_MONTH = 15.00  # USD per active meter per month

# Default royalty rate when revenue is tracked
DEFAULT_ROYALTY_RATE = 0.08  # 8% of OEM revenue


def _now_ms() -> int:
    return int(time() * 1000)


def _period_label(year: int, month: int) -> str:
    """Return 'YYYY-MM' period string."""
    return f"{year:04d}-{month:02d}"


def _prior_period() -> str:
    """Return the prior calendar month as 'YYYY-MM'."""
    today  = date.today()
    first  = today.replace(day=1)
    last   = first - timedelta(days=1)
    return _period_label(last.year, last.month)


def calculate_royalty_for_oem(
    oem_org_id: str,
    period: Optional[str] = None,
    revenue: Optional[float] = None,
    royalty_rate: Optional[float] = None,
    meter_fee: Optional[float] = None,
    calculated_by: Optional[int] = None,
    upsert: bool = True,
) -> dict:
    """
    Calculate (and optionally upsert) the monthly royalty for one OEM.

    Args:
        oem_org_id    : OEM's org_id string (e.g. "OEM-XCT")
        period        : "YYYY-MM"; defaults to prior calendar month
        revenue       : OEM's total revenue for the period (optional)
        royalty_rate  : Contracted rate (e.g. 0.08); reads from Oem.royalty_rate if omitted
        meter_fee     : Per-meter fee (e.g. 15.0); used if revenue not available
        calculated_by : user.id who triggered the calculation
        upsert        : If True, save/update the Royalty row in the database

    Returns:
        dict with calculation details
    """
    from app.extensions import db
    from app.models.royalty import Royalty, ROYALTY_STATUS_PENDING
    from app.models.meter_license import MeterLicense
    from app.models.oem import Oem

    period = period or _prior_period()

    # ── Count active licensed meters for this OEM ─────────────────────────────
    total_licenses = (MeterLicense.query
                      .filter_by(oem_org_id=oem_org_id)
                      .count())
    active_meters = (MeterLicense.query
                     .filter_by(oem_org_id=oem_org_id, state="active")
                     .count())
    # Grace period meters still count as billable
    grace_meters  = (MeterLicense.query
                     .filter_by(oem_org_id=oem_org_id, state="grace")
                     .count())
    billable_meters = active_meters + grace_meters

    # ── Resolve rates ─────────────────────────────────────────────────────────
    # Try to read royalty_rate from the Oem record if not provided
    oem_record = Oem.query.filter_by(org_id=oem_org_id, is_active=True).first()
    if royalty_rate is None:
        royalty_rate = getattr(oem_record, "royalty_rate", None) if oem_record else None
        royalty_rate = royalty_rate or DEFAULT_ROYALTY_RATE

    if meter_fee is None:
        meter_fee = DEFAULT_METER_FEE_PER_MONTH

    # ── Calculate royalty_due ─────────────────────────────────────────────────
    if revenue is not None and revenue > 0:
        # Mode 1: revenue-based
        royalty_due = round(revenue * royalty_rate, 2)
        mode = "revenue_based"
    else:
        # Mode 2: per-meter fee
        royalty_due = round(billable_meters * meter_fee, 2)
        mode = "per_meter_fee"

    result = {
        "oem_org_id":       oem_org_id,
        "period":           period,
        "licensed_meters":  total_licenses,
        "active_meters":    billable_meters,
        "revenue":          revenue,
        "royalty_rate":     royalty_rate,
        "meter_fee":        meter_fee,
        "royalty_due":      royalty_due,
        "mode":             mode,
        "status":           ROYALTY_STATUS_PENDING,
    }

    if upsert:
        now = _now_ms()
        existing = Royalty.query.filter_by(oem_org_id=oem_org_id, period=period).first()
        if existing:
            # Only update if still pending (don't overwrite paid/invoiced records)
            if existing.status == ROYALTY_STATUS_PENDING:
                existing.licensed_meters = total_licenses
                existing.active_meters   = billable_meters
                existing.revenue         = revenue
                existing.royalty_rate    = royalty_rate
                existing.meter_fee       = meter_fee
                existing.royalty_due     = royalty_due
                existing.calculated_at   = now
                existing.calculated_by   = calculated_by
                existing.updatedAt       = now
            result["id"] = existing.id
            result["action"] = "updated"
        else:
            row = Royalty(
                oem_org_id=oem_org_id,
                period=period,
                licensed_meters=total_licenses,
                active_meters=billable_meters,
                revenue=revenue,
                royalty_rate=royalty_rate,
                meter_fee=meter_fee,
                royalty_due=royalty_due,
                status=ROYALTY_STATUS_PENDING,
                calculated_at=now,
                calculated_by=calculated_by,
                createdAt=now,
                updatedAt=now,
            )
            db.session.add(row)
            db.session.flush()   # get row.id before commit
            result["id"] = row.id
            result["action"] = "created"

        db.session.commit()

    return result


def generate_all_royalties(
    period: Optional[str] = None,
    calculated_by: Optional[int] = None,
) -> list[dict]:
    """
    Generate royalty records for all active OEMs for a given period.
    Called from the API route or rollup scheduler.
    """
    from app.models.oem import Oem

    period  = period or _prior_period()
    oems    = Oem.query.filter_by(is_active=True).all()
    results = []

    for oem in oems:
        try:
            r = calculate_royalty_for_oem(
                oem_org_id=oem.org_id,
                period=period,
                calculated_by=calculated_by,
            )
            results.append(r)
            logger.info("royalty: oem=%s period=%s due=%.2f mode=%s",
                        oem.org_id, period, r["royalty_due"], r["mode"])
        except Exception as exc:
            logger.error("royalty: oem=%s error: %s", oem.org_id, exc)
            results.append({
                "oem_org_id": oem.org_id,
                "period":     period,
                "error":      str(exc),
            })

    return results


def oem_royalty_summary(oem_org_id: str, periods: int = 12) -> dict:
    """
    Aggregate royalty KPIs for an OEM over the last N months.
    Returns monthly totals, quarterly totals, annual total, and outstanding balance.
    """
    from app.models.royalty import Royalty

    rows = (Royalty.query
            .filter_by(oem_org_id=oem_org_id)
            .order_by(Royalty.period.desc())
            .limit(periods)
            .all())

    monthly = [
        {
            "period":          r.period,
            "licensed_meters": r.licensed_meters,
            "active_meters":   r.active_meters,
            "royalty_due":     r.royalty_due,
            "status":          r.status,
        }
        for r in rows
    ]

    total_due         = sum(r.royalty_due for r in rows)
    outstanding_total = sum(r.royalty_due for r in rows if r.status not in ("paid", "waived"))
    paid_total        = sum(r.royalty_due for r in rows if r.status == "paid")

    # Quarterly: sum last 3 months
    quarterly = sum(r.royalty_due for r in rows[:3]) if rows else 0.0
    # Annual: sum last 12 months
    annual = sum(r.royalty_due for r in rows[:12]) if rows else 0.0

    return {
        "oem_org_id":       oem_org_id,
        "monthly":          monthly,
        "quarterly_total":  round(quarterly, 2),
        "annual_total":     round(annual,    2),
        "total_due":        round(total_due, 2),
        "outstanding":      round(outstanding_total, 2),
        "paid":             round(paid_total, 2),
    }


def license_dashboard(oem_org_id: Optional[str] = None) -> dict:
    """
    Aggregate license KPIs for the Meter License Manager™ dashboard.
    If oem_org_id is provided, scopes to that OEM only.
    Spec §40 "Dashboard Metrics":
      Licensed Meters, Active Meters, Available Licenses, Suspended Licenses,
      Revenue, Royalties
    """
    from app.models.meter_license import MeterLicense

    q = MeterLicense.query
    if oem_org_id:
        q = q.filter_by(oem_org_id=oem_org_id)

    total      = q.count()
    active     = q.filter_by(state="active").count()
    grace      = q.filter_by(state="grace").count()
    suspended  = q.filter_by(state="suspended").count()
    expired    = q.filter_by(state="expired").count()
    pending    = q.filter_by(state="pending").count()

    # Latest royalty totals (all-time outstanding)
    outstanding_royalties = 0.0
    try:
        from app.models.royalty import Royalty
        rq = Royalty.query.filter(Royalty.status.notin_(["paid", "waived"]))
        if oem_org_id:
            rq = rq.filter_by(oem_org_id=oem_org_id)
        for row in rq.all():
            outstanding_royalties += row.royalty_due or 0.0
    except Exception:
        pass

    return {
        "licensed_meters":     total,
        "active_meters":       active,
        "grace_period_meters": grace,
        "suspended_meters":    suspended,
        "expired_meters":      expired,
        "pending_meters":      pending,
        "available_licenses":  max(0, total - active - suspended),
        "outstanding_royalties": round(outstanding_royalties, 2),
    }
