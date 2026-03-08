from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from ..db import Base

class Organization(Base):
    __tablename__ = "organizations"
    org_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    org_name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_type: Mapped[str] = mapped_column(String(255), nullable=False)  # oem|customer|pe
    
    # Contact information
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)  # Legacy field
    billing_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Company/Billing Address
    company_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_zip: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_phone: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_cell: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Physical Address
    physical_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    physical_city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    physical_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    physical_zip: Mapped[str | None] = mapped_column(String(255), nullable=True)
    physical_phone: Mapped[str | None] = mapped_column(String(255), nullable=True)
    physical_cell: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # OEM sponsor for customer/pe orgs (orgs created by OEM Admin)
    sponsor_org_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # PE-specific fields (only used when org_type = 'pe')
    pe_license_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pe_license_state: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pe_approval_status: Mapped[str | None] = mapped_column(String(255), nullable=True)  # pending|approved|rejected
    pe_linked_org_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Optional link to licensee org
    
    # Relationship to users
    users: Mapped[List["User"]] = relationship("User", back_populates="organization")