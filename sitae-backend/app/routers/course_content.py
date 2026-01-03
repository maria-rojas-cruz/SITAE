# app/routers/course_content.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_db
from app.services.course_content_service import CourseContentService
from app.schemas.course_content import CourseContentResponse, CourseEditDataResponse
from sqlalchemy.orm import Session
import time
import logging
import cProfile
import pstats
from io import StringIO

router = APIRouter(prefix="/courses", tags=["course-content"])
logger = logging.getLogger(__name__)

@router.get(
    "/{course_id}/content",
    response_model=CourseContentResponse
)
async def get_course_content(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener contenido completo del curso optimizado con eager loading
    """
    start_time = time.time()
    
    service = CourseContentService(db)
    result = service.get_course_full_content(course_id, current_user["id"])
    
    elapsed = time.time() - start_time
    logger.info(f"⏱️ get_course_content ejecutado en {elapsed:.2f}s para course_id={course_id}")
    
    return result

@router.get("/{course_id}/edit-data",
    response_model=CourseEditDataResponse
)
async def get_course_edit_data(
    course_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    profiler = cProfile.Profile()
    profiler.enable()

    """Obtener estructura completa con relaciones para edición (solo docentes)"""
    start_time = time.time()
    
    service = CourseContentService(db)
    result = service.get_course_edit_data(course_id, current_user["id"])
    
    profiler.disable()
    s = StringIO()
    ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
    ps.print_stats(20)  # Top 20 funciones más lentas
    print(s.getvalue())
    
    elapsed = time.time() - start_time
    logger.info(f"⏱️ get_course_edit_data ejecutado en {elapsed:.2f}s")
    
    return result