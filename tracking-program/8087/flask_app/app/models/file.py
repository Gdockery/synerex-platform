"""File model - api/models/File.js (stored file metadata)"""
from app.extensions import db
from app.models.base import BaseModel


class File(BaseModel):
    __tablename__ = "file"

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True)
    url = db.Column(db.String(255), nullable=False)
