# app/models/question.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Float, ForeignKey
from app.db.base import Base
import uuid

class Question(Base):
    __tablename__ = "question"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    quiz_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("quiz.id"), 
        nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    correct_explanation: Mapped[str | None] = mapped_column(Text)
    topic_objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("topic_objective.id"), 
        nullable=False
    )