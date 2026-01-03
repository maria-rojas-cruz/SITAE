# app/repositories/user_learning_profile_repository.py
from sqlalchemy.orm import Session
from app.models import UserLearningProfile
from typing import Optional

class UserLearningProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: str) -> Optional[UserLearningProfile]:
        """Obtener perfil de aprendizaje por user_id"""
        return (
            self.db.query(UserLearningProfile)
            .filter(UserLearningProfile.user_id == user_id)
            .first()
        )

    def create(self, user_id: str, profile_data: dict) -> UserLearningProfile:
        """Crear perfil de aprendizaje"""
        # clean None values
        cleaned_data = {k: v for k, v in profile_data.items() if v is not None}
        
        db_profile = UserLearningProfile(user_id=user_id, **cleaned_data)
        self.db.add(db_profile)
        self.db.flush()  # flush instead of commit - writes to DB but keeps transaction open
        return db_profile

    def update(self, user_id: str, profile_data: dict) -> Optional[UserLearningProfile]:
        """Actualizar perfil de aprendizaje"""
        profile = self.get_by_user_id(user_id)
        if not profile:
            return None
        
        # clean None values to avoid overwriting with null
        cleaned_data = {k: v for k, v in profile_data.items() if v is not None}
        
        for field, value in cleaned_data.items():
            if hasattr(profile, field):
                setattr(profile, field, value)
        
        self.db.flush()  # flush instead of commit
        return profile

    def exists(self, user_id: str) -> bool:
        """Verificar si existe perfil para el usuario"""
        return self.db.query(
            self.db.query(UserLearningProfile)
            .filter(UserLearningProfile.user_id == user_id)
            .exists()
        ).scalar()