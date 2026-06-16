"""
AssetRelationship model — Phase 2: Asset Relationship Engine.

Stores directed edges in the electrical asset graph.

Required relationship types (from spec):
  feeds         — upstream asset provides power to downstream asset
  contains      — enclosure/panel physically contains sub-assets
  monitored_by  — asset is metered by a device
  controlled_by — asset is switched/controlled by a device
  connected_to  — generic electrical connection

All edges are scoped to a digital_twin_id so that different versions of the
twin can have different topologies.
"""
from app.extensions import db
from app.models.base import BaseModel

RELATIONSHIP_TYPES = ("feeds", "contains", "monitored_by", "controlled_by", "connected_to")


class AssetRelationship(BaseModel):
    __tablename__ = "asset_relationship"

    digital_twin_id  = db.Column(db.Integer, nullable=False, index=True)
    parent_asset_id  = db.Column(db.Integer, db.ForeignKey("asset.id"), nullable=False, index=True)
    child_asset_id   = db.Column(db.Integer, db.ForeignKey("asset.id"), nullable=False, index=True)
    relationship_type = db.Column(db.String(30), nullable=False)  # one of RELATIONSHIP_TYPES
    notes            = db.Column(db.Text, nullable=True)
