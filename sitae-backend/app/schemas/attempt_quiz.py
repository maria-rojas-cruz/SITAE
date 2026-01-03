# app/schemas/attempt_quiz.py
from pydantic import BaseModel, Field
from typing import List
from typing import Optional, Literal
from datetime import datetime

AttemptStateType = Literal["EN_PROGRESO", "CALIFICADO", "ABANDONADO", "EXPIRADO"]

class AttemptQuizBase(BaseModel):
    quiz_id: str
    state: AttemptStateType = Field(default="EN_PROGRESO")

class AttemptQuizCreate(BaseModel):
    pass

class AttemptQuizResponse(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    date_start: datetime
    date_end: Optional[datetime] = None
    state: AttemptStateType
    score_total: Optional[float] = None
    percent: Optional[float] = None
    
    class Config:
        from_attributes = True

class AttemptQuizListResponse(BaseModel):
    attempts: list[AttemptQuizResponse]
    total: int

## para el finish
class FinishAnswerIn(BaseModel):
    question_id: str
    option_id: Optional[str] = None
    time_seconds: Optional[int] = None

class FinishAttemptIn(BaseModel):
    answers: List[FinishAnswerIn]


# --- Reutilizamos los DTOs en inglés del review ---
class OptionOut(BaseModel):
    id: str
    text: str

class ResourceOut(BaseModel):
    id: str
    title: str
    type: str
    url: str
    duration_min: Optional[int] = None
    mandatory: bool
    why_text: Optional[str] = None
    
    class Config:
        from_attributes = True

class TopicObjectiveOut(BaseModel):
    id: str
    code: Optional[str] = None
    description: str

class QuestionResultOut(BaseModel):
    question_id: str
    text: str
    correct: bool
    selected_option: Optional[OptionOut] = None
    correct_option: Optional[OptionOut] = None
    topic_objective: TopicObjectiveOut
    correct_explanation: Optional[str] = None # ← Esto es la explicación del docente
    comment: Optional[str] = None # ← Esto es la explicación generada por LLM
    recommendations: List[ResourceOut] = []

class AttemptSummaryOut(BaseModel):
    attempt_id: str
    percent: float
    total_score: float

class SubmitQuizOut(BaseModel):
    attempt: AttemptSummaryOut
    questions: List[QuestionResultOut]

# Para mostrar los resultados del quiz con recomendaciones
class QuestionRecommendationsOut(BaseModel):
    question_id: str
    recommendations: List[ResourceOut]

class AttemptRecommendationsOut(BaseModel):
    attempt_id: str
    items: List[QuestionRecommendationsOut]
    total_recommendations: int
