# app/routers/topics.py
from fastapi import APIRouter, Depends, Path, Body
from app.deps import get_current_user, get_db
from app.services.topic_service import TopicService
from app.schemas.topic import (
    TopicCreate,
    TopicUpdate,
    TopicResponse,
    TopicListResponse
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/modules", tags=["topics"])

@router.get(
    "/{module_id}/topics",
    response_model=TopicListResponse
)
async def get_topics(
    module_id: str = Path(..., description="ID del módulo"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicService(db)
    return service.get_module_topics(module_id, current_user["id"])

@router.post(
    "/{module_id}/topics",
    response_model=TopicResponse,
    status_code=201
)
async def create_topic(
    module_id: str = Path(..., description="ID del módulo"),
    topic_data: TopicCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicService(db)
    return service.create_topic(module_id, current_user["id"], topic_data)

@router.put(
    "/{module_id}/topics/{topic_id}",
    response_model=TopicResponse
)
async def update_topic(
    module_id: str = Path(..., description="ID del módulo"),
    topic_id: str = Path(..., description="ID del topic"),
    topic_data: TopicUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicService(db)
    return service.update_topic(topic_id, current_user["id"], topic_data)

@router.delete(
    "/{module_id}/topics/{topic_id}",
    status_code=200
)
async def delete_topic(
    module_id: str = Path(..., description="ID del módulo"),
    topic_id: str = Path(..., description="ID del topic"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicService(db)
    return service.delete_topic(topic_id, current_user["id"])

@router.patch(
    "/{module_id}/topics/reorder",
    status_code=200
)
async def reorder_topics(
    module_id: str = Path(..., description="ID del módulo"),
    topic_orders: dict[str, int] = Body(..., description="Dict de topic_id: new_order"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicService(db)
    return service.reorder_topics(module_id, current_user["id"], topic_orders)