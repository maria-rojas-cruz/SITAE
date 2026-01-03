# app/models/question_response.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Boolean, Float, Integer, ForeignKey
from app.db.base import Base
import uuid

class QuestionResponse(Base):
    __tablename__ = "question_response"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    attempt_quiz_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("attempt_quiz.id"), 
        nullable=False
    )
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("question.id"), 
        nullable=False
    )
    option_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("option.id")
    )
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    score: Mapped[float | None] = mapped_column(Float)
    comment: Mapped[str | None] = mapped_column(Text)
    time_seconds: Mapped[int | None] = mapped_column(Integer)