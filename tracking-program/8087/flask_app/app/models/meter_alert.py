"""MeterAlert model - api/models/MeterAlert.js"""
from app.extensions import db
from app.models.base import BaseModel


class MeterAlert(BaseModel):
    __tablename__ = "meteralert"

    meter = db.Column(db.Integer, db.ForeignKey("meter.id"), nullable=False)
    group = db.Column(db.Integer, db.ForeignKey("meteralertgroup.id"), nullable=False)
    triggerNotificationOn = db.Column(db.Float, default=0)
    lastNotificationsSent = db.Column(db.Float, default=0)
