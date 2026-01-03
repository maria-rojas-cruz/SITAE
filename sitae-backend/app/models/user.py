# app/models/user.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Boolean, TIMESTAMP, ForeignKey, Integer 
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime
import uuid

class Role(Base):
    __tablename__ = "role"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True) 
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    
   
    # course_user_roles = relationship("CourseUserRole", back_populates="role")

class Person(Base):
    __tablename__ = "person"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    first_last_name: Mapped[str] = mapped_column(Text, nullable=False)
    second_last_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    
    users = relationship("User", back_populates="person")

class User(Base):
    __tablename__ = "user"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    person_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("person.id", ondelete="CASCADE"))
    username: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    password_hash: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    google_id: Mapped[str | None] = mapped_column(Text, unique=True)
    email: Mapped[str | None] = mapped_column(Text, unique=True)
    name: Mapped[str | None] = mapped_column(Text)
    picture: Mapped[str | None] = mapped_column(Text)
    auth_provider: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    person = relationship("Person", back_populates="users")

    
    course_roles = relationship("CourseUserRole", back_populates="user")
    
    learning_profile = relationship(
        "UserLearningProfile", 
        back_populates="user",
        uselist=False
    )
    
    course_profiles = relationship(
        "UserCourseProfile", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    