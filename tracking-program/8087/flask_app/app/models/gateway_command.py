"""GatewayCommand model - api/models/GatewayCommand.js"""
from app.extensions import db
from app.models.base import BaseModel


class GatewayCommand(BaseModel):
    __tablename__ = "gatewaycommand"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    commandType = db.Column(db.Integer, nullable=False)
    startAt = db.Column(db.BigInteger, nullable=False)
    isCancelled = db.Column(db.Boolean, default=False)
    duration = db.Column(db.Float, nullable=True)
    test = db.Column(db.Integer, nullable=True)  # FK to test.id
