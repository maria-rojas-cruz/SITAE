# app/models/module.py
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Text, Integer, ForeignKey
from app.db.base import Base
import uuid


class Module(Base):
    __tablename__ = "module"
    
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
    description: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=1)

    course = relationship("Course", back_populates="modules")
    module_objectives = relationship(
        "ModuleObjective",
        back_populates="module",
        order_by="ModuleObjective.order"
    )
    topics = relationship(
        "Topic",
        back_populates="module",
        order_by="Topic.order"
    )