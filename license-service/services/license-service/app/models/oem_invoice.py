"""OEM platform-fee invoice model.

Each time a Synerex Admin activates (or renews) a client that belongs to an OEM,
one OemInvoice record is created against the OEM's account.  Synerex marks these
as paid after receiving the offline / wired payment from the OEM.
"""
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db import Base


class OemInvoice(Base):
    __tablename__ = "oem_invoices"

    invoice_id: Mapped[str] = mapped_column(String(255), primary_key=True)

    # The OEM who owes this fee
    oem_org_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # The client that was activated / renewed (for reference)
    client_org_id: Mapped[str] = mapped_column(String(255), nullable=False)

    # Linked license that was issued
    license_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Subscription plan the client took (basic / pro / enterprise)
    plan: Mapped[str] = mapped_column(String(255), nullable=False)

    # Event type: "activation" (first year) or "renewal" (subsequent years)
    event_type: Mapped[str] = mapped_column(String(50), default="activation")

    # Platform fee Synerex charges the OEM for this client
    amount: Mapped[str] = mapped_column(String(255), default="0.00")
    currency: Mapped[str] = mapped_column(String(10), default="USD")

    # pending | paid | waived
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Free-text notes (payment reference, offline invoice #, etc.)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
