"""
EMV Analysis model - stores EM&V analysis results pushed from EMV program.
Used for: baseline savings %, client HTML report, history.
"""
from app.extensions import db
from app.models.base import BaseModel


class EmvAnalysis(BaseModel):
    """
    EM&V analysis record. When EMV pushes analysis, we store it here.
    Latest becomes the project baseline (project.kwhSavings, etc. updated).
    """
    __tablename__ = "emv_analysis"

    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False, index=True)
    org_id = db.Column(db.String(255), nullable=True)
    client_id = db.Column(db.Integer, nullable=True)

    # Savings percentages (decimal, e.g. 0.05 = 5%)
    kwh_savings = db.Column(db.Float, nullable=True)
    kw_peak_savings = db.Column(db.Float, nullable=True)
    pf_savings = db.Column(db.Float, nullable=True)
    kvar_savings = db.Column(db.Float, nullable=True)
    kva_savings = db.Column(db.Float, nullable=True)

    # Client HTML report
    report_html = db.Column(db.Text, nullable=True)
    share_token = db.Column(db.String(255), nullable=True, unique=True, index=True)

    # Metadata
    analysis_date = db.Column(db.String(50), nullable=True)
    off_period_start = db.Column(db.String(50), nullable=True)
    off_period_end = db.Column(db.String(50), nullable=True)
    on_period_start = db.Column(db.String(50), nullable=True)
    on_period_end = db.Column(db.String(50), nullable=True)

    # OFF-period harmonic baseline pushed by EMV program (H3–H21 per phase + THD/TDD)
    # Structure: {"l1":{"amp":{"H3":2.1,...},"volt":{...}},"l2":{...},"l3":{...},"thd":{...},"tdd":{...}}
    harmonic_baseline = db.Column(db.JSON, nullable=True)
