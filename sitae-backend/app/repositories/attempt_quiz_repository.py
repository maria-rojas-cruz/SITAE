# app/repositories/attempt_quiz_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.attempt_quiz import AttemptQuiz, AttemptState
from typing import List, Optional

class AttemptQuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_quiz(self, user_id: str, quiz_id: str) -> List[AttemptQuiz]:
        """Obtener intentos de un usuario en un quiz"""
        return self.db.query(AttemptQuiz)\
            .filter(
                AttemptQuiz.user_id == user_id,
                AttemptQuiz.quiz_id == quiz_id
            )\
            .order_by(AttemptQuiz.date_start.desc())\
            .all()

    def get_by_id(self, attempt_id: str) -> Optional[AttemptQuiz]:
        """Obtener intento por ID"""
        return self.db.query(AttemptQuiz)\
            .filter(AttemptQuiz.id == attempt_id)\
            .first()

    def create(self, user_id: str, quiz_id: str) -> AttemptQuiz:
        """Crear nuevo intento"""
        db_attempt = AttemptQuiz(
            user_id=user_id,
            quiz_id=quiz_id,
            state=AttemptState.EN_PROGRESO
        )
        self.db.add(db_attempt)
        self.db.commit()
        self.db.refresh(db_attempt)
        return db_attempt

    def update(self, attempt_id: str, attempt_data: dict) -> Optional[AttemptQuiz]:
        """Actualizar intento"""
        db_attempt = self.get_by_id(attempt_id)
        if not db_attempt:
            return None
        
        for key, value in attempt_data.items():
            if value is not None:
                setattr(db_attempt, key, value)
        
        self.db.commit()
        self.db.refresh(db_attempt)
        return db_attempt

    def count_attempts(self, user_id: str, quiz_id: str) -> int:
        """Contar intentos de un usuario en un quiz"""
        return self.db.query(AttemptQuiz)\
            .filter(
                AttemptQuiz.user_id == user_id,
                AttemptQuiz.quiz_id == quiz_id
            )\
            .count()

    def get_active_attempt(self, user_id: str, quiz_id: str) -> Optional[AttemptQuiz]:
        """Obtener intento activo (en progreso)"""
        return self.db.query(AttemptQuiz)\
            .filter(
                AttemptQuiz.user_id == user_id,
                AttemptQuiz.quiz_id == quiz_id,
                AttemptQuiz.state == AttemptState.EN_PROGRESO
            )\
            .first()