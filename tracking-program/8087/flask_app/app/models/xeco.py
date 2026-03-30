"""CompanySettings model - platform-level company info (formerly xeco table)"""
from app.extensions import db
from app.models.base import BaseModel


class CompanySettings(BaseModel):
    __tablename__ = "company_settings"

    billingEmail = db.Column(db.String(255), nullable=False, unique=True)
    billingPhone = db.Column(db.String(255))
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(255), nullable=False)
    zip = db.Column(db.String(255), nullable=False)
    carbonCreditRate = db.Column(db.Float, nullable=False)
    managerCostPercent = db.Column(db.Float, nullable=False, default=0)
    name = db.Column(db.String(255))
    country = db.Column(db.String(255))
    taxId = db.Column(db.String(100))
