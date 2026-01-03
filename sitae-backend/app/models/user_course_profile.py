# app/models/user_course_profile.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import Text, TIMESTAMP, String, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime

class UserCourseProfile(Base):
    __tablename__ = "user_course_profile"
    
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True
    )
    course_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        ForeignKey("course.id", ondelete="CASCADE"),
        primary_key=True
    )
    goals: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    prereq_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    weekly_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    # Relaciones simples
    user = relationship("User", back_populates="course_profiles")
    course = relationship("Course", back_populates="user_profiles")