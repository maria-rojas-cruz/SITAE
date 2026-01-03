# app/models/option.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Boolean, ForeignKey
from app.db.base import Base
import uuid

class Option(Base):
    __tablename__ = "option"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("question.id"), 
        nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text)