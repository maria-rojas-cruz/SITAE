from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    type: str
    url: str
    duration_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    is_mandatory: bool
    difficulty: Optional[str] = None
    order: int


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str] = None
    order: Optional[int] = None


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str] = None
    order: Optional[int] = None


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: Optional[str] = None
    name: str
    description: Optional[str] = None


# === Nested variants ===

class TopicWithResources(TopicOut):
    resources: List[ResourceOut] = []


class ModuleWithTopics(ModuleOut):
    topics: List[TopicOut] = []


class CourseWithModules(CourseOut):
    modules: List[ModuleOut] = []


# === Quiz / Question / Option ===

class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    text: str
    is_correct: bool
    feedback: Optional[str] = None


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    text: str
    score: float
    correct_explanation: Optional[str] = None


class QuestionWithOptions(QuestionOut):
    options: List[OptionOut] = []


class QuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str] = None
    time_minutes: Optional[int] = None
    attempt_max: Optional[int] = None
    weight: Optional[float] = None
    is_active: Optional[bool] = None


class QuizWithQuestions(QuizOut):
    questions: List[QuestionWithOptions] = []


# === Quiz submission ===

class AnswerIn(BaseModel):
    question_id: str
    option_id: Optional[str] = None  # None = no answer


class SubmitQuizIn(BaseModel):
    user_id: str
    answers: List[AnswerIn]


# === Topic Objective (for recommendations) ===

class TopicObjectiveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: Optional[str] = None
    description: str


# === Quiz results ===

class QuestionResultOut(BaseModel):
    question_id: str
    text: str
    correct: bool
    marked_option: Optional[OptionOut] = None
    correct_option: Optional[OptionOut] = None
    topic_objective: TopicObjectiveOut
    recommendations: List[ResourceOut] = []


class AttemptSummaryOut(BaseModel):
    attempt_id: str
    percent: float
    score_total: float


class SubmitQuizOut(BaseModel):
    attempt: AttemptSummaryOut
    questions: List[QuestionResultOut]