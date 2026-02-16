"""Repeater model - api/models/Repeater.js"""
from app.extensions import db
from app.models.base import BaseModel


class Repeater(BaseModel):
    __tablename__ = "repeater"

    name = db.Column(db.String(255), nullable=False)
    deviceId = db.Column(db.String(255), nullable=False)
    meshId = db.Column(db.String(255))
    meshIp = db.Column(db.String(255), nullable=True)
    lastCommunicatedAt = db.Column(db.Float)
    gateway = db.Column(db.String(255), nullable=True)
    project = db.Column(db.Integer, db.ForeignKey("project.id"))
    meshLastCommunicatedAt = db.Column(db.Float)
    isDeleted = db.Column(db.Boolean, default=False)
    isOn = db.Column(db.Boolean, default=True)
