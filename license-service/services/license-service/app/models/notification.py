from sqlalchemy import String, Boolean, DateTime, Text, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from enum import Enum
from ..db import Base

class NotificationType(str, Enum):
    EXPIRATION_REMINDER = "expiration_reminder"
    RENEWAL_REMINDER = "renewal_reminder"
    PAYMENT_DUE = "payment_due"
    PAYMENT_RECEIVED = "payment_received"
    LICENSE_ISSUED = "license_issued"
    LICENSE_REVOKED = "license_revoked"
    LICENSE_SUSPENDED = "license_suspended"
    LICENSE_ACTIVATED = "license_activated"
    TRIAL_EXPIRING = "trial_expiring"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    BOUNCED = "bounced"

class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    license_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    notification_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default=NotificationStatus.PENDING.value)
    recipient_email: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)


