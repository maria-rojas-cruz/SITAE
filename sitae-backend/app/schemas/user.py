from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class GoogleUserData(BaseModel):
    access_token: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    google_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    auth_provider: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse