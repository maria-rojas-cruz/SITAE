# app/services/resource_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.resource_repository import ResourceRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.topic_objective_repository import TopicObjectiveRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceListResponse
)
from typing import Optional

class ResourceService:
    def __init__(self, db: Session):
        self.db = db
        self.resource_repo = ResourceRepository(db)
        self.topic_repo = TopicRepository(db)
        self.topic_objective_repo = TopicObjectiveRepository(db)
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

    def _verify_topic_objective_belongs_to_topic(self, topic_objective_id: str, topic_id: str):
        """Verificar que el topic_objective pertenece al topic"""
        objective = self.topic_objective_repo.get_by_id(topic_objective_id)
        if not objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo de topic no encontrado"
            )
        
        if objective.topic_id != topic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El objetivo no pertenece a este topic"
            )

    def _verify_teacher_access(self, topic_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        course_id = self._get_course_id_from_topic(topic_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar recursos"
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

    def get_topic_resources(
        self, 
        topic_id: str, 
        user_id: str,
        resource_type: Optional[str] = None,
        mandatory_only: bool = False,
        is_external: Optional[bool] = None
    ) -> ResourceListResponse:
        """Obtener recursos de un topic con filtros opcionales combinables"""
        self._verify_course_access(topic_id, user_id)
        
        # use combined filter method in repository
        resources = self.resource_repo.get_by_filters(
            topic_id=topic_id,
            resource_type=resource_type,
            is_mandatory=mandatory_only if mandatory_only else None,
            is_external=is_external
        )
        
        return ResourceListResponse(
            resources=[ResourceResponse.model_validate(r) for r in resources],
            total=len(resources)
        )

    def create_resource(
        self, 
        topic_id: str, 
        user_id: str, 
        resource_data: ResourceCreate
    ) -> ResourceResponse:
        """Crear nuevo recurso (solo docentes)"""
        self._verify_teacher_access(topic_id, user_id)
        
        # Verificar que el topic_objective_id pertenece al topic
        self._verify_topic_objective_belongs_to_topic(
            resource_data.topic_objective_id, 
            topic_id
        )
        
        db_resource = self.resource_repo.create(
            topic_id, 
            resource_data.model_dump()
        )
        
        return ResourceResponse.model_validate(db_resource)

    def update_resource(
        self, 
        resource_id: str, 
        user_id: str, 
        resource_data: ResourceUpdate
    ) -> ResourceResponse:
        """Actualizar recurso (solo docentes)"""
        db_resource = self.resource_repo.get_by_id(resource_id)
        if not db_resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso no encontrado"
            )

        self._verify_teacher_access(db_resource.topic_id, user_id)

        # Si se actualiza topic_objective_id, verificar que pertenece al topic
        if resource_data.topic_objective_id:
            self._verify_topic_objective_belongs_to_topic(
                resource_data.topic_objective_id,
                db_resource.topic_id
            )

        updated = self.resource_repo.update(
            resource_id, 
            resource_data.model_dump(exclude_unset=True)
        )
        
        return ResourceResponse.model_validate(updated)

    def delete_resource(self, resource_id: str, user_id: str) -> dict:
        """Eliminar recurso (solo docentes)"""
        db_resource = self.resource_repo.get_by_id(resource_id)
        if not db_resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recurso no encontrado"
            )

        self._verify_teacher_access(db_resource.topic_id, user_id)

        self.resource_repo.delete(resource_id)
        
        return {"message": "Recurso eliminado exitosamente"}

    def reorder_resources(
        self, 
        topic_id: str, 
        user_id: str, 
        resource_orders: dict[str, int]
    ) -> dict:
        """Reordenar recursos de un topic (solo docentes)"""
        self._verify_teacher_access(topic_id, user_id)
        
        self.resource_repo.reorder(topic_id, resource_orders)
        
        return {"message": "Recursos reordenados exitosamente"}