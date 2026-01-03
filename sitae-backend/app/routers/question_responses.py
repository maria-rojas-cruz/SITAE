# app/routers/question_responses.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.question_response_service import QuestionResponseService
from app.schemas.question_response import (
    QuestionResponseCreate,
    QuestionResponseDetail,
    QuestionResponseListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/attempts", tags=["question-responses"])

@router.get(
    "/{attempt_id}/responses",
    response_model=QuestionResponseListResponse
)
async def get_attempt_responses(
    attempt_id: str = Path(..., description="ID del intento"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener respuestas de un intento"""
    service = QuestionResponseService(db)
    return service.get_attempt_responses(attempt_id, current_user["id"])

@router.post(
    "/{attempt_id}/responses",
    response_model=QuestionResponseDetail,
    status_code=201
)
async def submit_question_response(
    attempt_id: str = Path(..., description="ID del intento"),
    response_data: QuestionResponseCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enviar respuesta a una pregunta"""
    service = QuestionResponseService(db)
    return service.submit_response(attempt_id, current_user["id"], response_data)