# app/models/user_learning_profile.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Text, TIMESTAMP, ForeignKey, String
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime

class UserLearningProfile(Base):
    __tablename__ = "user_learning_profile"
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("user.id", ondelete="CASCADE"),  
        primary_key=True
    )
    career: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_role: Mapped[str | None] = mapped_column(Text, nullable=True)
    #   ARRAY de tipos Enum de PostgreSQL
    preferred_modalities: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True
    )
    interests: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True
    )
    interest_other: Mapped[str | None] = mapped_column(Text, nullable=True)
    #   ARRAY de device_kind (tipo Enum en PostgreSQL)
    devices: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    #   Relationship
    user = relationship(
        "User", 
        back_populates="learning_profile"
    )