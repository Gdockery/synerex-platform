from sqlalchemy import String, DateTime, Text, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base

class Payment(Base):
    __tablename__ = "payments"
    
    id: Mapped[int] = mapped_column(String, primary_key=True)  # Payment ID from gateway
    order_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[str] = mapped_column(String, nullable=False)  # Decimal as string
    currency: Mapped[str] = mapped_column(String, default="USD")
    gateway: Mapped[str] = mapped_column(String, nullable=False)  # "stripe", "paypal", etc.
    gateway_transaction_id: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)  # "pending", "completed", "failed", "refunded"
    payment_method: Mapped[str | None] = mapped_column(String, nullable=True)  # "card", "paypal", etc.
    invoice_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON (renamed from metadata - reserved word)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Invoice(Base):
    __tablename__ = "invoices"
    
    invoice_id: Mapped[str] = mapped_column(String, primary_key=True)
    order_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    amount: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="USD")
    status: Mapped[str] = mapped_column(String, nullable=False)  # "draft", "sent", "paid", "overdue", "cancelled"
    pdf_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

