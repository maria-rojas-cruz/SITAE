# app/routers/options.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.option_service import OptionService
from app.schemas.option import (
    OptionCreate,
    OptionUpdate,
    OptionResponse,
    OptionListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/questions", tags=["options"])

@router.get(
    "/{question_id}/options",
    response_model=OptionListResponse
)
async def get_options(
    question_id: str = Path(..., description="ID de la pregunta"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener opciones de una pregunta"""
    service = OptionService(db)
    return service.get_question_options(question_id, current_user["id"])

@router.post(
    "/{question_id}/options",
    response_model=OptionResponse,
    status_code=201
)
async def create_option(
    question_id: str = Path(..., description="ID de la pregunta"),
    option_data: OptionCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear opción (solo docentes)"""
    service = OptionService(db)
    return service.create_option(question_id, current_user["id"], option_data)

@router.put(
    "/{question_id}/options/{option_id}",
    response_model=OptionResponse
)
async def update_option(
    question_id: str = Path(..., description="ID de la pregunta"),
    option_id: str = Path(..., description="ID de la opción"),
    option_data: OptionUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar opción (solo docentes)"""
    service = OptionService(db)
    return service.update_option(option_id, current_user["id"], option_data)

@router.delete(
    "/{question_id}/options/{option_id}",
    status_code=200
)
async def delete_option(
    question_id: str = Path(..., description="ID de la pregunta"),
    option_id: str = Path(..., description="ID de la opción"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar opción (solo docentes)"""
    service = OptionService(db)
    return service.delete_option(option_id, current_user["id"])