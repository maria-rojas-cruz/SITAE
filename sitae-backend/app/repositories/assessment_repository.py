from sqlalchemy.orm import Session, joinedload
from app.models.assessment import Quiz
from app.models.topic import Topic
from app.models.module import Module
from typing import List, Optional

class AssessmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_course_quizzes(self, course_id: str) -> List[Quiz]:
        """Obtener todos los quizzes de un curso con información del topic"""
        return self.db.query(Quiz)\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .options(
                joinedload(Quiz.topic)
            )\
            .filter(
                Module.course_id == course_id, 
                Quiz.is_active == True
            )\
            .all()

    def get_topic_quizzes(self, topic_id: str) -> List[Quiz]:
        """Obtener quizzes de un topic específico"""
        return self.db.query(Quiz)\
            .filter(
                Quiz.topic_id == topic_id, 
                Quiz.is_active == True
            )\
            .all()

    def get_quiz_by_id(self, quiz_id: str) -> Optional[Quiz]:
        """Obtener quiz por ID"""
        return self.db.query(Quiz)\
            .filter(Quiz.id == quiz_id)\
            .first()

    def create_quiz(self, quiz_data: dict) -> Quiz:
        """Crear nuevo quiz"""
        db_quiz = Quiz(**quiz_data)
        self.db.add(db_quiz)
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def update_quiz(self, quiz_id: str, quiz_data: dict) -> Optional[Quiz]:
        """Actualizar quiz"""
        quiz = self.get_quiz_by_id(quiz_id)
        if quiz:
            for key, value in quiz_data.items():
                setattr(quiz, key, value)
            self.db.commit()
            self.db.refresh(quiz)
        return quiz

    def delete_quiz(self, quiz_id: str) -> bool:
        """Eliminar quiz (soft delete)"""
        quiz = self.get_quiz_by_id(quiz_id)
        if quiz:
            quiz.is_active = False
            self.db.commit()
            return True
        return False