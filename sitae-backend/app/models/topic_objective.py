# app/models/topic_objective.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, ForeignKey
from app.db.base import Base
import uuid

class TopicObjective(Base):
    __tablename__ = "topic_objective"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    topic_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("topic.id"), 
        nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    code: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=1)

    topic = relationship("Topic", back_populates="topic_objectives")
    
    linked_module_objectives = relationship(
        "ModuleObjective",
        secondary="topic_module_objective",
        backref="linked_topic_objectives"
    )