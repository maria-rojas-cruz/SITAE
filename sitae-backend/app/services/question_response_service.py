# app/services/question_response_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.question_response_repository import QuestionResponseRepository
from app.repositories.attempt_quiz_repository import AttemptQuizRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.option_repository import OptionRepository
from app.models.attempt_quiz import AttemptState
from app.schemas.question_response import (
    QuestionResponseCreate,
    QuestionResponseDetail,
    QuestionResponseListResponse
)

class QuestionResponseService:
    def __init__(self, db: Session):
        self.db = db
        self.response_repo = QuestionResponseRepository(db)
        self.attempt_repo = AttemptQuizRepository(db)
        self.question_repo = QuestionRepository(db)
        self.option_repo = OptionRepository(db)

    def get_attempt_responses(
        self, 
        attempt_id: str, 
        user_id: str
    ) -> QuestionResponseListResponse:
        """Obtener respuestas de un intento"""
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intento no encontrado"
            )
        
        # Verificar que es el dueño o un docente
        if attempt.user_id != user_id:
            # TODO: Verificar si es docente del curso
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver estas respuestas"
            )
        
        responses = self.response_repo.get_by_attempt(attempt_id)
        
        return QuestionResponseListResponse(
            responses=[QuestionResponseDetail.model_validate(r) for r in responses],
            total=len(responses)
        )

    def submit_response(
        self, 
        attempt_id: str, 
        user_id: str, 
        response_data: QuestionResponseCreate
    ) -> QuestionResponseDetail:
        """Enviar respuesta a una pregunta"""
        # Verificar que el intento existe
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intento no encontrado"
            )
        
        # Verificar que es el dueño
        if attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para responder en este intento"
            )
        
        # Verificar que está en progreso
        if attempt.state != AttemptState.EN_PROGRESO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes responder en un intento finalizado"
            )
        
        # Verificar que la pregunta pertenece al quiz
        question = self.question_repo.get_by_id(response_data.question_id)
        if not question or question.quiz_id != attempt.quiz_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La pregunta no pertenece a este quiz"
            )
        
        # Verificar que la opción pertenece a la pregunta
        option = self.option_repo.get_by_id(response_data.option_id)
        if not option or option.question_id != response_data.question_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La opción no pertenece a esta pregunta"
            )
        
        # Verificar si ya respondió esta pregunta
        existing = self.response_repo.get_by_attempt_and_question(
            attempt_id, 
            response_data.question_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya respondiste esta pregunta"
            )
        
        # Calcular si es correcta y el puntaje
        is_correct = option.is_correct
        score = question.score if is_correct else 0.0
        
        # Crear respuesta
        db_response = self.response_repo.create(attempt_id, {
            "question_id": response_data.question_id,
            "option_id": response_data.option_id,
            "is_correct": is_correct,
            "score": score,
            "time_seconds": response_data.time_seconds
        })
        
        return QuestionResponseDetail.model_validate(db_response)