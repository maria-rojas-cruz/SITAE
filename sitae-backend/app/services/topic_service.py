# app/services/topic_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.topic import (
    TopicCreate,
    TopicUpdate,
    TopicResponse,
    TopicListResponse
)

class TopicService:
    def __init__(self, db: Session):
        self.db = db
        self.topic_repo = TopicRepository(db)
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
                detail="Solo los docentes pueden modificar topics"
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

    def get_module_topics(
        self, 
        module_id: str, 
        user_id: str
    ) -> TopicListResponse:
        """Obtener todos los topics de un módulo"""
        self._verify_course_access(module_id, user_id)
        
        topics = self.topic_repo.get_by_module(module_id)
        
        return TopicListResponse(
            topics=[TopicResponse.model_validate(t) for t in topics],
            total=len(topics)
        )

    def create_topic(
        self, 
        module_id: str, 
        user_id: str, 
        topic_data: TopicCreate
    ) -> TopicResponse:
        """Crear nuevo topic (solo docentes)"""
        self._verify_teacher_access(module_id, user_id)
        
        db_topic = self.topic_repo.create(
            module_id, 
            topic_data.model_dump()
        )
        
        return TopicResponse.model_validate(db_topic)

    def update_topic(
        self, 
        topic_id: str, 
        user_id: str, 
        topic_data: TopicUpdate
    ) -> TopicResponse:
        """Actualizar topic (solo docentes)"""
        db_topic = self.topic_repo.get_by_id(topic_id)
        if not db_topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic no encontrado"
            )

        self._verify_teacher_access(db_topic.module_id, user_id)

        updated = self.topic_repo.update(
            topic_id, 
            topic_data.model_dump(exclude_unset=True)
        )
        
        return TopicResponse.model_validate(updated)

    def delete_topic(self, topic_id: str, user_id: str) -> dict:
        """Eliminar topic (solo docentes)"""
        db_topic = self.topic_repo.get_by_id(topic_id)
        if not db_topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic no encontrado"
            )

        self._verify_teacher_access(db_topic.module_id, user_id)

        self.topic_repo.delete(topic_id)
        
        return {"message": "Topic eliminado exitosamente"}

    def reorder_topics(
        self, 
        module_id: str, 
        user_id: str, 
        topic_orders: dict[str, int]
    ) -> dict:
        """Reordenar topics de un módulo (solo docentes)"""
        self._verify_teacher_access(module_id, user_id)
        
        self.topic_repo.reorder(module_id, topic_orders)
        
        return {"message": "Topics reordenados exitosamente"}