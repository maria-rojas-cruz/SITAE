# app/repositories/module_repository.py
from sqlalchemy.orm import Session
from app.models.module import Module
from typing import List, Optional

class ModuleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: str) -> List[Module]:
        """Obtener todos los módulos de un curso, ordenados"""
        return self.db.query(Module)\
            .filter(Module.course_id == course_id)\
            .order_by(Module.order)\
            .all()

    def get_by_id(self, module_id: str) -> Optional[Module]:
        """Obtener un módulo por ID"""
        return self.db.query(Module)\
            .filter(Module.id == module_id)\
            .first()

    def create(self, course_id: str, module_data: dict) -> Module:
        """Crear nuevo módulo"""
        db_module = Module(
            course_id=course_id,
            **module_data
        )
        self.db.add(db_module)
        self.db.commit()
        self.db.refresh(db_module)
        return db_module

    def update(self, module_id: str, module_data: dict) -> Optional[Module]:
        """Actualizar módulo"""
        db_module = self.get_by_id(module_id)
        if not db_module:
            return None
        
        for key, value in module_data.items():
            if value is not None:
                setattr(db_module, key, value)
        
        self.db.commit()
        self.db.refresh(db_module)
        return db_module

    def delete(self, module_id: str) -> bool:
        """Eliminar módulo"""
        db_module = self.get_by_id(module_id)
        if not db_module:
            return False
        
        self.db.delete(db_module)
        self.db.commit()
        return True

    def reorder(self, course_id: str, module_orders: dict[str, int]) -> bool:
        """Reordenar módulos de un curso"""
        for module_id, new_order in module_orders.items():
            db_module = self.get_by_id(module_id)
            if db_module and db_module.course_id == course_id:
                db_module.order = new_order
        
        self.db.commit()
        return True