"""
Baseline routes — Phase 6: EM&V Baseline Manager™.

Spec: ECBS OS v4 §12, §73
      Workflow: draft → engineering_review → approved → locked
      Locking: once locked, no edits; must version-forward instead
      History: baselines are never deleted

Routes
------
GET    /api/baseline/                         list baselines for a project
POST   /api/baseline/                         create new baseline (auto-version)
GET    /api/baseline/<id>                     get one
PATCH  /api/baseline/<id>                     update (blocked if locked)
                                              [no DELETE — spec: never delete]

POST   /api/baseline/<id>/status              advance/retreat status with guards
POST   /api/baseline/<id>/link-analysis       attach an EmvAnalysis record + sync metrics
GET    /api/baseline/<id>/comparison          compare this baseline vs another version

GET    /api/baseline/active                   active (locked) baseline for a project
POST   /api/baseline/version-forward          create next version from a locked baseline

[COMPAT] /api/emv/push-baseline unchanged — EMV program unaffected.
         project.active_emv_analysis_id unchanged.
"""

import logging

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session

logger = logging.getLogger(__name__)
from app.models.baseline import Baseline, BASELINE_STATUSES, BASELINE_TEST_TYPES, _TRANSITIONS
from app.models.emv_analysis import EmvAnalysis
from app.services.audit import audit
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles
from app.helpers.time_utils import now_ms as _now

_BASELINE_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES

baseline_bp = Blueprint("baseline", __name__, url_prefix="/api/baseline")


# ── Serialiser ────────────────────────────────────────────────────────────────

def _b_dict(b: Baseline) -> dict:
    return {
        "id":                  b.id,
        "project_id":          b.project_id,
        "org_id":              b.org_id,
        "version":             b.version,
        "status":              b.status,
        "test_type":           b.test_type,
        "test_start":          b.test_start,
        "test_end":            b.test_end,
        "emv_analysis_id":     b.emv_analysis_id,
        "reviewer_id":         b.reviewer_id,
        "reviewer_notes":      b.reviewer_notes,
        "reviewed_at":         b.reviewed_at,
        "approved_by":         b.approved_by,
        "approved_at":         b.approved_at,
        "locked_by":           b.locked_by,
        "locked_at":           b.locked_at,
        "avg_kw":              b.avg_kw,
        "avg_kva":             b.avg_kva,
        "avg_pf":              b.avg_pf,
        "avg_kvar":            b.avg_kvar,
        "peak_kva":            b.peak_kva,
        "kwh_savings_pct":     b.kwh_savings_pct,
        "kw_peak_savings_pct": b.kw_peak_savings_pct,
        "pf_savings_pct":      b.pf_savings_pct,
        "notes":               b.notes,
        "createdAt":           b.createdAt,
        "updatedAt":           b.updatedAt,
    }


# ── Scope helper ──────────────────────────────────────────────────────────────

def _can_access_project(project_id: int) -> bool:
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    org = getattr(current_user, "org_id", None)
    if not org:
        return False
    sess = get_session()
    from sqlalchemy import text
    row = sess.execute(
        text("SELECT id FROM project WHERE id=:pid AND org_id=:org AND isDeleted=0"),
        {"pid": project_id, "org": org},
    ).fetchone()
    return row is not None


def _next_version(sess, project_id: int) -> int:
    max_v = (sess.query(Baseline.version)
             .filter_by(project_id=project_id)
             .order_by(Baseline.version.desc())
             .scalar())
    return (max_v or 0) + 1


# ── CRUD ──────────────────────────────────────────────────────────────────────

@baseline_bp.route("/", methods=["GET"])
@login_required
def list_baselines():
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "project_id required"}, 400
    if not _can_access_project(project_id):
        return {"error": "Not found"}, 404

    sess = get_session()
    rows = (sess.query(Baseline)
            .filter_by(project_id=project_id)
            .order_by(Baseline.version.desc())
            .all())
    return {"data": [_b_dict(r) for r in rows]}


@baseline_bp.route("/", methods=["POST"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def create_baseline():
    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return {"error": "project_id required"}, 400
    if not _can_access_project(project_id):
        return {"error": "Not found"}, 404

    if body.get("test_type") and body["test_type"] not in BASELINE_TEST_TYPES:
        return {"error": f"test_type must be one of {BASELINE_TEST_TYPES}"}, 400

    sess = get_session()
    now  = _now()
    b    = Baseline(
        project_id   = project_id,
        org_id       = body.get("org_id") or getattr(current_user, "org_id", None),
        version      = _next_version(sess, project_id),
        status       = "draft",
        test_type    = body.get("test_type"),
        test_start   = body.get("test_start"),
        test_end     = body.get("test_end"),
        notes        = body.get("notes"),
        createdAt    = now,
        updatedAt    = now,
    )
    sess.add(b)
    sess.commit()
    audit("baseline.created", user_id=current_user.id,
          entity_type="baseline", entity_id=b.id,
          detail={"project_id": project_id, "version": b.version})
    return {"data": _b_dict(b)}, 201


@baseline_bp.route("/<int:bid>", methods=["GET"])
@login_required
def get_baseline(bid: int):
    sess = get_session()
    b    = sess.query(Baseline).filter_by(id=bid).first()
    if not b or not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404
    return {"data": _b_dict(b)}


@baseline_bp.route("/<int:bid>", methods=["PATCH"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def update_baseline(bid: int):
    sess = get_session()
    b    = sess.query(Baseline).filter_by(id=bid).first()
    if not b or not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404

    # Spec: locked baselines cannot be edited
    if b.status == "locked":
        return {"error": "Baseline is locked and cannot be edited. "
                         "Use version-forward to create a new version."}, 423

    body     = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("test_type", "test_start", "test_end", "notes",
                 "avg_kw", "avg_kva", "avg_pf", "avg_kvar", "peak_kva",
                 "kwh_savings_pct", "kw_peak_savings_pct", "pf_savings_pct")
    for k in _EDITABLE:
        if k in body:
            setattr(b, k, body[k])
    b.updatedAt = _now()
    sess.commit()
    audit("baseline.updated", user_id=current_user.id,
          entity_type="baseline", entity_id=bid)
    return {"data": _b_dict(b)}

# No DELETE route — spec: historical baselines are never deleted.


# ── Status lifecycle ──────────────────────────────────────────────────────────

@baseline_bp.route("/<int:bid>/status", methods=["POST"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def change_status(bid: int):
    sess = get_session()
    b    = sess.query(Baseline).filter_by(id=bid).first()
    if not b or not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404

    body       = request.get_json(force=True, silent=True) or {}
    new_status = body.get("status", "")
    if new_status not in BASELINE_STATUSES:
        return {"error": f"status must be one of {BASELINE_STATUSES}"}, 400

    allowed = _TRANSITIONS.get(b.status, ())
    if new_status not in allowed:
        return {"error": f"Cannot transition from '{b.status}' to '{new_status}'. "
                         f"Allowed: {allowed}"}, 400

    now = _now()
    b.status    = new_status
    b.updatedAt = now

    if new_status == "engineering_review":
        b.reviewer_id = current_user.id

    if new_status == "approved":
        b.approved_by = current_user.id
        b.approved_at = now
        if body.get("reviewer_notes"):
            b.reviewer_notes = body["reviewer_notes"]
        b.reviewed_at = now

    if new_status == "locked":
        b.locked_by = current_user.id
        b.locked_at = now
        # Set as active baseline on project
        from sqlalchemy import text
        sess.execute(
            text("UPDATE project SET active_baseline_id=:bid WHERE id=:pid"),
            {"bid": bid, "pid": b.project_id},
        )

    if new_status == "draft" and body.get("reviewer_notes"):
        b.reviewer_notes = body["reviewer_notes"]

    sess.commit()
    audit(f"baseline.status.{new_status}", user_id=current_user.id,
          entity_type="baseline", entity_id=bid,
          detail={"project_id": b.project_id, "version": b.version})
    return {"data": _b_dict(b)}


# ── Link EmvAnalysis ──────────────────────────────────────────────────────────

@baseline_bp.route("/<int:bid>/link-analysis", methods=["POST"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def link_analysis(bid: int):
    """
    Attach an EmvAnalysis record to this baseline and sync metrics.
    Called after the EMV program pushes results via /api/emv/push-baseline.
    Body: { "emv_analysis_id": int }
    """
    sess = get_session()
    b    = sess.query(Baseline).filter_by(id=bid).first()
    if not b or not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404
    if b.status == "locked":
        return {"error": "Cannot modify a locked baseline."}, 423

    body          = request.get_json(force=True, silent=True) or {}
    analysis_id   = body.get("emv_analysis_id")
    if not analysis_id:
        return {"error": "emv_analysis_id required"}, 400

    emv = sess.query(EmvAnalysis).filter_by(id=analysis_id, project_id=b.project_id).first()
    if not emv:
        return {"error": "EmvAnalysis not found for this project"}, 404

    b.emv_analysis_id     = emv.id
    b.kwh_savings_pct     = emv.kwh_savings
    b.kw_peak_savings_pct = emv.kw_peak_savings
    b.pf_savings_pct      = emv.pf_savings
    if emv.off_period_start and not b.test_start:
        b.test_start = emv.off_period_start
    if emv.off_period_end and not b.test_end:
        b.test_end = emv.off_period_end
    b.updatedAt = _now()
    sess.commit()

    audit("baseline.analysis_linked", user_id=current_user.id,
          entity_type="baseline", entity_id=bid,
          detail={"emv_analysis_id": analysis_id})
    return {"data": _b_dict(b)}


# ── Comparison ────────────────────────────────────────────────────────────────

@baseline_bp.route("/<int:bid>/comparison", methods=["GET"])
@login_required
def compare_baseline(bid: int):
    """
    Compare this baseline against another version.
    Query params:
      compare_to_id   int  — ID of the other Baseline to compare against
                             (defaults to the previous version if omitted)

    Returns side-by-side metrics for both baselines plus delta values.
    """
    sess = get_session()
    b    = sess.query(Baseline).filter_by(id=bid).first()
    if not b or not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404

    compare_id = request.args.get("compare_to_id", type=int)
    if compare_id:
        other = sess.query(Baseline).filter_by(id=compare_id, project_id=b.project_id).first()
    else:
        # Default: previous version
        other = (sess.query(Baseline)
                 .filter(
                     Baseline.project_id == b.project_id,
                     Baseline.version < b.version,
                 )
                 .order_by(Baseline.version.desc())
                 .first())

    if not other:
        return {"error": "No comparison baseline found"}, 404

    def _delta(key):
        a = getattr(b, key)
        o = getattr(other, key)
        if a is not None and o is not None:
            return round(a - o, 4)
        return None

    metrics = ["avg_kw", "avg_kva", "avg_pf", "avg_kvar", "peak_kva",
               "kwh_savings_pct", "kw_peak_savings_pct", "pf_savings_pct"]

    return {
        "data": {
            "baseline":    _b_dict(b),
            "compare_to":  _b_dict(other),
            "delta": {k: _delta(k) for k in metrics},
        }
    }


# ── Active baseline ───────────────────────────────────────────────────────────

@baseline_bp.route("/active", methods=["GET"])
@login_required
def get_active_baseline():
    """
    Return the currently active (locked) baseline for a project.
    Falls back to the most recently locked baseline if project.active_baseline_id is not set.

    Query params:
      project_id  int  (required)
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return {"error": "project_id required"}, 400
    if not _can_access_project(project_id):
        return {"error": "Not found"}, 404

    from sqlalchemy import text
    sess = get_session()

    # Try project.active_baseline_id first
    row = sess.execute(
        text("SELECT active_baseline_id FROM project WHERE id=:pid"),
        {"pid": project_id},
    ).fetchone()

    active_id = row[0] if row else None
    if active_id:
        b = sess.query(Baseline).filter_by(id=active_id, project_id=project_id).first()
        if b:
            return {"data": _b_dict(b)}

    # Fallback: most recently locked
    b = (sess.query(Baseline)
         .filter_by(project_id=project_id, status="locked")
         .order_by(Baseline.locked_at.desc())
         .first())
    if not b:
        return {"data": None}
    return {"data": _b_dict(b)}


# ── Version forward ───────────────────────────────────────────────────────────

@baseline_bp.route("/version-forward", methods=["POST"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def version_forward():
    """
    Create a new draft baseline pre-populated from a locked baseline.
    This is the spec-mandated path for updating a locked baseline.
    Body: { "from_baseline_id": int, "notes": str }
    """
    body          = request.get_json(force=True, silent=True) or {}
    from_id       = body.get("from_baseline_id")
    if not from_id:
        return {"error": "from_baseline_id required"}, 400

    sess = get_session()
    src  = sess.query(Baseline).filter_by(id=from_id).first()
    if not src or not _can_access_project(src.project_id):
        return {"error": "Not found"}, 404
    if src.status != "locked":
        return {"error": "Can only version-forward from a locked baseline"}, 400

    now  = _now()
    new_b = Baseline(
        project_id          = src.project_id,
        org_id              = src.org_id,
        version             = _next_version(sess, src.project_id),
        status              = "draft",
        test_type           = src.test_type,
        test_start          = src.test_start,
        test_end            = src.test_end,
        avg_kw              = src.avg_kw,
        avg_kva             = src.avg_kva,
        avg_pf              = src.avg_pf,
        avg_kvar            = src.avg_kvar,
        peak_kva            = src.peak_kva,
        kwh_savings_pct     = src.kwh_savings_pct,
        kw_peak_savings_pct = src.kw_peak_savings_pct,
        pf_savings_pct      = src.pf_savings_pct,
        notes               = body.get("notes") or f"Versioned forward from V{src.version}",
        createdAt           = now,
        updatedAt           = now,
    )
    sess.add(new_b)
    sess.commit()
    audit("baseline.version_forward", user_id=current_user.id,
          entity_type="baseline", entity_id=new_b.id,
          detail={"from_baseline_id": from_id, "from_version": src.version,
                  "new_version": new_b.version})
    return {"data": _b_dict(new_b)}, 201


# ── Auto-compute metrics from meterdata ───────────────────────────────────────

@baseline_bp.route("/<int:bid>/compute", methods=["POST"])
@login_required
@require_roles(_BASELINE_WRITE_ROLES)
def compute_baseline(bid: int):
    """
    POST /api/baseline/<id>/compute

    Queries meterdata for the baseline's project and test window (test_start →
    test_end) and computes avg_kw, avg_kva, avg_kvar, avg_pf, peak_kva,
    sample_count.  Writes the result back to the baseline row.

    The baseline must have test_start and test_end set and must NOT be locked.

    Response:
      { "data": { baseline fields }, "computed": { raw stats } }
    """
    from app.services.baseline_compute import compute_baseline_metrics

    b = get_session().query(Baseline).filter_by(id=bid).first()
    if not b:
        return {"error": "Not found"}, 404
    if not _can_access_project(b.project_id):
        return {"error": "Not found"}, 404

    try:
        stats = compute_baseline_metrics(bid)
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except Exception as exc:
        logger.exception("[baseline.compute] unexpected error: %s", exc)
        return {"error": "Compute failed — check server logs"}, 500

    # Refresh the row after commit inside the service
    b = get_session().query(Baseline).filter_by(id=bid).first()
    audit("baseline.computed", user_id=current_user.id,
          entity_type="baseline", entity_id=bid,
          detail={"sample_count": stats.get("sample_count"),
                  "avg_kw": stats.get("avg_kw"),
                  "avg_pf": stats.get("avg_pf")})
    return {"data": _b_dict(b), "computed": stats}
