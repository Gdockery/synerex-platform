"""MeterCSV model - api/models/MeterCSV.js"""
from app.extensions import db
from app.models.base import BaseModel


class MeterCSV(BaseModel):
    __tablename__ = "metercsv"

    reportType = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    uuid = db.Column(db.String(255), nullable=False)
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    fromDate = db.Column(db.BigInteger, nullable=False)
    toDate = db.Column(db.BigInteger, nullable=False)
