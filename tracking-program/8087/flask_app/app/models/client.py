"""
Client model - ported from api/models/Client.js
"""
from app.extensions import db
from app.models.base import BaseModel


class Client(BaseModel):
    __tablename__ = "client"

    org_id = db.Column(db.String(255), nullable=True)  # From License service - links to org registry
    sponsor_org_id = db.Column(db.String(255), nullable=True)  # OEM org_id when client created by OEM
    name = db.Column(db.String(255), nullable=False)
    legalName = db.Column(db.String(255))
    address = db.Column(db.String(255))
    city = db.Column(db.String(255))
    state = db.Column(db.String(255))
    zip = db.Column(db.String(255))
    country = db.Column(db.String(255))
    contactName = db.Column(db.String(255))
    contactTitle = db.Column(db.String(255))
    contactPhone = db.Column(db.String(255))
    marketSegment = db.Column(db.String(255))
    taxId = db.Column(db.String(255))
    shippingTerms = db.Column(db.String(255))
    salesTax = db.Column(db.Float)
    createdBy = db.Column(db.Integer, nullable=True)  # FK to user.id
    financeEmail = db.Column(db.String(255))
    financePhone = db.Column(db.String(255))
    managerName = db.Column(db.String(255))
    managerCertificate = db.Column(db.String(255))
    managerPhone = db.Column(db.String(255))
    managerEmail = db.Column(db.String(255))
    managerLocation = db.Column(db.String(255))
    logoImgSrc = db.Column(db.String(255))
    isDeleted = db.Column(db.Boolean, default=False)
