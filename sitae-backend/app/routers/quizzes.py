# app/routers/quizzes.py
from fastapi import APIRouter, Depends, Path, Query
from app.deps import get_current_user, get_db
from app.services.quiz_service import QuizService
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizListResponse
)
from typing import List
from sqlalchemy.orm import Session
from app.schemas.topic_objective import TopicObjectiveInfo
from app.services.question_service import QuestionService

router = APIRouter(prefix="/topics", tags=["quizzes"])

@router.get(
    "/{topic_id}/quizzes",
    response_model=QuizListResponse
)
async def get_quizzes(
    topic_id: str = Path(..., description="ID del topic"),
    include_inactive: bool = Query(False, description="Incluir quizzes inactivos (solo docentes)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    return service.get_topic_quizzes(topic_id, current_user["id"], include_inactive)

@router.post(
    "/{topic_id}/quizzes",
    response_model=QuizResponse,
    status_code=201
)
async def create_quiz(
    topic_id: str = Path(..., description="ID del topic"),
    quiz_data: QuizCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    return service.create_quiz(topic_id, current_user["id"], quiz_data)

@router.put(
    "/{topic_id}/quizzes/{quiz_id}",
    response_model=QuizResponse
)
async def update_quiz(
    topic_id: str = Path(..., description="ID del topic"),
    quiz_id: str = Path(..., description="ID del quiz"),
    quiz_data: QuizUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    return service.update_quiz(quiz_id, current_user["id"], quiz_data)

@router.delete(
    "/{topic_id}/quizzes/{quiz_id}",
    status_code=200
)
async def delete_quiz(
    topic_id: str = Path(..., description="ID del topic"),
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    return service.delete_quiz(quiz_id, current_user["id"])

@router.get(
    "/{quiz_id}/available-objectives",
    response_model=List[TopicObjectiveInfo]
)
async def get_available_objectives_for_quiz(
    quiz_id: str = Path(..., description="ID del quiz"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    service = QuestionService(db)
    return service.get_available_objectives(quiz_id, current_user["id"])