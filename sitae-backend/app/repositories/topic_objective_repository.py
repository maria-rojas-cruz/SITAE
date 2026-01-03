# app/repositories/topic_objective_repository.py
from sqlalchemy.orm import Session
from app.models.topic_objective import TopicObjective
from typing import List, Optional
from app.models.topic_module_objective import TopicModuleObjective
from app.models.module_objective import ModuleObjective

class TopicObjectiveRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_topic(self, topic_id: str) -> List[TopicObjective]:
        """Obtener todos los objetivos de un topic, ordenados"""
        return self.db.query(TopicObjective)\
            .filter(TopicObjective.topic_id == topic_id)\
            .order_by(TopicObjective.order)\
            .all()

    def get_by_id(self, objective_id: str) -> Optional[TopicObjective]:
        """Obtener un objetivo por ID"""
        return self.db.query(TopicObjective)\
            .filter(TopicObjective.id == objective_id)\
            .first()

    def create(self, topic_id: str, objective_data: dict) -> TopicObjective:
        """Crear nuevo objetivo"""
        db_objective = TopicObjective(
            topic_id=topic_id,
            **objective_data
        )
        self.db.add(db_objective)
        self.db.commit()
        self.db.refresh(db_objective)
        return db_objective

    def update(self, objective_id: str, objective_data: dict) -> Optional[TopicObjective]:
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
    
    def link_module_objective(
        self, 
        topic_objective_id: str, 
        module_objective_id: str,
        is_primary: bool = False
    ) -> bool:
        """Vincular topic objective con module objective"""
        link = TopicModuleObjective(
            topic_objective_id=topic_objective_id,
            module_objective_id=module_objective_id,
            is_primary=is_primary
        )
        self.db.add(link)
        self.db.commit()
        return True
    
    def unlink_module_objective(
        self, 
        topic_objective_id: str, 
        module_objective_id: str
    ) -> bool:
        """Desvincular"""
        link = self.db.query(TopicModuleObjective).filter(
            TopicModuleObjective.topic_objective_id == topic_objective_id,
            TopicModuleObjective.module_objective_id == module_objective_id
        ).first()
        
        if link:
            self.db.delete(link)
            self.db.commit()
            return True
        return False
    
    def get_linked_module_objectives(self, topic_objective_id: str):
        """Obtener module objectives vinculados"""
        return self.db.query(
            ModuleObjective,
            TopicModuleObjective.is_primary
        ).join(
            TopicModuleObjective,
            ModuleObjective.id == TopicModuleObjective.module_objective_id
        ).filter(
            TopicModuleObjective.topic_objective_id == topic_objective_id
        ).all()