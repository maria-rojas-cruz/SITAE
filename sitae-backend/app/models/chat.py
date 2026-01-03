# app/models/chat.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Text, Integer, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid

class Conversation(Base):
    """Historial de conversaciones del asistente"""
    __tablename__ = "conversation"
    
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("user.id"),
        nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("course.id"),
        nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[dict | None] = mapped_column(JSONB)  # Referencias a documentos usados
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now()
    )
    
    # Relaciones
    user = relationship("User")
    course = relationship("Course")


class CourseDocument(Base):
    """Metadatos de documentos del curso (para tracking)"""
    __tablename__ = "course_document"
    
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
    title: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)  # Link de Drive, etc.
    document_type: Mapped[str] = mapped_column(Text)  # 'pdf', 'code', 'video', 'syllabus'
    file_path: Mapped[str | None] = mapped_column(Text)  # Ruta local si se descarga
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)  # Cuántos chunks generó
    processed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now()
    )
    
    course = relationship("Course")