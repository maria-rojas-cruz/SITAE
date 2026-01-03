from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_user_profile(
    current_user: dict = Depends(get_current_user)
):
    print(f"🔵 [USERS/ME] Llamada recibida")
    print(f"🔵 [USERS/ME] Usuario autenticado: {current_user}")

    return current_user