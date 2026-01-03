# app/schemas/statistics.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ==================== ESTADÍSTICAS GENERALES ====================

class CourseStatistics(BaseModel):
    total_students: int
    total_quizzes: int
    avg_quiz_score: float
    quizzes_completed_count: int
    quizzes_pending_count: int
    active_students_last_week: int
    quiz_participation_rate: float  # NUEVO
    average_objectives_achievement: float  # NUEVO

# ==================== DESEMPEÑO DE ESTUDIANTES ====================

class StudentPerformance(BaseModel):
    user_id: str
    full_name: str
    email: str
    quizzes_completed: int
    quizzes_total: int
    avg_score: Optional[float] = None
    last_activity: Optional[datetime] = None

class StudentPerformanceList(BaseModel):
    students: List[StudentPerformance]
    total: int

# ==================== RESULTADOS DE QUIZ ====================

class QuestionAnalysis(BaseModel):
    question_id: str
    question_text: str
    correct_rate: float  # 0.0 a 100.0
    total_responses: int
    avg_time_seconds: Optional[float] = None

class StudentQuizResult(BaseModel):
    user_id: str
    full_name: str
    attempt_id: str
    score: float
    percent: float
    date_completed: datetime
    time_taken_minutes: Optional[int] = None

class QuizResultsReport(BaseModel):
    quiz_id: str
    quiz_title: str
    topic_name: str
    total_attempts: int
    completed_attempts: int
    avg_score: float
    avg_percent: float
    question_analysis: List[QuestionAnalysis]
    student_results: List[StudentQuizResult]

# ==================== ANÁLISIS POR LEARNING OUTCOME ====================

class LearningOutcomePerformance(BaseModel):
    learning_outcome_id: str
    learning_outcome_code: str
    learning_outcome_description: str
    related_quizzes_count: int
    avg_score_across_quizzes: float
    students_above_70_percent: int
    students_below_70_percent: int
    topic: Optional[str] = None  # NUEVO

class LearningOutcomePerformanceList(BaseModel):  # NUEVO
    learning_outcomes: List[LearningOutcomePerformance]
    total: int

# ==================== ANÁLISIS DE ERRORES ====================

class ErrorAnalysisItem(BaseModel):  # NUEVO
    question_id: str
    question_text: str
    full_question_text: str
    error_rate: float
    learning_objective_code: Optional[str] = None  # ← CAMBIAR A OPCIONAL
    learning_objective_description: Optional[str] = None  # ← CAMBIAR A OPCIONAL
    quiz_title: str
    topic_name: str

class ErrorAnalysisList(BaseModel):  # NUEVO
    errors: List[ErrorAnalysisItem]
    total: int