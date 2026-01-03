# app/services/module_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.module import (
    ModuleCreate,
    ModuleUpdate,
    ModuleResponse,
    ModuleListResponse
)

class ModuleService:
    def __init__(self, db: Session):
        self.db = db
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)

    def _verify_teacher_access(self, course_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:  # 2 = teacher
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden modificar módulos"
            )

    def _verify_course_access(self, course_id: str, user_id: str):
        """Verificar que el usuario tiene acceso al curso"""
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_course_modules(self, course_id: str, user_id: str) -> ModuleListResponse:
        """Obtener todos los módulos de un curso"""
        self._verify_course_access(course_id, user_id)
        
        modules = self.module_repo.get_by_course(course_id)
        
        return ModuleListResponse(
            modules=[ModuleResponse.model_validate(m) for m in modules],
            total=len(modules)
        )

    def create_module(
        self, 
        course_id: str, 
        user_id: str, 
        module_data: ModuleCreate
    ) -> ModuleResponse:
        """Crear nuevo módulo (solo docentes)"""
        self._verify_teacher_access(course_id, user_id)
        
        db_module = self.module_repo.create(
            course_id, 
            module_data.model_dump()
        )
        
        return ModuleResponse.model_validate(db_module)

    def update_module(
        self, 
        module_id: str, 
        user_id: str, 
        module_data: ModuleUpdate
    ) -> ModuleResponse:
        """Actualizar módulo (solo docentes)"""
        db_module = self.module_repo.get_by_id(module_id)
        if not db_module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo no encontrado"
            )

        self._verify_teacher_access(db_module.course_id, user_id)

        updated = self.module_repo.update(
            module_id, 
            module_data.model_dump(exclude_unset=True)
        )
        
        return ModuleResponse.model_validate(updated)

    def delete_module(self, module_id: str, user_id: str) -> dict:
        """Eliminar módulo (solo docentes)"""
        db_module = self.module_repo.get_by_id(module_id)
        if not db_module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo no encontrado"
            )

        self._verify_teacher_access(db_module.course_id, user_id)

        self.module_repo.delete(module_id)
        
        return {"message": "Módulo eliminado exitosamente"}

    def reorder_modules(
        self, 
        course_id: str, 
        user_id: str, 
        module_orders: dict[str, int]
    ) -> dict:
        """Reordenar módulos de un curso (solo docentes)"""
        self._verify_teacher_access(course_id, user_id)
        
        self.module_repo.reorder(course_id, module_orders)
        
        return {"message": "Módulos reordenados exitosamente"}