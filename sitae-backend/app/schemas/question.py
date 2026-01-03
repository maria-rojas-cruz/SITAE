# app/schemas/question.py
from pydantic import BaseModel, Field
from typing import Optional

class QuestionBase(BaseModel):
    text: str = Field(..., min_length=1)
    score: float = Field(default=1.0, ge=0)
    correct_explanation: Optional[str] = None
    topic_objective_id: str

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)
    score: Optional[float] = Field(None, ge=0)
    correct_explanation: Optional[str] = None
    topic_objective_id: Optional[str] = None

class QuestionResponse(QuestionBase):
    id: str
    quiz_id: str
    
    class Config:
        from_attributes = True

class QuestionListResponse(BaseModel):
    questions: list[QuestionResponse]
    total: int

class QuestionCreateWithObjective(BaseModel):
    """Para crear pregunta desde el frontend con selector de objectives"""
    text: str = Field(..., min_length=1)
    score: float = Field(default=1.0, ge=0)
    correct_explanation: Optional[str] = None
    topic_objective_id: str  # ← El usuario selecciona del dropdown

class QuestionWithObjectiveInfo(BaseModel):
    """Response que incluye info del objective para mostrar"""
    id: str
    quiz_id: str
    text: str
    score: float
    correct_explanation: Optional[str]
    topic_objective_id: str
    topic_objective_code: Optional[str]  # ← Para mostrar en UI
    topic_objective_description: str  # ← Para mostrar en UI
    
    class Config:
        from_attributes = True