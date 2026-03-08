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
    _role = db.Column("role", db.Integer)
    lastActiveAt = db.Column(db.BigInteger)

    @property
    def role(self):
        """Always return role as int — MySQL may return float via some drivers."""
        return int(self._role) if self._role is not None else None

    @role.setter
    def role(self, value):
        self._role = int(value) if value is not None else None
    isDeleted = db.Column(db.Boolean, default=False)
    client = db.Column(db.Integer, db.ForeignKey("client.id"))
    defaultProject = db.Column(db.Integer, nullable=True)  # FK to project.id
    userLogo = db.Column(db.Boolean, default=False)  # True if user has uploaded logo
