"""Gateway model - api/models/Gateway.js"""
from app.extensions import db
from app.models.base import BaseModel


class Gateway(BaseModel):
    __tablename__ = "gateway"

    deviceId = db.Column(db.String(255), nullable=False)
    meshId = db.Column(db.String(255))
    meshIp = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    softwareVersion = db.Column(db.String(255))
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    lastCommunicatedAt = db.Column(db.Float)
    isDeleted = db.Column(db.Boolean, default=False)
