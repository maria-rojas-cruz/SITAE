from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import GoogleUserData, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    user_data: GoogleUserData, 
    db: Session = Depends(get_db)
):
    #proteger datos sensible
    print("🔵 [AUTH] Llamada recibida desde frontend")
    #print(f"🔵 [AUTH] Datos recibidos: {user_data}")
    print("Token secreto")

    auth_service = AuthService(db)
    result = auth_service.authenticate_google_user(user_data)
    
    #print(f"🟢 [AUTH] Respuesta al frontend: {result}")
    return result

