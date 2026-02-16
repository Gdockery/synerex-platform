"""PerMeterDataAggregate model - api/models/PerMeterDataAggregate.js"""
from app.extensions import db
from app.models.base import BaseModel


class PerMeterDataAggregate(BaseModel):
    __tablename__ = "permeterdataaggregate"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    day = db.Column(db.String(255), nullable=False)
    intervalId = db.Column(db.String(255))
    numSamples = db.Column(db.Integer, nullable=False)
    intervalStartTime = db.Column(db.BigInteger)
    intervalEndTime = db.Column(db.BigInteger)
    meter = db.Column(db.Integer, nullable=False)  # FK to meter.id
    avgVolt = db.Column(db.Float)
    avgAmp = db.Column(db.Float)
    avgKw = db.Column(db.Float)
    avgKva = db.Column(db.Float)
    avgPf = db.Column(db.Float)
    avgKvar = db.Column(db.Float)
    peakKva = db.Column(db.Float, nullable=True)
    peakKw = db.Column(db.Float, nullable=True)
