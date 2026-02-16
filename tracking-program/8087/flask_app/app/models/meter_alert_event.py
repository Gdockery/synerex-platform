"""MeterAlertEvent model - api/models/MeterAlertEvent.js"""
from app.extensions import db
from app.models.base import BaseModel


class MeterAlertEvent(BaseModel):
    __tablename__ = "meteralertevent"

    meter = db.Column(db.Integer, db.ForeignKey("meter.id"))
    alertGroup = db.Column(db.Integer, db.ForeignKey("meteralertgroup.id"))
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
