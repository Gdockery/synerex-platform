"""SwitchAlertEvent model - api/models/SwitchAlertEvent.js"""
from app.extensions import db
from app.models.base import BaseModel


class SwitchAlertEvent(BaseModel):
    __tablename__ = "switchalertevent"

    switch = db.Column(db.Integer, db.ForeignKey("switch.id"))
    alertGroup = db.Column(db.Integer, db.ForeignKey("switchalertgroup.id"))
    project = db.Column(db.Integer, db.ForeignKey("project.id"))
