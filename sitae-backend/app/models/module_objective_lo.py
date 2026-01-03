# app/models/module_objective_lo.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Boolean, ForeignKey
from app.db.base import Base

class ModuleObjectiveLO(Base):
    __tablename__ = "module_objective_lo"
    
    module_objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("module_objective.id"),
        primary_key=True
    )
    learning_outcomes_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("learning_outcomes.id"),
        primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)