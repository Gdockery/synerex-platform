"""EquipmentData model - for scheduler/switch power readings. api/models/EquipmentData.js"""
from app.extensions import db
from app.models.base import BaseModel


class EquipmentData(BaseModel):
    __tablename__ = "equipmentdata"

    switch = db.Column(db.Integer, db.ForeignKey("switch.id"))
    meshId = db.Column(db.String(255))
    recordedAt = db.Column(db.Float, nullable=False)
    day = db.Column(db.String(255), nullable=False)
    minute = db.Column(db.Float, nullable=False)
    intervalId = db.Column(db.String(255), nullable=False)
    l1Volt = db.Column(db.Float)
    l1Amp = db.Column(db.Float)
    l1Kw = db.Column(db.Float)
    l1Kva = db.Column(db.Float)
    l1Pf = db.Column(db.Float)
    l1Kvar = db.Column(db.Float)
    l2Volt = db.Column(db.Float)
    l2Amp = db.Column(db.Float)
    l2Kw = db.Column(db.Float)
    l2Kva = db.Column(db.Float)
    l2Pf = db.Column(db.Float)
    l2Kvar = db.Column(db.Float)
    l3Volt = db.Column(db.Float)
    l3Amp = db.Column(db.Float)
    l3Kw = db.Column(db.Float)
    l3Kva = db.Column(db.Float)
    l3Pf = db.Column(db.Float)
    l3Kvar = db.Column(db.Float)
    totalVolt = db.Column(db.Float)
    totalAmp = db.Column(db.Float)
    totalKw = db.Column(db.Float)
    totalKva = db.Column(db.Float)
    totalPf = db.Column(db.Float)
    totalKvar = db.Column(db.Float)
