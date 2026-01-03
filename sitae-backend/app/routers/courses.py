#routers/courses.py
from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_course_service
from app.services import CourseService
from app.schemas import CourseListResponse, CourseWithRoleResponse, CreateCourseRequest, UpdateCourseRequest

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/my-courses", response_model=CourseListResponse)
async def get_my_courses(
    current_user: dict = Depends(get_current_user),
    course_service: CourseService = Depends(get_course_service)
):
    """Obtener todos los cursos del usuario actual con sus roles"""
    return course_service.get_my_courses(current_user["id"])

@router.get("/{course_id}", response_model=CourseWithRoleResponse)
async def get_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    course_service: CourseService = Depends(get_course_service)
):
    """Obtener detalles de un curso (solo si tienes acceso)"""
    return course_service.get_course_details(course_id, current_user["id"])

# Crear nuevo curso
@router.post("/", response_model=CourseWithRoleResponse)
async def create_course(
    course_data: CreateCourseRequest,
    current_user: dict = Depends(get_current_user),
    course_service: CourseService = Depends(get_course_service)
):
    """Crear nuevo curso (cualquier usuario autenticado)"""
    return course_service.create_course(course_data, current_user["id"])

# CEditar curso curso
@router.put("/{course_id}", response_model=CourseWithRoleResponse)
async def update_course(
    course_data: UpdateCourseRequest,
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    course_service: CourseService = Depends(get_course_service)
):
    
    return course_service.update_course(course_id, course_data, current_user["id"])