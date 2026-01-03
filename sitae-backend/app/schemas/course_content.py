# app/schemas/course_content.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ==================== SCHEMAS ANIDADOS ====================

class TeacherInfo(BaseModel):
    id: str
    full_name: str
    email: str

class LearningOutcomeInfo(BaseModel):
    id: str
    code: str
    description: str
    bloom_level: Optional[str] = None
    order: int

class TopicObjectiveInfo(BaseModel):
    id: str
    description: str
    code: Optional[str] = None

class ModuleObjectiveInfo(BaseModel):
    id: str
    description: str
    code: Optional[str] = None

class ResourceInfo(BaseModel):
    id: str
    type: str
    title: str
    url: str
    duration_minutes: Optional[int] = None
    is_mandatory: bool
    order: int
    topic_objective_id: str
    topic_objective_code: Optional[str] = None

class QuizSummary(BaseModel):
    """Quiz como recurso dentro de topic"""
    id: str
    type: str = "quiz"
    title: str
    description: Optional[str] = None
    time_minutes: Optional[int] = None
    is_active: bool
    order: int = 999
    completed: bool = False  # ← AGREGAR
    last_attempt_id: Optional[str] = None  # ← AGREGAR
    last_attempt_percent: Optional[float] = None  # ← AGREGAR


class QuizEditData(BaseModel):
    id: str
    title: str
    description: Optional[str]
    time_minutes: Optional[int]
    is_active: bool
    available_topic_objectives: List[TopicObjectiveInfo]

class ModuleObjectiveWithLinks(BaseModel):
    id: str
    description: str
    code: Optional[str]
    order: int
    linked_learning_outcome_ids: List[str]

class TopicObjectiveWithLinks(BaseModel):
    id: str
    description: str
    code: Optional[str]
    order: int
    linked_module_objective_ids: List[str]

# ⭐ AHORA TopicEditData puede usar QuizEditData
class TopicEditData(BaseModel):
    id: str
    title: str
    description: Optional[str]
    order: int
    objectives: List[TopicObjectiveWithLinks]
    resources: List[ResourceInfo]
    quizzes: List[QuizEditData]  #   Ahora sí está definido
    available_module_objectives: List[ModuleObjectiveInfo]

class ModuleEditData(BaseModel):
    id: str
    title: str
    description: Optional[str]
    order: int
    objectives: List[ModuleObjectiveWithLinks]
    topics: List[TopicEditData]

class EvaluationInfo(BaseModel):
    """Para la pestaña de evaluaciones"""
    id: str
    title: str
    topic: str
    status: str
    score: Optional[float] = None
    total_questions: int
    correct_answers: Optional[int] = None
    due_date: Optional[datetime] = None
    attempt_id: Optional[str] = None

# ==================== SCHEMAS DE TOPIC ====================

class TopicInfo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    order: int
    objectives: List[TopicObjectiveInfo]
    resources: List[ResourceInfo]
    quizzes: List[QuizSummary]

class ModuleInfo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    order: int
    objectives: List[ModuleObjectiveInfo]
    topics: List[TopicInfo]

# ==================== RESPONSE PRINCIPAL ====================

class CourseContentResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    role: str
    teachers: List[TeacherInfo]
    learning_outcomes: List[LearningOutcomeInfo]
    modules: List[ModuleInfo]
    evaluations: List[EvaluationInfo]

class CourseEditDataResponse(BaseModel):
    id: str
    name: str
    code: Optional[str]
    description: Optional[str]
    is_active: bool
    learning_outcomes: List[LearningOutcomeInfo]
    modules: List[ModuleEditData]