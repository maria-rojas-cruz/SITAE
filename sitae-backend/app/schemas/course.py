#schema/course.py
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

class CourseWithRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    role: UserRole
    progress: Optional[float] = None

class CourseListResponse(BaseModel):
    courses: List[CourseWithRoleResponse]
    total: int

class CreateCourseRequest(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None

class UpdateCourseRequest(BaseModel):
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Introducción a Python Avanzado",
                "code": "CS102",
                "description": "Curso intermedio de programación en Python"
            }
        }