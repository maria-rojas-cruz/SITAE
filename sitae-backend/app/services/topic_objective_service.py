# app/services/topic_objective_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.topic_objective_repository import TopicObjectiveRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.topic_objective import (
    TopicObjectiveCreate,
    TopicObjectiveUpdate,
    TopicObjectiveResponse,
    TopicObjectiveListResponse
)
from app.schemas.topic_objective import LinkModuleObjectiveRequest, LinkedModuleObjective
from typing import List


class TopicObjectiveService:
    def __init__(self, db: Session):
        self.db = db
        self.objective_repo = TopicObjectiveRepository(db)
        self.topic_repo = TopicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _get_course_id_from_topic(self, topic_id: str) -> str:
        """Obtener course_id desde un topic_id"""
        topic = self.topic_repo.get_by_id(topic_id)
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic no encontrado"
            )
        
        module = self.module_repo.get_by_id(topic.module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo no encontrado"
            )
        
        return module.course_id

    def _verify_teacher_access(self, topic_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        course_id = self._get_course_id_from_topic(topic_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar objetivos de topic"
            )

    def _verify_course_access(self, topic_id: str, user_id: str):
        """Verificar acceso al curso"""
        course_id = self._get_course_id_from_topic(topic_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_topic_objectives(
        self, 
        topic_id: str, 
        user_id: str
    ) -> TopicObjectiveListResponse:
        """Obtener objetivos de un topic"""
        self._verify_course_access(topic_id, user_id)
        
        objectives = self.objective_repo.get_by_topic(topic_id)
        
        return TopicObjectiveListResponse(
            objectives=[TopicObjectiveResponse.model_validate(o) for o in objectives],
            total=len(objectives)
        )

    def create_objective(
        self, 
        topic_id: str, 
        user_id: str, 
        objective_data: TopicObjectiveCreate
    ) -> TopicObjectiveResponse:
        """Crear objetivo de topic (solo docentes)"""
        self._verify_teacher_access(topic_id, user_id)
        
        db_objective = self.objective_repo.create(
            topic_id, 
            objective_data.model_dump()
        )
        
        return TopicObjectiveResponse.model_validate(db_objective)

    def update_objective(
        self, 
        objective_id: str, 
        user_id: str, 
        objective_data: TopicObjectiveUpdate
    ) -> TopicObjectiveResponse:
        """Actualizar objetivo (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )

        self._verify_teacher_access(db_objective.topic_id, user_id)

        updated = self.objective_repo.update(
            objective_id, 
            objective_data.model_dump(exclude_unset=True)
        )
        
        return TopicObjectiveResponse.model_validate(updated)

    def delete_objective(self, objective_id: str, user_id: str) -> dict:
        """Eliminar objetivo (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )

        self._verify_teacher_access(db_objective.topic_id, user_id)

        self.objective_repo.delete(objective_id)
        
        return {"message": "Objetivo eliminado exitosamente"}
    
    def link_module_objective(
        self,
        topic_objective_id: str,
        user_id: str,
        link_data: LinkModuleObjectiveRequest
    ) -> dict:
        """Vincular con module objective (solo docentes)"""
        db_objective = self.objective_repo.get_by_id(topic_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo de topic no encontrado"
            )
        
        self._verify_teacher_access(db_objective.topic_id, user_id)
        
        self.objective_repo.link_module_objective(
            topic_objective_id,
            link_data.module_objective_id,
            link_data.is_primary
        )
        
        return {"message": "Vinculado correctamente"}
    
    def unlink_module_objective(
        self,
        topic_objective_id: str,
        module_objective_id: str,
        user_id: str
    ) -> dict:
        """Desvincular module objective"""
        db_objective = self.objective_repo.get_by_id(topic_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )
        
        self._verify_teacher_access(db_objective.topic_id, user_id)
        
        self.objective_repo.unlink_module_objective(
            topic_objective_id,
            module_objective_id
        )
        
        return {"message": "Desvinculado correctamente"}
    
    def get_linked_module_objectives(
        self,
        topic_objective_id: str,
        user_id: str
    ) -> List[LinkedModuleObjective]:
        """Obtener module objectives vinculados"""
        db_objective = self.objective_repo.get_by_id(topic_objective_id)
        if not db_objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo no encontrado"
            )
        
        self._verify_course_access(db_objective.topic_id, user_id)
        
        results = self.objective_repo.get_linked_module_objectives(topic_objective_id)
        
        return [
            LinkedModuleObjective(
                id=mo.id,
                code=mo.code,
                description=mo.description,
                is_primary=is_primary
            )
            for mo, is_primary in results
        ]