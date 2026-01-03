# app/models/topic.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, ForeignKey
from app.db.base import Base
import uuid
from sqlalchemy.orm import relationship

class Topic(Base):
    __tablename__ = "topic"
    
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
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=1)

    module = relationship("Module", back_populates="topics")
    topic_objectives = relationship(
        "TopicObjective",
        back_populates="topic",
        order_by="TopicObjective.order"
    )
    resources = relationship(
        "Resource",
        back_populates="topic",
        order_by="Resource.order"
    )
    quizzes = relationship("Quiz", back_populates="topic")