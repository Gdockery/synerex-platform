"""
Alarms & Events™ routes — Phase 11.

Spec: ECBS OS v4 §38, Figures A-12 / A-13, Appendix B-23, C-24 / C-25

Routes — Alarms
───────────────
GET  /api/alarms/summary            Dashboard KPIs (counts, MTTR, sources)
GET  /api/alarms/active             Active alarm list (filtered)
GET  /api/alarms/history            Historical alarms
GET  /api/alarms/<id>               Alarm detail
POST /api/alarms/<id>/acknowledge   Move alarm to 'acknowledged'
POST /api/alarms/<id>/assign        Assign alarm to a user
POST /api/alarms/<id>/resolve       Move alarm to 'resolved'
POST /api/alarms/<id>/close         Move alarm to 'closed'
GET  /api/alarms/events             Raw event log
POST /api/alarms/evaluate           Trigger manual alarm evaluation (admin)

Routes — Alert Rules
────────────────────
GET    /api/alert-rules             List all alert rules
GET    /api/alert-rules/<id>        Rule detail
POST   /api/alert-rules             Create new rule
PUT    /api/alert-rules/<id>        Update rule
DELETE /api/alert-rules/<id>        Soft-delete rule
POST   /api/alert-rules/<id>/test   Test rule notification
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.extensions import db
from app.models.alarm import (
    Alarm, AlarmAssignment, AlertRule, Event, Notification,
    STATUS_NEW, STATUS_ACKNOWLEDGED, STATUS_ASSIGNED,
    STATUS_IN_PROGRESS, STATUS_RESOLVED, STATUS_CLOSED,
    SEVERITY_CRITICAL, SEVERITY_HIGH, SEVERITY_MEDIUM,
    SEVERITY_LOW, SEVERITY_INFORMATION,
)
from app.helpers.roles import ADMIN_ROLES, ENGINEERING_ROLES, require_roles
from app.helpers.time_utils import now_ms as _now_ms

alarm_bp = Blueprint("alarms", __name__, url_prefix="")

_WRITE_ROLES  = ENGINEERING_ROLES | ADMIN_ROLES
_ADMIN_ROLES  = ADMIN_ROLES

# Valid severity / status sets for input validation
_VALID_SEVERITIES = {
    SEVERITY_CRITICAL, SEVERITY_HIGH, SEVERITY_MEDIUM,
    SEVERITY_LOW, SEVERITY_INFORMATION,
}
_VALID_STATUSES = {
    STATUS_NEW, STATUS_ACKNOWLEDGED, STATUS_ASSIGNED,
    STATUS_IN_PROGRESS, STATUS_RESOLVED, STATUS_CLOSED,
}


def _project_id_from_request() -> int | None:
    pid = request.args.get("project_id") or request.args.get("projectId")
    try:
        return int(pid) if pid else None
    except (ValueError, TypeError):
        return None


def _site_id_from_request() -> int | None:
    sid = request.args.get("site_id") or request.args.get("siteId")
    try:
        return int(sid) if sid else None
    except (ValueError, TypeError):
        return None


def _alarm_to_dict(alarm: Alarm) -> dict:
    return {
        "id":              alarm.id,
        "project_id":      alarm.project_id,
        "site_id":         alarm.site_id,
        "alarm_type":      alarm.alarm_type,
        "source":          alarm.source,
        "severity":        alarm.severity,
        "status":          alarm.status,
        "title":           alarm.title,
        "description":     alarm.description,
        "asset_id":        alarm.asset_id,
        "asset_name":      alarm.asset_name,
        "metric_value":    alarm.metric_value,
        "threshold_value": alarm.threshold_value,
        "unit":            alarm.unit,
        "alert_rule_id":   alarm.alert_rule_id,
        "triggered_at":    alarm.triggered_at,
        "acknowledged_at": alarm.acknowledged_at,
        "resolved_at":     alarm.resolved_at,
        "closed_at":       alarm.closed_at,
        "createdAt":       alarm.createdAt,
        "updatedAt":       alarm.updatedAt,
    }


def _rule_to_dict(rule: AlertRule) -> dict:
    return {
        "id":               rule.id,
        "project_id":       rule.project_id,
        "site_id":          rule.site_id,
        "name":             rule.name,
        "description":      rule.description,
        "category":         rule.category,
        "alarm_type":       rule.alarm_type,
        "severity":         rule.severity,
        "metric_key":       rule.metric_key,
        "condition":        rule.condition,
        "threshold":        rule.threshold,
        "unit":             rule.unit,
        "notify_email":     rule.notify_email,
        "notify_push":      rule.notify_push,
        "notify_sms":       rule.notify_sms,
        "notify_user_ids":  rule.notify_user_ids,
        "is_active":        rule.is_active,
        "last_triggered_at": rule.last_triggered_at,
        "createdAt":        rule.createdAt,
        "updatedAt":        rule.updatedAt,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Alarm routes
# ─────────────────────────────────────────────────────────────────────────────

@alarm_bp.route("/api/alarms/summary")
@login_required
def alarm_summary():
    """Dashboard KPIs — spec Figure A-12."""
    project_id = _project_id_from_request()
    site_id    = _site_id_from_request()

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    from app.services.alarm_engine import dashboard_summary
    summary = dashboard_summary(project_id, site_id)
    return jsonify(summary)


@alarm_bp.route("/api/alarms/active")
@login_required
def alarm_active():
    """Active alarm list with optional filtering."""
    project_id = _project_id_from_request()
    site_id    = _site_id_from_request()
    severity   = request.args.get("severity")
    source     = request.args.get("source")
    alarm_type = request.args.get("alarm_type")
    limit      = min(int(request.args.get("limit", 100)), 500)
    offset     = int(request.args.get("offset", 0))

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    q = Alarm.query.filter(
        Alarm.project_id == project_id,
        Alarm.status.notin_(["resolved", "closed"]),
        Alarm.isDeleted == False,
    )
    if site_id:
        q = q.filter(Alarm.site_id == site_id)
    if severity and severity in _VALID_SEVERITIES:
        q = q.filter(Alarm.severity == severity)
    if source:
        q = q.filter(Alarm.source == source)
    if alarm_type:
        q = q.filter(Alarm.alarm_type == alarm_type)

    total = q.count()
    rows  = q.order_by(Alarm.triggered_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":  total,
        "offset": offset,
        "limit":  limit,
        "alarms": [_alarm_to_dict(a) for a in rows],
    })


@alarm_bp.route("/api/alarms/history")
@login_required
def alarm_history():
    """Historical alarms (resolved + closed) with date range filter."""
    project_id = _project_id_from_request()
    site_id    = _site_id_from_request()
    severity   = request.args.get("severity")
    source     = request.args.get("source")
    from_ts    = request.args.get("from_ts", type=int)
    to_ts      = request.args.get("to_ts",   type=int)
    limit      = min(int(request.args.get("limit", 200)), 1000)
    offset     = int(request.args.get("offset", 0))

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    q = Alarm.query.filter(
        Alarm.project_id == project_id,
        Alarm.isDeleted == False,
    )
    if site_id:
        q = q.filter(Alarm.site_id == site_id)
    if severity and severity in _VALID_SEVERITIES:
        q = q.filter(Alarm.severity == severity)
    if source:
        q = q.filter(Alarm.source == source)
    if from_ts:
        q = q.filter(Alarm.triggered_at >= from_ts)
    if to_ts:
        q = q.filter(Alarm.triggered_at <= to_ts)

    total = q.count()
    rows  = q.order_by(Alarm.triggered_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":  total,
        "offset": offset,
        "limit":  limit,
        "alarms": [_alarm_to_dict(a) for a in rows],
    })


@alarm_bp.route("/api/alarms/<int:alarm_id>")
@login_required
def alarm_detail(alarm_id: int):
    """Single alarm detail with full assignment history."""
    alarm = Alarm.query.filter_by(id=alarm_id, isDeleted=False).first_or_404()
    assignments = AlarmAssignment.query.filter_by(alarm_id=alarm_id).order_by(
        AlarmAssignment.action_ts.asc()
    ).all()

    result = _alarm_to_dict(alarm)
    result["history"] = [
        {
            "id":           a.id,
            "to_status":    a.to_status,
            "assigned_to":  a.assigned_to,
            "performed_by": a.performed_by,
            "note":         a.note,
            "action_ts":    a.action_ts,
        }
        for a in assignments
    ]
    return jsonify(result)


def _transition_alarm(alarm_id: int, to_status: str,
                      assign_to: int | None = None,
                      note: str | None = None) -> tuple:
    """Shared state-machine transition helper."""
    alarm = Alarm.query.filter_by(id=alarm_id, isDeleted=False).first()
    if not alarm:
        return jsonify({"error": "Alarm not found"}), 404

    now = _now_ms()
    alarm.status    = to_status
    alarm.updatedAt = now

    if to_status == STATUS_ACKNOWLEDGED:
        alarm.acknowledged_at = now
    elif to_status == STATUS_RESOLVED:
        alarm.resolved_at = now
    elif to_status == STATUS_CLOSED:
        alarm.closed_at = now

    entry = AlarmAssignment(
        alarm_id=alarm_id,
        to_status=to_status,
        assigned_to=assign_to,
        performed_by=getattr(current_user, "id", None),
        note=note,
        action_ts=now,
        createdAt=now,
        updatedAt=now,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(_alarm_to_dict(alarm)), 200


@alarm_bp.route("/api/alarms/<int:alarm_id>/acknowledge", methods=["POST"])
@login_required
def alarm_acknowledge(alarm_id: int):
    body = request.get_json(silent=True) or {}
    return _transition_alarm(alarm_id, STATUS_ACKNOWLEDGED, note=body.get("note"))


@alarm_bp.route("/api/alarms/<int:alarm_id>/assign", methods=["POST"])
@login_required
def alarm_assign(alarm_id: int):
    body    = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    return _transition_alarm(
        alarm_id, STATUS_ASSIGNED,
        assign_to=int(user_id) if user_id else None,
        note=body.get("note"),
    )


@alarm_bp.route("/api/alarms/<int:alarm_id>/resolve", methods=["POST"])
@login_required
def alarm_resolve(alarm_id: int):
    body = request.get_json(silent=True) or {}
    return _transition_alarm(alarm_id, STATUS_RESOLVED, note=body.get("note"))


@alarm_bp.route("/api/alarms/<int:alarm_id>/close", methods=["POST"])
@login_required
def alarm_close(alarm_id: int):
    body = request.get_json(silent=True) or {}
    return _transition_alarm(alarm_id, STATUS_CLOSED, note=body.get("note"))


@alarm_bp.route("/api/alarms/events")
@login_required
def alarm_events():
    """Raw event log from all ECBS modules."""
    project_id = _project_id_from_request()
    site_id    = _site_id_from_request()
    source     = request.args.get("source")
    from_ts    = request.args.get("from_ts", type=int)
    to_ts      = request.args.get("to_ts",   type=int)
    limit      = min(int(request.args.get("limit", 200)), 1000)
    offset     = int(request.args.get("offset", 0))

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    q = Event.query.filter_by(project_id=project_id)
    if site_id:
        q = q.filter(Event.site_id == site_id)
    if source:
        q = q.filter(Event.source == source)
    if from_ts:
        q = q.filter(Event.event_ts >= from_ts)
    if to_ts:
        q = q.filter(Event.event_ts <= to_ts)

    total = q.count()
    rows  = q.order_by(Event.event_ts.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":  total,
        "events": [
            {
                "id":          ev.id,
                "source":      ev.source,
                "event_type":  ev.event_type,
                "severity":    ev.severity,
                "title":       ev.title,
                "description": ev.description,
                "payload":     ev.payload,
                "asset_id":    ev.asset_id,
                "event_ts":    ev.event_ts,
            }
            for ev in rows
        ],
    })


@alarm_bp.route("/api/alarms/evaluate", methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def alarm_evaluate():
    """Manually trigger alarm evaluation for a project."""
    body       = request.get_json(silent=True) or {}
    project_id = body.get("project_id") or _project_id_from_request()
    site_id    = body.get("site_id")    or _site_id_from_request()

    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    from app.services.alarm_engine import run_alarm_evaluation
    result = run_alarm_evaluation(int(project_id), int(site_id) if site_id else None)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# Alert Rule routes
# ─────────────────────────────────────────────────────────────────────────────

@alarm_bp.route("/api/alert-rules")
@login_required
def alert_rules_list():
    """List all active alert rules for the project."""
    project_id = _project_id_from_request()
    category   = request.args.get("category")

    q = AlertRule.query.filter_by(is_deleted=False)
    if project_id:
        q = q.filter(
            db.or_(AlertRule.project_id == project_id, AlertRule.project_id == None)
        )
    if category:
        q = q.filter(AlertRule.category == category)

    rules = q.order_by(AlertRule.createdAt.desc()).all()
    return jsonify([_rule_to_dict(r) for r in rules])


@alarm_bp.route("/api/alert-rules/<int:rule_id>")
@login_required
def alert_rule_detail(rule_id: int):
    """Single alert rule detail."""
    rule = AlertRule.query.filter_by(id=rule_id, is_deleted=False).first_or_404()
    return jsonify(_rule_to_dict(rule))


@alarm_bp.route("/api/alert-rules", methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def alert_rule_create():
    """Create a new alert rule."""
    body = request.get_json(silent=True) or {}

    required = ("name", "category", "alarm_type", "metric_key", "condition", "threshold")
    missing  = [k for k in required if k not in body]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    if body.get("severity") and body["severity"] not in _VALID_SEVERITIES:
        return jsonify({"error": "Invalid severity"}), 400

    valid_conditions = {"greater_than", "less_than", "equals", "not_equals"}
    if body["condition"] not in valid_conditions:
        return jsonify({"error": f"condition must be one of {valid_conditions}"}), 400

    now  = _now_ms()
    rule = AlertRule(
        project_id=body.get("project_id"),
        site_id=body.get("site_id"),
        name=body["name"],
        description=body.get("description"),
        category=body["category"],
        alarm_type=body["alarm_type"],
        severity=body.get("severity", SEVERITY_MEDIUM),
        metric_key=body["metric_key"],
        condition=body["condition"],
        threshold=float(body["threshold"]),
        unit=body.get("unit"),
        notify_email=bool(body.get("notify_email", True)),
        notify_push=bool(body.get("notify_push", False)),
        notify_sms=bool(body.get("notify_sms", False)),
        notify_user_ids=body.get("notify_user_ids"),
        is_active=bool(body.get("is_active", True)),
        created_by=getattr(current_user, "id", None),
        createdAt=now,
        updatedAt=now,
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify(_rule_to_dict(rule)), 201


@alarm_bp.route("/api/alert-rules/<int:rule_id>", methods=["PUT"])
@login_required
@require_roles(_WRITE_ROLES)
def alert_rule_update(rule_id: int):
    """Update an existing alert rule."""
    rule = AlertRule.query.filter_by(id=rule_id, is_deleted=False).first_or_404()
    body = request.get_json(silent=True) or {}

    for field in ("name", "description", "category", "alarm_type", "severity",
                  "metric_key", "condition", "unit", "notify_email",
                  "notify_push", "notify_sms", "notify_user_ids", "is_active"):
        if field in body:
            setattr(rule, field, body[field])

    if "threshold" in body:
        rule.threshold = float(body["threshold"])

    rule.updatedAt = _now_ms()
    db.session.commit()
    return jsonify(_rule_to_dict(rule))


@alarm_bp.route("/api/alert-rules/<int:rule_id>", methods=["DELETE"])
@login_required
@require_roles(_ADMIN_ROLES)
def alert_rule_delete(rule_id: int):
    """Soft-delete an alert rule."""
    rule = AlertRule.query.filter_by(id=rule_id, is_deleted=False).first_or_404()
    rule.is_deleted = True
    rule.updatedAt  = _now_ms()
    db.session.commit()
    return jsonify({"deleted": True, "id": rule_id})


@alarm_bp.route("/api/alert-rules/<int:rule_id>/test", methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def alert_rule_test(rule_id: int):
    """
    Test fire a rule notification without actually raising a production alarm.
    Sends a test email to the current user (or configured recipients).
    """
    rule = AlertRule.query.filter_by(id=rule_id, is_deleted=False).first_or_404()
    user_email = getattr(current_user, "email", None)

    note = Notification(
        alarm_id=None,
        user_id=getattr(current_user, "id", None),
        channel="email",
        recipient=user_email,
        subject=f"[TEST] Alert Rule: {rule.name}",
        body=(
            f"This is a TEST notification for alert rule '{rule.name}'.\n\n"
            f"Category:  {rule.category}\n"
            f"Metric:    {rule.metric_key}\n"
            f"Condition: {rule.condition}\n"
            f"Threshold: {rule.threshold} {rule.unit or ''}\n"
            f"Severity:  {rule.severity}\n"
        ),
        status="pending",
        createdAt=_now_ms(),
        updatedAt=_now_ms(),
    )
    db.session.add(note)

    # Attempt actual email send
    try:
        from flask import current_app
        import smtplib
        from email.mime.text import MIMEText
        smtp_host = current_app.config.get("MAIL_SERVER", "")
        smtp_port = int(current_app.config.get("MAIL_PORT", 587))
        smtp_user = current_app.config.get("MAIL_USERNAME", "")
        smtp_pass = current_app.config.get("MAIL_PASSWORD", "")

        if smtp_host and smtp_user and user_email:
            msg = MIMEText(note.body)
            msg["Subject"] = note.subject
            msg["From"]    = smtp_user
            msg["To"]      = user_email

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [user_email], msg.as_string())

            note.status  = "sent"
            note.sent_at = _now_ms()
        else:
            note.status = "skipped_no_smtp"
    except Exception as exc:
        note.status = "failed"
        note.error  = str(exc)

    note.updatedAt = _now_ms()
    db.session.commit()

    return jsonify({
        "rule_id":    rule_id,
        "rule_name":  rule.name,
        "notif_id":   note.id,
        "status":     note.status,
        "recipient":  note.recipient,
    })
