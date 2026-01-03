# app/services/learning_outcome_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.learning_outcome_repository import LearningOutcomeRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.learning_outcome import (
    LearningOutcomeCreate, 
    LearningOutcomeUpdate,
    LearningOutcomeResponse,
    LearningOutcomesListResponse
)

class LearningOutcomeService:
    def __init__(self, db: Session):
        self.db = db
        self.outcome_repo = LearningOutcomeRepository(db)
        self.course_repo = CourseRepository(db)

    def _verify_teacher_access(self, course_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:  # 2 = teacher
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar learning outcomes"
            )

    def get_course_outcomes(self, course_id: str, user_id: str) -> LearningOutcomesListResponse:
        """Obtener todos los learning outcomes de un curso (cualquier rol)"""
        # Verificar acceso al curso
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

        outcomes = self.outcome_repo.get_by_course(course_id)
        
        return LearningOutcomesListResponse(
            outcomes=[LearningOutcomeResponse.model_validate(o) for o in outcomes],
            total=len(outcomes)
        )

    def create_outcome(
        self, 
        course_id: str, 
        user_id: str, 
        outcome_data: LearningOutcomeCreate
    ) -> LearningOutcomeResponse:
        """Crear nuevo learning outcome (solo docentes)"""
        self._verify_teacher_access(course_id, user_id)

        # Verificar que el código no exista
        if self.outcome_repo.check_code_exists(course_id, outcome_data.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un learning outcome con el código '{outcome_data.code}' en este curso"
            )

        db_outcome = self.outcome_repo.create(
            course_id, 
            outcome_data.model_dump()
        )
        
        return LearningOutcomeResponse.model_validate(db_outcome)

    def update_outcome(
        self, 
        outcome_id: str, 
        user_id: str, 
        outcome_data: LearningOutcomeUpdate
    ) -> LearningOutcomeResponse:
        """Actualizar learning outcome (solo docentes)"""
        db_outcome = self.outcome_repo.get_by_id(outcome_id)
        if not db_outcome:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning outcome no encontrado"
            )

        self._verify_teacher_access(db_outcome.course_id, user_id)

        # Si se actualiza el código, verificar que no exista
        if outcome_data.code and outcome_data.code != db_outcome.code:
            if self.outcome_repo.check_code_exists(
                db_outcome.course_id, 
                outcome_data.code, 
                exclude_id=outcome_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe un learning outcome con el código '{outcome_data.code}'"
                )

        updated = self.outcome_repo.update(
            outcome_id, 
            outcome_data.model_dump(exclude_unset=True)
        )
        
        return LearningOutcomeResponse.model_validate(updated)

    def delete_outcome(self, outcome_id: str, user_id: str) -> dict:
        """Eliminar learning outcome (solo docentes)"""
        db_outcome = self.outcome_repo.get_by_id(outcome_id)
        if not db_outcome:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning outcome no encontrado"
            )

        self._verify_teacher_access(db_outcome.course_id, user_id)

        self.outcome_repo.delete(outcome_id)
        
        return {"message": "Learning outcome eliminado exitosamente"}