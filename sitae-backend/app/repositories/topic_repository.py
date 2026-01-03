# app/repositories/topic_repository.py
from sqlalchemy.orm import Session
from app.models.topic import Topic
from typing import List, Optional

class TopicRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_module(self, module_id: str) -> List[Topic]:
        """Obtener todos los topics de un módulo, ordenados"""
        return self.db.query(Topic)\
            .filter(Topic.module_id == module_id)\
            .order_by(Topic.order)\
            .all()

    def get_by_id(self, topic_id: str) -> Optional[Topic]:
        """Obtener un topic por ID"""
        return self.db.query(Topic)\
            .filter(Topic.id == topic_id)\
            .first()

    def create(self, module_id: str, topic_data: dict) -> Topic:
        """Crear nuevo topic"""
        db_topic = Topic(
            module_id=module_id,
            **topic_data
        )
        self.db.add(db_topic)
        self.db.commit()
        self.db.refresh(db_topic)
        return db_topic

    def update(self, topic_id: str, topic_data: dict) -> Optional[Topic]:
        """Actualizar topic"""
        db_topic = self.get_by_id(topic_id)
        if not db_topic:
            return None
        
        for key, value in topic_data.items():
            if value is not None:
                setattr(db_topic, key, value)
        
        self.db.commit()
        self.db.refresh(db_topic)
        return db_topic

    def delete(self, topic_id: str) -> bool:
        """Eliminar topic"""
        db_topic = self.get_by_id(topic_id)
        if not db_topic:
            return False
        
        self.db.delete(db_topic)
        self.db.commit()
        return True

    def reorder(self, module_id: str, topic_orders: dict[str, int]) -> bool:
        """Reordenar topics de un módulo"""
        for topic_id, new_order in topic_orders.items():
            db_topic = self.get_by_id(topic_id)
            if db_topic and db_topic.module_id == module_id:
                db_topic.order = new_order
        
        self.db.commit()
        return True