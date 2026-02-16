"""Test model - api/models/Test.js"""
from app.extensions import db
from app.models.base import BaseModel

# Join table: Test <-> Gateway many-to-many
gateway_test = db.Table(
    "gateway_tests__test_gateways",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("gateway_tests", db.Integer, db.ForeignKey("gateway.id")),
    db.Column("test_gateways", db.Integer, db.ForeignKey("test.id")),
)


class Test(BaseModel):
    __tablename__ = "test"

    project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    startAt = db.Column(db.BigInteger, nullable=False)
    endAt = db.Column(db.BigInteger, nullable=False)
    duration = db.Column(db.Integer)
    interval = db.Column(db.Integer)
    hiddenMeterDataRowIds = db.Column(db.JSON, default=None)
    reportData = db.Column(db.JSON, default=None)
    isDeleted = db.Column(db.Boolean, default=False)
    allswitchesset = db.Column(db.JSON, default=None)
    completed = db.Column(db.Boolean, default=False)
    isStatic = db.Column(db.Integer, default=0)
