# app/repositories/module_objective_repository.py
from sqlalchemy.orm import Session
from app.models.module_objective import ModuleObjective
from typing import List, Optional
from app.models.module_objective_lo import ModuleObjectiveLO
from app.models.learning_outcome import LearningOutcome

class ModuleObjectiveRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_module(self, module_id: str) -> List[ModuleObjective]:
        """Obtener todos los objetivos de un módulo, ordenados"""
        query = self.db.query(ModuleObjective)\
            .filter(ModuleObjective.module_id == module_id)
        
        # Ordenar por 'order' si existe, sino por created_at
        return query.order_by(
            ModuleObjective.order.asc().nullsfirst(),
            ModuleObjective.created_at
        ).all()

    def get_by_id(self, objective_id: str) -> Optional[ModuleObjective]:
        """Obtener un objetivo por ID"""
        return self.db.query(ModuleObjective)\
            .filter(ModuleObjective.id == objective_id)\
            .first()

    def create(self, module_id: str, objective_data: dict) -> ModuleObjective:
        """Crear nuevo objetivo"""
        db_objective = ModuleObjective(
            module_id=module_id,
            **objective_data
        )
        self.db.add(db_objective)
        self.db.commit()
        self.db.refresh(db_objective)
        return db_objective

    def update(self, objective_id: str, objective_data: dict) -> Optional[ModuleObjective]:
        """Actualizar objetivo"""
        db_objective = self.get_by_id(objective_id)
        if not db_objective:
            return None
        
        for key, value in objective_data.items():
            if value is not None:
                setattr(db_objective, key, value)
        
        self.db.commit()
        self.db.refresh(db_objective)
        return db_objective

    def delete(self, objective_id: str) -> bool:
        """Eliminar objetivo"""
        db_objective = self.get_by_id(objective_id)
        if not db_objective:
            return False
        
        self.db.delete(db_objective)
        self.db.commit()
        return True
    
    def link_learning_outcome(
        self, 
        module_objective_id: str, 
        learning_outcome_id: str,
        is_primary: bool = False
    ) -> bool:
        """Vincular module objective con learning outcome"""
        link = ModuleObjectiveLO(
            module_objective_id=module_objective_id,
            learning_outcomes_id=learning_outcome_id,
            is_primary=is_primary
        )
        self.db.add(link)
        self.db.commit()
        return True
    
    def unlink_learning_outcome(
        self, 
        module_objective_id: str, 
        learning_outcome_id: str
    ) -> bool:
        """Desvincular"""
        link = self.db.query(ModuleObjectiveLO).filter(
            ModuleObjectiveLO.module_objective_id == module_objective_id,
            ModuleObjectiveLO.learning_outcomes_id == learning_outcome_id
        ).first()
        
        if link:
            self.db.delete(link)
            self.db.commit()
            return True
        return False
    
    def get_linked_learning_outcomes(self, module_objective_id: str):
        """Obtener LOs vinculados"""
        return self.db.query(
            LearningOutcome,
            ModuleObjectiveLO.is_primary
        ).join(
            ModuleObjectiveLO,
            LearningOutcome.id == ModuleObjectiveLO.learning_outcomes_id
        ).filter(
            ModuleObjectiveLO.module_objective_id == module_objective_id
        ).all()