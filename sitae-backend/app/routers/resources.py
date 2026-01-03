# app/routers/resources.py
from fastapi import APIRouter, Depends, Path, Query, Body
from app.deps import get_current_user, get_db
from app.services.resource_service import ResourceService
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceListResponse
)
from sqlalchemy.orm import Session
from typing import Optional

router = APIRouter(prefix="/topics", tags=["resources"])

@router.get(
    "/{topic_id}/resources",
    response_model=ResourceListResponse
)
async def get_resources(
    topic_id: str = Path(..., description="ID del topic"),
    resource_type: Optional[str] = Query(None, description="Filtrar por tipo de recurso"),
    mandatory_only: bool = Query(False, description="Solo recursos obligatorios"),
    is_external: Optional[bool] = Query(True, description="Filtrar por recursos externos o internos"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ResourceService(db)
    return service.get_topic_resources(
        topic_id, 
        current_user["id"],
        resource_type,
        mandatory_only,
        is_external
    )

@router.post(
    "/{topic_id}/resources",
    response_model=ResourceResponse,
    status_code=201
)
async def create_resource(
    topic_id: str = Path(..., description="ID del topic"),
    resource_data: ResourceCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo recurso (solo docentes)"""
    service = ResourceService(db)
    return service.create_resource(topic_id, current_user["id"], resource_data)

@router.put(
    "/{topic_id}/resources/{resource_id}",
    response_model=ResourceResponse
)
async def update_resource(
    topic_id: str = Path(..., description="ID del topic"),
    resource_id: str = Path(..., description="ID del recurso"),
    resource_data: ResourceUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar recurso (solo docentes)"""
    service = ResourceService(db)
    return service.update_resource(resource_id, current_user["id"], resource_data)

@router.delete(
    "/{topic_id}/resources/{resource_id}",
    status_code=200
)
async def delete_resource(
    topic_id: str = Path(..., description="ID del topic"),
    resource_id: str = Path(..., description="ID del recurso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar recurso (solo docentes)"""
    service = ResourceService(db)
    return service.delete_resource(resource_id, current_user["id"])

@router.patch(
    "/{topic_id}/resources/reorder",
    status_code=200
)
async def reorder_resources(
    topic_id: str = Path(..., description="ID del topic"),
    resource_orders: dict[str, int] = Body(..., description="Dict de resource_id: new_order"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reordenar recursos del topic (solo docentes)"""
    service = ResourceService(db)
    return service.reorder_resources(topic_id, current_user["id"], resource_orders)