"""
Baseline model — Phase 6: EM&V Baseline Manager™.

Represents an engineering baseline record with a full approval workflow.
Wraps an EmvAnalysis record (computed by the EMV program) with version
control, status lifecycle, and engineering sign-off.

Status lifecycle (spec §12, §73):
  draft → engineering_review → approved → locked

Locking rules (spec §73):
  Once status = locked:
    - Cannot be edited
    - Cannot be deleted
    - To change, a new version must be created (version forward)

Version control:
  version auto-increments per project (1, 2, 3...).
  Historical baselines are NEVER deleted.

[COMPAT] EmvAnalysis table/model is unchanged.
         project.active_emv_analysis_id is unchanged.
         Phase 6 adds active_baseline_id to project (additive column).
"""
from app.extensions import db
from app.models.base import BaseModel

BASELINE_STATUSES = (
    "draft",
    "engineering_review",
    "approved",
    "locked",
)

BASELINE_TEST_TYPES = (
    "24hr",
    "7day",
    "30day",
    "custom",
)

_TRANSITIONS = {
    "draft":              ("engineering_review",),
    "engineering_review": ("approved", "draft"),   # reviewer can push back to draft
    "approved":           ("locked", "draft"),      # can re-open to draft before locking
    "locked":             (),                       # terminal — create new version instead
}


class Baseline(BaseModel):
    __tablename__ = "baseline_master"

    # Scope
    project_id  = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False, index=True)
    org_id      = db.Column(db.String(255), nullable=True, index=True)

    # Versioning — auto-set by route on create, never changes after creation
    version     = db.Column(db.Integer, nullable=False, default=1)

    # Status lifecycle
    status      = db.Column(db.String(30), nullable=False, default="draft", index=True)

    # Test configuration
    test_type   = db.Column(db.String(20), nullable=True)   # 24hr, 7day, 30day, custom
    test_start  = db.Column(db.String(50), nullable=True)   # date string YYYY-MM-DD
    test_end    = db.Column(db.String(50), nullable=True)

    # Link to EmvAnalysis computed result (nullable until EMV pushes data)
    emv_analysis_id = db.Column(db.Integer, db.ForeignKey("emv_analysis.id"), nullable=True)

    # Engineering review
    reviewer_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    reviewer_notes  = db.Column(db.Text, nullable=True)
    reviewed_at     = db.Column(db.BigInteger, nullable=True)

    # Approval
    approved_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    approved_at     = db.Column(db.BigInteger, nullable=True)

    # Lock
    locked_by       = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    locked_at       = db.Column(db.BigInteger, nullable=True)

    # Baseline metrics snapshot (filled when linked to EmvAnalysis or approved)
    avg_kw          = db.Column(db.Float, nullable=True)
    avg_kva         = db.Column(db.Float, nullable=True)
    avg_pf          = db.Column(db.Float, nullable=True)
    avg_kvar        = db.Column(db.Float, nullable=True)
    peak_kva        = db.Column(db.Float, nullable=True)
    kwh_savings_pct = db.Column(db.Float, nullable=True)   # e.g. 0.08 = 8%
    kw_peak_savings_pct = db.Column(db.Float, nullable=True)
    pf_savings_pct  = db.Column(db.Float, nullable=True)

    notes           = db.Column(db.Text, nullable=True)

    # Spec: historical baselines are NEVER deleted — no is_deleted flag
