from fastapi import APIRouter, Depends, Path, HTTPException, status
from app.deps import get_current_user, get_assessment_service
from app.services.assessment_service import AssessmentService
from app.schemas.assessment import EvaluationSchema, QuizSchema, CreateQuizRequest, UpdateQuizRequest
from typing import List

router = APIRouter(prefix="/courses/{course_id}/assessments", tags=["assessments"])

@router.get("/evaluations", response_model=List[EvaluationSchema])
async def get_course_evaluations(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    """Obtener todas las evaluaciones de un curso"""
    return assessment_service.get_user_evaluations_for_course(course_id, current_user["id"])

@router.get("/quizzes", response_model=List[QuizSchema])
async def get_course_quizzes(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    """Obtener todos los quizzes de un curso"""
    return assessment_service.get_course_quizzes(course_id, current_user["id"])

@router.get("/topics/{topic_id}/quizzes", response_model=List[QuizSchema])
async def get_topic_quizzes(
    topic_id: str = Path(..., description="ID del topic"),
    current_user: dict = Depends(get_current_user),
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    """Obtener quizzes de un topic específico"""
    return assessment_service.get_topic_quizzes(topic_id, current_user["id"])

@router.post("/quizzes", response_model=QuizSchema)
async def create_quiz(
    quiz_data: CreateQuizRequest,
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    """Crear nuevo quiz (solo teachers/admins)"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint en desarrollo"
    )

@router.put("/quizzes/{quiz_id}", response_model=QuizSchema)
async def update_quiz(
    quiz_data: UpdateQuizRequest,
    quiz_id: str = Path(..., description="ID del quiz"),
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    """Actualizar quiz (solo teachers/admins)"""
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint en desarrollo"
    )