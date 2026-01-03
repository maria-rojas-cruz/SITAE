# app/repositories/learning_outcome_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.learning_outcome import LearningOutcome
from typing import List, Optional

class LearningOutcomeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: str) -> List[LearningOutcome]:
        """Obtener todos los learning outcomes de un curso, ordenados"""
        return self.db.query(LearningOutcome)\
            .filter(LearningOutcome.course_id == course_id)\
            .order_by(LearningOutcome.order)\
            .all()

    def get_by_id(self, outcome_id: str) -> Optional[LearningOutcome]:
        """Obtener un learning outcome por ID"""
        return self.db.query(LearningOutcome)\
            .filter(LearningOutcome.id == outcome_id)\
            .first()

    def create(self, course_id: str, outcome_data: dict) -> LearningOutcome:
        """Crear nuevo learning outcome"""
        db_outcome = LearningOutcome(
            course_id=course_id,
            **outcome_data
        )
        self.db.add(db_outcome)
        self.db.commit()
        self.db.refresh(db_outcome)
        return db_outcome

    def update(self, outcome_id: str, outcome_data: dict) -> Optional[LearningOutcome]:
        """Actualizar learning outcome"""
        db_outcome = self.get_by_id(outcome_id)
        if not db_outcome:
            return None
        
        for key, value in outcome_data.items():
            if value is not None:
                setattr(db_outcome, key, value)
        
        self.db.commit()
        self.db.refresh(db_outcome)
        return db_outcome

    def delete(self, outcome_id: str) -> bool:
        """Eliminar learning outcome"""
        db_outcome = self.get_by_id(outcome_id)
        if not db_outcome:
            return False
        
        self.db.delete(db_outcome)
        self.db.commit()
        return True

    def check_code_exists(self, course_id: str, code: str, exclude_id: Optional[str] = None) -> bool:
        """Verificar si ya existe un código en el curso"""
        query = self.db.query(LearningOutcome).filter(
            and_(
                LearningOutcome.course_id == course_id,
                LearningOutcome.code == code
            )
        )
        
        if exclude_id:
            query = query.filter(LearningOutcome.id != exclude_id)
        
        return query.first() is not None