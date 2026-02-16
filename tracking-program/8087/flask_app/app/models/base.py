"""
Base model with timestamps.
Waterline uses createdAt, updatedAt (camelCase) as bigint JS timestamps.
"""
from time import time

from app.extensions import db


def _js_timestamp():
    """Current time as JS timestamp (ms since epoch)."""
    return int(time() * 1000)


class BaseModel(db.Model):
    """Abstract base with id, createdAt, updatedAt."""

    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    createdAt = db.Column(db.BigInteger, nullable=True)
    updatedAt = db.Column(db.BigInteger, nullable=True)
