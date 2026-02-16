"""Switch model - api/models/Switch.js"""
from app.extensions import db
from app.models.base import BaseModel


class Switch(BaseModel):
    __tablename__ = "switch"

    name = db.Column(db.String(255), nullable=False)
    deviceId = db.Column(db.String(255), nullable=False)
    meshId = db.Column(db.String(255))
    meshIp = db.Column(db.String(255), nullable=True)
    gateway = db.Column(db.String(255), nullable=True)
    deviceType = db.Column(db.Integer, nullable=False)
    ampLoad = db.Column(db.Float, nullable=True)
    voltage = db.Column(db.Float, nullable=True)
    pf = db.Column(db.Float, nullable=True)
    originalHours = db.Column(db.Float, nullable=True)
    lastCommunicatedAt = db.Column(db.Float)
    meshLastCommunicatedAt = db.Column(db.Float)
    project = db.Column(db.Integer, db.ForeignKey("project.id"))
    isDeleted = db.Column(db.Boolean, default=False)
    hasSchedule = db.Column(db.Boolean, default=False)
    isOn = db.Column(db.Boolean, default=True)
