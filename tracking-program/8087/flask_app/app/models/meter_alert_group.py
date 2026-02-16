"""MeterAlertGroup model - api/models/MeterAlertGroup.js"""
from app.extensions import db
from app.models.base import BaseModel

# Many-to-many: MeterAlertGroup <-> User
meter_alert_group_user = db.Table(
    "meteralertgroup_users__user_meteralertgroups",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("meteralertgroup_users", db.Integer, db.ForeignKey("meteralertgroup.id")),
    db.Column("user_meteralertgroups", db.Integer, db.ForeignKey("user.id")),
)


class MeterAlertGroup(BaseModel):
    __tablename__ = "meteralertgroup"

    alertType = db.Column(db.Integer, nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    delay = db.Column(db.Float)
    note = db.Column(db.String(255))
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    isDeleted = db.Column(db.Boolean, default=False)
