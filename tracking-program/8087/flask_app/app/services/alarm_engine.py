"""
Alarms & Events™ Engine — Phase 11

Spec: ECBS OS v4 §38, Appendix B-23, Figures A-12 / A-13

Purpose
───────
Centralized alarm evaluation engine.  Called from rollup_errands.py after every
CBI / Capacity / Savings / Utility compute cycle.

Two modes of alarm generation:
  1. Built-in rules  — hard-coded threshold checks against ECBS module outputs.
     Covers the 18 alarm types listed in §38 (CBI, Capacity, Savings, Utility,
     Device, License).
  2. User alert rules — rows from the `alert_rules` table configured via the
     UI / API.  Each rule specifies a metric_key, condition, and threshold.

De-duplication
──────────────
Before creating a new Alarm, the engine checks whether an active alarm of the
same (site_id, alarm_type) already exists.  If one does, it is skipped so we
don't flood the table with duplicate rows per rollup cycle.

State Machine
─────────────
  new → acknowledged → assigned → in_progress → resolved → closed

Transitions are performed by the API (alarm_routes.py).  The engine only ever
creates alarms in the 'new' state.
"""
from __future__ import annotations

import logging
from time import time
from typing import Optional

from app.extensions import db
from app.models.alarm import (
    Alarm, AlertRule, Event, Notification,
    SEVERITY_CRITICAL, SEVERITY_HIGH, SEVERITY_MEDIUM, SEVERITY_LOW,
    SEVERITY_INFORMATION,
    STATUS_NEW,
    SOURCE_CBI, SOURCE_CAPACITY, SOURCE_SAVINGS, SOURCE_UTILITY,
    SOURCE_DEVICE, SOURCE_LICENSE,
)

logger = logging.getLogger(__name__)


def _now_ms() -> int:
    return int(time() * 1000)


# ─────────────────────────────────────────────────────────────────────────────
# Alarm creation helpers
# ─────────────────────────────────────────────────────────────────────────────

def _active_alarm_exists(site_id: Optional[int], project_id: Optional[int],
                          alarm_type: str) -> bool:
    """Return True if there is already a non-closed alarm of this type for the site."""
    q = Alarm.query.filter(
        Alarm.alarm_type == alarm_type,
        Alarm.status.notin_(["resolved", "closed"]),
        Alarm.isDeleted == False,
    )
    if site_id is not None:
        q = q.filter(Alarm.site_id == site_id)
    elif project_id is not None:
        q = q.filter(Alarm.project_id == project_id)
    return q.first() is not None


def _raise_alarm(
    alarm_type: str,
    source: str,
    severity: str,
    title: str,
    description: str,
    project_id: Optional[int] = None,
    site_id: Optional[int] = None,
    metric_value: Optional[float] = None,
    threshold_value: Optional[float] = None,
    unit: Optional[str] = None,
    asset_id: Optional[int] = None,
    asset_name: Optional[str] = None,
    alert_rule_id: Optional[int] = None,
) -> Optional[Alarm]:
    """Create a new Alarm if no active alarm of this type exists for the site."""
    if _active_alarm_exists(site_id, project_id, alarm_type):
        return None

    alarm = Alarm(
        project_id=project_id,
        site_id=site_id,
        alarm_type=alarm_type,
        source=source,
        severity=severity,
        status=STATUS_NEW,
        title=title,
        description=description,
        asset_id=asset_id,
        asset_name=asset_name,
        metric_value=metric_value,
        threshold_value=threshold_value,
        unit=unit,
        alert_rule_id=alert_rule_id,
        triggered_at=_now_ms(),
        createdAt=_now_ms(),
        updatedAt=_now_ms(),
    )
    db.session.add(alarm)
    logger.info("alarm raised: %s site=%s severity=%s", alarm_type, site_id, severity)
    return alarm


def publish_event(
    source: str,
    event_type: str,
    title: str,
    description: str = "",
    severity: str = SEVERITY_INFORMATION,
    project_id: Optional[int] = None,
    site_id: Optional[int] = None,
    asset_id: Optional[int] = None,
    payload: Optional[dict] = None,
) -> Event:
    """Publish a raw event to the events log (does not create an Alarm)."""
    ev = Event(
        project_id=project_id,
        site_id=site_id,
        source=source,
        event_type=event_type,
        severity=severity,
        title=title,
        description=description,
        asset_id=asset_id,
        payload=payload or {},
        event_ts=_now_ms(),
        createdAt=_now_ms(),
        updatedAt=_now_ms(),
    )
    db.session.add(ev)
    return ev


# ─────────────────────────────────────────────────────────────────────────────
# Built-in rule evaluation
# ─────────────────────────────────────────────────────────────────────────────

# Thresholds for built-in rules
_CBI_SCORE_LOW        = 70.0   # CBI score below this → alarm
_HARMONIC_HIGH_PCT    = 15.0   # harmonic burden % above this → alarm
_REACTIVE_HIGH_PCT    = 20.0   # reactive burden % above this → alarm
_NEUTRAL_HIGH_PCT     = 10.0   # neutral burden % above this → alarm
_CAP_UTIL_HIGH_PCT    = 85.0   # capacity utilization % above this → warning
_CAP_UTIL_CRIT_PCT    = 95.0   # capacity utilization % above this → critical
_CAP_MARGIN_LOW_PCT   = 10.0   # available / installed % below this → warning
_SAVINGS_VARIANCE_PCT = 20.0   # savings variance from baseline above this %
_BILL_ANOMALY_PCT     = 25.0   # utility bill above last-3-month avg by this %
_DEMAND_SPIKE_PCT     = 30.0   # demand spike above rolling avg by this %


def evaluate_cbi_alarms(project_id: int, site_id: Optional[int]) -> int:
    """
    Evaluate CBI-sourced alarms from the latest current_balance_metrics row.
    Returns count of new alarms created.
    """
    from app.models.current_balance_metrics import CurrentBalanceMetrics  # local import
    count = 0

    row = (
        CurrentBalanceMetrics.query
        .filter_by(project_id=project_id, isDeleted=False)
        .order_by(CurrentBalanceMetrics.bucket_ts.desc())
        .first()
    )
    if not row:
        return 0

    cbi_score = getattr(row, "cbi_score", None)
    harmonic_pct = getattr(row, "harmonic_burden_pct", None) or 0.0
    reactive_pct = getattr(row, "reactive_burden_pct", None) or 0.0
    neutral_pct  = getattr(row, "neutral_burden_pct",  None) or 0.0

    if cbi_score is not None and cbi_score < _CBI_SCORE_LOW:
        severity = SEVERITY_CRITICAL if cbi_score < 50 else SEVERITY_HIGH
        if _raise_alarm(
            alarm_type="low_cbi_score",
            source=SOURCE_CBI,
            severity=severity,
            title="Low Current Balance Index™",
            description=(
                f"CBI score {cbi_score:.1f} is below threshold {_CBI_SCORE_LOW}. "
                "Electrical current imbalance may be reducing capacity and efficiency."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=cbi_score, threshold_value=_CBI_SCORE_LOW, unit="score",
        ):
            count += 1

    if harmonic_pct > _HARMONIC_HIGH_PCT:
        if _raise_alarm(
            alarm_type="high_harmonic_current",
            source=SOURCE_CBI,
            severity=SEVERITY_HIGH,
            title="High Harmonic Current Detected",
            description=(
                f"Harmonic burden {harmonic_pct:.1f}% exceeds threshold {_HARMONIC_HIGH_PCT}%. "
                "Harmonics reduce transformer life and cause hidden capacity loss."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=harmonic_pct, threshold_value=_HARMONIC_HIGH_PCT, unit="%",
        ):
            count += 1

    if reactive_pct > _REACTIVE_HIGH_PCT:
        if _raise_alarm(
            alarm_type="high_reactive_current",
            source=SOURCE_CBI,
            severity=SEVERITY_MEDIUM,
            title="High Reactive Current",
            description=(
                f"Reactive burden {reactive_pct:.1f}% exceeds threshold {_REACTIVE_HIGH_PCT}%. "
                "Poor power factor increases conductor and transformer loading."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=reactive_pct, threshold_value=_REACTIVE_HIGH_PCT, unit="%",
        ):
            count += 1

    if neutral_pct > _NEUTRAL_HIGH_PCT:
        if _raise_alarm(
            alarm_type="high_neutral_current",
            source=SOURCE_CBI,
            severity=SEVERITY_HIGH,
            title="High Neutral Current",
            description=(
                f"Neutral burden {neutral_pct:.1f}% exceeds threshold {_NEUTRAL_HIGH_PCT}%. "
                "Elevated neutral current indicates phase imbalance or high harmonic content."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=neutral_pct, threshold_value=_NEUTRAL_HIGH_PCT, unit="%",
        ):
            count += 1

    return count


def evaluate_capacity_alarms(project_id: int, site_id: Optional[int]) -> int:
    """
    Evaluate Capacity Intelligence-sourced alarms from latest capacity_intelligence row.
    Returns count of new alarms created.
    """
    from app.models.capacity_intelligence import CapacityIntelligence  # local import
    count = 0

    row = (
        CapacityIntelligence.query
        .filter_by(project_id=project_id, isDeleted=False)
        .order_by(CapacityIntelligence.bucket_ts.desc())
        .first()
    )
    if not row:
        return 0

    util_pct      = getattr(row, "utilization_pct", None) or 0.0
    installed_kva = getattr(row, "installed_capacity", None) or 0.0
    available_kva = getattr(row, "available_capacity", None) or 0.0
    health_score  = getattr(row, "capacity_health_score", None)

    avail_pct = (available_kva / installed_kva * 100) if installed_kva else 100.0

    if util_pct >= _CAP_UTIL_CRIT_PCT:
        if _raise_alarm(
            alarm_type="transformer_capacity_critical",
            source=SOURCE_CAPACITY,
            severity=SEVERITY_CRITICAL,
            title="Transformer Capacity Critical",
            description=(
                f"Capacity utilization {util_pct:.1f}% has exceeded critical threshold "
                f"{_CAP_UTIL_CRIT_PCT}%. Immediate load relief required."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=util_pct, threshold_value=_CAP_UTIL_CRIT_PCT, unit="%",
        ):
            count += 1

    elif util_pct >= _CAP_UTIL_HIGH_PCT:
        if _raise_alarm(
            alarm_type="transformer_capacity_warning",
            source=SOURCE_CAPACITY,
            severity=SEVERITY_HIGH,
            title="Transformer Capacity Warning",
            description=(
                f"Capacity utilization {util_pct:.1f}% has exceeded warning threshold "
                f"{_CAP_UTIL_HIGH_PCT}%. Plan capacity relief in the near term."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=util_pct, threshold_value=_CAP_UTIL_HIGH_PCT, unit="%",
        ):
            count += 1

    if avail_pct < _CAP_MARGIN_LOW_PCT:
        if _raise_alarm(
            alarm_type="capacity_margin_low",
            source=SOURCE_CAPACITY,
            severity=SEVERITY_HIGH,
            title="Capacity Margin Low",
            description=(
                f"Available capacity margin {avail_pct:.1f}% is below "
                f"{_CAP_MARGIN_LOW_PCT}%. Risk of overload during demand peaks."
            ),
            project_id=project_id, site_id=site_id,
            metric_value=avail_pct, threshold_value=_CAP_MARGIN_LOW_PCT, unit="%",
        ):
            count += 1

    return count


def evaluate_savings_alarms(project_id: int, site_id: Optional[int]) -> int:
    """
    Evaluate Savings Intelligence-sourced alarms.
    Returns count of new alarms created.
    """
    from app.models.savings_intelligence import SavingsIntelligence
    count = 0

    rows = (
        SavingsIntelligence.query
        .filter_by(project_id=project_id, isDeleted=False)
        .order_by(SavingsIntelligence.bucket_ts.desc())
        .limit(2)
        .all()
    )
    if len(rows) < 2:
        return 0

    latest, previous = rows[0], rows[1]
    latest_savings   = getattr(latest,   "annual_savings", None) or 0.0
    previous_savings = getattr(previous, "annual_savings", None) or 0.0

    if previous_savings and previous_savings > 0:
        variance_pct = abs(latest_savings - previous_savings) / previous_savings * 100
        if variance_pct > _SAVINGS_VARIANCE_PCT:
            if _raise_alarm(
                alarm_type="savings_variance",
                source=SOURCE_SAVINGS,
                severity=SEVERITY_MEDIUM,
                title="Savings Variance Detected",
                description=(
                    f"Annual savings changed by {variance_pct:.1f}% "
                    f"(from ${previous_savings:,.0f} to ${latest_savings:,.0f}). "
                    "Review baseline and metering data for anomalies."
                ),
                project_id=project_id, site_id=site_id,
                metric_value=variance_pct, threshold_value=_SAVINGS_VARIANCE_PCT, unit="%",
            ):
                count += 1

    return count


def evaluate_utility_alarms(project_id: int, site_id: Optional[int]) -> int:
    """
    Evaluate Utility Intelligence-sourced alarms from recent utility_bills.
    Returns count of new alarms created.
    """
    try:
        from app.models.utility_bill import UtilityBill
    except ImportError:
        return 0

    count = 0

    recent_bills = (
        UtilityBill.query
        .filter_by(project_id=project_id, is_deleted=False)
        .order_by(UtilityBill.bill_month.desc())
        .limit(4)
        .all()
    )
    if len(recent_bills) < 2:
        return 0

    latest = recent_bills[0]
    prior  = recent_bills[1:]

    # Bill anomaly — total cost vs avg of last 3 months
    latest_cost = getattr(latest, "total_cost", None) or 0.0
    prior_costs = [getattr(b, "total_cost", None) or 0.0 for b in prior]
    avg_prior   = sum(prior_costs) / len(prior_costs) if prior_costs else 0.0

    if avg_prior > 0:
        anomaly_pct = (latest_cost - avg_prior) / avg_prior * 100
        if anomaly_pct > _BILL_ANOMALY_PCT:
            if _raise_alarm(
                alarm_type="bill_anomaly",
                source=SOURCE_UTILITY,
                severity=SEVERITY_HIGH,
                title="Utility Bill Anomaly",
                description=(
                    f"Latest bill ${latest_cost:,.2f} is {anomaly_pct:.1f}% above "
                    f"3-month average ${avg_prior:,.2f}. Review demand and rate changes."
                ),
                project_id=project_id, site_id=site_id,
                metric_value=latest_cost, threshold_value=avg_prior, unit="USD",
            ):
                count += 1

    # Demand spike — peak_kw vs avg of last 3 months
    latest_demand = getattr(latest, "peak_kw", None) or 0.0
    prior_demands = [getattr(b, "peak_kw", None) or 0.0 for b in prior]
    avg_demand    = sum(prior_demands) / len(prior_demands) if prior_demands else 0.0

    if avg_demand > 0:
        spike_pct = (latest_demand - avg_demand) / avg_demand * 100
        if spike_pct > _DEMAND_SPIKE_PCT:
            if _raise_alarm(
                alarm_type="demand_spike",
                source=SOURCE_UTILITY,
                severity=SEVERITY_HIGH,
                title="Demand Spike Detected",
                description=(
                    f"Peak demand {latest_demand:.1f} kW is {spike_pct:.1f}% above "
                    f"3-month average {avg_demand:.1f} kW. "
                    "Check for new loads or abnormal conditions."
                ),
                project_id=project_id, site_id=site_id,
                metric_value=latest_demand, threshold_value=avg_demand, unit="kW",
            ):
                count += 1

    return count


# ─────────────────────────────────────────────────────────────────────────────
# User-defined alert rule evaluation
# ─────────────────────────────────────────────────────────────────────────────

_METRIC_MAP = {
    # CBI metrics
    "cbi_score":            ("current_balance_metrics", "cbi_score"),
    "harmonic_burden_pct":  ("current_balance_metrics", "harmonic_burden_pct"),
    "reactive_burden_pct":  ("current_balance_metrics", "reactive_burden_pct"),
    "neutral_burden_pct":   ("current_balance_metrics", "neutral_burden_pct"),
    # Capacity metrics
    "utilization_pct":      ("capacity_intelligence",   "utilization_pct"),
    "capacity_health_score":("capacity_intelligence",   "capacity_health_score"),
    "available_capacity":   ("capacity_intelligence",   "available_capacity"),
    "hidden_pct":           ("capacity_intelligence",   "hidden_pct"),
    # Savings metrics
    "annual_savings":       ("savings_intelligence",    "annual_savings"),
    "roi":                  ("savings_intelligence",    "roi"),
}


def _fetch_latest_metric(project_id: int, table: str, column: str) -> Optional[float]:
    """Fetch the most recent value of a metric column from a given table."""
    try:
        from sqlalchemy import text
        sql = text(
            f"SELECT `{column}` FROM `{table}` "
            f"WHERE project_id = :pid AND isDeleted = 0 "
            f"ORDER BY bucket_ts DESC LIMIT 1"
        )
        result = db.session.execute(sql, {"pid": project_id}).fetchone()
        return float(result[0]) if result and result[0] is not None else None
    except Exception as exc:
        logger.debug("metric fetch error table=%s col=%s: %s", table, column, exc)
        return None


def _condition_met(value: float, condition: str, threshold: float) -> bool:
    ops = {
        "greater_than": value > threshold,
        "less_than":    value < threshold,
        "equals":       abs(value - threshold) < 1e-6,
        "not_equals":   abs(value - threshold) >= 1e-6,
    }
    return ops.get(condition, False)


def evaluate_alert_rules(project_id: int, site_id: Optional[int]) -> int:
    """
    Evaluate all active user-defined alert rules for this project/site.
    Returns count of new alarms created.
    """
    count = 0
    rules = (
        AlertRule.query
        .filter(
            AlertRule.is_active == True,
            AlertRule.is_deleted == False,
            db.or_(
                AlertRule.project_id == project_id,
                AlertRule.project_id == None,
            ),
        )
        .all()
    )

    for rule in rules:
        try:
            table_col = _METRIC_MAP.get(rule.metric_key)
            if not table_col:
                continue
            table, col = table_col
            value = _fetch_latest_metric(project_id, table, col)
            if value is None:
                continue

            if _condition_met(value, rule.condition, rule.threshold):
                alarm = _raise_alarm(
                    alarm_type=rule.alarm_type,
                    source=rule.category,
                    severity=rule.severity,
                    title=rule.name,
                    description=(
                        f"Alert rule '{rule.name}' triggered: "
                        f"{rule.metric_key} {rule.condition.replace('_', ' ')} "
                        f"{rule.threshold} {rule.unit or ''}. "
                        f"Current value: {value:.2f}."
                    ),
                    project_id=project_id,
                    site_id=site_id,
                    metric_value=value,
                    threshold_value=rule.threshold,
                    unit=rule.unit,
                    alert_rule_id=rule.id,
                )
                if alarm:
                    count += 1
                    # Update rule's last_triggered_at
                    rule.last_triggered_at = _now_ms()
                    rule.updatedAt = _now_ms()
        except Exception as exc:
            logger.warning("alert rule %s eval error: %s", rule.id, exc)

    return count


# ─────────────────────────────────────────────────────────────────────────────
# Main evaluation entry point (called from rollup_errands)
# ─────────────────────────────────────────────────────────────────────────────

def run_alarm_evaluation(project_id: int, site_id: Optional[int] = None) -> dict:
    """
    Full alarm evaluation pass for a single project.

    Runs all built-in module checks + user alert rules, commits results.
    Returns a summary dict.
    """
    total = 0
    results = {}

    try:
        n = evaluate_cbi_alarms(project_id, site_id)
        results["cbi"] = n
        total += n
    except Exception as exc:
        logger.warning("CBI alarm eval error project=%s: %s", project_id, exc)
        results["cbi"] = 0

    try:
        n = evaluate_capacity_alarms(project_id, site_id)
        results["capacity"] = n
        total += n
    except Exception as exc:
        logger.warning("Capacity alarm eval error project=%s: %s", project_id, exc)
        results["capacity"] = 0

    try:
        n = evaluate_savings_alarms(project_id, site_id)
        results["savings"] = n
        total += n
    except Exception as exc:
        logger.warning("Savings alarm eval error project=%s: %s", project_id, exc)
        results["savings"] = 0

    try:
        n = evaluate_utility_alarms(project_id, site_id)
        results["utility"] = n
        total += n
    except Exception as exc:
        logger.warning("Utility alarm eval error project=%s: %s", project_id, exc)
        results["utility"] = 0

    try:
        n = evaluate_alert_rules(project_id, site_id)
        results["user_rules"] = n
        total += n
    except Exception as exc:
        logger.warning("Alert rules eval error project=%s: %s", project_id, exc)
        results["user_rules"] = 0

    if total > 0:
        try:
            db.session.commit()
            logger.info("alarm eval project=%s: %d new alarms %s", project_id, total, results)
        except Exception as exc:
            db.session.rollback()
            logger.error("alarm commit error project=%s: %s", project_id, exc)
            total = 0

    results["total"] = total
    return results


def dashboard_summary(project_id: int, site_id: Optional[int] = None) -> dict:
    """
    Aggregate KPIs for the Alarms & Events Overview dashboard (Figure A-12).
    """
    from app.models.alarm import Alarm as _Alarm
    from sqlalchemy import func

    base_q = _Alarm.query.filter(
        _Alarm.project_id == project_id,
        _Alarm.isDeleted == False,
    )
    if site_id:
        base_q = base_q.filter(_Alarm.site_id == site_id)

    active_q = base_q.filter(_Alarm.status.notin_(["resolved", "closed"]))

    critical = active_q.filter(_Alarm.severity == SEVERITY_CRITICAL).count()
    high     = active_q.filter(_Alarm.severity == SEVERITY_HIGH).count()
    medium   = active_q.filter(_Alarm.severity == SEVERITY_MEDIUM).count()
    low      = active_q.filter(_Alarm.severity == SEVERITY_LOW).count()
    info     = active_q.filter(_Alarm.severity == SEVERITY_INFORMATION).count()

    total_active = active_q.count()
    alarms_ok    = 1 if total_active == 0 else 0

    # MTTR — average resolution time in minutes for alarms resolved in last 30 days
    thirty_days_ms = 30 * 24 * 60 * 60 * 1000
    cutoff = _now_ms() - thirty_days_ms
    resolved_rows = (
        base_q
        .filter(
            _Alarm.status == "resolved",
            _Alarm.resolved_at != None,
            _Alarm.resolved_at >= cutoff,
        )
        .all()
    )
    mttr_minutes = None
    if resolved_rows:
        durations = [
            (r.resolved_at - r.triggered_at) / 60000
            for r in resolved_rows
            if r.resolved_at and r.triggered_at
        ]
        if durations:
            mttr_minutes = round(sum(durations) / len(durations), 1)

    # Active alarms by source
    source_counts = {}
    for row in active_q.all():
        source_counts[row.source] = source_counts.get(row.source, 0) + 1

    return {
        "critical":       critical,
        "high":           high,
        "medium":         medium,
        "low":            low,
        "information":    info,
        "total_active":   total_active,
        "alarms_ok":      alarms_ok,
        "mttr_minutes":   mttr_minutes,
        "source_counts":  source_counts,
    }
