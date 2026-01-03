# app/routers/modules.py
from fastapi import APIRouter, Depends, Path, Body
from app.deps import get_current_user, get_db
from app.services.module_service import ModuleService
from app.schemas.module import (
    ModuleCreate,
    ModuleUpdate,
    ModuleResponse,
    ModuleListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/courses", tags=["modules"])

@router.get(
    "/{course_id}/modules",
    response_model=ModuleListResponse
)
async def get_modules(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los módulos de un curso"""
    service = ModuleService(db)
    return service.get_course_modules(course_id, current_user["id"])

@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
    status_code=201
)
async def create_module(
    course_id: str = Path(..., description="ID del curso"),
    module_data: ModuleCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo módulo (solo docentes)"""
    service = ModuleService(db)
    return service.create_module(course_id, current_user["id"], module_data)

@router.put(
    "/{course_id}/modules/{module_id}",
    response_model=ModuleResponse
)
async def update_module(
    course_id: str = Path(..., description="ID del curso"),
    module_id: str = Path(..., description="ID del módulo"),
    module_data: ModuleUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar módulo (solo docentes)"""
    service = ModuleService(db)
    return service.update_module(module_id, current_user["id"], module_data)

@router.delete(
    "/{course_id}/modules/{module_id}",
    status_code=200
)
async def delete_module(
    course_id: str = Path(..., description="ID del curso"),
    module_id: str = Path(..., description="ID del módulo"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar módulo (solo docentes)"""
    service = ModuleService(db)
    return service.delete_module(module_id, current_user["id"])

@router.patch(
    "/{course_id}/modules/reorder",
    status_code=200
)
async def reorder_modules(
    course_id: str = Path(..., description="ID del curso"),
    module_orders: dict[str, int] = Body(..., description="Dict de module_id: new_order"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reordenar módulos del curso (solo docentes)"""
    service = ModuleService(db)
    return service.reorder_modules(course_id, current_user["id"], module_orders)