from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base

class License(Base):
    __tablename__ = "licenses"
    license_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False)

    program_id: Mapped[str] = mapped_column(String, nullable=False)        # emv|tracking
    authorization_id: Mapped[str] = mapped_column(String, nullable=False)

    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


    suspended: Mapped[bool] = mapped_column(Boolean, default=False)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    suspended_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    signature_b64: Mapped[str] = mapped_column(Text, nullable=False)
    key_id: Mapped[str] = mapped_column(String, default="SYX-MASTER-KEY-01")
    
    # New fields for lifecycle management
    is_trial: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=False)
    renewal_license_id: Mapped[str | None] = mapped_column(String, nullable=True)  # ID of renewed license
    previous_license_id: Mapped[str | None] = mapped_column(String, nullable=True)  # ID of license this renewed
    grace_period_ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)