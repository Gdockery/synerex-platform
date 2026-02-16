"""Xeco model - config/singleton from api/models/Xeco.js"""
from app.extensions import db
from app.models.base import BaseModel


class Xeco(BaseModel):
    __tablename__ = "xeco"

    billingEmail = db.Column(db.String(255), nullable=False, unique=True)
    billingPhone = db.Column(db.String(255))
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(255), nullable=False)
    zip = db.Column(db.String(255), nullable=False)
    carbonCreditRate = db.Column(db.Float, nullable=False)
    xecoManagerCostPercent = db.Column(db.Float, nullable=False)
