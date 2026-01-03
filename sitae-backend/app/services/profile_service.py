# services/profile_service.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.repositories import (
    UserLearningProfileRepository, 
    UserCourseProfileRepository,
    CourseRepository
)
from app.schemas import (
    CompleteProfileRequest,
    CompleteProfileResponse,
    UserLearningProfileResponse,
    UserCourseProfileResponse
)
from typing import Optional

class ProfileService:
    """Servicio para manejar perfiles completos (general + curso)"""
    
    def __init__(self, db: Session):
        self.db = db
        self.learning_repo = UserLearningProfileRepository(db)
        self.course_profile_repo = UserCourseProfileRepository(db)
        self.course_repo = CourseRepository(db)
    
    def get_complete_profile(
        self, 
        user_id: str, 
        course_id: str
    ) -> CompleteProfileResponse:
        """
        Obtener perfil completo para mostrar en el frontend.
        Retorna ambos perfiles aunque alguno no exista (será None).
        """
        try:
            learning_profile = self.learning_repo.get_by_user_id(user_id)
            course_profile = self.course_profile_repo.get_by_user_and_course(user_id, course_id)
            
            # explicit commit for read operations to close transaction
            self.db.commit()
            
            return CompleteProfileResponse(
                user_id=user_id,
                course_id=course_id,
                learning_profile=UserLearningProfileResponse.model_validate(learning_profile) if learning_profile else None,
                course_profile=UserCourseProfileResponse.model_validate(course_profile) if course_profile else None
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener el perfil"
            )
    
    def save_complete_profile(
        self,
        user_id: str,
        course_id: str,
        profile_data: CompleteProfileRequest
    ) -> CompleteProfileResponse:
        """
        Guardar/actualizar perfil completo (crea o actualiza según corresponda).
        Maneja la transacción de forma atómica.
        """
        try:
            # verify user enrollment
            if not self.course_profile_repo.user_is_enrolled(user_id, course_id):
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No estás inscrito en este curso"
                )
            
            # prepare learning_profile data
            learning_data = {
                "career": profile_data.career,
                "job_role": profile_data.job_role,
                "preferred_modalities": profile_data.preferred_modalities,
                "interests": profile_data.interests,
                "interest_other": profile_data.interest_other,
                "devices": profile_data.devices
            }
            learning_data = {k: v for k, v in learning_data.items() if v is not None}
            
            # prepare course_profile data
            course_data = {
                "goals": profile_data.goals,
                "prereq_level": profile_data.prereq_level,
                "weekly_time": profile_data.weekly_time
            }
            course_data = {k: v for k, v in course_data.items() if v is not None}
            
            # save learning_profile (create or update)
            learning_profile = None
            if learning_data:
                if self.learning_repo.exists(user_id):
                    learning_profile = self.learning_repo.update(user_id, learning_data)
                else:
                    learning_profile = self.learning_repo.create(user_id, learning_data)
            
            # save course_profile (create or update)
            course_profile = None
            if course_data:
                if self.course_profile_repo.exists(user_id, course_id):
                    course_profile = self.course_profile_repo.update(user_id, course_id, course_data)
                else:
                    course_profile = self.course_profile_repo.create(user_id, course_id, course_data)
            
            # CRITICAL: explicit commit to close transaction
            self.db.commit()
            
            # refresh objects to get latest data after commit
            if learning_profile:
                self.db.refresh(learning_profile)
            if course_profile:
                self.db.refresh(course_profile)
            
            return CompleteProfileResponse(
                user_id=user_id,
                course_id=course_id,
                learning_profile=UserLearningProfileResponse.model_validate(learning_profile) if learning_profile else None,
                course_profile=UserCourseProfileResponse.model_validate(course_profile) if course_profile else None
            )
            
        except HTTPException:
            self.db.rollback()
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error de base de datos al guardar el perfil"
            )
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error inesperado al guardar el perfil"
            )
    
    def get_complete_profile_for_agent(
        self, 
        user_id: str, 
        course_id: str
    ) -> dict:
        """
        Obtener perfil completo en formato para enviar al agente.
        USO INTERNO - sin validaciones HTTP.
        """
        try:
            learning_profile = self.learning_repo.get_by_user_id(user_id)
            course_profile = self.course_profile_repo.get_by_user_and_course(user_id, course_id)
            
            # explicit commit for read operations
            self.db.commit()
            
            result = {
                "user_id": user_id,
                "course_id": course_id,
                "learning_profile": None,
                "course_profile": None
            }
            
            if learning_profile:
                result["learning_profile"] = {
                    "career": learning_profile.career,
                    "job_role": learning_profile.job_role,
                    "preferred_modalities": learning_profile.preferred_modalities,
                    "interests": learning_profile.interests,
                    "interest_other": learning_profile.interest_other,
                    "devices": learning_profile.devices
                }
            
            if course_profile:
                result["course_profile"] = {
                    "goals": course_profile.goals,
                    "prereq_level": course_profile.prereq_level,
                    "weekly_time": course_profile.weekly_time
                }
            
            return result
        except SQLAlchemyError as e:
            self.db.rollback()
            raise