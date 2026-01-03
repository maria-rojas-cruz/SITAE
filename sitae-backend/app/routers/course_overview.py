from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.course_overview import CourseOverviewResponse
from app.services.course_overview_service import CourseOverviewService
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/courses", tags=["course overview"])


@router.get("/{course_id}/overview", response_model=CourseOverviewResponse)
async def get_course_overview(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Devuelve la vista general del curso con módulos, topics y objetivos.
    """
    try:
        service = CourseOverviewService(db)
        return service.get_course_overview(course_id, current_user["id"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
