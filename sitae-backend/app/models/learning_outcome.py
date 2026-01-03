# app/models/learning_outcome.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, ForeignKey
from app.db.base import Base
import uuid

class LearningOutcome(Base):
    __tablename__ = "learning_outcomes"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("course.id"), 
        nullable=False
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    bloom_level: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=1)
    
    course = relationship("Course", back_populates="learning_outcomes")