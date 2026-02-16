"""SwitchCommand model - api/models/SwitchCommand.js"""
from app.extensions import db
from app.models.base import BaseModel


class SwitchCommand(BaseModel):
    __tablename__ = "switchcommand"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    commandType = db.Column(db.Integer, nullable=False)
    deviceType = db.Column(db.Integer, nullable=True)
    startAt = db.Column(db.BigInteger, nullable=False)
    acceptedBySwitchIds = db.Column(db.JSON, default=list)
    isCancelled = db.Column(db.Boolean, default=False)
    cancelledBySwitchIds = db.Column(db.JSON, default=list)
    executedBySwitchIds = db.Column(db.JSON, default=list)
    test = db.Column(db.Integer, nullable=True)  # FK to test.id
