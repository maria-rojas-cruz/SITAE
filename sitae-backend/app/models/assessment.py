from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, Boolean, ForeignKey, Numeric
from app.db.base import Base
import uuid

class Quiz(Base):
    __tablename__ = "quiz"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("topic.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    time_minutes: Mapped[int | None] = mapped_column(Integer)
    attempt_max: Mapped[int | None] = mapped_column(Integer)
    weight: Mapped[float | None] = mapped_column(Numeric)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
   
    topic: Mapped["Topic"] = relationship("Topic", back_populates="quizzes")