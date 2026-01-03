from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

class EvaluationStatus(str, Enum):
    COMPLETED = "completed"
    PENDING = "pending"

class EvaluationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    topic: str
    title: str
    status: EvaluationStatus
    score: Optional[float] = None
    totalQuestions: int
    correctAnswers: Optional[int] = None
    dueDate: Optional[datetime] = None
    duration: Optional[int] = None

class QuizSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    description: Optional[str] = None
    time_minutes: Optional[int] = None
    attempt_max: Optional[int] = None
    weight: Optional[float] = None
    is_active: bool = True
    topic_id: Optional[str] = None

class CreateQuizRequest(BaseModel):
    title: str
    description: Optional[str] = None
    time_minutes: Optional[int] = None
    attempt_max: Optional[int] = None
    weight: Optional[float] = None
    topic_id: str

class UpdateQuizRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    time_minutes: Optional[int] = None
    attempt_max: Optional[int] = None
    weight: Optional[float] = None
    is_active: Optional[bool] = None