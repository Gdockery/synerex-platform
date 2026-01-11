from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base

class ProgramAuthorization(Base):
    __tablename__ = "program_authorizations"
    authorization_id: Mapped[str] = mapped_column(String, primary_key=True)
    program_id: Mapped[str] = mapped_column(String, nullable=False)  # emv|tracking
    org_id: Mapped[str] = mapped_column(String, nullable=False)
    template_id: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, default="active")   # active|suspended|terminated
    starts_at: Mapped[str] = mapped_column(String, nullable=False)  # YYYY-MM-DD
    ends_at: Mapped[str] = mapped_column(String, nullable=False)

    scope_json: Mapped[str] = mapped_column(Text, nullable=False)
    constraints_json: Mapped[str] = mapped_column(Text, nullable=False)
    bindings_override_json: Mapped[str] = mapped_column(Text, nullable=False)
    issued_by: Mapped[str] = mapped_column(String, nullable=False)
