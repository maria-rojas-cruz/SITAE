# app/models/module_objective.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid

class ModuleObjective(Base):
    __tablename__ = "module_objective"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    module_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("module.id"), 
        nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    code: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now()
    )

    module = relationship("Module", back_populates="module_objectives")
    
    linked_learning_outcomes = relationship(
        "LearningOutcome",
        secondary="module_objective_lo",
        backref="linked_module_objectives"
    )