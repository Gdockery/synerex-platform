"""RepeaterAlert model - api/models/RepeaterAlert.js"""
from app.extensions import db
from app.models.base import BaseModel


class RepeaterAlert(BaseModel):
    __tablename__ = "repeateralert"

    repeater = db.Column(db.Integer, db.ForeignKey("repeater.id"))
    group = db.Column(db.Integer, db.ForeignKey("repeateralertgroup.id"))
    triggerNotificationOn = db.Column(db.Float, default=0)
    lastNotificationsSent = db.Column(db.Float, default=0)
