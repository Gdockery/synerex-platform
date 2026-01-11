from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base

class SeatAssignment(Base):
    __tablename__ = "seat_assignments"
    id: Mapped[str] = mapped_column(String, primary_key=True)  # f"{license_id}:{user_id}"
    license_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
