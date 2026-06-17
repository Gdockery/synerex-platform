"""
Commercial Platform™ routes — Phase 13.

Spec: ECBS OS v4 §40 (Meter License Manager™), §41 (Royalty Engine™),
      §42 (OEM Administration™), §43 (White-Label Branding™),
      Appendix B-25, C-28 / C-29

Modules
───────
Meter License Manager™:
  GET  /api/licenses                      License dashboard KPIs
  GET  /api/licensed-meters               Paginated list of all licensed meters
  POST /api/licenses/<id>/activate        Activate a meter license
  POST /api/licenses/<id>/suspend         Suspend a meter license
  POST /api/licenses/<id>/expire          Mark a license as expired

Synerex Royalty Engine™:
  GET  /api/royalties                     List royalty records
  GET  /api/oems/<org_id>/royalties       OEM royalty summary
  POST /api/royalties/generate            Generate royalties for a period
  POST /api/royalties/<id>/mark-paid      Mark a royalty record as paid

OEM Administration™:
  GET  /api/oem/admin/dashboard           OEM admin dashboard (super admin only)
  GET  /api/oem/admin/list                All OEMs with metrics (super admin only)

White-Label Branding™:
  GET  /api/oem/branding/<org_id>         Get OEM branding
  PUT  /api/oem/branding/<org_id>         Update OEM branding
"""
import time as _time
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.extensions import db
from app.models.meter_license import MeterLicense, LICENSE_STATES
from app.models.oem import Oem
from app.models.oem_branding import OemBranding
from app.models.royalty import Royalty, ROYALTY_STATUS_PAID, ROYALTY_STATUS_INVOICED

commercial_bp = Blueprint("commercial", __name__, url_prefix="")


def _now_ms() -> int:
    return int(_time.time() * 1000)


def _is_super_admin() -> bool:
    return getattr(current_user, "role", 0) == 8


def _is_oem_admin() -> bool:
    return getattr(current_user, "role", 0) in (8, 9)


def _current_org_id() -> str | None:
    """Resolve the current user's OEM org_id."""
    from flask import session
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
    if not org_id:
        org_id = getattr(current_user, "org_id", None)
    return org_id


def _license_to_dict(lic: MeterLicense) -> dict:
    return {
        "id":           lic.id,
        "meter_id":     lic.meter_id,
        "oem_org_id":   lic.oem_org_id,
        "state":        lic.state,
        "activated_at": lic.activated_at,
        "expires_at":   lic.expires_at,
        "grace_ends_at": lic.grace_ends_at,
        "suspended_at": lic.suspended_at,
        "suspended_by": lic.suspended_by,
        "notes":        lic.notes,
        "createdAt":    lic.createdAt,
        "updatedAt":    lic.updatedAt,
    }


def _royalty_to_dict(r: Royalty) -> dict:
    return {
        "id":               r.id,
        "oem_org_id":       r.oem_org_id,
        "period":           r.period,
        "licensed_meters":  r.licensed_meters,
        "active_meters":    r.active_meters,
        "revenue":          r.revenue,
        "royalty_rate":     r.royalty_rate,
        "meter_fee":        r.meter_fee,
        "royalty_due":      r.royalty_due,
        "status":           r.status,
        "calculated_at":    r.calculated_at,
        "paid_at":          r.paid_at,
        "invoice_ref":      r.invoice_ref,
        "notes":            r.notes,
        "createdAt":        r.createdAt,
        "updatedAt":        r.updatedAt,
    }


def _branding_to_dict(b: OemBranding) -> dict:
    return {
        "id":                b.id,
        "org_id":            b.org_id,
        "brand_name":        b.brand_name,
        "logo_path":         b.logo_path,
        "white_logo_path":   b.white_logo_path,
        "primary_color":     b.primary_color,
        "secondary_color":   b.secondary_color,
        "support_email":     b.support_email,
        "website_url":       b.website_url,
        "portal_title":      b.portal_title,
        "smtp_server":       b.smtp_server,
        "smtp_port":         b.smtp_port,
        "smtp_username":     b.smtp_username,
        "smtp_from_address": b.smtp_from_address,
        "smtp_from_name":    b.smtp_from_name,
        "smtp_use_tls":      b.smtp_use_tls,
        "insurance_policy":  b.insurance_policy,
        "createdAt":         b.createdAt,
        "updatedAt":         b.updatedAt,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Meter License Manager™
# ─────────────────────────────────────────────────────────────────────────────

@commercial_bp.route("/api/licenses")
@login_required
def license_dashboard():
    """
    Meter License Manager™ dashboard KPIs.
    Spec §40: Licensed Meters, Active Meters, Available Licenses,
              Suspended Licenses, Revenue, Royalties.
    Super admin sees all OEMs; OEM admin sees their own.
    """
    if not _is_oem_admin():
        return jsonify({"error": "Forbidden"}), 403

    org_id = None if _is_super_admin() else _current_org_id()

    from app.services.royalty_engine import license_dashboard as _dash
    return jsonify(_dash(oem_org_id=org_id))


@commercial_bp.route("/api/licensed-meters")
@login_required
def licensed_meters_list():
    """
    Paginated list of all licensed meters.
    Spec Appendix C-28.
    """
    if not _is_oem_admin():
        return jsonify({"error": "Forbidden"}), 403

    org_id = None if _is_super_admin() else _current_org_id()
    state  = request.args.get("state")
    limit  = min(int(request.args.get("limit", 100)), 500)
    offset = int(request.args.get("offset", 0))

    q = MeterLicense.query
    if org_id:
        q = q.filter_by(oem_org_id=org_id)
    if state and state in LICENSE_STATES:
        q = q.filter_by(state=state)

    total = q.count()
    rows  = q.order_by(MeterLicense.createdAt.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total":   total,
        "offset":  offset,
        "limit":   limit,
        "meters":  [_license_to_dict(l) for l in rows],
    })


@commercial_bp.route("/api/licenses/<int:license_id>/activate", methods=["POST"])
@login_required
def license_activate(license_id: int):
    """Activate a meter license (state → active)."""
    if not _is_oem_admin():
        return jsonify({"error": "Forbidden"}), 403

    lic = MeterLicense.query.get_or_404(license_id)
    now = _now_ms()
    lic.state        = "active"
    lic.activated_at = lic.activated_at or now
    lic.updatedAt    = now
    db.session.commit()
    return jsonify(_license_to_dict(lic))


@commercial_bp.route("/api/licenses/<int:license_id>/suspend", methods=["POST"])
@login_required
def license_suspend(license_id: int):
    """Suspend a meter license (state → suspended)."""
    if not _is_oem_admin():
        return jsonify({"error": "Forbidden"}), 403

    lic  = MeterLicense.query.get_or_404(license_id)
    body = request.get_json(silent=True) or {}
    now  = _now_ms()
    lic.state        = "suspended"
    lic.suspended_at = now
    lic.suspended_by = getattr(current_user, "id", None)
    lic.notes        = body.get("notes") or lic.notes
    lic.updatedAt    = now
    db.session.commit()
    return jsonify(_license_to_dict(lic))


@commercial_bp.route("/api/licenses/<int:license_id>/expire", methods=["POST"])
@login_required
def license_expire(license_id: int):
    """Mark a meter license as expired (state → expired)."""
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    lic = MeterLicense.query.get_or_404(license_id)
    lic.state     = "expired"
    lic.updatedAt = _now_ms()
    db.session.commit()
    return jsonify(_license_to_dict(lic))


# ─────────────────────────────────────────────────────────────────────────────
# Synerex Royalty Engine™
# ─────────────────────────────────────────────────────────────────────────────

@commercial_bp.route("/api/royalties")
@login_required
def royalties_list():
    """
    List royalty records.
    Super admin sees all; OEM admin sees own.
    """
    if not _is_oem_admin():
        return jsonify({"error": "Forbidden"}), 403

    org_id  = None if _is_super_admin() else _current_org_id()
    period  = request.args.get("period")
    status  = request.args.get("status")
    limit   = min(int(request.args.get("limit", 50)), 200)
    offset  = int(request.args.get("offset", 0))

    q = Royalty.query
    if org_id:
        q = q.filter_by(oem_org_id=org_id)
    if period:
        q = q.filter_by(period=period)
    if status:
        q = q.filter_by(status=status)

    total = q.count()
    rows  = q.order_by(Royalty.period.desc(), Royalty.oem_org_id).offset(offset).limit(limit).all()

    return jsonify({
        "total":     total,
        "royalties": [_royalty_to_dict(r) for r in rows],
    })


@commercial_bp.route("/api/oems/<string:org_id>/royalties")
@login_required
def oem_royalties(org_id: str):
    """
    OEM royalty summary (monthly/quarterly/annual totals, outstanding balance).
    OEM admin can only read their own; super admin can read any.
    """
    if not _is_super_admin():
        current_org = _current_org_id()
        if current_org != org_id:
            return jsonify({"error": "Forbidden"}), 403

    from app.services.royalty_engine import oem_royalty_summary
    periods = request.args.get("periods", 12, type=int)
    summary = oem_royalty_summary(org_id, periods=min(periods, 60))
    return jsonify(summary)


@commercial_bp.route("/api/royalties/generate", methods=["POST"])
@login_required
def royalties_generate():
    """
    Generate royalty records for a given period (defaults to prior month).
    Super admin only.
    """
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    body    = request.get_json(silent=True) or {}
    period  = body.get("period")
    org_id  = body.get("oem_org_id")   # optional: single OEM

    from app.services.royalty_engine import (
        generate_all_royalties, calculate_royalty_for_oem
    )

    if org_id:
        result = [calculate_royalty_for_oem(
            oem_org_id=org_id,
            period=period,
            revenue=body.get("revenue"),
            royalty_rate=body.get("royalty_rate"),
            meter_fee=body.get("meter_fee"),
            calculated_by=getattr(current_user, "id", None),
        )]
    else:
        result = generate_all_royalties(
            period=period,
            calculated_by=getattr(current_user, "id", None),
        )

    return jsonify({"generated": len(result), "results": result}), 201


@commercial_bp.route("/api/royalties/<int:royalty_id>/mark-paid", methods=["POST"])
@login_required
def royalty_mark_paid(royalty_id: int):
    """Mark a royalty record as paid. Super admin only."""
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    row  = Royalty.query.get_or_404(royalty_id)
    body = request.get_json(silent=True) or {}
    now  = _now_ms()

    row.status      = ROYALTY_STATUS_PAID
    row.paid_at     = now
    row.paid_by     = getattr(current_user, "id", None)
    row.invoice_ref = body.get("invoice_ref") or row.invoice_ref
    row.notes       = body.get("notes")       or row.notes
    row.updatedAt   = now
    db.session.commit()
    return jsonify(_royalty_to_dict(row))


# ─────────────────────────────────────────────────────────────────────────────
# OEM Administration™
# ─────────────────────────────────────────────────────────────────────────────

@commercial_bp.route("/api/oem/admin/dashboard")
@login_required
def oem_admin_dashboard():
    """
    Synerex Super Admin OEM overview dashboard.
    Spec §42: OEM Name, Active Customers, Active Sites, Active Meters,
              Revenue, Royalty Due.
    Super admin only.
    """
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    oems = Oem.query.filter_by(is_active=True).all()

    from app.services.royalty_engine import license_dashboard as _lic_dash
    result = []
    for oem in oems:
        dash = _lic_dash(oem_org_id=oem.org_id)

        # Count projects for this OEM
        project_count = 0
        try:
            from app.models.project import Project
            project_count = Project.query.filter(
                Project.orgId == oem.org_id,
                Project.isDeleted == False,
            ).count()
        except Exception:
            pass

        result.append({
            "org_id":              oem.org_id,
            "name":                oem.name,
            "domain":              oem.domain,
            "is_active":           oem.is_active,
            "contact_email":       oem.contact_email,
            "active_projects":     project_count,
            "licensed_meters":     dash["licensed_meters"],
            "active_meters":       dash["active_meters"],
            "suspended_meters":    dash["suspended_meters"],
            "outstanding_royalties": dash["outstanding_royalties"],
        })

    total_meters    = sum(r["licensed_meters"]     for r in result)
    total_active    = sum(r["active_meters"]        for r in result)
    total_royalties = sum(r["outstanding_royalties"] for r in result)

    return jsonify({
        "oem_count":            len(result),
        "total_licensed_meters": total_meters,
        "total_active_meters":  total_active,
        "total_outstanding_royalties": round(total_royalties, 2),
        "oems":                 result,
    })


@commercial_bp.route("/api/oem/admin/list")
@login_required
def oem_admin_list():
    """List all OEMs with status and meter counts. Super admin only."""
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    oems = Oem.query.order_by(Oem.name).all()
    result = []
    for oem in oems:
        meters = MeterLicense.query.filter_by(oem_org_id=oem.org_id).count()
        active = MeterLicense.query.filter_by(oem_org_id=oem.org_id, state="active").count()
        result.append({
            "id":            oem.id,
            "org_id":        oem.org_id,
            "name":          oem.name,
            "slug":          oem.slug,
            "domain":        oem.domain,
            "is_active":     oem.is_active,
            "contact_email": oem.contact_email,
            "total_meters":  meters,
            "active_meters": active,
            "createdAt":     oem.createdAt,
        })

    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# White-Label Branding™
# ─────────────────────────────────────────────────────────────────────────────

@commercial_bp.route("/api/oem/branding/<string:org_id>")
@login_required
def branding_get(org_id: str):
    """
    Get OEM branding settings.
    OEM admins can read their own; super admin can read any.
    """
    if not _is_super_admin():
        current_org = _current_org_id()
        if current_org != org_id:
            return jsonify({"error": "Forbidden"}), 403

    b = OemBranding.query.filter_by(org_id=org_id).first()
    if not b:
        return jsonify({"error": "Branding not found for org_id"}), 404
    return jsonify(_branding_to_dict(b))


@commercial_bp.route("/api/oem/branding/<string:org_id>", methods=["PUT"])
@login_required
def branding_update(org_id: str):
    """
    Update OEM branding settings.
    OEM admins can update their own; super admin can update any.
    Branding restrictions (spec §43): OEMs may NOT modify licensing enforcement,
    analytics engines, database structures, or security framework.
    """
    if not _is_super_admin():
        current_org = _current_org_id()
        if current_org != org_id:
            return jsonify({"error": "Forbidden"}), 403

    body = request.get_json(silent=True) or {}
    now  = _now_ms()

    b = OemBranding.query.filter_by(org_id=org_id).first()
    if not b:
        # Create new branding record
        b = OemBranding(
            org_id=org_id,
            createdAt=now,
            updatedAt=now,
        )
        db.session.add(b)

    # Allowed branding fields (spec §43: Logo, Company Name, Theme Colors,
    # Login Screen, Dashboard Branding, Reports, Email Templates)
    allowed_fields = (
        "brand_name", "logo_path", "white_logo_path",
        "primary_color", "secondary_color",
        "support_email", "website_url", "portal_title",
        "smtp_server", "smtp_port", "smtp_username",
        "smtp_from_address", "smtp_from_name", "smtp_use_tls",
        "insurance_policy",
    )
    # Never allow these (spec §43 restrictions):
    # "license enforcement", "analytics engines", "database structures", "security framework"
    # (they are not fields on this model, but belt-and-suspenders)

    for field in allowed_fields:
        if field in body:
            setattr(b, field, body[field])

    b.updatedAt = now
    db.session.commit()
    return jsonify(_branding_to_dict(b))


@commercial_bp.route("/api/oem/branding/<string:org_id>", methods=["POST"])
@login_required
def branding_create(org_id: str):
    """Create OEM branding (super admin only — use PUT for updates)."""
    if not _is_super_admin():
        return jsonify({"error": "Forbidden — Synerex Admin only"}), 403

    body = request.get_json(silent=True) or {}
    now  = _now_ms()

    existing = OemBranding.query.filter_by(org_id=org_id).first()
    if existing:
        return jsonify({"error": "Branding already exists; use PUT to update"}), 409

    b = OemBranding(
        org_id=org_id,
        brand_name=body.get("brand_name"),
        logo_path=body.get("logo_path"),
        white_logo_path=body.get("white_logo_path"),
        primary_color=body.get("primary_color"),
        secondary_color=body.get("secondary_color"),
        support_email=body.get("support_email"),
        website_url=body.get("website_url"),
        portal_title=body.get("portal_title"),
        smtp_server=body.get("smtp_server"),
        smtp_port=body.get("smtp_port"),
        smtp_username=body.get("smtp_username"),
        smtp_from_address=body.get("smtp_from_address"),
        smtp_from_name=body.get("smtp_from_name"),
        smtp_use_tls=body.get("smtp_use_tls", True),
        insurance_policy=body.get("insurance_policy"),
        createdAt=now,
        updatedAt=now,
    )
    db.session.add(b)
    db.session.commit()
    return jsonify(_branding_to_dict(b)), 201
