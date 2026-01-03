from datetime import datetime, timedelta
from typing import Any
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from app.core.config import settings
from google.auth.transport import requests
from google.oauth2 import id_token

security = HTTPBearer()

# Función para crear JWT interno
def create_access_token(subject: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {
        "exp": expire,
        "sub": subject,
        "email": email
    }
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

# Función para verificar JWT interno
def verify_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

# Dependencia para obtener usuario actual desde JWT
async def get_current_user(token: str = Depends(security)) -> dict:
    payload = verify_token(token.credentials)
    return {"id": payload["sub"], "email": payload["email"]}

# Función para verificar token de Google (corregida)
def verify_google_token(token: str) -> dict:
    """Verificar token de Google"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Verificar audience
        if idinfo['aud'] != settings.GOOGLE_CLIENT_ID:
            raise ValueError('Audiencia incorrecta')
            
        return idinfo
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Verificación de token falló: {str(e)}"
        )