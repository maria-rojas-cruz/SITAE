from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.topic_repository import TopicRepository
from app.schemas.assessment import EvaluationSchema, QuizSchema
from typing import List

class AssessmentService:
    def __init__(self, db: Session):
        self.db = db
        self.assessment_repo = AssessmentRepository(db)
        self.course_repo = CourseRepository(db)
        self.topic_repo = TopicRepository(db)

    def get_user_evaluations_for_course(self, course_id: str, user_id: str) -> List[EvaluationSchema]:
        """Obtener evaluaciones de un curso para CourseService"""
        # Verificar acceso al curso
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

        quizzes = self.assessment_repo.get_course_quizzes(course_id)
        
        evaluations = []
        for quiz in quizzes:
            evaluations.append(EvaluationSchema(
                id=quiz.id,
                topic=quiz.topic.title if quiz.topic else "General",
                title=quiz.title,
                status="pending",  # TODO: Implementar lógica de estado real
                score=None,
                totalQuestions=self._count_quiz_questions(quiz.id),
                correctAnswers=None,
                dueDate=None,
                duration=quiz.time_minutes
            ))
        
        return evaluations

    def get_course_quizzes(self, course_id: str, user_id: str) -> List[QuizSchema]:
        """Obtener todos los quizzes de un curso"""
        # Verificar acceso al curso
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

        quizzes = self.assessment_repo.get_course_quizzes(course_id)
        
        return [QuizSchema(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            time_minutes=quiz.time_minutes,
            attempt_max=quiz.attempt_max,
            weight=float(quiz.weight) if quiz.weight else None,
            is_active=quiz.is_active
        ) for quiz in quizzes]

    def get_topic_quizzes(self, topic_id: str, user_id: str) -> List[QuizSchema]:
        """Obtener quizzes de un topic específico"""
        # Verificar acceso al topic (a través del curso)
        topic = self.topic_repo.get_topic_by_id(topic_id)
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic no encontrado"
            )

        # Verificar acceso al curso del topic
        role_id = self.course_repo.get_user_role_in_course(user_id, topic.module.course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este topic"
            )

        quizzes = self.assessment_repo.get_topic_quizzes(topic_id)
        
        return [QuizSchema(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            time_minutes=quiz.time_minutes,
            attempt_max=quiz.attempt_max,
            weight=float(quiz.weight) if quiz.weight else None,
            is_active=quiz.is_active
        ) for quiz in quizzes]

    def _count_quiz_questions(self, quiz_id: str) -> int:
        """Contar preguntas de un quiz (placeholder)"""
        # TODO: Implementar lógica real de conteo de preguntas
        return 10  # Placeholder