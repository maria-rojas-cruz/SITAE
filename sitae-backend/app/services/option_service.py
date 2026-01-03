# app/services/option_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.option_repository import OptionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.option import (
    OptionCreate,
    OptionUpdate,
    OptionResponse,
    OptionListResponse
)

class OptionService:
    def __init__(self, db: Session):
        self.db = db
        self.option_repo = OptionRepository(db)
        self.question_repo = QuestionRepository(db)
        self.quiz_repo = QuizRepository(db)
        self.topic_repo = TopicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _get_course_id_from_question(self, question_id: str) -> str:
        """Obtener course_id desde question_id"""
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pregunta no encontrada"
            )
        
        quiz = self.quiz_repo.get_by_id(question.quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        topic = self.topic_repo.get_by_id(quiz.topic_id)
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

    def _verify_teacher_access(self, question_id: str, user_id: str):
        """Verificar que el usuario es docente"""
        course_id = self._get_course_id_from_question(question_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar opciones"
            )

    def _verify_course_access(self, question_id: str, user_id: str):
        """Verificar acceso al curso"""
        course_id = self._get_course_id_from_question(question_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_question_options(
        self, 
        question_id: str, 
        user_id: str
    ) -> OptionListResponse:
        """Obtener opciones de una pregunta"""
        self._verify_course_access(question_id, user_id)
        
        options = self.option_repo.get_by_question(question_id)
        
        return OptionListResponse(
            options=[OptionResponse.model_validate(o) for o in options],
            total=len(options)
        )

    def create_option(
        self, 
        question_id: str, 
        user_id: str, 
        option_data: OptionCreate
    ) -> OptionResponse:
        """Crear opción (solo docentes)"""
        self._verify_teacher_access(question_id, user_id)
        
        db_option = self.option_repo.create(
            question_id, 
            option_data.model_dump()
        )
        
        return OptionResponse.model_validate(db_option)

    def update_option(
        self, 
        option_id: str, 
        user_id: str, 
        option_data: OptionUpdate
    ) -> OptionResponse:
        """Actualizar opción (solo docentes)"""
        db_option = self.option_repo.get_by_id(option_id)
        if not db_option:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opción no encontrada"
            )

        self._verify_teacher_access(db_option.question_id, user_id)

        updated = self.option_repo.update(
            option_id, 
            option_data.model_dump(exclude_unset=True)
        )
        
        # Verificar que hay al menos una opción correcta
        correct_count = self.option_repo.count_correct_options(db_option.question_id)
        if correct_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La pregunta debe tener al menos una opción correcta"
            )
        
        return OptionResponse.model_validate(updated)

    def delete_option(self, option_id: str, user_id: str) -> dict:
        """Eliminar opción (solo docentes)"""
        db_option = self.option_repo.get_by_id(option_id)
        if not db_option:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opción no encontrada"
            )

        self._verify_teacher_access(db_option.question_id, user_id)

        # Si es la única opción correcta, no permitir eliminar
        if db_option.is_correct:
            correct_count = self.option_repo.count_correct_options(db_option.question_id)
            if correct_count == 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede eliminar la única opción correcta"
                )

        self.option_repo.delete(option_id)
        
        return {"message": "Opción eliminada exitosamente"}