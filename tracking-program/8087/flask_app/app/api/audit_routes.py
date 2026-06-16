"""
Audit log query routes — Phase 1.

GET /api/audit/
  Query params:
    user_id, org_id, action, entity_type, entity_id
    from_ts, to_ts  (JS timestamps)
    page, page_size (default 50)

Only super admin (8) or OEM admin (9) may read logs.
OEM admin is automatically scoped to their org_id.
"""
from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.audit_log import AuditLog

audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit")


@audit_bp.route("/", methods=["GET"])
@login_required
def list_audit():
    role = getattr(current_user, "role", 0)
    if role not in (8, 9):
        return {"error": "Forbidden"}, 403

    sess      = get_session()
    q         = sess.query(AuditLog)
    args      = request.args

    # OEM admin scoped to their org
    if role == 9:
        org_id = getattr(current_user, "org_id", None)
        if not org_id:
            return {"data": [], "total": 0}
        q = q.filter(AuditLog.org_id == org_id)
    elif args.get("org_id"):
        q = q.filter(AuditLog.org_id == args["org_id"])

    if args.get("user_id"):
        try:
            q = q.filter(AuditLog.user_id == int(args["user_id"]))
        except ValueError:
            pass
    if args.get("action"):
        q = q.filter(AuditLog.action.like(f"%{args['action']}%"))
    if args.get("entity_type"):
        q = q.filter(AuditLog.entity_type == args["entity_type"])
    if args.get("entity_id"):
        try:
            q = q.filter(AuditLog.entity_id == int(args["entity_id"]))
        except ValueError:
            pass
    if args.get("from_ts"):
        try:
            q = q.filter(AuditLog.createdAt >= int(args["from_ts"]))
        except ValueError:
            pass
    if args.get("to_ts"):
        try:
            q = q.filter(AuditLog.createdAt <= int(args["to_ts"]))
        except ValueError:
            pass

    total     = q.count()
    page_size = min(int(args.get("page_size", 50)), 200)
    page      = max(int(args.get("page", 1)), 1)
    rows      = q.order_by(AuditLog.createdAt.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "data": [
            {
                "id":          r.id,
                "user_id":     r.user_id,
                "org_id":      r.org_id,
                "action":      r.action,
                "entity_type": r.entity_type,
                "entity_id":   r.entity_id,
                "ip_address":  r.ip_address,
                "detail":      r.detail,
                "createdAt":   r.createdAt,
            }
            for r in rows
        ],
        "total":     total,
        "page":      page,
        "page_size": page_size,
    }
