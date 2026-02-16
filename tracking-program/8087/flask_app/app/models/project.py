"""
Project model - ported from api/models/Project.js
Join table project_users__user_projects for Project-User many-to-many.
"""
from app.extensions import db
from app.models.base import BaseModel

# Many-to-many: project <-> user (Waterline: project_users__user_projects)
project_user = db.Table(
    "project_users__user_projects",
    db.Column("id", db.Integer, primary_key=True, autoincrement=True),
    db.Column("project_users", db.Integer, db.ForeignKey("project.id")),
    db.Column("user_projects", db.Integer, db.ForeignKey("user.id")),
)


class Project(BaseModel):
    __tablename__ = "project"

    org_id = db.Column(db.String(255), nullable=True)  # From client - links to org registry
    name = db.Column(db.String(255), nullable=False)  # VARCHAR(255) utf8mb4 in MySQL
    slug = db.Column(db.String(255), nullable=False, unique=True)
    location = db.Column(db.String(255))
    proposalNumber = db.Column(db.String(255))
    invoiceNumber = db.Column(db.JSON)
    workOrder = db.Column(db.String(255))
    purchaseOrder = db.Column(db.String(255))
    depositAmount = db.Column(db.Float)
    discount = db.Column(db.Float)
    totalCost = db.Column(db.Float)
    carbonCreditRate = db.Column(db.Float)
    currencyCode = db.Column(db.String(255), default="USD")
    currencyExchangeRate = db.Column(db.Float)
    salesTax = db.Column(db.Float)
    startDate = db.Column(db.String(255))
    subNeeded = db.Column(db.Boolean, default=False)
    subStartDate = db.Column(db.String(255))
    timeZoneId = db.Column(db.String(255), nullable=False)
    selectedTest = db.Column(db.Integer, nullable=True)
    slackChannel = db.Column(db.Integer, nullable=True)
    lastRollupAt = db.Column(db.BigInteger, default=0)
    electricBillAnalysisUpdatedAt = db.Column(db.BigInteger, default=0)
    isDeleted = db.Column(db.Boolean, default=False)
    documentShareToken = db.Column(db.String(255), nullable=False)
    proposalSrc = db.Column(db.String(255))
    depositInvoiceSrc = db.Column(db.String(255))
    finalInvoiceSrc = db.Column(db.String(255))
    installationInvoiceSrc = db.Column(db.String(255))
    kwPeakSavings = db.Column(db.Float, default=0)
    pfSavings = db.Column(db.Float, default=0)
    kvarSavings = db.Column(db.Float, default=0)
    kvaSavings = db.Column(db.Float, default=0)
    kwhSavings = db.Column(db.Float, default=0)
    lastKwh = db.Column(db.Float, default=0)
    avg15MinuteKva = db.Column(db.Float, default=0)
    totalAmpLoad = db.Column(db.Float, default=0)
    lastTotalPf = db.Column(db.Float, default=100)
    initialPf = db.Column(db.Float, default=100)
    ILRatio = db.Column(db.Float, default=100)
    gwControl = db.Column(db.Boolean, default=False)
    kwRate = db.Column(db.Float, default=0)
    kwhRate = db.Column(db.Float, default=0)
    taxRate = db.Column(db.Float, default=0)
    lowAmpsThreshold = db.Column(db.Float, nullable=True)
    highAmpsThreshold = db.Column(db.Float, nullable=True)
    lastThresholdSwitchState = db.Column(db.String(255), nullable=True)
    electricBillAnalysis = db.Column(db.JSON, default=None)
    equipmentInfo = db.Column(db.JSON, default=dict)
    reportFields = db.Column(db.JSON, default=dict)
    active_emv_analysis_id = db.Column(db.Integer, nullable=True)  # FK to emv_analysis.id, set via migration
    client = db.Column(db.Integer, db.ForeignKey("client.id"), nullable=False)
    multiplier = db.Column(db.Float, default=1)
    peakMultiplier = db.Column(db.Float, default=1)
    xecoManager = db.Column(db.Integer, nullable=True)  # FK to user.id
    servicePlan = db.Column(db.Integer, nullable=True)  # FK to serviceplan.id
    lastBudgetInvoice = db.Column(db.JSON, default=dict)
    lastBudget = db.Column(db.JSON, default=dict)
