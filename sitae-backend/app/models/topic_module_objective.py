# app/models/topic_module_objective.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Boolean, ForeignKey
from app.db.base import Base

class TopicModuleObjective(Base):
    __tablename__ = "topic_module_objective"
    
    topic_objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("topic_objective.id"),
        primary_key=True
    )
    module_objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("module_objective.id"),
        primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)