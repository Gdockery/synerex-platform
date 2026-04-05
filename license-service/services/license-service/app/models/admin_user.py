"""Platform admin users with roles: admin, fraud_prevention, customer_support."""
from datetime import datetime
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

# Platform admin roles
PLATFORM_ROLES = ("admin", "fraud_prevention", "customer_support")


class AdminUser(Base):
    """Platform admin with role-based access. Master admin (from config) has role 'admin'."""
    __tablename__ = "admin_users"

    username: Mapped[str] = mapped_column(String(255), primary_key=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False, default="admin")
    # Customer Support: comma-separated org_ids this admin can access for payments/review
    support_org_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def get_support_org_ids(self) -> list[str]:
        """Return list of org_ids this Customer Support admin can access."""
        if not self.support_org_ids:
            return []
        return [x.strip() for x in self.support_org_ids.split(",") if x.strip()]
