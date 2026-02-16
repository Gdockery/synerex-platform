"""RepeaterAlertEvent model - api/models/RepeaterAlertEvent.js"""
from app.extensions import db
from app.models.base import BaseModel


class RepeaterAlertEvent(BaseModel):
    __tablename__ = "repeateralertevent"

    repeater = db.Column(db.Integer, db.ForeignKey("repeater.id"))
    alertGroup = db.Column(db.Integer, db.ForeignKey("repeateralertgroup.id"))
    project = db.Column(db.Integer, db.ForeignKey("project.id"))
