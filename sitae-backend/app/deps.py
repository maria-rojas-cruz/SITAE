#deps.py
from fastapi import Depends, HTTPException, status
from app.core.security import get_current_user as security_get_current_user
from app.db.session import get_db
from sqlalchemy.orm import Session

async def get_current_user(
    user_data: dict = Depends(security_get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener usuario completo desde JWT"""
    from app.services import AuthService
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_data["id"])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no existe"
        )
    
    return auth_service._build_user_response(user)

async def get_course_service(db: Session = Depends(get_db)):
    """Dependencia para obtener el servicio de cursos"""
    from app.services import CourseService
    return CourseService(db)

async def get_profile_service(db: Session = Depends(get_db)):
    """Dependencia para obtener el servicio de perfiles"""
    from app.services import ProfileService
    return ProfileService(db)


# Para endpoints que solo necesitan datos básicos del usuario
get_current_user_id = security_get_current_user