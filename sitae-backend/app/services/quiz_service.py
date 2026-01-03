# app/services/quiz_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.quiz_repository import QuizRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizListResponse
)
from typing import List
from app.schemas.topic_objective import TopicObjectiveInfo

class QuizService:
    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.topic_repo = TopicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _get_course_id_from_topic(self, topic_id: str) -> str:
        """Obtener course_id desde topic_id"""
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
        """Verificar que el usuario es docente"""
        course_id = self._get_course_id_from_topic(topic_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar quizzes"
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

    def get_topic_quizzes(
        self, 
        topic_id: str, 
        user_id: str,
        include_inactive: bool = False
    ) -> QuizListResponse:
        """Obtener quizzes de un topic"""
        self._verify_course_access(topic_id, user_id)
        
        # Solo docentes pueden ver quizzes inactivos
        if include_inactive:
            role_id = self.course_repo.get_user_role_in_course(
                user_id, 
                self._get_course_id_from_topic(topic_id)
            )
            if role_id != 2:
                include_inactive = False
        
        quizzes = self.quiz_repo.get_by_topic(topic_id, include_inactive)
        
        return QuizListResponse(
            quizzes=[QuizResponse.model_validate(q) for q in quizzes],
            total=len(quizzes)
        )

    def create_quiz(
        self, 
        topic_id: str, 
        user_id: str, 
        quiz_data: QuizCreate
    ) -> QuizResponse:
        """Crear quiz (solo docentes)"""
        self._verify_teacher_access(topic_id, user_id)
        
        db_quiz = self.quiz_repo.create(topic_id, quiz_data.model_dump())
        
        return QuizResponse.model_validate(db_quiz)

    def update_quiz(
        self, 
        quiz_id: str, 
        user_id: str, 
        quiz_data: QuizUpdate
    ) -> QuizResponse:
        """Actualizar quiz (solo docentes)"""
        db_quiz = self.quiz_repo.get_by_id(quiz_id)
        if not db_quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )

        self._verify_teacher_access(db_quiz.topic_id, user_id)

        updated = self.quiz_repo.update(
            quiz_id, 
            quiz_data.model_dump(exclude_unset=True)
        )
        
        return QuizResponse.model_validate(updated)

    def delete_quiz(self, quiz_id: str, user_id: str) -> dict:
        """Eliminar quiz (solo docentes)"""
        db_quiz = self.quiz_repo.get_by_id(quiz_id)
        if not db_quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )

        self._verify_teacher_access(db_quiz.topic_id, user_id)

        self.quiz_repo.delete(quiz_id)
        
        return {"message": "Quiz eliminado exitosamente"}
    
    def get_available_objectives(
        self,
        quiz_id: str,
        user_id: str
    ) -> List[TopicObjectiveInfo]:
        """Obtener objectives del topic para selector"""
        # Obtener quiz
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        # Verificar acceso
        self._verify_course_access(quiz_id, user_id)
        
        # Obtener objectives del topic
        topic_objectives = self.topic_objective_repo.get_by_topic(quiz.topic_id)
        
        return [
            TopicObjectiveInfo(
                id=to.id,
                description=to.description,
                code=to.code
            )
            for to in topic_objectives
        ]