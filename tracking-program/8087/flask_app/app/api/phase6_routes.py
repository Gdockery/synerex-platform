"""
Phase 6: Alerts (meter, repeater, switch), Test, User (admin), Meter CSV.
Ported from api/controllers/web/
"""
import secrets
from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required

from app.extensions import db
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

phase6_bp = Blueprint("phase6", __name__, url_prefix="")

# Meter CSV <-> Meter join (Waterline: meter_meters_meter__metercsv_meters)
metercsv_meter = db.Table(
    "meter_meters_meter__metercsv_meters",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("metercsv_meters", db.Integer, db.ForeignKey("metercsv.id")),
    db.Column("meter_meters_meter", db.Integer, db.ForeignKey("meter.id")),
)


def _send_invite_email(user, token, subject="Welcome to the Energy Portal"):
    """Send invite email when user is created without password."""
    email_host = current_app.config.get("EMAIL_HOST", "").strip()
    if email_host:
        base_url = email_host.rstrip("/")
    else:
        base_url = current_app.config.get("TRACKING_BASE_URL", "http://localhost:8087").rstrip("/")
    invite_link = f"{base_url}/invite/accept?token={token}"
    brand_name = "Xeco"  # Fallback; could use whitelabel from request hostname
    try:
        from app.api.web_routes import _get_brand_name
        brand_name = _get_brand_name()
    except Exception:
        pass
    subject_full = subject.replace("the Energy Portal", f"{brand_name} Energy Portal")
    body = f"""Hi {user.firstName},

You've been invited to join the {brand_name} Energy Portal!

Click the link below to set up your account and choose your password:

{invite_link}

If you have any questions, please contact your {brand_name} Energy representative.

Welcome aboard!
The {brand_name} Team"""
    mail_server = current_app.config.get("MAIL_SERVER")
    if mail_server and current_app.config.get("MAIL_USERNAME"):
        try:
            import smtplib
            from email.mime.text import MIMEText
            msg = MIMEText(body, "plain")
            msg["Subject"] = subject_full
            msg["From"] = current_app.config.get("MAIL_FROM", "noreply@tracking.local")
            msg["To"] = user.email
            with smtplib.SMTP(mail_server, current_app.config.get("MAIL_PORT", 587)) as s:
                if current_app.config.get("MAIL_USE_TLS", True):
                    s.starttls()
                s.login(
                    current_app.config["MAIL_USERNAME"],
                    current_app.config.get("MAIL_PASSWORD", ""),
                )
                s.sendmail(msg["From"], [user.email], msg.as_string())
            current_app.logger.info("Invite email sent to %s", user.email)
        except Exception as e:
            current_app.logger.exception("Failed to send invite email: %s", e)
    elif current_app.config.get("ENV") == "development":
        current_app.logger.info("INVITE LINK (no mail config): %s", invite_link)


def _user_has_project_access(project_id):
    if not current_user.is_authenticated:
        return False
    user = User.query.get(current_user.id)
    if not user:
        return False
    if user.role == 8:
        return True
    row = db.session.query(project_user).filter(
        project_user.c.project_users == project_id,
        project_user.c.user_projects == user.id,
    ).first()
    return row is not None




def _role_friendly_name(role):
    names = {1: "Client User", 2: "Client Admin", 3: "Client Manager", 4: "Xeco User",
             7: "Account Manager", 8: "Xeco Admin"}
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
    events = MeterAlertEvent.query.join(MeterAlert).join(MeterAlertGroup).filter(MeterAlertGroup.project == project).order_by(MeterAlertEvent.createdAt.desc()).limit(100).all()
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
    events = RepeaterAlertEvent.query.join(RepeaterAlert).join(RepeaterAlertGroup).filter(RepeaterAlertGroup.project == project).limit(100).all()
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
    events = SwitchAlertEvent.query.join(SwitchAlert).join(SwitchAlertGroup).filter(SwitchAlertGroup.project == project).limit(100).all()
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
    data = request.get_json() or {}
    project = data.get("project")
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    start_at = data.get("startAt")
    duration = data.get("duration")
    interval = data.get("interval", 1)
    gateways = data.get("gateways") or []
    if start_at is None or duration is None:
        return jsonify({"error": "startAt and duration required"}), 400
    import time
    now = int(time.time() * 1000)
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
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": t.id, "startAt": t.startAt, "duration": t.duration, "interval": t.interval}})


@phase6_bp.route("/api/test/<int:tid>", methods=["DELETE"])
@login_required
@license_required
def remove_test(tid):
    t = Test.query.get(tid)
    if not t or not _user_has_project_access(t.project):
        return jsonify({"error": "Not found"}), 404
    t.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": tid}})


# ----- USER (admin) -----

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

    q = User.query.filter_by(isDeleted=False)
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
        col = getattr(User, order_by, User.role)
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
    proj_ids = [r[0] for r in db.session.query(project_user.c.project_users).filter(project_user.c.user_projects == u.id).all()]
    projs = [{"id": p.id, "name": p.name} for pid in proj_ids for p in [Project.query.get(pid)] if p]
    client = Client.query.get(u.client) if u.client else None
    return jsonify({"meta": {}, "response": {
        "id": u.id, "email": u.email, "fullName": f"{u.firstName} {u.lastName}",
        "lastActiveAt": u.lastActiveAt, "role": u.role, "roleFriendlyName": _role_friendly_name(u.role),
        "client": {"id": client.id, "name": client.name} if client else None,
        "projects": projs, "hasPassword": bool(u.hashedPassword), "isDeleted": u.isDeleted,
    }})


@phase6_bp.route("/api/user", methods=["POST"])
@phase6_bp.route("/api/user/", methods=["POST"])
@login_required
@license_required
def create_user():
    data = request.get_json() or {}
    role = data.get("role")
    full_name = data.get("fullName", "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    client_id = data.get("client")
    projects = data.get("projects") or []
    if not role or not full_name or not email:
        return jsonify({"error": "role, fullName, email required"}), 400
    parts = full_name.split(None, 1)
    if len(parts) < 2:
        return jsonify({"error": "fullName must have first and last name"}), 400
    first_name, last_name = parts[0], parts[1]
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
    if token and not hashed:
        _send_invite_email(existing, token, subject="Welcome back to the Energy Portal")
        return jsonify({"meta": {}, "response": {"id": existing.id, "uriEncodedToken": token, "reEnabledUser": True}})
    u = User(firstName=first_name, lastName=last_name, email=email, role=role, client=client_id, isDeleted=False,
             hashedPassword=hashed, resetPasswordToken=token if not password else "")
    db.session.add(u)
    db.session.flush()
    for pid in projects:
        db.session.execute(project_user.insert().values(project_users=pid, user_projects=u.id))
    db.session.commit()
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
        u.client = data["client"]
    db.session.commit()
    return jsonify({"meta": {}, "response": {"uriEncodedToken": getattr(u, "resetPasswordToken", "") or ""}})


@phase6_bp.route("/api/user/<int:uid>", methods=["DELETE"])
@login_required
@license_required
def destroy_user(uid):
    u = User.query.get(uid)
    if not u:
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


@phase6_bp.route("/api/meter/csv/<int:project_or_id>/create", methods=["POST"])
@login_required
@license_required
def create_meter_csv_report(project_or_id):
    data = request.get_json() or {}
    project = data.get("project") or project_or_id or request.args.get("project", type=int)
    if not project or not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404
    meters = data.get("meters", [])
    report_type = data.get("reportType", 1)
    from_date = data.get("fromDate")
    to_date = data.get("toDate")
    title = data.get("title", f"Report {project}")
    if from_date is None or to_date is None:
        return jsonify({"error": "fromDate and toDate required"}), 400
    if not meters:
        return jsonify({"error": "meters required"}), 400
    uuid_val = secrets.token_urlsafe(16)
    r = MeterCSV(reportType=report_type, title=title, uuid=uuid_val, project=project, fromDate=from_date, toDate=to_date)
    db.session.add(r)
    db.session.flush()
    for m in meters:
        if Meter.query.filter_by(id=m, project=project).first():
            try:
                db.session.execute(metercsv_meter.insert().values(metercsv_meters=r.id, meter_meters_meter=m))
            except Exception:
                pass
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": r.id, "reportType": r.reportType, "title": r.title, "fromDate": r.fromDate, "toDate": r.toDate, "meterCount": len(meters), "url": ""}})


@phase6_bp.route("/api/meter/csv/<int:rid>/download", methods=["GET"])
@login_required
@license_required
def get_meter_csv_download_url(rid):
    r = MeterCSV.query.get(rid)
    if not r or not _user_has_project_access(r.project):
        return jsonify({"error": "Not found"}), 404
    return jsonify({"meta": {}, "response": {"url": ""}})


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
