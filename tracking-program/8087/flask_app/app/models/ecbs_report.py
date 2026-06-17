"""
Phase 12: Reporting Engine™ models

Spec: ECBS OS v4 §39, Appendix B-24, Figure A-14, Appendix C-26

Tables:
  ecbs_reports         — report catalog: one row per generated report
  report_schedules     — recurring schedule config
  report_exports       — each generated file artifact (path, size, downloads)

Note: named ecbs_reports (not "reports") to avoid conflict with the
legacy reportdata / savingsreport tables and to match Flask convention
of explicit table names.
"""
from app.extensions import db
from app.models.base import BaseModel, _js_timestamp


# ── Category constants (spec §39) ─────────────────────────────────────────────
CATEGORY_EXECUTIVE      = "executive_summary"
CATEGORY_CAPACITY       = "capacity_performance"
CATEGORY_POWER_QUALITY  = "power_quality"
CATEGORY_SAVINGS        = "savings_financials"
CATEGORY_ENVIRONMENTAL  = "environmental_impact"
CATEGORY_ALARMS         = "alarms_events"
CATEGORY_CUSTOM         = "custom"

ALL_CATEGORIES = [
    CATEGORY_EXECUTIVE, CATEGORY_CAPACITY, CATEGORY_POWER_QUALITY,
    CATEGORY_SAVINGS, CATEGORY_ENVIRONMENTAL, CATEGORY_ALARMS, CATEGORY_CUSTOM,
]

# ── Export format constants ────────────────────────────────────────────────────
FORMAT_PDF   = "pdf"
FORMAT_EXCEL = "excel"
FORMAT_CSV   = "csv"
FORMAT_JSON  = "json"

ALL_FORMATS = [FORMAT_PDF, FORMAT_EXCEL, FORMAT_CSV, FORMAT_JSON]

# ── Status constants ───────────────────────────────────────────────────────────
STATUS_PENDING    = "pending"
STATUS_RUNNING    = "running"
STATUS_COMPLETE   = "complete"
STATUS_FAILED     = "failed"

# ── Schedule frequency constants ──────────────────────────────────────────────
FREQ_DAILY     = "daily"
FREQ_WEEKLY    = "weekly"
FREQ_MONTHLY   = "monthly"
FREQ_QUARTERLY = "quarterly"
FREQ_ANNUAL    = "annual"


class EcbsReport(BaseModel):
    """
    One row per report catalog entry.

    A report may exist in the catalog without a file (status=pending/running)
    while generation is in progress.  Once complete the associated ReportExport
    row holds the file path.

    Spec: ECBS OS v4 §39, Appendix B-24
    """
    __tablename__ = "ecbs_reports"

    # ── Scope ─────────────────────────────────────────────────────────────────
    project_id   = db.Column(db.Integer, db.ForeignKey("project.id"),
                             nullable=True, index=True)
    site_id      = db.Column(db.Integer, db.ForeignKey("site.id"),
                             nullable=True, index=True)

    # ── Classification ────────────────────────────────────────────────────────
    name         = db.Column(db.String(255), nullable=False)
    description  = db.Column(db.Text,        nullable=True)
    category     = db.Column(db.String(60),  nullable=False, index=True)
    report_type  = db.Column(db.String(60),  nullable=False, index=True)  # matches category
    format       = db.Column(db.String(20),  nullable=False, default=FORMAT_PDF)

    # ── Status ────────────────────────────────────────────────────────────────
    status       = db.Column(db.String(20),  nullable=False,
                             default=STATUS_PENDING, index=True)
    error        = db.Column(db.Text,        nullable=True)

    # ── Date range this report covers ─────────────────────────────────────────
    from_date    = db.Column(db.BigInteger,  nullable=True)   # epoch-ms
    to_date      = db.Column(db.BigInteger,  nullable=True)   # epoch-ms

    # ── Generation metadata ───────────────────────────────────────────────────
    generated_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    generated_at = db.Column(db.BigInteger, nullable=True)

    # ── Link back to schedule that triggered this (if any) ────────────────────
    schedule_id  = db.Column(db.Integer, nullable=True)   # soft FK to report_schedules

    # ── Soft-delete ───────────────────────────────────────────────────────────
    isDeleted    = db.Column(db.Boolean, default=False, index=True)

    __table_args__ = (
        db.Index("ix_ecbs_reports_project_category", "project_id", "category"),
        db.Index("ix_ecbs_reports_generated_at",     "generated_at"),
    )


class ReportSchedule(BaseModel):
    """
    Recurring report schedule.

    Defines which report type to run, how often, and on behalf of which
    project/site.  The rollup errand checks due schedules and fires generation.

    Spec: §39 "Scheduled Reports: Daily | Weekly | Monthly | Quarterly | Annual"
    """
    __tablename__ = "report_schedules"

    project_id   = db.Column(db.Integer, db.ForeignKey("project.id"),
                             nullable=True, index=True)
    site_id      = db.Column(db.Integer, db.ForeignKey("site.id"),
                             nullable=True)

    name         = db.Column(db.String(255), nullable=False)
    category     = db.Column(db.String(60),  nullable=False)
    format       = db.Column(db.String(20),  nullable=False, default=FORMAT_PDF)

    frequency    = db.Column(db.String(20),  nullable=False, default=FREQ_MONTHLY)

    # Timestamps (epoch-ms)
    last_run_at  = db.Column(db.BigInteger,  nullable=True)
    next_run_at  = db.Column(db.BigInteger,  nullable=True, index=True)

    is_active    = db.Column(db.Boolean,     default=True,  index=True)
    is_deleted   = db.Column(db.Boolean,     default=False, index=True)
    created_by   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    # Notification: comma-separated email addresses to send the report to
    notify_emails = db.Column(db.Text, nullable=True)


class ReportExport(BaseModel):
    """
    Generated file artifact for a report.

    One row per file produced (a single report run may produce a PDF + CSV).
    Stores the local file path and a web-accessible URL.

    Spec: Appendix B-24, §39 "Export Formats: PDF | Excel | CSV | JSON"
    """
    __tablename__ = "report_exports"

    report_id    = db.Column(db.Integer, db.ForeignKey("ecbs_reports.id"),
                             nullable=False, index=True)

    format       = db.Column(db.String(20),  nullable=False)
    file_path    = db.Column(db.String(500), nullable=True)   # local filesystem path
    file_url     = db.Column(db.String(500), nullable=True)   # web-accessible URL
    file_size    = db.Column(db.Integer,     nullable=True)   # bytes

    download_count = db.Column(db.Integer,   nullable=False, default=0)
    last_downloaded_at = db.Column(db.BigInteger, nullable=True)

    created_at   = db.Column(db.BigInteger,  nullable=True, default=_js_timestamp)
