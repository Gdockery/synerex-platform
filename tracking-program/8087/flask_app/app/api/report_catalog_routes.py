"""
Reporting Engine™ routes — Phase 12.

Spec: ECBS OS v4 §39, Figure A-14, Appendix B-24, C-26

Routes
──────
GET    /api/reports                     Report catalog (list + filter)
GET    /api/reports/<id>                Report detail + export list
GET    /api/sites/<sid>/reports         Reports for a specific site
POST   /api/reports/generate            Generate a report on demand
GET    /api/reports/<id>/download       Stream file download
DELETE /api/reports/<id>                Soft-delete report
GET    /api/report-schedules            List schedules
POST   /api/report-schedules            Create schedule
PUT    /api/report-schedules/<id>       Update schedule
DELETE /api/report-schedules/<id>       Disable/delete schedule
POST   /api/reports/schedule            Create schedule (spec alias)
"""
import time as _time
from pathlib import Path

from flask import Blueprint, Response, jsonify, request, send_file, current_app
from flask_login import login_required, current_user

from app.extensions import db
from app.models.ecbs_report import (
    EcbsReport, ReportSchedule, ReportExport,
    ALL_CATEGORIES, ALL_FORMATS,
    FORMAT_PDF, FREQ_MONTHLY,
    STATUS_COMPLETE, STATUS_FAILED,
)
from app.helpers.roles import ADMIN_ROLES, ENGINEERING_ROLES, require_roles

report_catalog_bp = Blueprint("report_catalog", __name__, url_prefix="")

_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES
_ADMIN_ROLES = ADMIN_ROLES


def _now_ms() -> int:
    return int(_time.time() * 1000)


def _project_id() -> int | None:
    v = request.args.get("project_id") or request.args.get("projectId")
    try:
        return int(v) if v else None
    except (TypeError, ValueError):
        return None


def _report_to_dict(r: EcbsReport, include_exports: bool = False) -> dict:
    d = {
        "id":           r.id,
        "project_id":   r.project_id,
        "site_id":      r.site_id,
        "name":         r.name,
        "description":  r.description,
        "category":     r.category,
        "report_type":  r.report_type,
        "format":       r.format,
        "status":       r.status,
        "error":        r.error,
        "from_date":    r.from_date,
        "to_date":      r.to_date,
        "generated_by": r.generated_by,
        "generated_at": r.generated_at,
        "schedule_id":  r.schedule_id,
        "createdAt":    r.createdAt,
        "updatedAt":    r.updatedAt,
    }
    if include_exports:
        exports = ReportExport.query.filter_by(report_id=r.id).all()
        d["exports"] = [
            {
                "id":            e.id,
                "format":        e.format,
                "file_url":      e.file_url,
                "file_size":     e.file_size,
                "download_count": e.download_count,
                "created_at":    e.created_at,
            }
            for e in exports
        ]
    return d


def _schedule_to_dict(s: ReportSchedule) -> dict:
    return {
        "id":             s.id,
        "project_id":     s.project_id,
        "site_id":        s.site_id,
        "name":           s.name,
        "category":       s.category,
        "format":         s.format,
        "frequency":      s.frequency,
        "last_run_at":    s.last_run_at,
        "next_run_at":    s.next_run_at,
        "is_active":      s.is_active,
        "notify_emails":  s.notify_emails,
        "createdAt":      s.createdAt,
        "updatedAt":      s.updatedAt,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Report catalog routes
# ─────────────────────────────────────────────────────────────────────────────

@report_catalog_bp.route("/api/reports")
@login_required
def reports_list():
    """List reports with optional filtering."""
    project_id = _project_id()
    category   = request.args.get("category")
    fmt        = request.args.get("format")
    status     = request.args.get("status")
    site_id    = request.args.get("site_id", type=int)
    limit      = min(int(request.args.get("limit", 50)), 200)
    offset     = int(request.args.get("offset", 0))

    q = EcbsReport.query.filter_by(isDeleted=False)
    if project_id:
        q = q.filter(EcbsReport.project_id == project_id)
    if site_id:
        q = q.filter(EcbsReport.site_id == site_id)
    if category and category in ALL_CATEGORIES:
        q = q.filter(EcbsReport.category == category)
    if fmt and fmt in ALL_FORMATS:
        q = q.filter(EcbsReport.format == fmt)
    if status:
        q = q.filter(EcbsReport.status == status)

    total = q.count()
    rows  = q.order_by(EcbsReport.generated_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":   total,
        "offset":  offset,
        "limit":   limit,
        "reports": [_report_to_dict(r) for r in rows],
    })


@report_catalog_bp.route("/api/reports/<int:report_id>")
@login_required
def report_detail(report_id: int):
    """Report detail including export file list."""
    r = EcbsReport.query.filter_by(id=report_id, isDeleted=False).first_or_404()
    return jsonify(_report_to_dict(r, include_exports=True))


@report_catalog_bp.route("/api/sites/<int:site_id>/reports")
@login_required
def site_reports(site_id: int):
    """Reports for a specific site."""
    limit  = min(int(request.args.get("limit", 50)), 200)
    offset = int(request.args.get("offset", 0))

    q     = EcbsReport.query.filter_by(site_id=site_id, isDeleted=False)
    total = q.count()
    rows  = q.order_by(EcbsReport.generated_at.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":   total,
        "reports": [_report_to_dict(r) for r in rows],
    })


@report_catalog_bp.route("/api/reports/generate", methods=["POST"])
@login_required
def report_generate():
    """
    Generate a report on demand.

    Body:
      project_id  (required)
      category    (required) — one of ALL_CATEGORIES
      format      (optional, default "pdf") — pdf|excel|csv|json
      name        (optional)
      from_date   (optional epoch-ms)
      to_date     (optional epoch-ms)
      site_id     (optional)
    """
    body = request.get_json(silent=True) or {}
    project_id = body.get("project_id") or _project_id()
    category   = body.get("category", "executive_summary")
    fmt        = body.get("format", FORMAT_PDF)
    name       = body.get("name")
    from_ts    = body.get("from_date") or body.get("from_ts")
    to_ts      = body.get("to_date")   or body.get("to_ts")
    site_id    = body.get("site_id")

    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    if category not in ALL_CATEGORIES:
        return jsonify({"error": f"category must be one of {ALL_CATEGORIES}"}), 400
    if fmt not in ALL_FORMATS:
        return jsonify({"error": f"format must be one of {ALL_FORMATS}"}), 400

    from app.services.report_generator import create_and_generate
    try:
        result = create_and_generate(
            project_id=int(project_id),
            category=category,
            fmt=fmt,
            name=name,
            from_ts=int(from_ts) if from_ts else None,
            to_ts=int(to_ts)   if to_ts   else None,
            site_id=int(site_id) if site_id else None,
            generated_by=getattr(current_user, "id", None),
        )
        return jsonify(result), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@report_catalog_bp.route("/api/reports/<int:report_id>/download")
@login_required
def report_download(report_id: int):
    """Stream the generated report file for download."""
    r = EcbsReport.query.filter_by(id=report_id, isDeleted=False).first_or_404()

    if r.status != STATUS_COMPLETE:
        return jsonify({"error": f"Report status is '{r.status}', not ready for download"}), 409

    export = (ReportExport.query
              .filter_by(report_id=report_id)
              .order_by(ReportExport.created_at.desc())
              .first())
    if not export or not export.file_path:
        return jsonify({"error": "No export file found"}), 404

    fpath = Path(export.file_path)
    if not fpath.exists():
        return jsonify({"error": "File not found on disk"}), 404

    mime_map = {
        "pdf":   "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv":   "text/csv",
        "json":  "application/json",
    }
    mime = mime_map.get(export.format, "application/octet-stream")
    ext  = {"pdf": "pdf", "excel": "xlsx", "csv": "csv", "json": "json"}.get(export.format, export.format)
    safe_name = r.name.replace(" ", "_").replace("/", "-")[:60]
    download_name = f"{safe_name}.{ext}"

    # Increment download counter
    export.download_count     = (export.download_count or 0) + 1
    export.last_downloaded_at = _now_ms()
    export.updatedAt          = _now_ms()
    db.session.commit()

    return send_file(
        str(fpath),
        mimetype=mime,
        as_attachment=True,
        download_name=download_name,
    )


@report_catalog_bp.route("/api/reports/<int:report_id>", methods=["DELETE"])
@login_required
def report_delete(report_id: int):
    """Soft-delete a report (and its exports)."""
    r = EcbsReport.query.filter_by(id=report_id, isDeleted=False).first_or_404()
    r.isDeleted  = True
    r.updatedAt  = _now_ms()
    db.session.commit()
    return jsonify({"deleted": True, "id": report_id})


# ─────────────────────────────────────────────────────────────────────────────
# Report schedule routes
# ─────────────────────────────────────────────────────────────────────────────

def _next_run_ms(frequency: str) -> int:
    """Compute next_run_at epoch-ms from now."""
    import calendar
    from datetime import date, timedelta

    now    = _now_ms()
    today  = date.today()
    FREQ_DELTAS = {
        "daily":     timedelta(days=1),
        "weekly":    timedelta(weeks=1),
        "monthly":   None,     # handled below
        "quarterly": None,
        "annual":    None,
    }
    delta = FREQ_DELTAS.get(frequency)
    if delta:
        d = today + delta
    elif frequency == "monthly":
        month = today.month % 12 + 1
        year  = today.year + (1 if today.month == 12 else 0)
        d     = date(year, month, 1)
    elif frequency == "quarterly":
        months_ahead = 3 - ((today.month - 1) % 3)
        month  = (today.month - 1 + months_ahead) % 12 + 1
        year   = today.year + ((today.month - 1 + months_ahead) // 12)
        d      = date(year, month, 1)
    elif frequency == "annual":
        d = date(today.year + 1, 1, 1)
    else:
        from datetime import timedelta
        d = today + timedelta(days=1)

    import datetime as _dt
    return int(_dt.datetime.combine(d, _dt.time.min).replace(tzinfo=timezone.utc).timestamp() * 1000)


from datetime import timezone


@report_catalog_bp.route("/api/report-schedules")
@login_required
def schedule_list():
    """List active report schedules."""
    project_id = _project_id()
    q = ReportSchedule.query.filter_by(is_deleted=False)
    if project_id:
        q = q.filter(db.or_(
            ReportSchedule.project_id == project_id,
            ReportSchedule.project_id == None,
        ))
    schedules = q.order_by(ReportSchedule.createdAt.desc()).all()
    return jsonify([_schedule_to_dict(s) for s in schedules])


@report_catalog_bp.route("/api/report-schedules", methods=["POST"])
@report_catalog_bp.route("/api/reports/schedule",  methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def schedule_create():
    """Create a new report schedule."""
    body = request.get_json(silent=True) or {}

    required = ("name", "category", "frequency")
    missing  = [k for k in required if k not in body]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    if body["category"] not in ALL_CATEGORIES:
        return jsonify({"error": f"category must be one of {ALL_CATEGORIES}"}), 400

    now = _now_ms()
    s   = ReportSchedule(
        project_id=body.get("project_id"),
        site_id=body.get("site_id"),
        name=body["name"],
        category=body["category"],
        format=body.get("format", FORMAT_PDF),
        frequency=body.get("frequency", FREQ_MONTHLY),
        next_run_at=_next_run_ms(body.get("frequency", FREQ_MONTHLY)),
        is_active=bool(body.get("is_active", True)),
        notify_emails=body.get("notify_emails"),
        created_by=getattr(current_user, "id", None),
        createdAt=now,
        updatedAt=now,
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(_schedule_to_dict(s)), 201


@report_catalog_bp.route("/api/report-schedules/<int:schedule_id>", methods=["PUT"])
@login_required
@require_roles(_WRITE_ROLES)
def schedule_update(schedule_id: int):
    """Update a report schedule."""
    s    = ReportSchedule.query.filter_by(id=schedule_id, is_deleted=False).first_or_404()
    body = request.get_json(silent=True) or {}

    for field in ("name", "category", "format", "frequency", "is_active", "notify_emails"):
        if field in body:
            setattr(s, field, body[field])

    if "frequency" in body:
        s.next_run_at = _next_run_ms(body["frequency"])

    s.updatedAt = _now_ms()
    db.session.commit()
    return jsonify(_schedule_to_dict(s))


@report_catalog_bp.route("/api/report-schedules/<int:schedule_id>", methods=["DELETE"])
@login_required
@require_roles(_ADMIN_ROLES)
def schedule_delete(schedule_id: int):
    """Disable a report schedule (soft-delete)."""
    s = ReportSchedule.query.filter_by(id=schedule_id, is_deleted=False).first_or_404()
    s.is_active  = False
    s.is_deleted = True
    s.updatedAt  = _now_ms()
    db.session.commit()
    return jsonify({"deleted": True, "id": schedule_id})


# ─────────────────────────────────────────────────────────────────────────────
# Summary endpoint — Report Generator dashboard (Figure A-14)
# ─────────────────────────────────────────────────────────────────────────────

@report_catalog_bp.route("/api/reports/summary")
@login_required
def reports_summary():
    """
    Dashboard summary for the Report Generator page (Figure A-14).

    Returns:
      - count by category
      - recently generated (last 5)
      - scheduled reports (active)
      - overall totals
    """
    project_id = _project_id()

    base_q = EcbsReport.query.filter_by(isDeleted=False)
    if project_id:
        base_q = base_q.filter(EcbsReport.project_id == project_id)

    total_reports     = base_q.count()
    complete_reports  = base_q.filter(EcbsReport.status == STATUS_COMPLETE).count()
    failed_reports    = base_q.filter(EcbsReport.status == STATUS_FAILED).count()
    scheduled_reports = ReportSchedule.query.filter_by(is_active=True, is_deleted=False).count()

    # Count by category
    by_category = {}
    for cat in ALL_CATEGORIES:
        by_category[cat] = base_q.filter(EcbsReport.category == cat).count()

    # Recently generated (last 5)
    recent = (base_q
              .filter(EcbsReport.status == STATUS_COMPLETE)
              .order_by(EcbsReport.generated_at.desc())
              .limit(5)
              .all())

    return jsonify({
        "total_reports":     total_reports,
        "complete_reports":  complete_reports,
        "failed_reports":    failed_reports,
        "scheduled_reports": scheduled_reports,
        "by_category":       by_category,
        "recently_generated": [_report_to_dict(r) for r in recent],
    })
