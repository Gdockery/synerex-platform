"""
User model - ported from api/models/User.js
"""
from flask_login import UserMixin

from app.extensions import db
from app.models.base import BaseModel


class User(UserMixin, BaseModel):
    __tablename__ = "user"

    firstName = db.Column(db.String(255), nullable=False)
    lastName = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    phone = db.Column(db.String(255))
    certificateNo = db.Column(db.String(255))
    hashedPassword = db.Column(db.String(255))
    resetPasswordToken = db.Column(db.String(255))
    role = db.Column(db.Integer)
    lastActiveAt = db.Column(db.BigInteger)
    isDeleted = db.Column(db.Boolean, default=False)
    client = db.Column(db.Integer, db.ForeignKey("client.id"))
    defaultProject = db.Column(db.Integer, nullable=True)  # FK to project.id
    userLogo = db.Column(db.Boolean, default=False)  # True if user has uploaded logo
