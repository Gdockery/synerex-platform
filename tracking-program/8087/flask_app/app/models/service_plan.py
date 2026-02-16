"""ServicePlan model - api/models/ServicePlan.js"""
from app.extensions import db
from app.models.base import BaseModel


class ServicePlan(BaseModel):
    __tablename__ = "serviceplan"

    type = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    subscription = db.Column(db.Integer, nullable=False)
    billingInterval = db.Column(db.Integer, nullable=False)
    paymentMethod = db.Column(db.String(255), nullable=False)
    accountNumber = db.Column(db.String(255), nullable=False)
    expiresAt = db.Column(db.BigInteger, default=0)
