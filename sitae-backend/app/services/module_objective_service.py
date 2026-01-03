# app/services/module_objective_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.module_objective_repository import ModuleObjectiveRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.module_objective import (
    ModuleObjectiveCreate,
    ModuleObjectiveUpdate,
    ModuleObjectiveResponse,
    ModuleObjectiveListResponse
)
from app.schemas.module_objective import LinkLearningOutcomeRequest, LinkedLearningOutcome
from typing import List

class ModuleObjectiveService:
    def __init__(self, db: Session):
        self.db = db
        self.objective_repo = ModuleObjectiveRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _get_course_id_from_module(self, module_id: str) -> str:
        """Obtener course_id desde un module_id"""
        module = self.module_repo.get_by_id(module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo no encontrado"
            )
        return module.course_id

    def _verify_teacher_access(self, module_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        course_id = self._get_course_id_from_module(module_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar objetivos de módulo"
            )

    def _verify_course_access(self, module_id: str, user_id: str):
        """Verificar acceso al curso"""
        course_id = self._get_course_id_from_module(module_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_module_objectives(
        self, 
        module_id: str, 
        user_id: str
    ) -> ModuleObjectiveListResponse:
        """Obtener objetivos de un módulo"""
        self._verify_course_access(module_id, user_id)
        
        objectives = self.objective_repo.get_by_module(module_id)
        
        return ModuleObjectiveListResponse(
            objectives=[ModuleObjectiveResponse.model_validate(o) for o in objectives],
            total=len(objectives)
        )

    def create_objective(
        self, 
        module_id: str, 
        user_id: str, 
        objective_data: ModuleObjectiveCreate
    ) -> ModuleObjectiveResponse:
        """Crear objetivo de módulo (solo docentes)"""
        self._verify_teacher_access(module_id, user_id)
        
        db_objective = self.objective_repo.create(
            module_id, 
            objective_data.model_dump()
        )
        
        return ModuleObjectiveResponse.model_validate(db_objective)

    def update_objective(
        self, 
        objective_id: str, 
        user_id: str, 
        objective_data: ModuleObjectiveUpdate
    ) -> ModuleObjectiveResponse:
        """Actualizar objetivo (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )

        self._verify_teacher_access(db_objective.module_id, user_id)

        updated = self.objective_repo.update(
            objective_id, 
            objective_data.model_dump(exclude_unset=True)
        )
        
        return ModuleObjectiveResponse.model_validate(updated)

    def delete_objective(self, objective_id: str, user_id: str) -> dict:
        """Eliminar objetivo (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )

        self._verify_teacher_access(db_objective.module_id, user_id)

        self.objective_repo.delete(objective_id)
        
        return {"message": "Objetivo eliminado exitosamente"}
    

    def link_learning_outcome(
        self,
        module_objective_id: str,
        user_id: str,
        link_data: LinkLearningOutcomeRequest
    ) -> dict:
        """Vincular con learning outcome (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(module_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )
        
        self._verify_teacher_access(db_objective.module_id, user_id)
        
        # Verificar que el LO existe y pertenece al mismo curso
        # (obtener course_id del module_objective y verificar)
        
        self.objective_repo.link_learning_outcome(
            module_objective_id,
            link_data.learning_outcome_id,
            link_data.is_primary
        )
        
        return {"message": "Vinculado correctamente"}
    
    def unlink_learning_outcome(
        self,
        module_objective_id: str,
        learning_outcome_id: str,
        user_id: str
    ) -> dict:
        """Desvincular learning outcome"""
        db_objective = self.objective_repo.get_by_id(module_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )
        
        self._verify_teacher_access(db_objective.module_id, user_id)
        
        self.objective_repo.unlink_learning_outcome(
            module_objective_id,
            learning_outcome_id
        )
        
        return {"message": "Desvinculado correctamente"}
    
    def get_linked_learning_outcomes(
        self,
        module_objective_id: str,
        user_id: str
    ) -> List[LinkedLearningOutcome]:
        """Obtener LOs vinculados"""
        db_objective = self.objective_repo.get_by_id(module_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )
        
        self._verify_course_access(db_objective.module_id, user_id)
        
        results = self.objective_repo.get_linked_learning_outcomes(module_objective_id)
        
        return [
            LinkedLearningOutcome(
                id=lo.id,
                code=lo.code,
                description=lo.description,
                is_primary=is_primary
            )
            for lo, is_primary in results
        ]