# app/routers/attempt_results.py
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session
from app.deps import get_current_user, get_db
from app.services.attempt_result_service import AttemptResultService
from app.schemas.attempt_quiz import SubmitQuizOut, AttemptRecommendationsOut   # tus DTO de review

router = APIRouter(prefix="/attempts", tags=["attempt-results"])

@router.get(
    "/{attempt_id}/result",
    response_model=SubmitQuizOut
)
async def get_attempt_result(
    attempt_id: str = Path(..., description="Attempt ID"),
    #max_resources_per_question: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return full review (correct/incorrect, selected/correct option, and persisted recommendations)."""
    service = AttemptResultService(db)
    return service.get_attempt_result(
        attempt_id=attempt_id,
        user_id=current_user["id"],
        #max_resources_per_question=max_resources_per_question
    )
