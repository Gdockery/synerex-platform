"""
Socket event handlers for Phase 8 - project ticker rooms.
Room naming: project_{id}.
"""
from flask_login import current_user

from app.extensions import db, socketio
from app.models.project import project_user
from app.models.user import User


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


def _project_room_name(project_id):
    """Room name for project broadcasts."""
    return f"project_{project_id}"


@socketio.on("join_project")
def handle_join_project(data):
    """Join a project room for ticker updates. Requires project access."""
    project_id = data.get("project") if isinstance(data, dict) else None
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return {"error": "invalid project"}
    if not project_id:
        return {"error": "project required"}
    if not _user_has_project_access(project_id):
        return {"error": "unauthorized"}
    room = _project_room_name(project_id)
    from flask_socketio import join_room

    join_room(room)
    return {"ok": True}


def emit_project_ticker(project_id, data):
    """
    Emit ticker data to all clients in a project room.
    Call from rollup / EB apps when ReportData updates.
    Event name 'project'.
    """
    room = _project_room_name(project_id)
    socketio.emit("project", data, room=room)


@socketio.on("leave_project")
def handle_leave_project(data):
    """Leave a project room."""
    project_id = data.get("project") if isinstance(data, dict) else None
    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return {"error": "invalid project"}
    if not project_id:
        return {"error": "project required"}
    if not _user_has_project_access(project_id):
        return {"error": "unauthorized"}
    room = _project_room_name(project_id)
    from flask_socketio import leave_room

    leave_room(room)
    return {"ok": True}
