# app/repositories/module_objective_lo_repository.py
from sqlalchemy.orm import Session
from app.models.module_objective_lo import ModuleObjectiveLO
from typing import List

class ModuleObjectiveLORepository:
    def __init__(self, db: Session):
        self.db = db

    def create_relation(self, module_objective_id: str, learning_outcome_id: str, is_primary: bool = False) -> ModuleObjectiveLO:
        """Crear relación entre module_objective y learning_outcome"""
        relation = ModuleObjectiveLO(
            module_objective_id=module_objective_id,
            learning_outcomes_id=learning_outcome_id,
            is_primary=is_primary
        )
        self.db.add(relation)
        self.db.commit()
        self.db.refresh(relation)
        return relation

    def get_relations_by_module_objective(self, module_objective_id: str) -> List[ModuleObjectiveLO]:
        """Obtener todas las relaciones de un module_objective"""
        return self.db.query(ModuleObjectiveLO)\
            .filter(ModuleObjectiveLO.module_objective_id == module_objective_id)\
            .all()

    def delete_relations_by_module_objective(self, module_objective_id: str) -> bool:
        """Eliminar todas las relaciones de un module_objective"""
        relations = self.get_relations_by_module_objective(module_objective_id)
        for relation in relations:
            self.db.delete(relation)
        self.db.commit()
        return True

    def delete_relation(self, module_objective_id: str, learning_outcome_id: str) -> bool:
        """Eliminar una relación específica"""
        relation = self.db.query(ModuleObjectiveLO)\
            .filter(
                ModuleObjectiveLO.module_objective_id == module_objective_id,
                ModuleObjectiveLO.learning_outcomes_id == learning_outcome_id
            )\
            .first()
        
        if relation:
            self.db.delete(relation)
            self.db.commit()
            return True
        return False