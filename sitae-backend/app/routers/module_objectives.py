# app/routers/module_objectives.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.module_objective_service import ModuleObjectiveService
from app.schemas.module_objective import (
    ModuleObjectiveCreate,
    ModuleObjectiveUpdate,
    ModuleObjectiveResponse,
    ModuleObjectiveListResponse
)
from sqlalchemy.orm import Session
from app.schemas.module_objective import LinkLearningOutcomeRequest, LinkedLearningOutcome
from typing import List


router = APIRouter(prefix="/modules", tags=["module-objectives"])

@router.get(
    "/{module_id}/objectives",
    response_model=ModuleObjectiveListResponse
)
async def get_module_objectives(
    module_id: str = Path(..., description="ID del módulo"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener objetivos de un módulo"""
    service = ModuleObjectiveService(db)
    return service.get_module_objectives(module_id, current_user["id"])

@router.post(
    "/{module_id}/objectives",
    response_model=ModuleObjectiveResponse,
    status_code=201
)
async def create_module_objective(
    module_id: str = Path(..., description="ID del módulo"),
    objective_data: ModuleObjectiveCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear objetivo de módulo (solo docentes)"""
    service = ModuleObjectiveService(db)
    return service.create_objective(module_id, current_user["id"], objective_data)

@router.put(
    "/{module_id}/objectives/{objective_id}",
    response_model=ModuleObjectiveResponse
)
async def update_module_objective(
    module_id: str = Path(..., description="ID del módulo"),
    objective_id: str = Path(..., description="ID del objetivo"),
    objective_data: ModuleObjectiveUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar objetivo (solo docentes)"""
    service = ModuleObjectiveService(db)
    return service.update_objective(objective_id, current_user["id"], objective_data)

@router.delete(
    "/{module_id}/objectives/{objective_id}",
    status_code=200
)
async def delete_module_objective(
    module_id: str = Path(..., description="ID del módulo"),
    objective_id: str = Path(..., description="ID del objetivo"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar objetivo (solo docentes)"""
    service = ModuleObjectiveService(db)
    return service.delete_objective(objective_id, current_user["id"])


@router.post(
    "/{module_id}/objectives/{objective_id}/learning-outcomes",
    status_code=201
)
async def link_learning_outcome(
    module_id: str = Path(...),
    objective_id: str = Path(...),
    link_data: LinkLearningOutcomeRequest = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vincular module objective con learning outcome (solo docentes)"""
    service = ModuleObjectiveService(db)
    return service.link_learning_outcome(objective_id, current_user["id"], link_data)

@router.delete(
    "/{module_id}/objectives/{objective_id}/learning-outcomes/{lo_id}"
)
async def unlink_learning_outcome(
    module_id: str = Path(...),
    objective_id: str = Path(...),
    lo_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Desvincular learning outcome (solo docentes)"""
    service = ModuleObjectiveService(db)
    return service.unlink_learning_outcome(objective_id, lo_id, current_user["id"])

@router.get(
    "/{module_id}/objectives/{objective_id}/learning-outcomes",
    response_model=List[LinkedLearningOutcome]
)
async def get_linked_learning_outcomes(
    module_id: str = Path(...),
    objective_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener learning outcomes vinculados"""
    service = ModuleObjectiveService(db)
    return service.get_linked_learning_outcomes(objective_id, current_user["id"])