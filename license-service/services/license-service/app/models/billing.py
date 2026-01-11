from sqlalchemy import String, DateTime, Integer, Numeric, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base

class BillingOrder(Base):
    __tablename__ = "billing_orders"

    order_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False)

    program_id: Mapped[str] = mapped_column(String, nullable=False)  # emv|tracking
    plan: Mapped[str] = mapped_column(String, nullable=False)        # baseline|pro|enterprise etc.

    term_start: Mapped[str] = mapped_column(String, nullable=False)  # YYYY-MM-DD
    term_end: Mapped[str] = mapped_column(String, nullable=False)    # YYYY-MM-DD

    seat_count: Mapped[int] = mapped_column(Integer, default=0)
    meter_count: Mapped[int] = mapped_column(Integer, default=0)

    unit_price: Mapped[str] = mapped_column(String, default="0")     # string for simplicity
    amount_total: Mapped[str] = mapped_column(String, default="0")
    currency: Mapped[str] = mapped_column(String, default="USD")

    status: Mapped[str] = mapped_column(String, default="pending")   # pending|paid|overdue|cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    license_id: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # License agreement acceptance fields
    agreement_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    agreement_version: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g., "2026.01"
    agreement_accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    agreement_accepted_by: Mapped[str | None] = mapped_column(String, nullable=True)  # email or org_id