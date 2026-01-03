# app/services/question_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.question_repository import QuestionRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.topic_objective_repository import TopicObjectiveRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    QuestionListResponse, QuestionWithObjectiveInfo
)
from app.models.question import Question
from app.models.topic_objective import TopicObjective

class QuestionService:
    def __init__(self, db: Session):
        self.db = db
        self.question_repo = QuestionRepository(db)
        self.quiz_repo = QuizRepository(db)
        self.topic_objective_repo = TopicObjectiveRepository(db)
        self.topic_repo = TopicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _get_course_id_from_quiz(self, quiz_id: str) -> str:
        """Obtener course_id desde quiz_id"""
        quiz = self.quiz_repo.get_by_id(quiz_id)
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

    def _verify_topic_objective_belongs_to_quiz(self, topic_objective_id: str, quiz_id: str):
        """Verificar que el topic_objective pertenece al mismo topic del quiz"""
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        objective = self.topic_objective_repo.get_by_id(topic_objective_id)
        if not objective:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo de topic no encontrado"
            )
        
        if objective.topic_id != quiz.topic_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El objetivo no pertenece al mismo topic del quiz"
            )

    def _verify_teacher_access(self, quiz_id: str, user_id: str):
        """Verificar que el usuario es docente"""
        course_id = self._get_course_id_from_quiz(quiz_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar preguntas"
            )

    def _verify_course_access(self, quiz_id: str, user_id: str):
        """Verificar acceso al curso"""
        course_id = self._get_course_id_from_quiz(quiz_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_quiz_questions(
        self, 
        quiz_id: str, 
        user_id: str
    ) -> QuestionListResponse:
        """Obtener preguntas de un quiz"""
        self._verify_course_access(quiz_id, user_id)
        
        questions = self.db.query(
            Question,
            TopicObjective.code,
            TopicObjective.description
        ).join(
            TopicObjective,
            Question.topic_objective_id == TopicObjective.id
        ).filter(
            Question.quiz_id == quiz_id
        ).all()
        
        questions_with_info = [
            QuestionWithObjectiveInfo(
                id=q.id,
                quiz_id=q.quiz_id,
                text=q.text,
                score=q.score,
                correct_explanation=q.correct_explanation,
                topic_objective_id=q.topic_objective_id,
                topic_objective_code=code,
                topic_objective_description=description
            )
            for q, code, description in questions
        ]
        
        return QuestionListResponse(
            questions=questions_with_info,
            total=len(questions_with_info)
    )

    def create_question(
        self, 
        quiz_id: str, 
        user_id: str, 
        question_data: QuestionCreate
    ) -> QuestionResponse:
        """Crear pregunta (solo docentes)"""
        self._verify_teacher_access(quiz_id, user_id)
        
        # Verificar que topic_objective_id pertenece al topic del quiz
        self._verify_topic_objective_belongs_to_quiz(
            question_data.topic_objective_id,
            quiz_id
        )
        
        db_question = self.question_repo.create(
            quiz_id, 
            question_data.model_dump()
        )
        
        return QuestionResponse.model_validate(db_question)

    def update_question(
        self, 
        question_id: str, 
        user_id: str, 
        question_data: QuestionUpdate
    ) -> QuestionResponse:
        """Actualizar pregunta (solo docentes)"""
        db_question = self.question_repo.get_by_id(question_id)
        if not db_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pregunta no encontrada"
            )

        self._verify_teacher_access(db_question.quiz_id, user_id)

        # Si se actualiza topic_objective_id, verificar
        if question_data.topic_objective_id:
            self._verify_topic_objective_belongs_to_quiz(
                question_data.topic_objective_id,
                db_question.quiz_id
            )

        updated = self.question_repo.update(
            question_id, 
            question_data.model_dump(exclude_unset=True)
        )
        
        return QuestionResponse.model_validate(updated)

    def delete_question(self, question_id: str, user_id: str) -> dict:
        """Eliminar pregunta (solo docentes)"""
        db_question = self.question_repo.get_by_id(question_id)
        if not db_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pregunta no encontrada"
            )

        self._verify_teacher_access(db_question.quiz_id, user_id)

        self.question_repo.delete(question_id)
        
        return {"message": "Pregunta eliminada exitosamente"}