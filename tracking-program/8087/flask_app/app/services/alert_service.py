"""
Alert service - port of api/helpers/alerts/check-for-*-alert-conditions.js
Checks meter, repeater, switch alert conditions and sends notifications.
"""
import logging
from datetime import datetime

from app.extensions import db
from app.models.meter_alert import MeterAlert
from app.models.meter_alert_group import MeterAlertGroup
from app.models.meter_alert_event import MeterAlertEvent
from app.models.repeater_alert import RepeaterAlert
from app.models.repeater_alert_group import RepeaterAlertGroup
from app.models.repeater_alert_event import RepeaterAlertEvent
from app.models.switch_alert import SwitchAlert
from app.models.switch_alert_group import SwitchAlertGroup
from app.models.switch_alert_event import SwitchAlertEvent

logger = logging.getLogger(__name__)

HIGH_DEMAND = 1
GATEWAY_ERROR = 2


def _send_alert_email(to_email, subject, body_html):
    """Send alert email. Uses app MAIL_* config."""
    from flask import current_app
    if not current_app.config.get("MAIL_SERVER") or not current_app.config.get("MAIL_USERNAME"):
        logger.warning("Mail not configured, skipping alert email to %s", to_email)
        return
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = current_app.config.get("MAIL_FROM", "noreply@tracking.local")
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        port = current_app.config.get("MAIL_PORT", 587)
        use_tls = current_app.config.get("MAIL_USE_TLS", True)
        with smtplib.SMTP(current_app.config["MAIL_SERVER"], port) as server:
            if use_tls:
                server.starttls()
            server.login(
                current_app.config["MAIL_USERNAME"],
                current_app.config.get("MAIL_PASSWORD", ""),
            )
            server.sendmail(msg["From"], to_email, msg.as_string())
    except Exception as e:
        logger.exception("Failed to send alert email to %s: %s", to_email, e)


def check_for_meter_alert_conditions(project):
    """Check meter alert conditions for project. Port of check-for-meter-alert-conditions.js"""
    from app.models.meter import Meter
    from app.models.user import User

    now = int(datetime.now().timestamp() * 1000)
    groups = MeterAlertGroup.query.filter_by(project=project.id, isDeleted=False).all()
    for mag in groups:
        # Get meter alerts for this group
        alerts = MeterAlert.query.filter_by(group=mag.id).all()
        meter_ids = [a.meter for a in alerts]
        meters = Meter.query.filter(Meter.id.in_(meter_ids)).all() if meter_ids else []
        meter_map = {m.id: m for m in meters}
        alert_by_meter = {a.meter: a for a in alerts}

        earliest_allowable = now - (mag.threshold or 0) * 60 * 1000
        desired_notification_time = now + (mag.delay or 0) * 60 * 1000

        for meter in meters:
            ma = alert_by_meter.get(meter.id)
            if not ma:
                continue
            earliest_notification = (ma.lastNotificationsSent or 0) + 24 * 60 * 60 * 1000

            if mag.alertType == HIGH_DEMAND:
                in_range = (meter.lastTotalKva or 0) > (mag.threshold or 0)
                communicated = (meter.lastCommunicatedAt or 0) > now - 10 * 60 * 1000
                if in_range and communicated:
                    if (ma.triggerNotificationOn or 0) > 0:
                        if now > ma.triggerNotificationOn:
                            # Send alerts
                            ev = MeterAlertEvent(meter=meter.id, alertGroup=mag.id, project=project.id)
                            db.session.add(ev)
                            db.session.flush()
                            users = db.session.execute(
                                db.text(
                                    "SELECT user_meteralertgroups FROM meteralertgroup_users__user_meteralertgroups "
                                    "WHERE meteralertgroup_users = :gid"
                                ),
                                {"gid": mag.id},
                            ).fetchall()
                            for row in users:
                                uid = row[0]
                                u = User.query.get(uid)
                                if u and u.email:
                                    body = (
                                        f"<p>Hi {u.firstName},</p>"
                                        f"<p>The meter <strong>{meter.name}</strong> has measured demand above "
                                        f"{mag.threshold} KW for over {mag.delay} minutes.</p>"
                                    )
                                    _send_alert_email(u.email, "Alert: high meter demand reported", body)
                            ma.lastNotificationsSent = now
                            ma.triggerNotificationOn = now + 24 * 60 * 60 * 1000
                    else:
                        trigger = max(earliest_notification, desired_notification_time)
                        ma.triggerNotificationOn = trigger
                elif (ma.triggerNotificationOn or 0) > 0:
                    ma.triggerNotificationOn = 0
            else:  # GATEWAY_ERROR
                if (meter.lastCommunicatedAt or 0) > 0 and meter.lastCommunicatedAt < earliest_allowable:
                    if now >= earliest_notification:
                        ev = MeterAlertEvent(meter=meter.id, alertGroup=mag.id, project=project.id)
                        db.session.add(ev)
                        users = db.session.execute(
                            db.text(
                                "SELECT user_meteralertgroups FROM meteralertgroup_users__user_meteralertgroups "
                                "WHERE meteralertgroup_users = :gid"
                            ),
                            {"gid": mag.id},
                        ).fetchall()
                        for row in users:
                            uid = row[0]
                            u = User.query.get(uid)
                            if u and u.email:
                                body = f"<p>Hi {u.firstName},</p><p>Meter <strong>{meter.name}</strong> is offline.</p>"
                                _send_alert_email(u.email, "Alert: meter offline", body)
                        ma.lastNotificationsSent = now

    db.session.commit()


def check_for_repeater_alert_conditions(project):
    """Check repeater alert conditions. Port of check-for-repeater-alert-conditions.js"""
    from app.models.repeater import Repeater
    from app.models.user import User

    now = int(datetime.now().timestamp() * 1000)
    groups = RepeaterAlertGroup.query.filter_by(project=project.id, isDeleted=False).all()
    for rag in groups:
        alerts = RepeaterAlert.query.filter_by(group=rag.id).all()
        repeater_ids = [a.repeater for a in alerts]
        repeaters = Repeater.query.filter(Repeater.id.in_(repeater_ids)).all()
        alert_by_rep = {a.repeater: a for a in alerts}
        earliest_allowable = now - (rag.threshold or 0) * 60 * 1000

        for rep in repeaters:
            ra = alert_by_rep.get(rep.id)
            if not ra:
                continue
            earliest_notification = (ra.lastNotificationsSent or 0) + 24 * 60 * 60 * 1000
            if (rep.lastCommunicatedAt or 0) > 0 and rep.lastCommunicatedAt < earliest_allowable:
                if now >= earliest_notification:
                    ev = RepeaterAlertEvent(repeater=rep.id, alertGroup=rag.id, project=project.id)
                    db.session.add(ev)
                    users = db.session.execute(
                        db.text(
                            "SELECT user_repeateralertgroups FROM repeateralertgroup_users__user_repeateralertgroups "
                            "WHERE repeateralertgroup_users = :gid"
                        ),
                        {"gid": rag.id},
                    ).fetchall()
                    for row in users:
                        u = User.query.get(row[0])
                        if u and u.email:
                            body = f"<p>Hi {u.firstName},</p><p>Repeater <strong>{rep.name}</strong> is offline.</p>"
                            _send_alert_email(u.email, "Alert: repeater offline", body)
                    ra.lastNotificationsSent = now

    db.session.commit()


def check_for_switch_alert_conditions(project):
    """Check switch alert conditions. Port of check-for-switch-alert-conditions.js"""
    from app.models.switch import Switch
    from app.models.user import User

    now = int(datetime.now().timestamp() * 1000)
    groups = SwitchAlertGroup.query.filter_by(project=project.id, isDeleted=False).all()
    for sag in groups:
        alerts = SwitchAlert.query.filter_by(group=sag.id).all()
        switch_ids = [a.switch for a in alerts]
        switches = Switch.query.filter(Switch.id.in_(switch_ids)).all()
        alert_by_sw = {a.switch: a for a in alerts}
        earliest_allowable = now - (sag.threshold or 0) * 60 * 1000

        for sw in switches:
            sa = alert_by_sw.get(sw.id)
            if not sa:
                continue
            earliest_notification = (sa.lastNotificationsSent or 0) + 24 * 60 * 60 * 1000
            mesh_at = sw.meshLastCommunicatedAt or sw.lastCommunicatedAt or 0
            if mesh_at > 0 and mesh_at < earliest_allowable:
                if now >= earliest_notification:
                    ev = SwitchAlertEvent(switch=sw.id, alertGroup=sag.id, project=project.id)
                    db.session.add(ev)
                    users = db.session.execute(
                        db.text(
                            "SELECT user_switchalertgroups FROM switchalertgroup_users__user_switchalertgroups "
                            "WHERE switchalertgroup_users = :gid"
                        ),
                        {"gid": sag.id},
                    ).fetchall()
                    for row in users:
                        u = User.query.get(row[0])
                        if u and u.email:
                            body = f"<p>Hi {u.firstName},</p><p>Switch <strong>{sw.name}</strong> is offline.</p>"
                            _send_alert_email(u.email, "Alert: switch offline", body)
                    sa.lastNotificationsSent = now

    db.session.commit()


def check_all_alert_conditions():
    """Check alerts for all non-deleted projects. Equivalent to alerts/schedule-tasks + check-for-alert-conditions."""
    from app.models.project import Project
    projects = Project.query.filter_by(isDeleted=False).all()
    for p in projects:
        try:
            check_for_meter_alert_conditions(p)
            check_for_repeater_alert_conditions(p)
            check_for_switch_alert_conditions(p)
        except Exception as e:
            logger.exception("Error checking alerts for project %s: %s", p.id, e)
