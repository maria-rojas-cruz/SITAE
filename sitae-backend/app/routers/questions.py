# app/routers/questions.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.question_service import QuestionService
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/quizzes", tags=["questions"])

@router.get(
    "/{quiz_id}/questions",
    response_model=QuestionListResponse
)
async def get_questions(
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener preguntas de un quiz"""
    service = QuestionService(db)
    return service.get_quiz_questions(quiz_id, current_user["id"])

@router.post(
    "/{quiz_id}/questions",
    response_model=QuestionResponse,
    status_code=201
)
async def create_question(
    quiz_id: str = Path(..., description="ID del quiz"),
    question_data: QuestionCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear pregunta (solo docentes)"""
    service = QuestionService(db)
    return service.create_question(quiz_id, current_user["id"], question_data)

@router.put(
    "/{quiz_id}/questions/{question_id}",
    response_model=QuestionResponse
)
async def update_question(
    quiz_id: str = Path(..., description="ID del quiz"),
    question_id: str = Path(..., description="ID de la pregunta"),
    question_data: QuestionUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar pregunta (solo docentes)"""
    service = QuestionService(db)
    return service.update_question(question_id, current_user["id"], question_data)

@router.delete(
    "/{quiz_id}/questions/{question_id}",
    status_code=200
)
async def delete_question(
    quiz_id: str = Path(..., description="ID del quiz"),
    question_id: str = Path(..., description="ID de la pregunta"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar pregunta (solo docentes)"""
    service = QuestionService(db)
    return service.delete_question(question_id, current_user["id"])