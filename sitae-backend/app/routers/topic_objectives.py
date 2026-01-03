# app/routers/topic_objectives.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.topic_objective_service import TopicObjectiveService
from app.schemas.topic_objective import (
    TopicObjectiveCreate,
    TopicObjectiveUpdate,
    TopicObjectiveResponse,
    TopicObjectiveListResponse
)
from sqlalchemy.orm import Session
from app.schemas.topic_objective import LinkModuleObjectiveRequest, LinkedModuleObjective
from typing import List

router = APIRouter(prefix="/topics", tags=["topic-objectives"])

@router.get(
    "/{topic_id}/objectives",
    response_model=TopicObjectiveListResponse
)
async def get_topic_objectives(
    topic_id: str = Path(..., description="ID del topic"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.get_topic_objectives(topic_id, current_user["id"])

@router.post(
    "/{topic_id}/objectives",
    response_model=TopicObjectiveResponse,
    status_code=201
)
async def create_topic_objective(
    topic_id: str = Path(..., description="ID del topic"),
    objective_data: TopicObjectiveCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.create_objective(topic_id, current_user["id"], objective_data)

@router.put(
    "/{topic_id}/objectives/{objective_id}",
    response_model=TopicObjectiveResponse
)
async def update_topic_objective(
    topic_id: str = Path(..., description="ID del topic"),
    objective_id: str = Path(..., description="ID del objetivo"),
    objective_data: TopicObjectiveUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.update_objective(objective_id, current_user["id"], objective_data)

@router.delete(
    "/{topic_id}/objectives/{objective_id}",
    status_code=200
)
async def delete_topic_objective(
    topic_id: str = Path(..., description="ID del topic"),
    objective_id: str = Path(..., description="ID del objetivo"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.delete_objective(objective_id, current_user["id"])

@router.post(
    "/{topic_id}/objectives/{objective_id}/module-objectives",
    status_code=201
)
async def link_module_objective(
    topic_id: str = Path(...),
    objective_id: str = Path(...),
    link_data: LinkModuleObjectiveRequest = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.link_module_objective(objective_id, current_user["id"], link_data)

@router.delete(
    "/{topic_id}/objectives/{objective_id}/module-objectives/{mo_id}"
)
async def unlink_module_objective(
    topic_id: str = Path(...),
    objective_id: str = Path(...),
    mo_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.unlink_module_objective(objective_id, mo_id, current_user["id"])

@router.get(
    "/{topic_id}/objectives/{objective_id}/module-objectives",
    response_model=List[LinkedModuleObjective]
)
async def get_linked_module_objectives(
    topic_id: str = Path(...),
    objective_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = TopicObjectiveService(db)
    return service.get_linked_module_objectives(objective_id, current_user["id"])