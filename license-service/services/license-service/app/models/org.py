from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class Organization(Base):
    __tablename__ = "organizations"
    org_id: Mapped[str] = mapped_column(String, primary_key=True)
    org_name: Mapped[str] = mapped_column(String, nullable=False)
    org_type: Mapped[str] = mapped_column(String, nullable=False)  # oem|customer|pe
    
    # Contact information
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_email: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # PE-specific fields (only used when org_type = 'pe')
    pe_license_number: Mapped[str | None] = mapped_column(String, nullable=True)
    pe_license_state: Mapped[str | None] = mapped_column(String, nullable=True)
    pe_approval_status: Mapped[str | None] = mapped_column(String, nullable=True)  # pending|approved|rejected
    pe_linked_org_id: Mapped[str | None] = mapped_column(String, nullable=True)  # Optional link to licensee org