from sqlalchemy import String, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base

class UsageEvent(Base):
    __tablename__ = "usage_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    license_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)  # e.g., "feature_used", "api_call", "login"
    feature_name: Mapped[str | None] = mapped_column(String, nullable=True)
    event_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON (renamed from metadata - reserved word)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

