# routes/profile_routes.py

from fastapi import APIRouter, Depends, Path
from app.deps import get_current_user, get_profile_service  
from app.services import ProfileService
from app.schemas import CompleteProfileRequest, CompleteProfileResponse

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/course/{course_id}", response_model=CompleteProfileResponse)
async def get_profile_for_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)  
):
    """
    Obtener perfil completo para un curso (general + específico).
    Usado cuando el usuario entra a la página de perfil.
    """
    return profile_service.get_complete_profile(current_user["id"], course_id)

@router.post("/course/{course_id}", response_model=CompleteProfileResponse)
@router.put("/course/{course_id}", response_model=CompleteProfileResponse)
async def save_profile_for_course(
    profile_data: CompleteProfileRequest,
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)  
):
    """
    Guardar/actualizar perfil completo.
    Crea o actualiza según corresponda (upsert).
    Solo actualiza los campos enviados, el resto se mantiene.
    """
    return profile_service.save_complete_profile(
        current_user["id"], 
        course_id, 
        profile_data
    )