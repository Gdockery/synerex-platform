"""
Phase 11: Switch scheduling & events, Test reporting API.
Ported from api/controllers/web/switch/* and api/controllers/web/test/*
"""
import logging
import time

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import text

logger = logging.getLogger(__name__)

from app.extensions import db
from app.helpers.decorators import license_required
from app.models.project import project_user
from app.models.schedule import Schedule
from app.models.switch import Switch
from app.models.switch_command import SwitchCommand
from app.models.test import Test
from app.models.user import User
from app.helpers.project_access import user_has_project_access as _user_has_project_access

phase11_bp = Blueprint("phase11", __name__, url_prefix="")




# ----- SWITCH SCHEDULERS -----


@phase11_bp.route("/api/switch/schedulers", methods=["GET"])
@login_required
@license_required
def list_schedulers():
    """GET /api/switch/schedulers?project=X&deviceType=2 - list scheduler switches."""
    project_id = request.args.get("project", type=int)
    device_type = request.args.get("deviceType", type=int)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    query = Switch.query.filter_by(
        project=project_id, isDeleted=False
    )
    if device_type is not None:
        query = query.filter_by(deviceType=device_type)
    switches = query.all()

    from app.models.pi_board import PiBoard
    piboards = {pb.deviceId: pb for pb in PiBoard.query.filter(
        PiBoard.deviceId.in_([x.deviceId for x in switches if x.deviceId])
    ).all()} if switches else {}
    cur_time_ms = int(time.time() * 1000)
    items = []
    for s in switches:
        status_list = []
        pb = piboards.get(s.deviceId) if s.deviceId else None
        if pb:
            status_list.append("Off" if pb.switchState else "On")
        else:
            status_list.append("Undefined")
        if (s.meshLastCommunicatedAt or 0) < cur_time_ms - 3 * 60 * 1000:
            status_list = ["Poweroff"]
        elif s.hasSchedule:
            status_list.append("Scheduled")
        items.append({
            "id": s.id,
            "name": s.name,
            "ampLoad": s.ampLoad,
            "voltage": s.voltage,
            "pf": s.pf,
            "deviceId": s.deviceId,
            "originalHours": s.originalHours,
            "lastCommunicatedAt": s.lastCommunicatedAt,
            "meshLastCommunicatedAt": s.meshLastCommunicatedAt,
            "hasSchedule": s.hasSchedule,
            "deviceType": s.deviceType,
            "status": status_list,
        })
    return jsonify({"meta": {}, "response": items})


# ----- SWITCH SCHEDULES (Schedule model - recurring) -----


@phase11_bp.route("/api/switch/list-schedules", methods=["GET"])
@login_required
@license_required
def list_schedules():
    """GET /api/switch/list-schedules?project=X&deviceType=2 - list Schedule records."""
    project_id = request.args.get("project", type=int)
    device_type = request.args.get("deviceType", type=int)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    query = Schedule.query.filter_by(
        project=project_id, isCompleted=False, isDeleted=False
    )
    if device_type is not None:
        query = query.filter_by(deviceType=device_type)
    schedules = query.order_by(Schedule.startDate.desc()).all()

    items = []
    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for s in schedules:
        details = []
        for d in (s.scheduleDetail or []):
            details.append(
                f"From: {d.get('offTime', '')} - To: {d.get('onTime', '')}, "
            )
        days = [day_names[d] for d in (s.daysOfWeek or []) if 0 <= d <= 6]
        items.append({
            "id": s.id,
            "startDate": s.startDate,
            "endDate": s.endDate,
            "switches": s.switches or [],
            "scheduleDetail": details,
            "daysOfWeek": days,
        })
    return jsonify({"meta": {}, "response": items})


@phase11_bp.route("/api/switch/schedule", methods=["POST"])
@login_required
@license_required
def create_schedule():
    """POST /api/switch/schedule - create recurring Schedule. Cron will create SwitchCommands."""
    data = request.get_json() or {}
    project_id = data.get("project")
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    schedule = Schedule(
        project=project_id,
        startDate=data.get("startDate", ""),
        endDate=data.get("endDate", ""),
        switches=data.get("switches", []),
        scheduleDetail=data.get("scheduleDetail", []),
        daysOfWeek=data.get("daysOfWeek", []),
        totalHoursOff=data.get("totalHoursOff"),
        deviceType=data.get("deviceType"),
        isDeleted=False,
        isCompleted=False,
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify({
        "meta": {},
        "response": {"id": schedule.id, "switchCount": len(schedule.switches or [])},
    })


@phase11_bp.route("/api/switch/equipment/get-schedule", methods=["GET"])
@login_required
@license_required
def get_schedule_for_switch():
    """GET /api/switch/equipment/get-schedule?project=X&switch=Y - get schedule for a switch."""
    project_id = request.args.get("project", type=int)
    switch_id = request.args.get("switch", type=int)
    if not project_id or not switch_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    # Find schedule where switch is in switches array (MySQL JSON_CONTAINS)
    result = db.session.execute(
        text(
            "SELECT id, startDate, endDate, scheduleDetail, daysOfWeek "
            "FROM schedule WHERE project = :proj AND isDeleted = 0 AND isCompleted = 0 "
            "AND JSON_CONTAINS(switches, CAST(:sid AS JSON), '$') LIMIT 1"
        ),
        {"proj": project_id, "sid": switch_id},
    )
    row = result.fetchone()
    if not row:
        return jsonify({"meta": {}, "response": {"hasSchedule": False, "details": {}}})

    from datetime import datetime
    from zoneinfo import ZoneInfo
    from app.models.project import Project
    project = Project.query.get(project_id)
    tz_str = getattr(project, "timeZoneId", None) or "UTC"
    try:
        tz = ZoneInfo(tz_str)
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    import json
    detail_raw = row._mapping.get("scheduleDetail") or []
    if isinstance(detail_raw, str):
        detail_list = json.loads(detail_raw) if detail_raw else []
    else:
        detail_list = detail_raw if isinstance(detail_raw, list) else []
    sch_detail = []
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    for d in detail_list:
        det = d if isinstance(d, dict) else {}
        on_str = str(det.get("onTime") or "08:00")
        off_str = str(det.get("offTime") or "18:00")
        on_parts, off_parts = on_str.split(":"), off_str.split(":")
        on_dt = day_start.replace(hour=int(on_parts[0]), minute=int(on_parts[1]) if len(on_parts) > 1 else 0)
        off_dt = day_start.replace(hour=int(off_parts[0]), minute=int(off_parts[1]) if len(off_parts) > 1 else 0)
        sch_detail.append({"onTime": int(on_dt.timestamp() * 1000), "offTime": int(off_dt.timestamp() * 1000)})

    days_raw = row._mapping.get("daysOfWeek")
    if isinstance(days_raw, str):
        days = json.loads(days_raw) if days_raw else []
    else:
        days = days_raw if isinstance(days_raw, list) else []
    details = {
        "startDate": row._mapping.get("startDate"),
        "endDate": row._mapping.get("endDate"),
        "scheduleDetail": sch_detail,
        "scheduleId": row._mapping.get("id"),
        "daysOfWeek": days or [],
    }
    return jsonify({"meta": {}, "response": {"hasSchedule": True, "details": details}})


@phase11_bp.route("/api/switch/equipment/update-schedule", methods=["PUT"])
@login_required
@license_required
def update_schedule():
    """PUT /api/switch/equipment/update-schedule - update Schedule."""
    data = request.get_json() or {}
    project_id = data.get("project")
    schedule_id = data.get("schedule")
    if not project_id or not schedule_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    schedule = Schedule.query.filter_by(id=schedule_id, project=project_id).first()
    if not schedule:
        return jsonify({"error": "Not found"}), 404

    if "startDate" in data:
        schedule.startDate = data["startDate"]
    if "endDate" in data:
        schedule.endDate = data["endDate"]
    if "scheduleDetail" in data:
        schedule.scheduleDetail = data["scheduleDetail"]
    if "totalHoursOff" in data:
        schedule.totalHoursOff = data["totalHoursOff"]
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": schedule.id}})


@phase11_bp.route("/api/switch/delete-schedule", methods=["PUT"])
@login_required
@license_required
def delete_schedule():
    """PUT /api/switch/delete-schedule - delete Schedule and cancel associated commands."""
    data = request.get_json() or request.form or {}
    schedule_id = data.get("id")
    project_id = data.get("project")
    if not schedule_id:
        return jsonify({"error": "id required"}), 400

    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(schedule.project):
        return jsonify({"error": "Unauthorized"}), 404

    from app.services.device_service import cancel_switch_schedule
    from app.models.project import Project
    project = Project.query.get(schedule.project)
    schedule_switch_ids = set(schedule.switches or [])
    target_set = frozenset(schedule_switch_ids)

    # Find SwitchCommands with exact same switch set
    all_cmds = SwitchCommand.query.filter_by(
        project=schedule.project, isCancelled=False
    ).all()
    for sc in all_cmds:
        res = db.session.execute(
            text("SELECT switch_switches_switch FROM switch_switches_switch__switchcommand_switches WHERE switchcommand_switches = :cid"),
            {"cid": sc.id},
        )
        cmd_switches = frozenset(r[0] for r in res)
        if cmd_switches == target_set:
            try:
                cancel_switch_schedule(project.slug, f"x-{sc.id}")
            except Exception:
                pass
            db.session.execute(
                text("DELETE FROM switch_switches_switch__switchcommand_switches WHERE switchcommand_switches = :cid"),
                {"cid": sc.id},
            )
            SwitchCommand.query.filter_by(id=sc.id).delete()

    schedule.isDeleted = True
    db.session.commit()
    for sid in schedule_switch_ids:
        Switch.query.filter_by(id=sid).update({"hasSchedule": False})
    db.session.commit()

    return jsonify({"meta": {}, "response": {}})


# ----- SWITCH EVENTS (SwitchCommand - individual commands) -----


@phase11_bp.route("/api/switch/event", methods=["GET"])
@login_required
@license_required
def list_switch_events():
    """GET /api/switch/event?project=X&deviceType=2 - list SwitchCommands."""
    project_id = request.args.get("project", type=int)
    device_type = request.args.get("deviceType", type=int)
    is_cancelled = request.args.get("isCancelled", type=lambda v: v.lower() == "true" if v else None)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    query = SwitchCommand.query.filter_by(project=project_id)
    if device_type is not None:
        query = query.filter_by(deviceType=device_type)
    if is_cancelled is not None:
        query = query.filter_by(isCancelled=is_cancelled)
    commands = query.order_by(SwitchCommand.startAt.desc()).limit(100).all()

    # Get switch counts from join table
    cmd_ids = [c.id for c in commands]
    switch_counts = {}
    if cmd_ids:
        ids_ph = ",".join(str(i) for i in cmd_ids)
        try:
            res = db.session.execute(
                text(
                    "SELECT switchcommand_switches, COUNT(*) FROM switch_switches_switch__switchcommand_switches "
                    f"WHERE switchcommand_switches IN ({ids_ph}) GROUP BY switchcommand_switches"
                ),
            )
            for row in res:
                switch_counts[row[0]] = row[1]
        except Exception:
            db.session.rollback()
            switch_counts = {}

    items = []
    for sc in commands:
        items.append({
            "id": sc.id,
            "commandType": sc.commandType,
            "startAt": sc.startAt,
            "acceptedBySwitchIds": sc.acceptedBySwitchIds or [],
            "cancelledBySwitchIds": sc.cancelledBySwitchIds or [],
            "isCancelled": sc.isCancelled,
            "deviceType": sc.deviceType,
            "switchCount": switch_counts.get(sc.id, 0),
            "acceptedSwitchCount": len(sc.acceptedBySwitchIds or []),
            "cancelledSwitchCount": len(sc.cancelledBySwitchIds or []),
        })
    return jsonify({"meta": {}, "response": items})


@phase11_bp.route("/api/switch/event/<int:eid>", methods=["GET"])
@login_required
@license_required
def get_switch_event(eid):
    """GET /api/switch/event/:id - get one SwitchCommand with switch status."""
    sc = SwitchCommand.query.get(eid)
    if not sc:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(sc.project):
        return jsonify({"error": "Unauthorized"}), 404

    result = db.session.execute(
        text("SELECT switch_switches_switch FROM switch_switches_switch__switchcommand_switches WHERE switchcommand_switches = :eid"),
        {"eid": eid},
    )
    switch_ids = [r[0] for r in result]
    switches = Switch.query.filter(Switch.id.in_(switch_ids)).all() if switch_ids else []
    cancelled = set(sc.cancelledBySwitchIds or [])
    executed = set(sc.executedBySwitchIds or [])
    accepted = set(sc.acceptedBySwitchIds or [])
    switch_list = []
    for s in switches:
        if s.id in cancelled:
            status = "canceled"
        elif s.id in executed:
            status = "executed"
        elif s.id in accepted:
            status = "accepted"
        else:
            status = "pending"
        switch_list.append({
            "id": s.id, "name": s.name, "deviceId": s.deviceId,
            "project": s.project, "isDeleted": s.isDeleted,
            "status": status,
        })
    out = {
        "id": sc.id, "commandType": sc.commandType, "startAt": sc.startAt,
        "acceptedBySwitchIds": sc.acceptedBySwitchIds, "cancelledBySwitchIds": sc.cancelledBySwitchIds,
        "executedBySwitchIds": sc.executedBySwitchIds, "isCancelled": sc.isCancelled,
        "deviceType": sc.deviceType, "switches": switch_list,
    }
    return jsonify({"meta": {}, "response": out})


@phase11_bp.route("/api/switch/event", methods=["POST"])
@login_required
@license_required
def schedule_switch_event():
    """POST /api/switch/event - create one-off SwitchCommand and send to devices."""
    data = request.get_json() or {}
    project_id = data.get("project")
    start_at = data.get("startAt")
    switches = data.get("switches", [])
    device_type = data.get("deviceType") or 1
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    if not switches or not all(isinstance(s, int) or (isinstance(s, str) and str(s).isdigit()) for s in switches):
        return jsonify({"error": "badSwitchIds"}), 400

    # Angular sends commandType as a string from HTML selects; coerce to int
    try:
        command_type = int(data.get("commandType"))
    except (TypeError, ValueError):
        return jsonify({"error": "badCommandType"}), 400

    cmd_types = current_app.config.get("SWITCH_COMMAND_TYPES", {"POWER_ON": 1, "POWER_OFF": 2})
    if command_type not in list(cmd_types.values()):
        return jsonify({"error": "badCommandType"}), 400

    switch_ids = [int(s) if isinstance(s, str) else s for s in switches]
    valid = Switch.query.filter(
        Switch.id.in_(switch_ids), Switch.project == project_id, Switch.isDeleted == False
    ).all()
    if len(valid) != len(switch_ids):
        return jsonify({"error": "badSwitchIds"}), 400

    from app.services.device_service import send_switch_command
    from app.models.project import Project
    project = Project.query.get(project_id)
    sc = SwitchCommand(
        project=project_id,
        commandType=command_type,
        startAt=start_at,
        deviceType=device_type,
        test=data.get("test"),
    )
    db.session.add(sc)
    db.session.flush()
    for switch_id in switch_ids:
        db.session.execute(
            text(
                "INSERT INTO switch_switches_switch__switchcommand_switches "
                "(switchcommand_switches, switch_switches_switch) VALUES (:sc_id, :switch_id)"
            ),
            {"sc_id": sc.id, "switch_id": switch_id},
        )
    db.session.commit()

    schedule_id = f"x-{sc.id}"
    # Only attempt direct MQTT send when a broker is configured; otherwise
    # DataSync propagates the command to the node which sends via MQTT.
    iot_protocol = current_app.config.get("IOT_PROTOCOL", "none")
    if iot_protocol and iot_protocol != "none":
        for switch_id in switch_ids:
            try:
                send_switch_command(
                    project_slug=project.slug,
                    switch_id=switch_id,
                    command=command_type,
                    time_ms=start_at,
                    switch_command_id=sc.id,
                    schedule_id=schedule_id,
                )
                time.sleep(0.05)
            except Exception as e:
                logger.warning("send_switch_command failed for switch %s: %s", switch_id, e)

    return jsonify({
        "meta": {},
        "response": {
            "id": sc.id,
            "commandType": sc.commandType,
            "startAt": sc.startAt,
            "switchCount": len(switch_ids),
            "acceptedSwitchCount": 0,
            "isCancelled": sc.isCancelled,
        },
    })


@phase11_bp.route("/api/switch/events", methods=["DELETE"])
@login_required
@license_required
def clear_schedule_events():
    """DELETE /api/switch/events - cancel and delete ALL SwitchCommands for project."""
    project_id = request.args.get("project", type=int)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    from app.services.device_service import cancel_switch_schedule
    from app.models.project import Project
    project = Project.query.get(project_id)
    commands = SwitchCommand.query.filter_by(project=project_id).all()
    for sc in commands:
        try:
            cancel_switch_schedule(project.slug, f"x-{sc.id}")
        except Exception:
            pass
        db.session.execute(
            text("DELETE FROM switch_switches_switch__switchcommand_switches WHERE switchcommand_switches = :cid"),
            {"cid": sc.id},
        )
        SwitchCommand.query.filter_by(id=sc.id).delete()
    db.session.commit()
    return jsonify({"meta": {}, "response": {}})


@phase11_bp.route("/api/switch/event/<int:eid>", methods=["DELETE"])
@login_required
@license_required
def cancel_switch_event(eid):
    """DELETE /api/switch/event/:id - cancel one SwitchCommand."""
    sc = SwitchCommand.query.get(eid)
    if not sc:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(sc.project):
        return jsonify({"error": "Unauthorized"}), 404

    from app.services.device_service import cancel_switch_schedule
    from app.models.project import Project
    project = Project.query.get(sc.project)
    try:
        cancel_switch_schedule(project.slug, f"x-{sc.id}")
    except Exception:
        pass
    sc.isCancelled = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {}})


@phase11_bp.route("/api/switch/get-savings", methods=["GET"])
@login_required
@license_required
def get_switch_savings():
    """GET /api/switch/get-savings?project=X - equipment savings from scheduler schedules.
    Ported from api/controllers/web/switch/get-all-equipment-savings.js
    """
    from datetime import datetime
    from zoneinfo import ZoneInfo
    from app.models.project import Project
    from app.models.schedule import Schedule

    project_id = request.args.get("project", type=int)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404

    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    start_date = getattr(project, "startDate", None) or "2000-01-01"
    try:
        from datetime import datetime as dt
        proj_start = dt.strptime(str(start_date)[:10], "%Y-%m-%d").replace(tzinfo=tz)
        project_months = max(0, (now - proj_start).days / 30.44)
    except Exception:
        project_months = 12
    avg_rate = float(project.kwhRate or 0)

    daily_saving = daily_before_kwh = daily_after_kwh = daily_kwh_saving = 0
    weekly_saving = monthly_saving = yearly_saving = all_time_saving = 0

    schedules = Schedule.query.filter_by(
        project=project_id, isCompleted=False, isDeleted=False
    ).all()
    scheduler_ids = set()
    for s in schedules:
        for sw in (s.switches or []):
            if sw is not None:
                scheduler_ids.add(int(sw))
    if not scheduler_ids:
        return jsonify({
            "meta": {},
            "response": {
                "dailyBeforeKwh": 0, "dailyAfterKwh": 0, "dailyKwhSaving": 0,
                "dailySaving": 0, "weeklySaving": 0, "monthlySaving": 0,
                "yearlySaving": 0, "allTimeSaving": 0,
            },
        })

    schedulers = Switch.query.filter(
        Switch.id.in_(scheduler_ids),
        Switch.deviceType == 2,
        Switch.isDeleted == False,
        Switch.project == project_id,
    ).all()
    sched_by_id = {s.id: s for s in schedulers}
    days_per_week = 5

    for sched in schedules:
        for sw_id in (sched.switches or []):
            scheduler = sched_by_id.get(sw_id)
            if not scheduler:
                continue
            hours_off = float(sched.totalHoursOff or 0)
            vol = float(scheduler.voltage or 0)
            amp = float(scheduler.ampLoad or 0)
            pf = float(scheduler.pf or 1) / 100.0 if (scheduler.pf or 0) > 1 else float(scheduler.pf or 1)
            orig = float(scheduler.originalHours or 24)
            x = (vol * amp / 1000) * pf if vol and amp else 0
            if not x:
                continue
            days = len(sched.daysOfWeek or []) or 5
            daily_before_kwh += x * orig
            daily_after_kwh += x * (orig - hours_off)
            daily_kwh_saving += x * hours_off
            daily_saving += x * hours_off * avg_rate
            weekly_saving += x * hours_off * days * avg_rate
            monthly_saving += x * hours_off * days * 4 * avg_rate
            yearly_saving += x * hours_off * days * 4 * avg_rate * (12 if project_months >= 12 else project_months)
            all_time_saving += x * hours_off * days * 4 * avg_rate * project_months

    return jsonify({
        "meta": {},
        "response": {
            "dailyBeforeKwh": daily_before_kwh,
            "dailyAfterKwh": daily_after_kwh,
            "dailyKwhSaving": daily_kwh_saving,
            "dailySaving": daily_saving,
            "weeklySaving": weekly_saving,
            "monthlySaving": monthly_saving,
            "yearlySaving": yearly_saving,
            "allTimeSaving": all_time_saving,
        },
    })


# ----- TEST REPORTING -----


@phase11_bp.route("/api/test/<int:tid>/report", methods=["GET"])
@login_required
@license_required
def get_test_report(tid):
    """GET /api/test/:id/report - get test report data (calculates if needed)."""
    test = Test.query.filter_by(id=tid, isDeleted=False).first()
    if not test:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(test.project):
        return jsonify({"error": "Unauthorized"}), 404

    if test.isStatic == 1:
        if test.reportData:
            return jsonify({"meta": {}, "response": test.reportData})
        return jsonify({"error": "Static test has no report data"}), 500

    if test.reportData:
        return jsonify({"meta": {}, "response": test.reportData})

    from app.models.meter import Meter
    from app.services.test_calculation_service import calculate_test_results
    meters = Meter.query.filter_by(project=test.project, isDeleted=False).filter(Meter.lastCommunicatedAt > 0).all()
    meter_ids = ",".join(str(m.id) for m in meters) or "0"
    try:
        result = calculate_test_results(tid, meter_ids)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    if result:
        test.reportData = result
        db.session.commit()
    return jsonify({"meta": {}, "response": result or {}})


@phase11_bp.route("/api/test/<int:tid>/selected-report", methods=["GET"])
@login_required
@license_required
def get_selected_meter_test_report(tid):
    """GET /api/test/:id/selected-report - get report for selected meters (meters param)."""
    meters_param = request.args.get("meters", "")
    if meters_param:
        from app.services.test_calculation_service import calculate_test_results
        test = Test.query.filter_by(id=tid, isDeleted=False).first()
        if not test:
            return jsonify({"error": "Not found"}), 404
        if not _user_has_project_access(test.project):
            return jsonify({"error": "Unauthorized"}), 404
        if test.isStatic == 1 and test.reportData:
            return jsonify({"meta": {}, "response": test.reportData})
        try:
            result = calculate_test_results(tid, meters_param.strip())
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        return jsonify({"meta": {}, "response": result or {}})
    return get_test_report(tid)


@phase11_bp.route("/api/test/<int:pid>/reporting-meters", methods=["PUT"])
@login_required
@license_required
def update_reporting_meters(pid):
    """PUT /api/test/:project/reporting-meters - set isReporting for meters.
    Ported from api/controllers/web/test/update-reporting-meters.js
    """
    from app.models.meter import Meter

    if not _user_has_project_access(pid):
        return jsonify({"error": "Unauthorized"}), 404
    data = request.get_json() or {}
    meters_in = data.get("meters", [])
    if not isinstance(meters_in, list):
        meters_in = []
    meter_ids = [int(m) for m in meters_in if m is not None and (isinstance(m, int) or str(m).isdigit())]

    project_meters = Meter.query.filter_by(project=pid, isDeleted=False).all()
    all_ids = {m.id for m in project_meters}
    reporting_set = set(meter_ids) & all_ids
    for m in project_meters:
        m.isReporting = m.id in reporting_set
    db.session.commit()
    return jsonify({"meta": {}, "response": {}})


@phase11_bp.route("/api/test/<int:tid>/data", methods=["GET"])
@login_required
@license_required
def get_raw_test_data(tid):
    """GET /api/test/:id/data - get raw meter data for test with segment/cycle info.
    Ported from api/controllers/web/test/get-raw-test-data.js
    """
    from app.models.meter import Meter
    from app.models.meter_data import MeterData

    test = Test.query.filter_by(id=tid, isDeleted=False).first()
    if not test:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(test.project):
        return jsonify({"error": "Unauthorized"}), 404

    meters = Meter.query.filter_by(project=test.project, isReporting=True).all()
    meter_ids = [m.id for m in meters]
    if not meter_ids:
        return jsonify({"meta": {"page": 1, "total": 0}, "response": []})

    start_time = test.startAt
    duration_hr = test.duration or 1
    interval_hr = test.interval or 1
    end_time = start_time + (duration_hr * 60 * 60 * 1000)
    seg_count = int(duration_hr / interval_hr)
    segment_times = [start_time + (i * interval_hr * 60 * 60 * 1000) for i in range(seg_count + 1)]

    def _segment_info(recorded_at):
        for i in range(len(segment_times) - 1, -1, -1):
            if recorded_at >= segment_times[i]:
                return {
                    "segment": (i % 2) + 1,
                    "cycle": (i // 2) + 1,
                    "xecoSwitchedOn": bool(i % 2),
                }
        return {"segment": 1, "cycle": 1, "xecoSwitchedOn": False}

    show_hidden = request.args.get("showHidden", "false").lower() == "true"
    hidden_ids = set(test.hiddenMeterDataRowIds or [])
    page = max(1, request.args.get("page", 1, type=int))
    order_by = request.args.get("orderBy", "recordedAt")
    order_dir = request.args.get("orderDirection", "ASC")
    page_size = 100  # DEFAULT_PAGE_SIZE * 10

    query = MeterData.query.filter(
        MeterData.meter.in_(meter_ids),
        MeterData.recordedAt >= start_time,
        MeterData.recordedAt < end_time,
    )
    if not show_hidden and hidden_ids:
        query = query.filter(~MeterData.id.in_(hidden_ids))
    total = query.count()
    sort_col = getattr(MeterData, order_by, MeterData.recordedAt)
    if order_dir.upper() == "DESC":
        sort_col = sort_col.desc()
    rows = query.order_by(sort_col).offset((page - 1) * page_size).limit(page_size).all()
    meter_by_id = {m.id: m for m in meters}
    items = []
    for row in rows:
        info = _segment_info(row.recordedAt)
        m = meter_by_id.get(row.meter)
        total_pf = (row.totalKw / row.totalKva * 100) if row.totalKva else 0
        items.append({
            "id": row.id,
            "hidden": row.id in hidden_ids,
            "xecoSwitchedOn": info["xecoSwitchedOn"],
            "cycle": info["cycle"],
            "segment": info["segment"],
            "name": m.name if m else f"Meter #{row.meter}",
            "recordedAt": row.recordedAt,
            "totalVolt": row.totalVolt,
            "totalAmp": row.totalAmp,
            "totalKw": row.totalKw,
            "totalKva": row.totalKva,
            "totalPf": total_pf,
            "totalKvar": row.totalKvar,
        })
    return jsonify({"meta": {"page": page, "total": total}, "response": items})


@phase11_bp.route("/api/test/<int:tid>/data", methods=["PUT"])
@login_required
@license_required
def unhide_data_rows(tid):
    """PUT /api/test/:id/data - unhide data rows, recalculate report.
    Ported from api/controllers/web/test/unhide-data-rows.js
    """
    from app.models.meter import Meter
    from app.models.meter_data import MeterData
    from app.services.test_calculation_service import calculate_test_results

    test = Test.query.filter_by(id=tid, isDeleted=False).first()
    if not test:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(test.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    row_ids = data.get("rowIds", [])
    if not isinstance(row_ids, list):
        row_ids = []
    row_ids = [int(r) for r in row_ids if r is not None and (isinstance(r, int) or str(r).isdigit())]
    if not row_ids:
        return jsonify({"meta": {}, "response": test.reportData or {}})

    rows = MeterData.query.filter(MeterData.id.in_(row_ids)).all()
    if len(rows) != len(row_ids):
        return jsonify({"error": "invalidRowIds"}), 400
    start_time = test.startAt
    end_time = start_time + ((test.duration or 1) * 60 * 60 * 1000)
    for row in rows:
        meter = Meter.query.get(row.meter) if row.meter else None
        if not meter or meter.project != test.project:
            return jsonify({"error": "invalidRowIds"}), 400
        if row.recordedAt < start_time or row.recordedAt >= end_time:
            return jsonify({"error": "invalidRowIds"}), 400

    hidden = list(test.hiddenMeterDataRowIds or [])
    hidden_set = set(hidden)
    for r in row_ids:
        hidden_set.discard(r)
    test.hiddenMeterDataRowIds = list(hidden_set)
    test.reportData = None
    db.session.commit()

    meters = Meter.query.filter_by(project=test.project, isDeleted=False).filter(Meter.lastCommunicatedAt > 0).all()
    meter_ids = ",".join(str(m.id) for m in meters) or "0"
    result = calculate_test_results(tid, meter_ids)
    if result:
        test.reportData = result
        db.session.commit()
    return jsonify({"meta": {}, "response": result or {}})


@phase11_bp.route("/api/test/<int:tid>/data", methods=["DELETE"])
@login_required
@license_required
def hide_data_rows(tid):
    """DELETE /api/test/:id/data - hide data rows, recalculate report.
    Ported from api/controllers/web/test/hide-data-rows.js
    """
    from app.models.meter import Meter
    from app.models.meter_data import MeterData
    from app.services.test_calculation_service import calculate_test_results

    test = Test.query.filter_by(id=tid, isDeleted=False).first()
    if not test:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(test.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    row_ids = data.get("rowIds", [])
    if not isinstance(row_ids, list):
        row_ids = []
    row_ids = [int(r) for r in row_ids if r is not None and (isinstance(r, int) or str(r).isdigit())]
    if not row_ids:
        return jsonify({"meta": {}, "response": test.reportData or {}})

    rows = MeterData.query.filter(MeterData.id.in_(row_ids)).all()
    if len(rows) != len(row_ids):
        return jsonify({"error": "invalidRowIds"}), 400
    start_time = test.startAt
    end_time = start_time + ((test.duration or 1) * 60 * 60 * 1000)
    for row in rows:
        meter = Meter.query.get(row.meter) if row.meter else None
        if not meter or meter.project != test.project:
            return jsonify({"error": "invalidRowIds"}), 400
        if row.recordedAt < start_time or row.recordedAt >= end_time:
            return jsonify({"error": "invalidRowIds"}), 400

    hidden = list(test.hiddenMeterDataRowIds or [])
    hidden_set = set(hidden) | set(row_ids)
    test.hiddenMeterDataRowIds = list(hidden_set)
    test.reportData = None
    db.session.commit()

    meters = Meter.query.filter_by(project=test.project, isDeleted=False).filter(Meter.lastCommunicatedAt > 0).all()
    meter_ids = ",".join(str(m.id) for m in meters) or "0"
    result = calculate_test_results(tid, meter_ids)
    if result:
        test.reportData = result
        db.session.commit()
    return jsonify({"meta": {}, "response": result or {}})


@phase11_bp.route("/api/switch/test-schedules", methods=["POST"])
@login_required
@license_required
def test_schedules():
    """POST /api/switch/test-schedules - dry-run listing of pending schedules for the project."""
    from app.models.schedule import Schedule
    data = request.get_json() or {}
    project_id = data.get("project") or request.args.get("project", type=int)
    if not project_id or not _user_has_project_access(int(project_id)):
        return jsonify({"error": "Unauthorized"}), 404
    schedules = Schedule.query.filter_by(project=int(project_id), isDeleted=False, isCompleted=False).all()
    return jsonify({"meta": {}, "response": {"scheduleCount": len(schedules), "schedules": [{"id": s.id} for s in schedules]}})


@phase11_bp.route("/api/switch/command", methods=["POST"])
@login_required
@license_required
def send_switch_command():
    """POST /api/switch/command - dispatch an immediate on/off command to a switch."""
    from app.models.switch import Switch
    from app.models.project import Project
    data = request.get_json() or {}
    project_id = data.get("project")
    switch_id = data.get("switch") or data.get("id")
    command_type = data.get("type") or data.get("command")
    if not project_id or not _user_has_project_access(int(project_id)):
        return jsonify({"error": "Unauthorized"}), 404
    sw = Switch.query.filter_by(id=switch_id, project=int(project_id), isDeleted=False).first()
    if not sw:
        return jsonify({"error": "Switch not found"}), 404
    project = Project.query.get(int(project_id))
    try:
        import time as _time
        from app.services.device_service import send_switch_command as _send
        _send(
            project_slug=project.slug,
            switch_id=int(switch_id),
            command=command_type,
            time_ms=int(_time.time() * 1000),
            switch_command_id=0,
            schedule_id="x-manual",
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify({"meta": {}, "response": {"ok": True, "switch": switch_id, "command": command_type}})
