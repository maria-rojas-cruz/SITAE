# app/repositories/question_response_repository.py
from sqlalchemy.orm import Session
from app.models.question_response import QuestionResponse
from typing import List, Optional

class QuestionResponseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_attempt(self, attempt_id: str) -> List[QuestionResponse]:
        """Obtener respuestas de un intento"""
        return self.db.query(QuestionResponse)\
            .filter(QuestionResponse.attempt_quiz_id == attempt_id)\
            .all()

    def get_by_id(self, response_id: str) -> Optional[QuestionResponse]:
        """Obtener respuesta por ID"""
        return self.db.query(QuestionResponse)\
            .filter(QuestionResponse.id == response_id)\
            .first()

    def get_by_attempt_and_question(
        self, 
        attempt_id: str, 
        question_id: str
    ) -> Optional[QuestionResponse]:
        """Obtener respuesta específica de una pregunta en un intento"""
        return self.db.query(QuestionResponse)\
            .filter(
                QuestionResponse.attempt_quiz_id == attempt_id,
                QuestionResponse.question_id == question_id
            )\
            .first()

    def create(self, attempt_id: str, response_data: dict) -> QuestionResponse:
        """Crear respuesta"""
        db_response = QuestionResponse(
            attempt_quiz_id=attempt_id,
            **response_data
        )
        self.db.add(db_response)
        self.db.commit()
        self.db.refresh(db_response)
        return db_response

    def update(self, response_id: str, response_data: dict) -> Optional[QuestionResponse]:
        """Actualizar respuesta"""
        db_response = self.get_by_id(response_id)
        if not db_response:
            return None
        
        for key, value in response_data.items():
            if value is not None:
                setattr(db_response, key, value)
        
        self.db.commit()
        self.db.refresh(db_response)
        return db_response