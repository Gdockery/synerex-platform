from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db import Base

class User(Base):
    __tablename__ = "users"
    
    username: Mapped[str] = mapped_column(String, primary_key=True, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)  # bcrypt hash
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.org_id"), nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    
    def __repr__(self):
        return f"<User(username='{self.username}', org_id='{self.org_id}')>"
