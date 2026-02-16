"""Schedule model - api/models/Schedule.js"""
from app.extensions import db
from app.models.base import BaseModel


class Schedule(BaseModel):
    __tablename__ = "schedule"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    startDate = db.Column(db.String(255), nullable=False)
    endDate = db.Column(db.String(255), nullable=False)
    switches = db.Column(db.JSON, default=list)
    isDeleted = db.Column(db.Boolean, default=False)
    isCompleted = db.Column(db.Boolean, default=False)
    scheduleDetail = db.Column(db.JSON, default=list)
    deviceType = db.Column(db.Integer)
    daysOfWeek = db.Column(db.JSON, default=list)
    totalHoursOff = db.Column(db.Float, nullable=True)
