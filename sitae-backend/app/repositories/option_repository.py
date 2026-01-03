# app/repositories/option_repository.py
from sqlalchemy.orm import Session
from app.models.option import Option
from typing import List, Optional

class OptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_question(self, question_id: str) -> List[Option]:
        """Obtener opciones de una pregunta"""
        return self.db.query(Option)\
            .filter(Option.question_id == question_id)\
            .all()

    def get_by_id(self, option_id: str) -> Optional[Option]:
        """Obtener opción por ID"""
        return self.db.query(Option)\
            .filter(Option.id == option_id)\
            .first()

    def create(self, question_id: str, option_data: dict) -> Option:
        """Crear opción"""
        db_option = Option(question_id=question_id, **option_data)
        self.db.add(db_option)
        self.db.commit()
        self.db.refresh(db_option)
        return db_option

    def update(self, option_id: str, option_data: dict) -> Optional[Option]:
        """Actualizar opción"""
        db_option = self.get_by_id(option_id)
        if not db_option:
            return None
        
        for key, value in option_data.items():
            if value is not None:
                setattr(db_option, key, value)
        
        self.db.commit()
        self.db.refresh(db_option)
        return db_option

    def delete(self, option_id: str) -> bool:
        """Eliminar opción"""
        db_option = self.get_by_id(option_id)
        if not db_option:
            return False
        
        self.db.delete(db_option)
        self.db.commit()
        return True

    def count_correct_options(self, question_id: str) -> int:
        """Contar opciones correctas de una pregunta"""
        return self.db.query(Option)\
            .filter(Option.question_id == question_id, Option.is_correct == True)\
            .count()