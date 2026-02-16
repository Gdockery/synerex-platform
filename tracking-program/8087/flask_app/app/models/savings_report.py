"""SavingsReport model - api/models/SavingsReport.js"""
from app.extensions import db
from app.models.base import BaseModel


class SavingsReport(BaseModel):
    __tablename__ = "savingsreport"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    month = db.Column(db.String(255), nullable=False)
    fromDate = db.Column(db.BigInteger, nullable=False)
    toDate = db.Column(db.BigInteger, nullable=False)
    reportData = db.Column(db.JSON, nullable=False)
