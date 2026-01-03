# schemas/profile.py

from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.user_learning_profile import UserLearningProfileResponse
from app.schemas.user_course_profile import UserCourseProfileResponse

class CompleteProfileRequest(BaseModel):
    
    # Datos generales (user_learning_profile)
    career: Optional[str] = Field(None, max_length=255)
    job_role: Optional[str] = Field(None, max_length=255)
    preferred_modalities: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    interest_other: Optional[str] = Field(None, max_length=500)
    devices: Optional[List[str]] = None
    
    # Datos específicos del curso (user_course_profile)
    goals: Optional[List[str]] = None
    prereq_level: Optional[str] = Field(None, description="Ej: 'basico', 'intermedio', 'avanzado'")
    weekly_time: Optional[str] = Field(None, description="Ej: 'lt3h', 'h3_6', 'gt6h'")
    
    class Config:
        json_schema_extra = {
            "example": 
                {
                    
                    "learning_profile": {
                        "career": "Ingeniería de Software 3",
                        "devices": [
                            "laptop_pc",
                            "tablet"
                        ],
                        
                    },
                    "course_profile": {
                        "goals": [
                        "mejorar_nota"
                        ],
                        "prereq_level": "intermedio",
                    
                    }
                }
            }
        

class CompleteProfileResponse(BaseModel):
    """Response con ambos perfiles"""
    user_id: str
    course_id: str
    learning_profile: Optional[UserLearningProfileResponse] = None
    course_profile: Optional[UserCourseProfileResponse] = None