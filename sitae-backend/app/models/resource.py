# app/models/resource.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid

class Resource(Base):
    __tablename__ = "resource"
    
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
    title: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    difficulty: Mapped[str | None] = mapped_column(Text)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_external: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # fix this line
    order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    topic_objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("topic_objective.id"), 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    topic = relationship("Topic", back_populates="resources")