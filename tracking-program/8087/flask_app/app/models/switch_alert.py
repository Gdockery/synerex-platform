"""SwitchAlert model - api/models/SwitchAlert.js"""
from app.extensions import db
from app.models.base import BaseModel


class SwitchAlert(BaseModel):
    __tablename__ = "switchalert"

    switch = db.Column(db.Integer, db.ForeignKey("switch.id"))
    group = db.Column(db.Integer, db.ForeignKey("switchalertgroup.id"))
    triggerNotificationOn = db.Column(db.Float, default=0)
    lastNotificationsSent = db.Column(db.Float, default=0)
