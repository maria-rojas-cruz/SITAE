# app/routers/statistics.py
from fastapi import APIRouter, Depends, Path, Query
from app.deps import get_current_user, get_db
from app.services.statistics_service import StatisticsService
from app.schemas.statistics import (
    CourseStatistics,
    StudentPerformanceList,
    QuizResultsReport,
    LearningOutcomePerformance,
    LearningOutcomePerformanceList,
    ErrorAnalysisList
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get(
    "/courses/{course_id}",
    response_model=CourseStatistics
)
async def get_course_statistics(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Estadísticas generales del curso (solo docentes)"""
    service = StatisticsService(db)
    return service.get_course_statistics(course_id, current_user["id"])

@router.get(
    "/courses/{course_id}/students",
    response_model=StudentPerformanceList
)
async def get_students_performance(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Desempeño de estudiantes (solo docentes)"""
    service = StatisticsService(db)
    return service.get_students_performance(course_id, current_user["id"])

@router.get(
    "/quizzes/{quiz_id}/results",
    response_model=QuizResultsReport
)
async def get_quiz_results(
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resultados detallados de un quiz (solo docentes)"""
    service = StatisticsService(db)
    return service.get_quiz_results(quiz_id, current_user["id"])

@router.get(
    "/courses/{course_id}/learning-outcomes/{lo_id}",
    response_model=LearningOutcomePerformance
)
async def get_learning_outcome_performance(
    course_id: str = Path(..., description="ID del curso"),
    lo_id: str = Path(..., description="ID del learning outcome"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Análisis de desempeño por Learning Outcome específico (solo docentes)"""
    service = StatisticsService(db)
    return service.get_learning_outcome_performance(
        course_id, 
        lo_id, 
        current_user["id"]
    )

@router.get(
    "/courses/{course_id}/learning-outcomes",
    response_model=LearningOutcomePerformanceList
)
async def get_all_learning_outcomes_performance(
    course_id: str = Path(..., description="ID del curso"),
    student_id: str | None = Query(None, description="Filtrar por estudiante específico"),  # ← AGREGAR ESTA LÍNEA
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Análisis de todos los Learning Outcomes del curso (solo docentes)"""
    service = StatisticsService(db)
    return service.get_all_learning_outcomes_performance(
        course_id,
        current_user["id"],
        student_id  # ← AHORA SÍ ESTÁ DEFINIDO
    )

@router.get(
    "/courses/{course_id}/error-analysis",
    response_model=ErrorAnalysisList
)
async def get_error_analysis(
    course_id: str = Path(..., description="ID del curso"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de preguntas a retornar"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Análisis de preguntas con mayor % de error (solo docentes)"""
    service = StatisticsService(db)
    return service.get_error_analysis(
        course_id,
        current_user["id"],
        limit
    )