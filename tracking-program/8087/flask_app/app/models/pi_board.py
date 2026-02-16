"""PiBoard model - api/models/PiBoard.js"""
from app.extensions import db
from app.models.base import BaseModel


class PiBoard(BaseModel):
    __tablename__ = "piboard"

    deviceId = db.Column(db.String(255), nullable=False)
    meshId = db.Column(db.String(255), nullable=False)
    switchState = db.Column(db.Boolean, nullable=False)
    softwareVersion = db.Column(db.String(255))
    lastCommunicatedAt = db.Column(db.Float)
