#models/course
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Boolean, TIMESTAMP, ForeignKey, Integer, Numeric
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid

class Course(Base):
    __tablename__ = "course"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str | None] = mapped_column(Text, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    course_user_roles = relationship("CourseUserRole", back_populates="course")
    learning_outcomes = relationship(
            "LearningOutcome", 
            back_populates="course",
            order_by="LearningOutcome.order"
        )
    modules = relationship(
            "Module", 
            back_populates="course",
            order_by="Module.order"
        )
    
    user_profiles = relationship(
        "UserCourseProfile", 
        back_populates="course",
        cascade="all, delete-orphan"
    )
    

class CourseUserRole(Base):
    __tablename__ = "course_user_role"
    
    course_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("course.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("user.id"), primary_key=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("role.id"))
    progress: Mapped[float | None] = mapped_column(Numeric, default=0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="course_user_roles")
    user = relationship("User", back_populates="course_roles")