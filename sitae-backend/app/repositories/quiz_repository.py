# app/repositories/quiz_repository.py
from sqlalchemy.orm import Session
from app.models.quiz import Quiz
from typing import List, Optional

class QuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_topic(self, topic_id: str, include_inactive: bool = False) -> List[Quiz]:
        """Obtener quizzes de un topic"""
        query = self.db.query(Quiz).filter(Quiz.topic_id == topic_id)
        
        if not include_inactive:
            query = query.filter(Quiz.is_active == True)
        
        return query.all()

    def get_by_id(self, quiz_id: str) -> Optional[Quiz]:
        """Obtener quiz por ID"""
        return self.db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def create(self, topic_id: str, quiz_data: dict) -> Quiz:
        """Crear quiz"""
        db_quiz = Quiz(topic_id=topic_id, **quiz_data)
        self.db.add(db_quiz)
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def update(self, quiz_id: str, quiz_data: dict) -> Optional[Quiz]:
        """Actualizar quiz"""
        db_quiz = self.get_by_id(quiz_id)
        if not db_quiz:
            return None
        
        for key, value in quiz_data.items():
            if value is not None:
                setattr(db_quiz, key, value)
        
        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def delete(self, quiz_id: str) -> bool:
        """Eliminar quiz"""
        db_quiz = self.get_by_id(quiz_id)
        if not db_quiz:
            return False
        
        self.db.delete(db_quiz)
        self.db.commit()
        return True