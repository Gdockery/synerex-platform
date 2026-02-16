"""RepeaterAlertGroup model - api/models/RepeaterAlertGroup.js"""
from app.extensions import db
from app.models.base import BaseModel


class RepeaterAlertGroup(BaseModel):
    __tablename__ = "repeateralertgroup"

    alertType = db.Column(db.Integer, nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(255))
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    isDeleted = db.Column(db.Boolean, default=False)


repeater_alert_group_user = db.Table(
    "repeateralertgroup_users__user_repeateralertgroups",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("repeateralertgroup_users", db.Integer, db.ForeignKey("repeateralertgroup.id")),
    db.Column("user_repeateralertgroups", db.Integer, db.ForeignKey("user.id")),
)
