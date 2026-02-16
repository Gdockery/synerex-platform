"""ReportData model - api/models/ReportData.js (from xecobase)"""
from app.extensions import db
from app.models.base import BaseModel


class ReportData(BaseModel):
    __tablename__ = "reportdata"

    typeId = db.Column(db.Integer)
    project = db.Column(db.Integer, db.ForeignKey("project.id"))
    type = db.Column(db.String(255), nullable=False)
    valueType = db.Column(db.String(255), nullable=False)
    period = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    value = db.Column(db.Float, nullable=False, default=0)
