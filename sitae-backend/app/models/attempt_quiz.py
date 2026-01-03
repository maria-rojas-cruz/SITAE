# app/models/attempt_quiz.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Float, ForeignKey, TIMESTAMP, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid
import enum

class AttemptState(str, enum.Enum):
    EN_PROGRESO = "EN_PROGRESO"
    CALIFICADO = "CALIFICADO"
    ABANDONADO = "ABANDONADO"

class AttemptQuiz(Base):
    __tablename__ = "attempt_quiz"
    
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
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("user.id"), 
        nullable=False
    )
    date_start: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    date_end: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    state: Mapped[AttemptState] = mapped_column(
        SQLEnum(AttemptState, native_enum=False, length=50),
        default=AttemptState.EN_PROGRESO,
        nullable=False
    )
    score_total: Mapped[float | None] = mapped_column(Float)
    percent: Mapped[float | None] = mapped_column(Float)