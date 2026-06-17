"""
Phase 11: Alarms & Events™ models

Spec: ECBS OS v4 §38, Appendix B-23, Figure A-12 / A-13

Tables:
  alarms           — canonical alarm records, one per breach instance
  alarm_assignments — state-machine audit trail (New→Ack→Assigned→…→Closed)
  events           — raw event log published by every ECBS module
  notifications    — push/email/SMS delivery records
  alert_rules      — user-defined threshold rules that trigger alarms
"""
from app.extensions import db
from app.models.base import BaseModel, _js_timestamp


# ── Severity / Status enums (stored as VARCHAR so SQL queries stay readable) ──

SEVERITY_CRITICAL    = "critical"
SEVERITY_HIGH        = "high"
SEVERITY_MEDIUM      = "medium"
SEVERITY_LOW         = "low"
SEVERITY_INFORMATION = "information"

STATUS_NEW           = "new"
STATUS_ACKNOWLEDGED  = "acknowledged"
STATUS_ASSIGNED      = "assigned"
STATUS_IN_PROGRESS   = "in_progress"
STATUS_RESOLVED      = "resolved"
STATUS_CLOSED        = "closed"

# Alarm sources (matches spec §38)
SOURCE_CBI           = "cbi"
SOURCE_CAPACITY      = "capacity"
SOURCE_SAVINGS       = "savings"
SOURCE_UTILITY       = "utility"
SOURCE_DEVICE        = "device"
SOURCE_LICENSE       = "license"
SOURCE_CUSTOM        = "custom"


class Alarm(BaseModel):
    """
    One row per alarm instance.

    An alarm is raised when a monitored metric crosses an alert_rule threshold
    (or when the alarm_engine detects a known condition).  Each alarm moves
    through the workflow: new → acknowledged → assigned → in_progress →
    resolved → closed.

    Spec: ECBS OS v4 §38, Appendix B-23
    """
    __tablename__ = "alarms"

    # ── Scope ─────────────────────────────────────────────────────────────────
    project_id  = db.Column(db.Integer, db.ForeignKey("project.id"),
                            nullable=True, index=True)
    site_id     = db.Column(db.Integer, db.ForeignKey("site.id"),
                            nullable=True, index=True)

    # ── Classification ────────────────────────────────────────────────────────
    # alarm_type  : human-readable code, e.g. "high_harmonic_current"
    alarm_type  = db.Column(db.String(100), nullable=False, index=True)
    source      = db.Column(db.String(50),  nullable=False, index=True,
                            default=SOURCE_CUSTOM)   # cbi|capacity|savings|…

    severity    = db.Column(db.String(20),  nullable=False, index=True,
                            default=SEVERITY_MEDIUM)

    # ── Workflow state ────────────────────────────────────────────────────────
    status      = db.Column(db.String(30),  nullable=False, index=True,
                            default=STATUS_NEW)

    # ── Payload ───────────────────────────────────────────────────────────────
    title       = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text,        nullable=True)
    asset_id    = db.Column(db.Integer,     nullable=True)   # soft ref to asset
    asset_name  = db.Column(db.String(255), nullable=True)

    # Metric snapshot at breach time
    metric_value     = db.Column(db.Float,  nullable=True)
    threshold_value  = db.Column(db.Float,  nullable=True)
    unit             = db.Column(db.String(30), nullable=True)

    # Optional link back to the alert_rule that generated this alarm
    alert_rule_id    = db.Column(db.Integer, db.ForeignKey("alert_rules.id"),
                                 nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    triggered_at     = db.Column(db.BigInteger, nullable=True,
                                 default=_js_timestamp)
    acknowledged_at  = db.Column(db.BigInteger, nullable=True)
    resolved_at      = db.Column(db.BigInteger, nullable=True)
    closed_at        = db.Column(db.BigInteger, nullable=True)

    # Soft-delete flag
    isDeleted        = db.Column(db.Boolean, default=False, index=True)

    __table_args__ = (
        db.Index("ix_alarms_site_status", "site_id", "status"),
        db.Index("ix_alarms_project_status", "project_id", "status"),
    )


class AlarmAssignment(BaseModel):
    """
    Workflow state transitions for an alarm (audit trail).

    Every time an alarm changes state or is assigned to a user, a new row is
    appended so we have a full history of who did what and when.
    """
    __tablename__ = "alarm_assignments"

    alarm_id      = db.Column(db.Integer, db.ForeignKey("alarms.id"),
                              nullable=False, index=True)
    # state the alarm moved INTO with this action
    to_status     = db.Column(db.String(30), nullable=False)
    assigned_to   = db.Column(db.Integer, db.ForeignKey("user.id"),
                              nullable=True)
    performed_by  = db.Column(db.Integer, db.ForeignKey("user.id"),
                              nullable=True)
    note          = db.Column(db.Text, nullable=True)
    action_ts     = db.Column(db.BigInteger, nullable=True, default=_js_timestamp)


class Event(BaseModel):
    """
    Raw event log published by every ECBS module.

    Modules (CBI engine, rollup, device registry, license manager…) can publish
    informational events here without necessarily creating an Alarm.  The alarm
    engine reads recent events and may promote them to Alarms when thresholds
    are breached.
    """
    __tablename__ = "events"

    project_id   = db.Column(db.Integer, db.ForeignKey("project.id"),
                             nullable=True, index=True)
    site_id      = db.Column(db.Integer, db.ForeignKey("site.id"),
                             nullable=True, index=True)
    source       = db.Column(db.String(50),  nullable=False, index=True)
    event_type   = db.Column(db.String(100), nullable=False, index=True)
    severity     = db.Column(db.String(20),  nullable=True)
    title        = db.Column(db.String(255), nullable=True)
    description  = db.Column(db.Text,       nullable=True)
    payload      = db.Column(db.JSON,        nullable=True)   # arbitrary extra data
    asset_id     = db.Column(db.Integer,     nullable=True)
    event_ts     = db.Column(db.BigInteger,  nullable=True, default=_js_timestamp, index=True)


class Notification(BaseModel):
    """
    Delivery record for each notification sent (email, push, SMS).

    Created when an Alarm is raised or escalated, and updated with delivery
    confirmation or failure.
    """
    __tablename__ = "notifications"

    alarm_id     = db.Column(db.Integer, db.ForeignKey("alarms.id"),
                             nullable=True, index=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("user.id"),
                             nullable=True)
    channel      = db.Column(db.String(20), nullable=False,
                             default="email")   # email|push|sms
    recipient    = db.Column(db.String(255), nullable=True)
    subject      = db.Column(db.String(255), nullable=True)
    body         = db.Column(db.Text,        nullable=True)
    status       = db.Column(db.String(30),  nullable=False,
                             default="pending")  # pending|sent|failed
    sent_at      = db.Column(db.BigInteger,  nullable=True)
    error        = db.Column(db.Text,        nullable=True)


class AlertRule(BaseModel):
    """
    User-defined threshold rules that drive the Alarms & Events™ engine.

    Each rule watches a specific metric for a source module and raises an Alarm
    when the metric crosses the threshold.  Rules are evaluated during every
    rollup cycle by alarm_engine.evaluate_alert_rules().

    Spec: Figure A-13, §38
    """
    __tablename__ = "alert_rules"

    # ── Scope (nullable = applies to all) ─────────────────────────────────────
    project_id   = db.Column(db.Integer, db.ForeignKey("project.id"),
                             nullable=True, index=True)
    site_id      = db.Column(db.Integer, db.ForeignKey("site.id"),
                             nullable=True, index=True)

    # ── Classification ────────────────────────────────────────────────────────
    name         = db.Column(db.String(255), nullable=False)
    description  = db.Column(db.Text,        nullable=True)
    category     = db.Column(db.String(50),  nullable=False,
                             index=True)   # cbi|capacity|savings|utility|device|license
    alarm_type   = db.Column(db.String(100), nullable=False)   # matches Alarm.alarm_type
    severity     = db.Column(db.String(20),  nullable=False,
                             default=SEVERITY_MEDIUM)

    # ── Threshold ─────────────────────────────────────────────────────────────
    # metric_key   : dot-path into the source snapshot, e.g. "cbi_score"
    metric_key   = db.Column(db.String(100), nullable=False)
    condition    = db.Column(db.String(20),  nullable=False,
                             default="greater_than")
    # condition options: greater_than | less_than | equals | not_equals
    threshold    = db.Column(db.Float,       nullable=False)
    unit         = db.Column(db.String(30),  nullable=True)

    # ── Notification config ───────────────────────────────────────────────────
    notify_email    = db.Column(db.Boolean, default=True)
    notify_push     = db.Column(db.Boolean, default=False)
    notify_sms      = db.Column(db.Boolean, default=False)
    # Comma-separated user IDs to notify; NULL = notify all ops users
    notify_user_ids = db.Column(db.Text,    nullable=True)

    # ── State ─────────────────────────────────────────────────────────────────
    is_active    = db.Column(db.Boolean, default=True,  index=True)
    is_deleted   = db.Column(db.Boolean, default=False, index=True)

    # Audit
    created_by   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    last_triggered_at = db.Column(db.BigInteger, nullable=True)
