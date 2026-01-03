# app/services/auth_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_google_token, create_access_token
from app.schemas.user import GoogleUserData, TokenResponse
from app.repositories.user_repository import UserRepository
from datetime import datetime
import traceback  # ← AGREGAR ESTO

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def authenticate_google_user(self, user_data: GoogleUserData) -> TokenResponse:
        try:
          

            # 1. Verificar token de Google
            google_user = verify_google_token(user_data.access_token)
            
          
            google_id = google_user["sub"]
            email = google_user["email"]
            name = google_user.get("name", "")
            picture = google_user.get("picture")
            
            #proteger datos sensibles
            #print(f"🔵 [AUTH_SERVICE] Buscando usuario por Google ID: {google_id}")
            print(f"🔵 [AUTH_SERVICE] Buscando usuario por Google ID: no_sapos")

            # 2. Buscar usuario por google_id
            user = self.user_repo.get_by_google_id(google_id)
            if user:
                #print(f"  Usuario encontrado por Google ID: {user.email}")
                print(f"  Algún usuario fue encontrado")
                updated_user = self.user_repo.update_user(user, {
                    "google_id": google_id,
                    "name": name,
                    "picture": picture,
                    "email": email,
                    "auth_provider": "google",
                    "username": name,
                })
                return self._generate_token_response(updated_user)

            # 3. Buscar usuario por email
            print(f"🔵 [AUTH_SERVICE] No encontrado por Google ID, buscando por email: {email}")
            user = self.user_repo.get_by_email(email)
            if user:
                print(f"  Usuario encontrado por email: {user.email}")
                if not user.google_id:
                    updated_user = self.user_repo.update_user(user, {
                        "google_id": google_id,
                        "name": name,
                        "picture": picture,
                        "updated_at": datetime.now(),
                        "email": email,
                        "auth_provider": "google",
                        "username": name,
                    })
                    return self._generate_token_response(updated_user)
                return self._generate_token_response(user)

            # 4. Usuario no existe en la BD
            print(f"❌ [AUTH_SERVICE] Usuario no encontrado: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no autorizado. Contacta al administrador."
            )

        except HTTPException:
            raise
        except Exception as e:
            # ← CAMBIAR ESTA PARTE PARA VER EL ERROR REAL
            print(f"❌ [AUTH_SERVICE] ERROR CRÍTICO:")
            print(f"❌ Tipo de error: {type(e).__name__}")
            print(f"❌ Mensaje: {str(e)}")
            print(f"❌ Traceback completo:")
            traceback.print_exc()
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno del servidor: {str(e)}"  # ← Mostrar el error
            )

    def _generate_token_response(self, user) -> TokenResponse:
        access_token = create_access_token(str(user.id), user.email or "")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=self._build_user_response(user)
        )

    def _build_user_response(self, user):
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "google_id": user.google_id,
            "picture": user.picture,
            "username": user.username,
            "is_active": user.is_active
        }

    def get_user_by_id(self, user_id: str):
        return self.user_repo.get_by_id(user_id)