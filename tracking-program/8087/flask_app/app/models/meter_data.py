"""MeterData model - api/models/MeterData.js

Phase 5 additions (PQ Meter Data Collection Layer):
  - frequency: supply frequency in Hz (Phase 5 required measurement)
  - site_id:   direct link to Phase 2 site table for analytics scoping
"""
from app.extensions import db
from app.models.base import BaseModel


class MeterData(BaseModel):
    __tablename__ = "meterdata"

    meter = db.Column(db.Integer, db.ForeignKey("meter.id"))
    meshId = db.Column(db.String(255))
    recordedAt = db.Column(db.BigInteger, nullable=False)
    day = db.Column(db.String(255), nullable=False)
    minute = db.Column(db.Integer, nullable=False)
    intervalId = db.Column(db.String(255), nullable=False)
    knownRead = db.Column(db.Boolean, default=False)

    # Phase 5 — PQ Meter Data Collection Layer
    frequency = db.Column(db.Float, nullable=True)            # Hz, e.g. 60.0
    site_id   = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=True, index=True)
    l1Volt = db.Column(db.Float)
    l1Amp = db.Column(db.Float)
    l1Kw = db.Column(db.Float)
    l1Kva = db.Column(db.Float)
    l1Pf = db.Column(db.Float)
    l1THD = db.Column(db.Float, nullable=True)
    l1Kvar = db.Column(db.Float)
    l2Volt = db.Column(db.Float)
    l2Amp = db.Column(db.Float)
    l2Kw = db.Column(db.Float)
    l2Kva = db.Column(db.Float)
    l2Pf = db.Column(db.Float)
    l2THD = db.Column(db.Float, nullable=True)
    l2Kvar = db.Column(db.Float)
    l3Volt = db.Column(db.Float)
    l3Amp = db.Column(db.Float)
    l3Kw = db.Column(db.Float)
    l3Kva = db.Column(db.Float)
    l3Pf = db.Column(db.Float)
    l3THD = db.Column(db.Float, nullable=True)
    l3Kvar = db.Column(db.Float)
    totalVolt = db.Column(db.Float)
    totalAmp = db.Column(db.Float)
    totalKw = db.Column(db.Float)
    totalKva = db.Column(db.Float)
    totalPf = db.Column(db.Float)
    totalKvar = db.Column(db.Float)
    totalTHD = db.Column(db.Float, nullable=True)
    outputAmp = db.Column(db.Float, nullable=True)
    rawData = db.Column(db.JSON)

    # Individual harmonic orders H3–H21 per phase (% of fundamental), nullable until Xeco register map confirmed
    HARMONIC_ORDERS = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21]

    # L1 current harmonics
    l1AmpH3  = db.Column(db.Float, nullable=True)
    l1AmpH5  = db.Column(db.Float, nullable=True)
    l1AmpH7  = db.Column(db.Float, nullable=True)
    l1AmpH9  = db.Column(db.Float, nullable=True)
    l1AmpH11 = db.Column(db.Float, nullable=True)
    l1AmpH13 = db.Column(db.Float, nullable=True)
    l1AmpH15 = db.Column(db.Float, nullable=True)
    l1AmpH17 = db.Column(db.Float, nullable=True)
    l1AmpH19 = db.Column(db.Float, nullable=True)
    l1AmpH21 = db.Column(db.Float, nullable=True)
    # L1 voltage harmonics
    l1VoltH3  = db.Column(db.Float, nullable=True)
    l1VoltH5  = db.Column(db.Float, nullable=True)
    l1VoltH7  = db.Column(db.Float, nullable=True)
    l1VoltH9  = db.Column(db.Float, nullable=True)
    l1VoltH11 = db.Column(db.Float, nullable=True)
    l1VoltH13 = db.Column(db.Float, nullable=True)
    l1VoltH15 = db.Column(db.Float, nullable=True)
    l1VoltH17 = db.Column(db.Float, nullable=True)
    l1VoltH19 = db.Column(db.Float, nullable=True)
    l1VoltH21 = db.Column(db.Float, nullable=True)
    # L2 current harmonics
    l2AmpH3  = db.Column(db.Float, nullable=True)
    l2AmpH5  = db.Column(db.Float, nullable=True)
    l2AmpH7  = db.Column(db.Float, nullable=True)
    l2AmpH9  = db.Column(db.Float, nullable=True)
    l2AmpH11 = db.Column(db.Float, nullable=True)
    l2AmpH13 = db.Column(db.Float, nullable=True)
    l2AmpH15 = db.Column(db.Float, nullable=True)
    l2AmpH17 = db.Column(db.Float, nullable=True)
    l2AmpH19 = db.Column(db.Float, nullable=True)
    l2AmpH21 = db.Column(db.Float, nullable=True)
    # L2 voltage harmonics
    l2VoltH3  = db.Column(db.Float, nullable=True)
    l2VoltH5  = db.Column(db.Float, nullable=True)
    l2VoltH7  = db.Column(db.Float, nullable=True)
    l2VoltH9  = db.Column(db.Float, nullable=True)
    l2VoltH11 = db.Column(db.Float, nullable=True)
    l2VoltH13 = db.Column(db.Float, nullable=True)
    l2VoltH15 = db.Column(db.Float, nullable=True)
    l2VoltH17 = db.Column(db.Float, nullable=True)
    l2VoltH19 = db.Column(db.Float, nullable=True)
    l2VoltH21 = db.Column(db.Float, nullable=True)
    # L3 current harmonics
    l3AmpH3  = db.Column(db.Float, nullable=True)
    l3AmpH5  = db.Column(db.Float, nullable=True)
    l3AmpH7  = db.Column(db.Float, nullable=True)
    l3AmpH9  = db.Column(db.Float, nullable=True)
    l3AmpH11 = db.Column(db.Float, nullable=True)
    l3AmpH13 = db.Column(db.Float, nullable=True)
    l3AmpH15 = db.Column(db.Float, nullable=True)
    l3AmpH17 = db.Column(db.Float, nullable=True)
    l3AmpH19 = db.Column(db.Float, nullable=True)
    l3AmpH21 = db.Column(db.Float, nullable=True)
    # L3 voltage harmonics
    l3VoltH3  = db.Column(db.Float, nullable=True)
    l3VoltH5  = db.Column(db.Float, nullable=True)
    l3VoltH7  = db.Column(db.Float, nullable=True)
    l3VoltH9  = db.Column(db.Float, nullable=True)
    l3VoltH11 = db.Column(db.Float, nullable=True)
    l3VoltH13 = db.Column(db.Float, nullable=True)
    l3VoltH15 = db.Column(db.Float, nullable=True)
    l3VoltH17 = db.Column(db.Float, nullable=True)
    l3VoltH19 = db.Column(db.Float, nullable=True)
    l3VoltH21 = db.Column(db.Float, nullable=True)
