# app/routers/learning_outcomes.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.learning_outcome_service import LearningOutcomeService
from app.schemas.learning_outcome import (
    LearningOutcomeCreate,
    LearningOutcomeUpdate,
    LearningOutcomeResponse,
    LearningOutcomesListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/courses", tags=["learning-outcomes"])

# Listar learning outcomes de un curso
@router.get(
    "/{course_id}/learning-outcomes",
    response_model=LearningOutcomesListResponse
)
async def get_learning_outcomes(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los learning outcomes de un curso"""
    service = LearningOutcomeService(db)
    return service.get_course_outcomes(course_id, current_user["id"])

# Crear learning outcome
@router.post(
    "/{course_id}/learning-outcomes",
    response_model=LearningOutcomeResponse,
    status_code=201
)
async def create_learning_outcome(
    course_id: str = Path(..., description="ID del curso"),
    outcome_data: LearningOutcomeCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo learning outcome (solo docentes)"""
    service = LearningOutcomeService(db)
    return service.create_outcome(course_id, current_user["id"], outcome_data)

# Actualizar learning outcome
@router.put(
    "/{course_id}/learning-outcomes/{outcome_id}",
    response_model=LearningOutcomeResponse
)
async def update_learning_outcome(
    course_id: str = Path(..., description="ID del curso"),
    outcome_id: str = Path(..., description="ID del learning outcome"),
    outcome_data: LearningOutcomeUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar learning outcome (solo docentes)"""
    service = LearningOutcomeService(db)
    return service.update_outcome(outcome_id, current_user["id"], outcome_data)

# Eliminar learning outcome
@router.delete(
    "/{course_id}/learning-outcomes/{outcome_id}",
    status_code=200
)
async def delete_learning_outcome(
    course_id: str = Path(..., description="ID del curso"),
    outcome_id: str = Path(..., description="ID del learning outcome"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar learning outcome (solo docentes)"""
    service = LearningOutcomeService(db)
    return service.delete_outcome(outcome_id, current_user["id"])