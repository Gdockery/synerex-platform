"""SwitchAlertGroup model - api/models/SwitchAlertGroup.js"""
from app.extensions import db
from app.models.base import BaseModel


class SwitchAlertGroup(BaseModel):
    __tablename__ = "switchalertgroup"

    alertType = db.Column(db.Integer, nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(255))
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    isDeleted = db.Column(db.Boolean, default=False)
