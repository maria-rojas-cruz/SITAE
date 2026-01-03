# app/repositories/question_repository.py
from sqlalchemy.orm import Session
from app.models.question import Question
from typing import List, Optional

class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_quiz(self, quiz_id: str) -> List[Question]:
        """Obtener todas las preguntas de un quiz"""
        return self.db.query(Question)\
            .filter(Question.quiz_id == quiz_id)\
            .all()

    def get_by_id(self, question_id: str) -> Optional[Question]:
        """Obtener pregunta por ID"""
        return self.db.query(Question)\
            .filter(Question.id == question_id)\
            .first()

    def create(self, quiz_id: str, question_data: dict) -> Question:
        """Crear pregunta"""
        db_question = Question(quiz_id=quiz_id, **question_data)
        self.db.add(db_question)
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def update(self, question_id: str, question_data: dict) -> Optional[Question]:
        """Actualizar pregunta"""
        db_question = self.get_by_id(question_id)
        if not db_question:
            return None
        
        for key, value in question_data.items():
            if value is not None:
                setattr(db_question, key, value)
        
        self.db.commit()
        self.db.refresh(db_question)
        return db_question

    def delete(self, question_id: str) -> bool:
        """Eliminar pregunta"""
        db_question = self.get_by_id(question_id)
        if not db_question:
            return False
        
        self.db.delete(db_question)
        self.db.commit()
        return True