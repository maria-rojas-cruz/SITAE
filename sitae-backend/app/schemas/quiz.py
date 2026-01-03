# app/schemas/quiz.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    time_minutes: Optional[int] = Field(None, ge=1, description="Tiempo límite en minutos")
    attempt_max: Optional[int] = Field(None, ge=1, description="Intentos máximos permitidos")
    weight: Optional[float] = Field(None, ge=0, le=1, description="Peso en evaluación final (0-1)")
    is_active: bool = Field(default=True)
    due_date: Optional[datetime] = Field(None, description="Fecha límite de entrega")
    
class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    time_minutes: Optional[int] = Field(None, ge=1)
    attempt_max: Optional[int] = Field(None, ge=1)
    weight: Optional[float] = Field(None, ge=0, le=1)
    is_active: Optional[bool] = None

class QuizResponse(QuizBase):
    id: str
    topic_id: str
    
    class Config:
        from_attributes = True

class QuizListResponse(BaseModel):
    quizzes: list[QuizResponse]
    total: int