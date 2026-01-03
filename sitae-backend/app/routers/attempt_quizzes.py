# app/routers/attempt_quizzes.py
from fastapi import APIRouter, Depends, Path, Query
from app.deps import get_current_user, get_db
from app.services.attempt_quiz_service import AttemptQuizService
from app.schemas.attempt_quiz import (
    AttemptQuizResponse,
    AttemptQuizListResponse,
    FinishAttemptIn,
    SubmitQuizOut
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/quizzes", tags=["attempt-quizzes"])

@router.get(
    "/{quiz_id}/attempts",
    response_model=AttemptQuizListResponse
)
async def get_my_attempts(
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener mis intentos en un quiz"""
    service = AttemptQuizService(db)
    return service.get_user_attempts(quiz_id, current_user["id"])

@router.post(
    "/{quiz_id}/attempts/start",
    response_model=AttemptQuizResponse,
    status_code=201
)
async def start_quiz_attempt(
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Iniciar nuevo intento de quiz"""
    service = AttemptQuizService(db)
    return service.start_attempt(quiz_id, current_user["id"])

@router.post(
    "/{quiz_id}/attempts/{attempt_id}/finish",
    response_model=SubmitQuizOut
)
async def finish_quiz_attempt(
    quiz_id: str = Path(..., description="ID del quiz"),
    attempt_id: str = Path(..., description="ID del intento"),
    payload: FinishAttemptIn = ...,
    #max_resources_per_ot: int = Query(3, ge=1, le=10),
    #max_duration_min: int | None = Query(12, ge=1),
    #rec_source: str = Query("rule-based"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finaliza el intento: guarda respuestas enviadas, califica y persiste recomendaciones.
    Devuelve el review (correctas/incorrectas + recursos).
    """
    service = AttemptQuizService(db)
    return service.finish_attempt_with_answers(
        attempt_id=attempt_id,
        user_id=current_user["id"],
        answers=payload.answers,
        #max_resources_per_ot=max_resources_per_ot,
        #max_duration_min=max_duration_min,
        #rec_source=rec_source
    )

@router.post(
    "/{quiz_id}/attempts/{attempt_id}/finish-personalized",
    response_model=SubmitQuizOut,
    summary="Finalizar quiz con recomendaciones personalizadas"
)
async def finish_quiz_attempt_personalized(
    quiz_id: str = Path(..., description="ID del quiz"),
    attempt_id: str = Path(..., description="ID del intento"),
    payload: FinishAttemptIn = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Finaliza el quiz con recomendaciones personalizadas:
    - Filtra recursos según perfil (tiempo, modalidad, nivel)
    - Ordena por relevancia personalizada
    - Genera análisis de error con LLM (en correct_explanation)
    - Genera texto explicativo por recurso con LLM (en why_text)
    """
    service = AttemptQuizService(db)
    return await service.finish_attempt_with_personalization(
        attempt_id=attempt_id,
        user_id=current_user["id"],
        answers=payload.answers
    )

@router.post(
    "/{quiz_id}/attempts/{attempt_id}/abandon",
    response_model=AttemptQuizResponse
)
async def abandon_quiz_attempt(
    quiz_id: str = Path(..., description="ID del quiz"),
    attempt_id: str = Path(..., description="ID del intento"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Abandonar intento"""
    service = AttemptQuizService(db)
    return service.abandon_attempt(attempt_id, current_user["id"])