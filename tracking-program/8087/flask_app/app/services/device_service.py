"""
Device service - send switch commands, cancel schedules.
Ported from api/helpers/devices/send-switch-command.js and cancel-switch-schedule.js
"""
import logging

from app.extensions import db
from app.models.switch import Switch

logger = logging.getLogger(__name__)


def send_switch_command(project_slug, switch_id, command, time_ms, switch_command_id, schedule_id):
    """
    Send a command to a switch via MQTT/IoT.
    command: SWITCH_COMMAND_TYPES.POWER_ON (1) or POWER_OFF (2)
    """
    switch = Switch.query.filter_by(id=switch_id, isDeleted=False).first()
    if not switch:
        raise ValueError(f"Switch {switch_id} not found")

    from flask import current_app
    cmd_types = current_app.config.get("SWITCH_COMMAND_TYPES", {"POWER_ON": 1, "POWER_OFF": 2})
    cmd_str = "off" if command == cmd_types.get("POWER_OFF", 2) else "on"

    topic = f"synerex/{project_slug}/sensors/{switch.meshId or ''}/control"
    payload = {
        "id": switch_command_id,
        "schedule": schedule_id,
        "time": round(time_ms / 1000),
        "command": cmd_str,
    }

    from app.services.iot_command_service import publish
    publish(topic, payload)
    logger.info("Sent %s command to switch %s", cmd_str, switch_id)


def cancel_switch_schedule(project_slug, schedule_id):
    """
    Cancel a switch schedule by publishing cancelcontrol to all switches.
    schedule_id format: 'x-{switchCommandId}' or 't-{testId}'
    """
    entity_type, entity_id = schedule_id.split("-", 1) if "-" in schedule_id else (None, None)
    if entity_type == "t":
        from app.models.test import Test
        test = Test.query.filter_by(id=entity_id, isDeleted=False).first()
        if not test:
            raise ValueError(f"Test {entity_id} not found for cancel schedule {schedule_id}")
        switches = Switch.query.filter_by(project=test.project, isDeleted=False).all()
    elif entity_type == "x":
        from sqlalchemy import text
        result = db.session.execute(
            text(
                "SELECT switch_switches_switch FROM switch_switches_switch__switchcommand_switches "
                "WHERE switchcommand_switches = :sc_id"
            ),
            {"sc_id": entity_id},
        )
        switch_ids = [r[0] for r in result.fetchall() if r[0]]
        switches = Switch.query.filter(Switch.id.in_(switch_ids)).all() if switch_ids else []
    else:
        raise ValueError(f"Could not parse schedule {schedule_id} (expected x-ID or t-ID)")

    from app.services.iot_command_service import publish
    for switch in switches:
        if switch.meshId:
            topic = f"synerex/{project_slug}/sensors/{switch.meshId}/cancelcontrol"
            payload = {"schedule": schedule_id}
            publish(topic, payload)
            logger.info("Sent cancelcontrol for %s to switch %s", schedule_id, switch.id)
