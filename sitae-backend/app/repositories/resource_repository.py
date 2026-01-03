# app/repositories/resource_repository.py
from sqlalchemy.orm import Session
from app.models.resource import Resource
from typing import List, Optional

class ResourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_topic(self, topic_id: str) -> List[Resource]:
        """Obtener todos los recursos de un topic, ordenados"""
        return self.db.query(Resource)\
            .filter(Resource.topic_id == topic_id)\
            .order_by(Resource.order)\
            .all()

    def get_by_id(self, resource_id: str) -> Optional[Resource]:
        """Obtener un recurso por ID"""
        return self.db.query(Resource)\
            .filter(Resource.id == resource_id)\
            .first()

    def create(self, topic_id: str, resource_data: dict) -> Resource:
        """Crear nuevo recurso"""
        db_resource = Resource(
            topic_id=topic_id,
            **resource_data
        )
        self.db.add(db_resource)
        self.db.commit()
        self.db.refresh(db_resource)
        return db_resource

    def update(self, resource_id: str, resource_data: dict) -> Optional[Resource]:
        """Actualizar recurso"""
        db_resource = self.get_by_id(resource_id)
        if not db_resource:
            return None
        
        for key, value in resource_data.items():
            if value is not None:
                setattr(db_resource, key, value)
        
        self.db.commit()
        self.db.refresh(db_resource)
        return db_resource

    def delete(self, resource_id: str) -> bool:
        """Eliminar recurso"""
        db_resource = self.get_by_id(resource_id)
        if not db_resource:
            return False
        
        self.db.delete(db_resource)
        self.db.commit()
        return True

    def reorder(self, topic_id: str, resource_orders: dict[str, int]) -> bool:
        """Reordenar recursos de un topic"""
        for resource_id, new_order in resource_orders.items():
            db_resource = self.get_by_id(resource_id)
            if db_resource and db_resource.topic_id == topic_id:
                db_resource.order = new_order
        
        self.db.commit()
        return True

    def get_by_type(self, topic_id: str, resource_type: str) -> List[Resource]:
        """Obtener recursos de un topic filtrados por tipo"""
        return self.db.query(Resource)\
            .filter(
                Resource.topic_id == topic_id,
                Resource.type == resource_type
            )\
            .order_by(Resource.order)\
            .all()

    def get_mandatory(self, topic_id: str) -> List[Resource]:
        """Obtener solo recursos obligatorios de un topic"""
        return self.db.query(Resource)\
            .filter(
                Resource.topic_id == topic_id,
                Resource.is_mandatory == True
            )\
            .order_by(Resource.order)\
            .all()
    
    def get_for_topic_objective(
        self,
        topic_objective_id: str,
        max_duration_min: Optional[int],
        limit: int
    ) -> List[Resource]:
        q = self.db.query(Resource)\
            .filter(Resource.topic_objective_id == topic_objective_id)

        if max_duration_min is not None:
            # keep NULL durations (unknown) and <= max
            q = q.filter(
                (Resource.duration_minutes == None) |  # noqa: E711
                (Resource.duration_minutes <= max_duration_min)
            )

        # order: mandatory first, then by "order", then by known shortest duration
        q = q.order_by(
            Resource.is_mandatory.desc(),
            Resource.order.asc(),
            Resource.duration_minutes.asc().nulls_last()
        ).limit(limit)

        return q.all()
    

    def get_by_filters(
        self,
        topic_id: str,
        resource_type: Optional[str] = None,
        is_mandatory: Optional[bool] = None,
        is_external: Optional[bool] = None
    ) -> List[Resource]:
        """Obtener recursos aplicando múltiples filtros opcionales"""
        query = self.db.query(Resource).filter(Resource.topic_id == topic_id)
        
        # apply optional filters
        if resource_type is not None:
            query = query.filter(Resource.type == resource_type)
        
        if is_mandatory is not None:
            query = query.filter(Resource.is_mandatory == is_mandatory)
        
        if is_external is not None:
            query = query.filter(Resource.is_external == is_external)
        
        return query.order_by(Resource.order).all()