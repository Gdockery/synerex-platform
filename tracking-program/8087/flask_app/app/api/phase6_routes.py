"""
Phase 6: Alerts (meter, repeater, switch), Test, User (admin), Meter CSV.
Ported from api/controllers/web/
"""
import csv as csvmod
import io
import secrets
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, session
from flask_login import current_user, login_required

from app.extensions import db
from sqlalchemy import or_
from app.helpers.decorators import license_required
from app.models.meter import Meter
from app.models.meter_alert import MeterAlert
from app.models.meter_alert_group import MeterAlertGroup, meter_alert_group_user
from app.models.project import project_user
from app.models.repeater import Repeater
from app.models.repeater_alert import RepeaterAlert
from app.models.repeater_alert_group import RepeaterAlertGroup, repeater_alert_group_user
from app.models.switch import Switch
from app.models.switch_alert import SwitchAlert
from app.models.switch_alert_group import SwitchAlertGroup
from app.models.test import Test, gateway_test
from app.models.user import User
from app.models.client import Client
from app.models.meter_csv import MeterCSV
from app.models.project import Project
from app.models.gateway import Gateway
from app.helpers.project_access import user_has_project_access as _user_has_project_access

phase6_bp = Blueprint("phase6", __name__, url_prefix="")

# Meter CSV <-> Meter join (Waterline: meter_meters_meter__metercsv_meters)
metercsv_meter = db.Table(
    "meter_meters_meter__metercsv_meters",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("metercsv_meters", db.Integer, db.ForeignKey("metercsv.id")),
    db.Column("meter_meters_meter", db.Integer, db.ForeignKey("meter.id")),
)


def _send_invite_email(user, token, subject="Welcome to the Energy Portal"):
    """Send invite email when user is created without password.

    Always routes through the platform SMTP (MAIL_SERVER env var) or the OEM's
    own SMTP if configured. The email body is fully branded with the OEM's logo,
    color, and name so the client never sees 'Synerex'.
    """
    email_host = current_app.config.get("EMAIL_HOST", "").strip()
    if email_host:
        base_url = email_host.rstrip("/")
    else:
        base_url = current_app.config.get("TRACKING_BASE_URL", "http://localhost:8087").rstrip("/")
    invite_link = f"{base_url}/invite/accept?token={token}"

    # Resolve OEM branding + SMTP in one call
    smtp_cfg = _get_oem_smtp_for_current_user()
    brand_name = smtp_cfg.get("brand_name") or "Synerex"
    logo_url   = smtp_cfg.get("logo_url") or ""
    primary_color = smtp_cfg.get("primary_color") or "#1a73e8"
    support_email = smtp_cfg.get("support_email") or ""

    subject_full = subject.replace("the Energy Portal", f"{brand_name} Energy Portal")

    # Plain-text fallback
    body_text = (
        f"Hi {user.firstName},\n\n"
        f"You've been invited to join the {brand_name} Energy Portal!\n\n"
        f"Click the link below to set up your account and choose your password:\n\n"
        f"{invite_link}\n\n"
        f"If you have any questions, please contact your {brand_name} representative"
        + (f" at {support_email}" if support_email else "") + ".\n\n"
        f"Welcome aboard!\n"
        f"The {brand_name} Team"
    )

    # Branded HTML email
    logo_html = (
        f'<img src="{logo_url}" alt="{brand_name}" '
        f'style="max-height:60px; max-width:220px; display:block; margin:0 auto 16px auto;">'
        if logo_url else
        f'<div style="font-size:1.4em; font-weight:bold; color:white; '
        f'text-align:center; padding:8px 0;">{brand_name}</div>'
    )
    support_line = (
        f'<p style="color:#555; font-size:0.9em;">Questions? Contact us at '
        f'<a href="mailto:{support_email}" style="color:{primary_color};">{support_email}</a></p>'
        if support_email else ""
    )
    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header with brand color and logo -->
        <tr>
          <td style="background:{primary_color}; padding:28px 32px; text-align:center;">
            {logo_html}
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 16px 0; color:#222; font-size:1.3em;">
              Welcome to the {brand_name} Energy Portal!
            </h2>
            <p style="color:#444; line-height:1.6;">Hi {user.firstName},</p>
            <p style="color:#444; line-height:1.6;">
              You've been invited to join the <strong>{brand_name}</strong> Energy Portal.
              Click the button below to set up your account and choose your password.
            </p>
            <div style="text-align:center; margin:28px 0;">
              <a href="{invite_link}"
                 style="background:{primary_color}; color:#ffffff; text-decoration:none;
                        padding:14px 32px; border-radius:6px; font-size:1em;
                        font-weight:bold; display:inline-block;">
                Set Up My Account
              </a>
            </div>
            <p style="color:#888; font-size:0.85em; line-height:1.5;">
              Or copy and paste this link into your browser:<br>
              <a href="{invite_link}" style="color:{primary_color}; word-break:break-all;">{invite_link}</a>
            </p>
            {support_line}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8; padding:16px 40px; text-align:center;
                     border-top:1px solid #eee; color:#aaa; font-size:0.8em;">
            &copy; {brand_name}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    _send_email_via_smtp(
        smtp_cfg=smtp_cfg,
        to_address=user.email,
        subject=subject_full,
        body_text=body_text,
        body_html=body_html,
        log_label=f"Invite email to {user.email}",
        fallback_invite_link=invite_link,
    )


def _get_oem_smtp_for_current_user():
    """Return SMTP config + branding dict for the currently-logged-in user's OEM org.

    Always starts with platform-level MAIL_SERVER (the Synerex SMTP) so a single
    SMTP account powers all OEM emails. The OEM's brand_name is set as the From
    display name so clients see the OEM's name, not Synerex.

    If the OEM has configured their own SMTP credentials in Branding Settings those
    will be used instead (fully white-labeled sending address).

    Returns a dict with keys:
      server, port, use_tls, username, password, from_address, from_name,
      brand_name, logo_url, primary_color, support_email
    """
    cfg = {
        "server":       current_app.config.get("MAIL_SERVER", ""),
        "port":         current_app.config.get("MAIL_PORT", 587),
        "use_tls":      current_app.config.get("MAIL_USE_TLS", True),
        "username":     current_app.config.get("MAIL_USERNAME", ""),
        "password":     current_app.config.get("MAIL_PASSWORD", ""),
        "from_address": current_app.config.get("MAIL_FROM", "noreply@tracking.local"),
        "from_name":    None,       # Set to OEM brand name below
        "brand_name":   "Synerex",
        "logo_url":     "",
        "primary_color": "#1a73e8",
        "support_email": "",
    }
    try:
        from flask_login import current_user as _cu
        from app.db.request_session import get_session as _gs
        from app.models.oem_branding import OemBranding
        from flask import session as _sess
        from flask import request as _req

        # Determine org_id from session or user record
        org_id = (
            _sess.get("orgId")
            or (_sess.get("user") or {}).get("orgId")
            or (_sess.get("user") or {}).get("org_id")
        )
        if not org_id and _cu.is_authenticated and _cu.client:
            from app.models.client import Client as _C
            _c = _gs().query(_C).get(_cu.client)
            if _c:
                org_id = getattr(_c, "org_id", None)

        if org_id:
            b = _gs().query(OemBranding).filter_by(org_id=org_id).first()
            if b:
                if b.brand_name:
                    cfg["brand_name"] = b.brand_name
                    # Use OEM brand name as the email display name so clients see
                    # "Acme Energy <noreply@synerexlabs.com>" not just the address
                    cfg["from_name"] = b.smtp_from_name or b.brand_name
                if b.support_email:
                    cfg["support_email"] = b.support_email
                if b.primary_color:
                    cfg["primary_color"] = b.primary_color
                if b.logo_path:
                    safe_org = "".join(c if c.isalnum() or c in "-_" else "_" for c in org_id)
                    # Build absolute logo URL using the request host
                    try:
                        base = _req.host_url.rstrip("/")
                        app_root = current_app.config.get("APPLICATION_ROOT", "").rstrip("/")
                        cfg["logo_url"] = f"{base}{app_root}/tracking-images/oem_logo/{safe_org}"
                    except Exception:
                        cfg["logo_url"] = ""

                # Override SMTP only if the OEM has set their own credentials
                if b.smtp_server and b.smtp_username and b.smtp_password:
                    cfg["server"]       = b.smtp_server
                    cfg["port"]         = b.smtp_port or 587
                    cfg["use_tls"]      = b.smtp_use_tls if b.smtp_use_tls is not None else True
                    cfg["username"]     = b.smtp_username
                    cfg["password"]     = b.smtp_password
                    cfg["from_address"] = b.smtp_from_address or b.smtp_username
                    if b.smtp_from_name:
                        cfg["from_name"] = b.smtp_from_name
    except Exception as _e:
        current_app.logger.debug("Could not resolve OEM SMTP/branding config: %s", _e)
    return cfg


def _send_email_via_smtp(smtp_cfg, to_address, subject, body_text, body_html=None,
                          log_label="Email", fallback_invite_link=None):
    """Low-level helper: send an email using the given smtp_cfg dict.

    If SMTP is not configured, logs the invite link (dev mode) or silently skips.
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    server = smtp_cfg.get("server", "")
    username = smtp_cfg.get("username", "")
    password = smtp_cfg.get("password", "")
    from_addr = smtp_cfg.get("from_address") or username or "noreply@tracking.local"
    from_name = smtp_cfg.get("from_name")
    from_header = f"{from_name} <{from_addr}>" if from_name else from_addr

    if not server or not username:
        if fallback_invite_link:
            current_app.logger.info("%s — no SMTP configured: %s", log_label, fallback_invite_link)
        return

    try:
        if body_html:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(body_text, "plain"))
            msg.attach(MIMEText(body_html, "html"))
        else:
            msg = MIMEText(body_text, "plain")

        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = to_address

        port = smtp_cfg.get("port", 587)
        use_tls = smtp_cfg.get("use_tls", True)
        if port == 465:
            _smtp_ctx = smtplib.SMTP_SSL(server, port)
        else:
            _smtp_ctx = smtplib.SMTP(server, port)
            if use_tls:
                _smtp_ctx.starttls()
        with _smtp_ctx as s:
            if password:
                s.login(username, password)
            s.sendmail(from_addr, [to_address], msg.as_string())
        current_app.logger.info("%s sent successfully via %s", log_label, server)
    except Exception as e:
        current_app.logger.exception("Failed to send %s: %s", log_label, e)






def _role_friendly_name(role):
    names = {1: "Client User", 2: "Client Admin", 3: "Client Manager", 4: "Xeco User",
             7: "Account Manager", 8: "Synerex Admin", 9: "OEM Admin", 10: "OEM User"}
    return names.get(role, "User")


# ----- METER ALERT -----

@phase6_bp.route("/api/meter/alert", methods=["GET"])
@login_required
@license_required
def list_meter_alerts():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    groups = MeterAlertGroup.query.filter_by(project=project).order_by(MeterAlertGroup.threshold, MeterAlertGroup.delay).all()
    out = []
    for g in groups:
        count = MeterAlert.query.filter_by(group=g.id).count()
        user_ids = [r[0] for r in db.session.query(meter_alert_group_user.c.user_meteralertgroups).filter(
            meter_alert_group_user.c.meteralertgroup_users == g.id
        ).all()]
        users = []
        for uid in user_ids:
            u = User.query.get(uid)
            if u:
                users.append({"id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email})
        out.append({"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "delay": g.delay or 0, "deviceCount": count, "users": users})
    return jsonify({"meta": {}, "response": out})


@phase6_bp.route("/api/meter/alert/<int:aid>", methods=["GET"])
@login_required
@license_required
def get_meter_alert_details(aid):
    g = MeterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    alerts = MeterAlert.query.filter_by(group=g.id).all()
    devices = []
    for a in alerts:
        m = Meter.query.get(a.meter)
        if m:
            devices.append({"id": m.id, "name": m.name})
    user_ids = [r[0] for r in db.session.query(meter_alert_group_user.c.user_meteralertgroups).filter(
        meter_alert_group_user.c.meteralertgroup_users == g.id
    ).all()]
    users = [{"id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email}
             for uid in user_ids for u in [User.query.get(uid)] if u]
    return jsonify({"meta": {}, "response": {"alertType": g.alertType, "threshold": g.threshold, "delay": g.delay or 0, "devices": devices, "users": users}})


@phase6_bp.route("/api/meter/alert", methods=["POST"])
@login_required
@license_required
def create_meter_alert():
    data = request.get_json() or {}
    project = data.get("project")
    meters = data.get("meters", [])
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    if not meters or not all(isinstance(m, int) for m in meters):
        return jsonify({"error": "meters required"}), 400
    alert_type = data.get("alertType")
    if alert_type not in (1, 2):  # HIGH_DEMAND, GATEWAY_ERROR
        return jsonify({"error": "badAlertType"}), 400
    threshold = data.get("threshold", 0)
    delay = data.get("delay", 0)
    if alert_type == 1 and not delay:
        return jsonify({"error": "badAlertParameters"}), 400
    users = data.get("users") or []

    # Validate meters belong to project
    for mid in meters:
        m = Meter.query.filter_by(id=mid, project=project, isDeleted=False).first()
        if not m:
            return jsonify({"error": "badDeviceIds"}), 400

    g = MeterAlertGroup(project=project, alertType=alert_type, threshold=float(threshold), delay=float(delay) if delay else None, isDeleted=False)
    db.session.add(g)
    db.session.flush()
    for mid in meters:
        db.session.add(MeterAlert(meter=mid, group=g.id))
    for uid in users:
        if User.query.get(uid):
            db.session.execute(meter_alert_group_user.insert().values(meteralertgroup_users=g.id, user_meteralertgroups=uid))
    db.session.commit()
    out_users = [{"id": User.query.get(uid).id, "firstName": User.query.get(uid).firstName, "lastName": User.query.get(uid).lastName, "email": User.query.get(uid).email} for uid in users if User.query.get(uid)]
    return jsonify({"meta": {}, "response": {"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "delay": g.delay or 0, "deviceCount": len(meters), "users": out_users}})


@phase6_bp.route("/api/meter/alert/<int:aid>", methods=["PUT"])
@login_required
@license_required
def update_meter_alert(aid):
    g = MeterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    meters = data.get("meters")
    users = data.get("users")
    if meters is not None:
        for mid in meters:
            m = Meter.query.filter_by(id=mid, project=g.project, isDeleted=False).first()
            if not m:
                return jsonify({"error": "badDeviceIds"}), 400
        MeterAlert.query.filter_by(group=g.id).delete()
        for mid in meters:
            db.session.add(MeterAlert(meter=mid, group=g.id))
    if users is not None:
        db.session.execute(meter_alert_group_user.delete().where(meter_alert_group_user.c.meteralertgroup_users == g.id))
        for uid in users:
            if User.query.get(uid):
                db.session.execute(meter_alert_group_user.insert().values(meteralertgroup_users=g.id, user_meteralertgroups=uid))
    db.session.commit()
    return get_meter_alert_details(aid)


@phase6_bp.route("/api/meter/alert/<int:aid>", methods=["DELETE"])
@login_required
@license_required
def remove_meter_alert(aid):
    g = MeterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    MeterAlert.query.filter_by(group=g.id).delete()
    db.session.execute(meter_alert_group_user.delete().where(meter_alert_group_user.c.meteralertgroup_users == g.id))
    g.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id}})


@phase6_bp.route("/api/meter/alert/events", methods=["GET"])
@login_required
@license_required
def list_meter_alert_events():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.meter_alert_event import MeterAlertEvent
    events = (MeterAlertEvent.query
              .join(MeterAlertGroup, MeterAlertEvent.alertGroup == MeterAlertGroup.id)
              .filter(MeterAlertGroup.project == project)
              .order_by(MeterAlertEvent.createdAt.desc())
              .limit(100).all())
    return jsonify({"meta": {}, "response": [{"id": e.id, "createdAt": e.createdAt} for e in events]})


# ----- REPEATER ALERT (same pattern) -----

@phase6_bp.route("/api/repeater/alert", methods=["GET"])
@login_required
@license_required
def list_repeater_alerts():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    groups = RepeaterAlertGroup.query.filter_by(project=project).order_by(RepeaterAlertGroup.threshold).all()
    out = []
    for g in groups:
        count = RepeaterAlert.query.filter_by(group=g.id).count()
        user_ids = [r[0] for r in db.session.query(repeater_alert_group_user.c.user_repeateralertgroups).filter(
            repeater_alert_group_user.c.repeateralertgroup_users == g.id
        ).all()]
        users = [{"id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email}
                 for uid in user_ids for u in [User.query.get(uid)] if u]
        out.append({"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "deviceCount": count, "users": users})
    return jsonify({"meta": {}, "response": out})


@phase6_bp.route("/api/repeater/alert/<int:aid>", methods=["GET"])
@login_required
@license_required
def get_repeater_alert_details(aid):
    g = RepeaterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    alerts = RepeaterAlert.query.filter_by(group=g.id).all()
    devices = [{"id": r.id, "name": r.name} for a in alerts for r in [Repeater.query.get(a.repeater)] if r]
    user_ids = [r[0] for r in db.session.query(repeater_alert_group_user.c.user_repeateralertgroups).filter(
        repeater_alert_group_user.c.repeateralertgroup_users == g.id
    ).all()]
    users = [{"id": u.id, "firstName": u.firstName, "lastName": u.lastName, "email": u.email} for uid in user_ids for u in [User.query.get(uid)] if u]
    return jsonify({"meta": {}, "response": {"alertType": g.alertType, "threshold": g.threshold, "devices": devices, "users": users}})


@phase6_bp.route("/api/repeater/alert", methods=["POST"])
@login_required
@license_required
def create_repeater_alert():
    data = request.get_json() or {}
    project = data.get("project")
    repeaters = data.get("repeaters", data.get("devices", []))
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    if not repeaters:
        return jsonify({"error": "repeaters required"}), 400
    alert_type = data.get("alertType", 1)
    threshold = data.get("threshold", 0)
    for rid in repeaters:
        r = Repeater.query.filter_by(id=rid, project=project, isDeleted=False).first()
        if not r:
            return jsonify({"error": "badDeviceIds"}), 400
    g = RepeaterAlertGroup(project=project, alertType=alert_type, threshold=float(threshold), isDeleted=False)
    db.session.add(g)
    db.session.flush()
    for rid in repeaters:
        db.session.add(RepeaterAlert(repeater=rid, group=g.id))
    for uid in (data.get("users") or []):
        if User.query.get(uid):
            db.session.execute(repeater_alert_group_user.insert().values(repeateralertgroup_users=g.id, user_repeateralertgroups=uid))
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "deviceCount": len(repeaters), "users": []}})


@phase6_bp.route("/api/repeater/alert/<int:aid>", methods=["PUT"])
@login_required
@license_required
def update_repeater_alert(aid):
    g = RepeaterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "repeaters" in data:
        RepeaterAlert.query.filter_by(group=g.id).delete()
        for rid in data["repeaters"]:
            db.session.add(RepeaterAlert(repeater=rid, group=g.id))
    if "users" in data:
        db.session.execute(repeater_alert_group_user.delete().where(repeater_alert_group_user.c.repeateralertgroup_users == g.id))
        for uid in data["users"]:
            if User.query.get(uid):
                db.session.execute(repeater_alert_group_user.insert().values(repeateralertgroup_users=g.id, user_repeateralertgroups=uid))
    db.session.commit()
    return get_repeater_alert_details(aid)


@phase6_bp.route("/api/repeater/alert/<int:aid>", methods=["DELETE"])
@login_required
@license_required
def remove_repeater_alert(aid):
    g = RepeaterAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    RepeaterAlert.query.filter_by(group=g.id).delete()
    db.session.execute(repeater_alert_group_user.delete().where(repeater_alert_group_user.c.repeateralertgroup_users == g.id))
    g.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id}})


@phase6_bp.route("/api/repeater/alert/events", methods=["GET"])
@login_required
@license_required
def list_repeater_alert_events():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.repeater_alert_event import RepeaterAlertEvent
    events = (RepeaterAlertEvent.query
              .join(RepeaterAlertGroup, RepeaterAlertEvent.alertGroup == RepeaterAlertGroup.id)
              .filter(RepeaterAlertGroup.project == project)
              .limit(100).all())
    return jsonify({"meta": {}, "response": [{"id": e.id, "createdAt": getattr(e, "createdAt", None)} for e in events]})


# ----- SWITCH ALERT (same pattern) -----

@phase6_bp.route("/api/switch/alert", methods=["GET"])
@login_required
@license_required
def list_switch_alerts():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    groups = SwitchAlertGroup.query.filter_by(project=project).order_by(SwitchAlertGroup.threshold).all()
    out = []
    for g in groups:
        count = SwitchAlert.query.filter_by(group=g.id).count()
        out.append({"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "deviceCount": count, "users": []})
    return jsonify({"meta": {}, "response": out})


@phase6_bp.route("/api/switch/alert/<int:aid>", methods=["GET"])
@login_required
@license_required
def get_switch_alert_details(aid):
    g = SwitchAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    alerts = SwitchAlert.query.filter_by(group=g.id).all()
    devices = [{"id": s.id, "name": s.name} for a in alerts for s in [Switch.query.get(a.switch)] if s]
    return jsonify({"meta": {}, "response": {"alertType": g.alertType, "threshold": g.threshold, "devices": devices, "users": []}})


@phase6_bp.route("/api/switch/alert", methods=["POST"])
@login_required
@license_required
def create_switch_alert():
    data = request.get_json() or {}
    project = data.get("project")
    switches = data.get("switches", data.get("devices", []))
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    if not switches:
        return jsonify({"error": "switches required"}), 400
    for sid in switches:
        s = Switch.query.filter_by(id=sid, project=project, isDeleted=False).first()
        if not s:
            return jsonify({"error": "badDeviceIds"}), 400
    g = SwitchAlertGroup(project=project, alertType=data.get("alertType", 1), threshold=float(data.get("threshold", 0)), isDeleted=False)
    db.session.add(g)
    db.session.flush()
    for sid in switches:
        db.session.add(SwitchAlert(switch=sid, group=g.id))
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id, "alertType": g.alertType, "threshold": g.threshold, "deviceCount": len(switches), "users": []}})


@phase6_bp.route("/api/switch/alert/<int:aid>", methods=["PUT"])
@login_required
@license_required
def update_switch_alert(aid):
    g = SwitchAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "switches" in data:
        SwitchAlert.query.filter_by(group=g.id).delete()
        for sid in data["switches"]:
            db.session.add(SwitchAlert(switch=sid, group=g.id))
    db.session.commit()
    return get_switch_alert_details(aid)


@phase6_bp.route("/api/switch/alert/<int:aid>", methods=["DELETE"])
@login_required
@license_required
def remove_switch_alert(aid):
    g = SwitchAlertGroup.query.get(aid)
    if not g or not _user_has_project_access(g.project):
        return jsonify({"error": "Not found"}), 404
    SwitchAlert.query.filter_by(group=g.id).delete()
    g.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id}})


@phase6_bp.route("/api/switch/alert/events", methods=["GET"])
@login_required
@license_required
def list_switch_alert_events():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.switch_alert_event import SwitchAlertEvent
    events = (SwitchAlertEvent.query
              .join(SwitchAlertGroup, SwitchAlertEvent.alertGroup == SwitchAlertGroup.id)
              .filter(SwitchAlertGroup.project == project)
              .limit(100).all())
    return jsonify({"meta": {}, "response": [{"id": e.id} for e in events]})


# ----- TEST -----

@phase6_bp.route("/api/test", methods=["GET"])
@login_required
@license_required
def list_tests():
    project = request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    show_cancelled = request.args.get("showCancelled", "true").lower() != "false"
    q = Test.query.filter_by(project=project)
    if not show_cancelled:
        q = q.filter_by(isDeleted=False)
    tests = q.all()
    import time
    now = int(time.time() * 1000)
    out = []
    for t in tests:
        end_at = t.startAt + (t.duration or 0) * 60 * 60 * 1000
        out.append({
            "id": t.id, "inProgress": now >= t.startAt and now < end_at,
            "completed": now > end_at, "startAt": t.startAt, "duration": t.duration,
            "interval": t.interval, "isDeleted": t.isDeleted or False,
            "gateways": [r[0] for r in db.session.query(gateway_test.c.test_gateways).filter(gateway_test.c.gateway_tests == t.id).all()]
        })
    return jsonify({"meta": {"count": len(out)}, "response": out})


@phase6_bp.route("/api/test", methods=["POST"])
@login_required
@license_required
def create_test():
    import time as _time
    from app.models.switch_command import SwitchCommand
    from app.models.project import Project
    from app.services.device_service import send_switch_command

    data = request.get_json() or {}
    project = data.get("project")
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    gateways = data.get("gateways") or []
    try:
        start_at = int(data.get("startAt"))
        duration = float(data.get("duration"))
        interval = float(data.get("interval") or 1)
    except (TypeError, ValueError):
        return jsonify({"error": "startAt, duration, and interval must be numbers"}), 400
    if start_at is None or duration is None:
        return jsonify({"error": "startAt and duration required"}), 400
    now = int(_time.time() * 1000)
    if start_at < now + 5 * 60 * 1000:
        return jsonify({"error": "startTimeTooSoon"}), 400
    if duration < 0 or int(duration) != duration:
        return jsonify({"error": "invalidDuration"}), 400
    if interval <= 0:
        return jsonify({"error": "invalidInterval"}), 400

    end_at = start_at + duration * 60 * 60 * 1000
    t = Test(project=project, startAt=start_at, endAt=end_at, duration=duration, interval=interval, isDeleted=False)
    db.session.add(t)
    db.session.flush()
    for gid in gateways:
        db.session.execute(gateway_test.insert().values(gateway_tests=gid, test_gateways=t.id))

    proj = Project.query.get(project)
    cmd_types = current_app.config.get("SWITCH_COMMAND_TYPES", {"POWER_ON": 1, "POWER_OFF": 2})
    power_off = cmd_types.get("POWER_OFF", 2)
    power_on = cmd_types.get("POWER_ON", 1)

    from sqlalchemy import text
    switches = Switch.query.filter_by(project=project, isDeleted=False, deviceType=1).all()
    num_segments = int(duration // interval)
    schedule_id = f"t-{t.id}"

    iot_protocol = current_app.config.get("IOT_PROTOCOL", "none")

    for seg in range(num_segments):
        command_type = power_off if seg % 2 == 0 else power_on
        # Use float interval directly so sub-hour values (e.g. 0.5 h = 30 min) work correctly.
        # int(seg * interval * 3600000) converts to ms without truncating the interval first.
        seg_start_at = start_at + int(seg * interval * 3600000)
        sc = SwitchCommand(
            project=project,
            commandType=command_type,
            startAt=seg_start_at,
            test=t.id,
            deviceType=1,
        )
        db.session.add(sc)
        db.session.flush()
        for sw in switches:
            db.session.execute(
                text(
                    "INSERT INTO switch_switches_switch__switchcommand_switches "
                    "(switchcommand_switches, switch_switches_switch) VALUES (:sc_id, :switch_id) "
                    "ON DUPLICATE KEY UPDATE switchcommand_switches=switchcommand_switches"
                ),
                {"sc_id": sc.id, "switch_id": sw.id},
            )
            if iot_protocol and iot_protocol != "none":
                try:
                    send_switch_command(
                        project_slug=proj.slug if proj else str(project),
                        switch_id=sw.id,
                        command=command_type,
                        time_ms=seg_start_at,
                        switch_command_id=sc.id,
                        schedule_id=schedule_id,
                    )
                except Exception:
                    pass

    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": t.id, "startAt": t.startAt, "duration": t.duration, "interval": t.interval}})


@phase6_bp.route("/api/test/<int:tid>", methods=["DELETE"])
@login_required
@license_required
def remove_test(tid):
    from app.models.switch_command import SwitchCommand
    t = Test.query.get(tid)
    if not t or not _user_has_project_access(t.project):
        return jsonify({"error": "Not found"}), 404
    SwitchCommand.query.filter_by(test=tid, isCancelled=False).update({"isCancelled": True})
    t.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": tid}})


# ----- USER (admin) -----

def _get_oem_org_id_for_user(user):
    """Return org_id for OEM users (role 9, 10). None for non-OEM or if unset."""
    if not user or getattr(user, "role", None) not in (9, 10):
        return None
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId") or (session.get("user") or {}).get("org_id")
    if not org_id and user.client:
        oem_client = db.session.query(Client).get(user.client)
        if oem_client:
            org_id = getattr(oem_client, "org_id", None)
    # Fall back to org_id stored directly on the user row (JIT-provisioned OEM users)
    if not org_id:
        org_id = getattr(user, "org_id", None)
    return org_id


def _get_client_org_id_for_user(user):
    """Return org_id for client roles (1, 2, 3, 7). Checks client record first, then user.org_id directly (JIT users)."""
    if not user:
        return None
    if user.client:
        c = db.session.query(Client).get(user.client)
        org_id = getattr(c, "org_id", None) if c else None
        if org_id:
            return org_id
    return getattr(user, "org_id", None) or None


def _user_can_access_user(current_user_obj, target_user):
    """True if current user can access target user (view/edit/delete). Role 8: all; 9,10: same org; 1-7: same org."""
    if not current_user_obj or not target_user:
        return False
    # A user can always access their own record
    if current_user_obj.id == target_user.id:
        return True
    role = getattr(current_user_obj, "role", None)
    if role == 8:
        return True
    if role in (9, 10):
        oem_org_id = _get_oem_org_id_for_user(current_user_obj)
        if not oem_org_id:
            return False
        if not target_user.client:
            return False
        c = db.session.query(Client).get(target_user.client)
        return c is not None and (
            getattr(c, "org_id", None) == oem_org_id or getattr(c, "sponsor_org_id", None) == oem_org_id
        )
    if role in (1, 2, 3, 7):
        my_org = _get_client_org_id_for_user(current_user_obj)
        if not my_org:
            return False
        # Check target via client record, or via org_id directly (JIT-provisioned users)
        if target_user.client:
            c = db.session.query(Client).get(target_user.client)
            return c is not None and getattr(c, "org_id", None) == my_org
        return getattr(target_user, "org_id", None) == my_org
    return True


def _client_in_scope(user, client_id):
    """True if client_id is in scope for user when creating/assigning users. Role 8: any; 1-7: same org; 9,10: same org."""
    if not user:
        return False
    role = getattr(user, "role", None)
    if role == 8:
        return True
    if role in (9, 10):
        if not client_id:
            return True
        oem_org_id = _get_oem_org_id_for_user(user)
        if not oem_org_id:
            return False
        c = db.session.query(Client).get(client_id)
        return c is not None and (
            getattr(c, "org_id", None) == oem_org_id or getattr(c, "sponsor_org_id", None) == oem_org_id
        )
    if role in (1, 2, 3, 7):
        if not client_id:
            return True
        my_org = _get_client_org_id_for_user(user)
        if not my_org:
            return False
        c = db.session.query(Client).get(client_id)
        return c is not None and getattr(c, "org_id", None) == my_org
    return True


def _projects_in_scope(user, project_ids):
    """True if all project_ids belong to clients in user's scope. Role 8: any; 1-7: same org; 9,10: same org."""
    if not user or not project_ids:
        return True
    role = getattr(user, "role", None)
    if role == 8:
        return True
    if role in (9, 10):
        oem_org_id = _get_oem_org_id_for_user(user)
        if not oem_org_id:
            return False
        for pid in project_ids:
            p = Project.query.get(pid)
            if not p:
                return False
            c = db.session.query(Client).get(p.client) if p.client else None
            if not c:
                return False
            co, spo = getattr(c, "org_id", None), getattr(c, "sponsor_org_id", None)
            if co != oem_org_id and spo != oem_org_id:
                return False
        return True
    if role in (1, 2, 3, 7):
        my_org = _get_client_org_id_for_user(user)
        if not my_org:
            return False
        for pid in project_ids:
            p = Project.query.get(pid)
            if not p:
                return False
            c = db.session.query(Client).get(p.client) if p.client else None
            if not c or getattr(c, "org_id", None) != my_org:
                return False
        return True
    return True


@phase6_bp.route("/api/user", methods=["GET"])
@phase6_bp.route("/api/user/", methods=["GET"])
@login_required
@license_required
def list_users():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    page_size = min(page_size, 500)
    order_by = request.args.get("orderBy", "role")
    order_dir = request.args.get("orderDirection", "ASC")
    if order_by not in ("fullName", "email", "lastActiveAt", "role"):
        return jsonify({"error": "Cannot sort by that"}), 400
    email = request.args.get("email", "").strip()
    full_name = request.args.get("fullName", "").strip()

    user = User.query.get(current_user.id)
    role = getattr(user, "role", None)

    q = User.query.filter_by(isDeleted=False)

    # Role 8 (Synerex Admin): no org filter - sees all users
    # Role 9, 10 (OEM): only users whose client has org_id == oem_org_id
    # Role 1, 2, 3, 7 (Client): only users whose client has org_id == their client's org_id
    if role in (9, 10):
        oem_org_id = _get_oem_org_id_for_user(user)
        if oem_org_id:
            q = q.outerjoin(Client, User.client == Client.id).filter(
                or_(
                    Client.org_id == oem_org_id,
                    Client.sponsor_org_id == oem_org_id,
                    User.org_id == oem_org_id,  # OEM admins/users have no client FK
                )
            )
        else:
            q = q.filter(User.id == -1)  # OEM without org_id: show no users
    elif role in (1, 2, 3, 7):
        client_org_id = _get_client_org_id_for_user(user)
        if client_org_id:
            # Include users linked via client record OR via org_id directly (JIT-provisioned users)
            q = q.outerjoin(Client, User.client == Client.id).filter(
                or_(Client.org_id == client_org_id, User.org_id == client_org_id)
            )
        else:
            q = q.filter(User.id == -1)  # Client without org_id: show no users
    if email:
        q = q.filter(User.email.ilike(f"%{email}%"))
    if full_name:
        parts = full_name.split()
        if len(parts) >= 2:
            q = q.filter(User.firstName.ilike(f"%{parts[0]}%"), User.lastName.ilike(f"%{parts[-1]}%"))
        else:
            q = q.filter(db.or_(User.firstName.ilike(f"%{full_name}%"), User.lastName.ilike(f"%{full_name}%")))
    if order_by == "fullName":
        q = q.order_by(User.firstName.asc() if order_dir == "ASC" else User.firstName.desc())
    else:
        # Use _role (the actual DB column) when sorting by role, since User.role is a @property
        col = User._role if order_by == "role" else getattr(User, order_by, User._role)
        q = q.order_by(col.asc() if order_dir == "ASC" else col.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    out = []
    for u in items:
        proj_ids = [r[0] for r in db.session.query(project_user.c.project_users).filter(project_user.c.user_projects == u.id).all()]
        projs = [{"id": p.id, "name": p.name} for pid in proj_ids for p in [Project.query.get(pid)] if p]
        client = Client.query.get(u.client) if u.client else None
        out.append({
            "id": u.id, "email": u.email, "fullName": f"{u.firstName} {u.lastName}",
            "lastActiveAt": u.lastActiveAt, "role": u.role,
            "roleFriendlyName": _role_friendly_name(u.role),
            "client": {"id": client.id, "name": client.name} if client else None,
            "projects": projs,
        })
    return jsonify({"meta": {"page": page, "total": total}, "response": out})


@phase6_bp.route("/api/user/<int:uid>", methods=["GET"])
@login_required
@license_required
def get_user(uid):
    u = User.query.get(uid)
    if not u:
        return jsonify({"error": "Not found"}), 404
    current = User.query.get(current_user.id)
    if not _user_can_access_user(current, u):
        return jsonify({"error": "Not found"}), 404
    proj_ids = [r[0] for r in db.session.query(project_user.c.project_users).filter(project_user.c.user_projects == u.id).all()]
    projs = [{"id": p.id, "name": p.name} for pid in proj_ids for p in [Project.query.get(pid)] if p]
    client = Client.query.get(u.client) if u.client else None
    # Only expose resetPasswordToken when user has no password yet (pending invite)
    pending_token = u.resetPasswordToken if not u.hashedPassword else None
    return jsonify({"meta": {}, "response": {
        "id": u.id, "email": u.email, "fullName": f"{u.firstName} {u.lastName}",
        "lastActiveAt": u.lastActiveAt, "role": u.role, "roleFriendlyName": _role_friendly_name(u.role),
        "client": {"id": client.id, "name": client.name} if client else None,
        "projects": projs, "hasPassword": bool(u.hashedPassword), "isDeleted": u.isDeleted,
        "resetPasswordToken": pending_token,
    }})


@phase6_bp.route("/api/user", methods=["POST"])
@phase6_bp.route("/api/user/", methods=["POST"])
@login_required
@license_required
def create_user():
    from app.services.license_service import check_seat_available, assign_seat as ls_assign_seat
    data = request.get_json() or {}
    role = data.get("role")
    full_name = data.get("fullName", "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    client_id = data.get("client")
    projects = data.get("projects") or []
    if not role or not full_name or not email:
        return jsonify({"error": "role, fullName, email required"}), 400
    current = User.query.get(current_user.id)
    current_role = int(current.role) if current and current.role is not None else 0

    # Role creation permission checks:
    # - Synerex Admin (8): can create any role
    # - OEM Admin (9): can create OEM User (10) and client roles (1-4) including Client Admin (2)
    # - OEM User (10): can create client roles (1,3,4) only — NOT Client Admin (2)
    # - Client Admin (2): can create client roles (1,3,4) within their org — NOT another Client Admin
    new_role = int(role)
    allowed = False
    if current_role == 8:
        allowed = True
    elif current_role == 9:
        allowed = new_role in (1, 2, 3, 4, 10)
    elif current_role == 10:
        allowed = new_role in (1, 3, 4)
    elif current_role == 2:
        allowed = new_role in (1, 3, 4)
    if not allowed:
        return jsonify({"error": "You are not permitted to create a user with that role"}), 403

    if client_id is not None and not _client_in_scope(current, client_id):
        return jsonify({"error": "Client not in your scope"}), 403
    if projects and not _projects_in_scope(current, projects):
        return jsonify({"error": "One or more projects not in your scope"}), 403

    # Seat limit check: enforce for client-level users (roles 1-4) created under a client org.
    # OEM internal users (role 9/10) are free — no seat check.
    seat_license_id = None
    if new_role in (1, 2, 3, 4) and client_id:
        target_client = Client.query.get(client_id)
        client_org_id = getattr(target_client, "org_id", None) if target_client else None
        if client_org_id:
            available, lic_id, seat_err = check_seat_available(client_org_id, "tracking")
            if not available:
                return jsonify({"error": seat_err or "Seat limit reached. Please upgrade your subscription."}), 402
            seat_license_id = lic_id

    # Enforce one Client Admin (role 2) per org — the first account is always the only admin.
    if new_role == 2 and client_id:
        existing_admin = User.query.filter_by(role=2, client=client_id, isDeleted=False).first()
        if existing_admin:
            return jsonify({
                "error": f"This organization already has a Client Admin ({existing_admin.email}). "
                         "Each organization may only have one admin account."
            }), 409

    parts = full_name.split()
    if len(parts) < 2:
        return jsonify({"error": "fullName must have first and last name"}), 400
    first_name, last_name = parts[0], " ".join(parts[1:])
    if User.query.filter_by(email=email, isDeleted=False).first():
        return jsonify({"error": "Email already exists"}), 409
    existing = User.query.filter_by(email=email, isDeleted=True).first()
    token = ""
    if not password:
        token = secrets.token_urlsafe(24)
    import bcrypt
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(8)).decode() if password else None
    if existing:
        existing.isDeleted = False
        existing.firstName = first_name
        existing.lastName = last_name
        existing.role = role
        existing.client = client_id
        existing.hashedPassword = hashed or existing.hashedPassword
        existing.resetPasswordToken = token if not password else ""
        db.session.commit()
        for pid in projects:
            db.session.execute(project_user.insert().values(project_users=pid, user_projects=existing.id))
        db.session.commit()
        if seat_license_id:
            ls_assign_seat(seat_license_id, str(existing.id))
    if token and not hashed and existing:
        _send_invite_email(existing, token, subject="Welcome back to the Energy Portal")
        return jsonify({"meta": {}, "response": {"id": existing.id, "uriEncodedToken": token, "reEnabledUser": True}})
    u = User(firstName=first_name, lastName=last_name, email=email, role=role, client=client_id, isDeleted=False,
             hashedPassword=hashed, resetPasswordToken=token if not password else "")
    # OEM Users (role 10) inherit the creating OEM Admin's org_id so they can access the same org scope
    if new_role == 10:
        creator_org_id = _get_oem_org_id_for_user(current)
        if creator_org_id:
            u.org_id = creator_org_id
    db.session.add(u)
    db.session.flush()
    for pid in projects:
        db.session.execute(project_user.insert().values(project_users=pid, user_projects=u.id))
    db.session.commit()
    if seat_license_id:
        ls_assign_seat(seat_license_id, str(u.id))
    if token and not hashed:
        _send_invite_email(u, token, subject="Welcome to the Energy Portal")
    return jsonify({"meta": {}, "response": {"id": u.id, "uriEncodedToken": token, "reEnabledUser": False}})


@phase6_bp.route("/api/user/<int:uid>", methods=["PUT"])
@login_required
@license_required
def update_user(uid):
    u = User.query.filter_by(id=uid).filter(User.isDeleted != True).first()
    if not u:
        return jsonify({"error": "Not found"}), 404
    current = User.query.get(current_user.id)
    if not _user_can_access_user(current, u):
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if "projects" in data:
        db.session.execute(project_user.delete().where(project_user.c.user_projects == uid))
        for pid in data["projects"]:
            db.session.execute(project_user.insert().values(project_users=pid, user_projects=uid))
        db.session.commit()
        return jsonify({"meta": {}, "response": {}})
    if "fullName" in data:
        parts = data["fullName"].strip().split(None, 1)
        if len(parts) >= 2:
            u.firstName, u.lastName = parts[0], parts[1]
    if "email" in data:
        u.email = data["email"]
    if "password" in data:
        if data["password"]:
            import bcrypt
            u.hashedPassword = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt(8)).decode()
            u.resetPasswordToken = ""
        else:
            u.resetPasswordToken = secrets.token_urlsafe(24)
            u.hashedPassword = None
    if "role" in data:
        u.role = data["role"]
    if "client" in data:
        new_client = data["client"]
        if not _client_in_scope(current, new_client):
            return jsonify({"error": "Client not in your scope"}), 403
        u.client = new_client
    db.session.commit()
    return jsonify({"meta": {}, "response": {"uriEncodedToken": getattr(u, "resetPasswordToken", "") or ""}})


@phase6_bp.route("/api/user/<int:uid>", methods=["DELETE"])
@login_required
@license_required
def destroy_user(uid):
    u = User.query.get(uid)
    if not u:
        return jsonify({"error": "Not found"}), 404
    current = User.query.get(current_user.id)
    if not _user_can_access_user(current, u):
        return jsonify({"error": "Not found"}), 404
    u.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": uid}})


# ----- METER CSV -----

@phase6_bp.route("/api/meter/csv", methods=["GET"])
@phase6_bp.route("/api/meter/csv/<int:project_id>/list", methods=["GET"])
@login_required
@license_required
def list_meter_csv_reports(project_id=None):
    project = project_id or request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    reports = MeterCSV.query.filter_by(project=project).order_by(MeterCSV.createdAt.desc()).all()
    out = []
    for r in reports:
        try:
            count = db.session.execute(db.select(db.func.count()).select_from(metercsv_meter).where(metercsv_meter.c.metercsv_meters == r.id)).scalar() or 0
        except Exception:
            count = 0
        out.append({"id": r.id, "reportType": r.reportType, "title": r.title, "fromDate": r.fromDate, "toDate": r.toDate, "meterCount": count})
    return jsonify({"meta": {}, "response": out})


@phase6_bp.route("/api/meter/csv/<int:rid>", methods=["GET"])
@login_required
@license_required
def get_meter_csv_details(rid):
    r = MeterCSV.query.get(rid)
    if not r or not _user_has_project_access(r.project):
        return jsonify({"error": "Not found"}), 404
    meter_ids = []
    try:
        meter_ids = [row[0] for row in db.session.execute(db.select(metercsv_meter.c.meter_meters_meter).where(metercsv_meter.c.metercsv_meters == rid)).fetchall()]
    except Exception:
        pass
    meters = [{"id": m.id, "name": m.name} for mid in meter_ids for m in [Meter.query.get(mid)] if m]
    return jsonify({"meta": {}, "response": {"id": r.id, "reportType": r.reportType, "title": r.title, "fromDate": r.fromDate, "toDate": r.toDate, "meters": meters}})


def _build_csv_sql(meters, from_date, to_date, frequency):
    """Build the meterdata SQL query matching the original Sails.js helper logic."""
    from_date = int(from_date)
    to_date = int(to_date)
    meter_list = ", ".join(str(m) for m in meters)
    merge_meters = frequency == 365
    interval_length = 1 if merge_meters else frequency
    interval_ms = 60 * 1000 * interval_length
    interval_sec = 60 * interval_length
    from_date_sec = from_date // 1000

    if frequency == 0:
        return f"""
            SELECT
                MeterData.meter AS meter,
                Meter.name AS meterName,
                CONCAT(DATE_FORMAT(FROM_UNIXTIME(MeterData.recordedAt/1000), '%Y-%m-%d %H:'),
                       LPAD(MeterData.minute, 2, '0'), ':00') AS fromTime,
                CONCAT(DATE_FORMAT(FROM_UNIXTIME(MeterData.recordedAt/1000), '%Y-%m-%d %H:'),
                       LPAD(MeterData.minute, 2, '0'), ':59') AS toTime,
                MeterData.l1Volt, MeterData.l1Amp, MeterData.l1Kw, MeterData.l1Kva,
                MeterData.l1Pf, MeterData.l1THD, MeterData.l1Kvar,
                MeterData.l2Volt, MeterData.l2Amp, MeterData.l2Kw, MeterData.l2Kva,
                MeterData.l2Pf, MeterData.l2THD, MeterData.l2Kvar,
                MeterData.l3Volt, MeterData.l3Amp, MeterData.l3Kw, MeterData.l3Kva,
                MeterData.l3Pf, MeterData.l3THD, MeterData.l3Kvar,
                MeterData.totalVolt, MeterData.totalAmp, MeterData.totalKw, MeterData.totalKva,
                MeterData.totalPf, MeterData.totalTHD, MeterData.totalKvar,
                NULL AS peakKva, NULL AS peakKw,
                Project.timeZoneId AS projectTimeZoneId
            FROM meterdata AS MeterData
            JOIN meter AS Meter ON (MeterData.meter = Meter.id)
            JOIN project AS Project ON (Meter.project = Project.id)
            WHERE MeterData.meter IN ({meter_list})
              AND MeterData.recordedAt >= {from_date}
              AND MeterData.recordedAt <= {to_date} + 86399000
            ORDER BY fromTime
        """

    n = len(meters)
    if merge_meters:
        agg = f"""
            AVG(MeterData.l1Volt) AS l1Volt,
            AVG(MeterData.l1Amp)*{n} AS l1Amp,
            AVG(MeterData.l1Kw)*{n} AS l1Kw,
            AVG(MeterData.l1Kva)*{n} AS l1Kva,
            AVG(ABS(MeterData.l1Pf)) AS l1Pf,
            COALESCE(AVG(MeterData.l1THD), 0) AS l1THD,
            AVG(MeterData.l1Kvar)*{n} AS l1Kvar,
            AVG(MeterData.l2Volt) AS l2Volt,
            AVG(MeterData.l2Amp)*{n} AS l2Amp,
            AVG(MeterData.l2Kw)*{n} AS l2Kw,
            AVG(MeterData.l2Kva)*{n} AS l2Kva,
            AVG(ABS(MeterData.l2Pf)) AS l2Pf,
            COALESCE(AVG(MeterData.l2THD), 0) AS l2THD,
            AVG(MeterData.l2Kvar)*{n} AS l2Kvar,
            AVG(MeterData.l3Volt) AS l3Volt,
            AVG(MeterData.l3Amp)*{n} AS l3Amp,
            AVG(MeterData.l3Kw)*{n} AS l3Kw,
            AVG(MeterData.l3Kva)*{n} AS l3Kva,
            AVG(ABS(MeterData.l3Pf)) AS l3Pf,
            COALESCE(AVG(MeterData.l3THD), 0) AS l3THD,
            AVG(MeterData.l3Kvar)*{n} AS l3Kvar,
            AVG(MeterData.totalVolt) AS totalVolt,
            AVG(MeterData.totalAmp)*{n} AS totalAmp,
            AVG(MeterData.totalKw)*{n} AS totalKw,
            AVG(MeterData.totalKva)*{n} AS totalKva,
            AVG(MeterData.totalPf) AS totalPf,
            COALESCE(AVG(MeterData.totalTHD), 0) AS totalTHD,
            AVG(MeterData.totalKvar)*{n} AS totalKvar,
            MAX(MeterData.totalKva)*{n} AS peakKva,
            MAX(MeterData.totalKw)*{n} AS peakKw
        """
        group_by = "intervalNum, fromTime, toTime"
    else:
        agg = """
            AVG(MeterData.l1Volt) AS l1Volt,
            AVG(MeterData.l1Amp) AS l1Amp,
            AVG(MeterData.l1Kw) AS l1Kw,
            AVG(MeterData.l1Kva) AS l1Kva,
            AVG(ABS(MeterData.l1Pf)) AS l1Pf,
            COALESCE(AVG(MeterData.l1THD), 0) AS l1THD,
            AVG(MeterData.l1Kvar) AS l1Kvar,
            AVG(MeterData.l2Volt) AS l2Volt,
            AVG(MeterData.l2Amp) AS l2Amp,
            AVG(MeterData.l2Kw) AS l2Kw,
            AVG(MeterData.l2Kva) AS l2Kva,
            AVG(ABS(MeterData.l2Pf)) AS l2Pf,
            COALESCE(AVG(MeterData.l2THD), 0) AS l2THD,
            AVG(MeterData.l2Kvar) AS l2Kvar,
            AVG(MeterData.l3Volt) AS l3Volt,
            AVG(MeterData.l3Amp) AS l3Amp,
            AVG(MeterData.l3Kw) AS l3Kw,
            AVG(MeterData.l3Kva) AS l3Kva,
            AVG(ABS(MeterData.l3Pf)) AS l3Pf,
            COALESCE(AVG(MeterData.l3THD), 0) AS l3THD,
            AVG(MeterData.l3Kvar) AS l3Kvar,
            AVG(MeterData.totalVolt) AS totalVolt,
            AVG(MeterData.totalAmp) AS totalAmp,
            AVG(MeterData.totalKw) AS totalKw,
            AVG(MeterData.totalKva) AS totalKva,
            AVG(MeterData.totalPf) AS totalPf,
            COALESCE(AVG(MeterData.totalTHD), 0) AS totalTHD,
            AVG(MeterData.totalKvar) AS totalKvar,
            MAX(MeterData.totalKva) AS peakKva,
            MAX(MeterData.totalKw) AS peakKw
        """
        group_by = "meter, intervalNum, fromTime, toTime"

    return f"""
        SELECT
            max(MeterData.meter) AS meter,
            max(Meter.name) AS meterName,
            FLOOR((MeterData.recordedAt - {from_date}) / {interval_ms}) AS intervalNum,
            DATE_FORMAT(FROM_UNIXTIME({from_date_sec} + (FLOOR((recordedAt - {from_date}) / {interval_ms}) * {interval_sec})),
                        '%Y-%m-%d %H:%i:%s') AS fromTime,
            DATE_FORMAT(FROM_UNIXTIME({from_date_sec} + (FLOOR((recordedAt - {from_date}) / {interval_ms}) * {interval_sec}) + {interval_sec - 1}),
                        '%Y-%m-%d %H:%i:%s') AS toTime,
            {agg},
            max(Project.timeZoneId) AS projectTimeZoneId
        FROM meterdata AS MeterData
        JOIN meter AS Meter ON (MeterData.meter = Meter.id)
        JOIN project AS Project ON (Meter.project = Project.id)
        WHERE MeterData.meter IN ({meter_list})
          AND MeterData.recordedAt >= {from_date}
          AND MeterData.recordedAt <= {to_date} + 86399000
        GROUP BY {group_by}
        ORDER BY intervalNum
    """


def _corrected_pf(pf1_raw, pf2_raw, pf3_raw):
    """Replicate the PF correction logic from the original Sails.js CSV helper."""
    pf1 = (200 + pf1_raw) if pf1_raw is not None and pf1_raw < 0 else (pf1_raw or 0)
    pf2 = (200 + pf2_raw) if pf2_raw is not None and pf2_raw < 0 else (pf2_raw or 0)
    pf3 = (200 + pf3_raw) if pf3_raw is not None and pf3_raw < 0 else (pf3_raw or 0)
    result = (pf1 + pf2 + pf3) / 3
    if result > 100:
        result = -(200 - result)
    return result


def _format_row_time(time_str, tz):
    """Convert a UTC datetime string from MySQL to the project timezone."""
    try:
        dt = datetime.fromisoformat(str(time_str)).replace(tzinfo=timezone.utc).astimezone(tz)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return str(time_str)


def _generate_csv_content(rows, frequency):
    """Turn SQL result rows into CSV bytes."""
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo

    output = io.StringIO()
    writer = csvmod.writer(output)

    if frequency == 1:
        writer.writerow([
            "Start Time", "End Time", "Meter",
            "l1Volt", "l1Amp", "l1Kw", "l1Kva", "l1Pf", "l1THD", "l1Kvar",
            "l2Volt", "l2Amp", "l2Kw", "l2Kva", "l2Pf", "l2THD", "l2Kvar",
            "l3Volt", "l3Amp", "l3Kw", "l3Kva", "l3Pf", "l3THD", "l3Kvar",
            "avgVolt", "avgAmp", "totalKw", "totalKva", "avgPf", "avgTHD", "totalKvar",
        ])
    else:
        writer.writerow([
            "Start Time", "End Time", "Meter",
            "l1Volt", "l1Amp", "l1Kw", "l1Kva", "l1Pf", "l1THD", "l1Kvar",
            "l2Volt", "l2Amp", "l2Kw", "l2Kva", "l2Pf", "l2THD", "l2Kvar",
            "l3Volt", "l3Amp", "l3Kw", "l3Kva", "l3Pf", "l3THD", "l3Kvar",
            "avgVolt", "avgAmp", "avgKw", "avgKva", "avgPf", "avgTHD", "avgKvar",
            "peakKva", "peakKw",
        ])

    def r(v):
        try:
            return f"{float(v):.2f}" if v is not None else "0.00"
        except (TypeError, ValueError):
            return "0.00"

    for row in rows:
        d = dict(row._mapping)
        tz_id = d.get("projectTimeZoneId") or "UTC"
        try:
            tz = ZoneInfo(tz_id)
        except Exception:
            tz = ZoneInfo("UTC")

        from_str = _format_row_time(d.get("fromTime"), tz)
        to_str = _format_row_time(d.get("toTime"), tz)
        pf = _corrected_pf(d.get("l1Pf"), d.get("l2Pf"), d.get("l3Pf"))

        row_data = [
            from_str, to_str, d.get("meterName", ""),
            r(d.get("l1Volt")), r(d.get("l1Amp")), r(d.get("l1Kw")), r(d.get("l1Kva")),
            r(d.get("l1Pf")), r(d.get("l1THD")), r(d.get("l1Kvar")),
            r(d.get("l2Volt")), r(d.get("l2Amp")), r(d.get("l2Kw")), r(d.get("l2Kva")),
            r(d.get("l2Pf")), r(d.get("l2THD")), r(d.get("l2Kvar")),
            r(d.get("l3Volt")), r(d.get("l3Amp")), r(d.get("l3Kw")), r(d.get("l3Kva")),
            r(d.get("l3Pf")), r(d.get("l3THD")), r(d.get("l3Kvar")),
            r(d.get("totalVolt")), r(d.get("totalAmp")),
            r(d.get("totalKw")), r(d.get("totalKva")),
            r(pf),
            r(d.get("totalTHD")), r(d.get("totalKvar")),
        ]
        if frequency > 1:
            row_data.append(r(d.get("peakKva")))
            row_data.append(r(d.get("peakKw")))

        writer.writerow(row_data)

    return output.getvalue()


@phase6_bp.route("/api/meter/csv/<int:project_or_id>/create", methods=["POST"])
@login_required
@license_required
def create_meter_csv_report(project_or_id):
    from sqlalchemy import text as sa_text
    from app.config import _8087_ROOT

    data = request.get_json() or {}
    project = data.get("project") or project_or_id or request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    meters = data.get("meters", [])
    report_type = data.get("reportType", 1)
    from_date = data.get("fromDate")
    to_date = data.get("toDate")
    frequency = int(data.get("frequency") or 15)
    title = data.get("title") or f"Report {project}"

    if from_date is None or to_date is None:
        return jsonify({"error": "fromDate and toDate required"}), 400
    if not meters:
        return jsonify({"error": "meters required"}), 400

    valid_meters = [
        m.id for m in Meter.query.filter(Meter.id.in_(meters), Meter.project == project).all()
    ]
    if not valid_meters:
        return jsonify({"error": "No valid meters for this project"}), 400

    uuid_val = secrets.token_urlsafe(16)

    sql = _build_csv_sql(valid_meters, from_date, to_date, frequency)
    rows = db.session.execute(sa_text(sql)).fetchall()
    csv_content = _generate_csv_content(rows, frequency)

    csv_dir = Path(_8087_ROOT) / ".tmp" / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    csv_path = csv_dir / f"{uuid_val}.csv"
    csv_path.write_text(csv_content, encoding="utf-8")

    r = MeterCSV(reportType=report_type, title=title, uuid=uuid_val, project=project,
                 fromDate=int(from_date), toDate=int(to_date))
    db.session.add(r)
    db.session.flush()
    for m in valid_meters:
        try:
            db.session.execute(metercsv_meter.insert().values(metercsv_meters=r.id, meter_meters_meter=m))
        except Exception:
            pass
    db.session.commit()

    return jsonify({"meta": {}, "response": {
        "id": r.id, "reportType": r.reportType, "title": r.title,
        "fromDate": r.fromDate, "toDate": r.toDate, "meterCount": len(valid_meters),
    }})


@phase6_bp.route("/api/meter/csv/<int:rid>/download", methods=["GET"])
@login_required
@license_required
def get_meter_csv_download_url(rid):
    from app.config import _8087_ROOT

    r = MeterCSV.query.get(rid)
    if not r or not _user_has_project_access(r.project):
        return jsonify({"error": "Not found"}), 404

    csv_path = Path(_8087_ROOT) / ".tmp" / "csv" / f"{r.uuid}.csv"
    if not csv_path.exists():
        return jsonify({"error": "CSV file not found — please regenerate the report"}), 404

    app_root = current_app.config.get("APPLICATION_ROOT", "") or ""
    url = f"{app_root}/files/csv/{r.uuid}.csv"
    return jsonify({"meta": {}, "response": url})


@phase6_bp.route("/api/meter/csv/<int:rid>", methods=["DELETE"])
@login_required
@license_required
def remove_meter_csv_report(rid):
    r = MeterCSV.query.get(rid)
    if not r or not _user_has_project_access(r.project):
        return jsonify({"error": "Not found"}), 404
    try:
        db.session.execute(metercsv_meter.delete().where(metercsv_meter.c.metercsv_meters == rid))
    except Exception:
        pass
    db.session.delete(r)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": rid}})
