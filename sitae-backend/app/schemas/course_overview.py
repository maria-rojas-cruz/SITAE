from pydantic import BaseModel
from typing import List, Optional

class TopicResource(BaseModel):
    id: str
    title: str
    type: Optional[str] = None
    duration_minutes: Optional[int] = None
    completed: Optional[bool] = None

class TopicOverview(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    objectives: List[str]
    resources: List[TopicResource] = []

class ModuleOverview(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    objectives: List[str]
    topics: List[TopicOverview]

class LearningOutcomeItem(BaseModel):
    code: str
    description: str
    bloom_level: Optional[str] = None

class EvaluationOverview(BaseModel):
    id: str
    title: str
    topic: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    total_questions: Optional[int] = None

class CourseOverviewResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    role_id: int
    learning_outcomes: List[LearningOutcomeItem]
    modules: List[ModuleOverview]
    evaluations: List[EvaluationOverview]
