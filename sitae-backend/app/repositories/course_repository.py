#repositories/course_repository.py
from sqlalchemy.orm import Session
from app.models import Course, CourseUserRole, User
from typing import List, Optional, Tuple

class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_courses_with_roles(self, user_id: str) -> List[Tuple[Course, int, float]]:
        """
        Obtener cursos con rol y progreso
        Returns: List[(Course, role_id, progress)]
        """
        results = (
            self.db.query(
                Course,
                CourseUserRole.role_id,
                CourseUserRole.progress
            )
            .join(CourseUserRole, Course.id == CourseUserRole.course_id)
            .filter(
                CourseUserRole.user_id == user_id,
                Course.is_active == True
            )
            #ordenar por nombre
            .order_by(Course.name)
            .all()
        )
        
        return results

    def get_course_by_id(self, course_id: str) -> Optional[Course]:
        """Obtener curso por ID"""
        return (
            self.db.query(Course)
            .filter(Course.id == course_id, Course.is_active == True)
            .first()
        )

    def get_user_role_in_course(self, user_id: str, course_id: str) -> Optional[int]:
        """Obtener ID del rol del usuario en un curso específico"""
        relation = (
            self.db.query(CourseUserRole)
            .filter(
                CourseUserRole.user_id == user_id,
                CourseUserRole.course_id == course_id
            )
            .first()
        )
        return relation.role_id if relation else None

    def create_course(self, course_data: dict) -> Course:
        """Crear nuevo curso"""
        db_course = Course(**course_data)
        self.db.add(db_course)
        self.db.commit()
        self.db.refresh(db_course)
        return db_course

    def enroll_user_in_course(self, user_id: str, course_id: str, role_id: int = 1):
        """Matricular usuario en curso"""
        enrollment = CourseUserRole(
            user_id=user_id,
            course_id=course_id,
            role_id=role_id
        )
        self.db.add(enrollment)
        self.db.commit()
        return enrollment
    
    def update_course(self, course_id: str, course_data: dict) -> Course:
        """
        Actualizar información del curso.
        Solo actualiza los campos que vienen en course_data.
        """
        course = self.get_course_by_id(course_id)
        if not course:
            return None
        
        # Actualizar solo los campos proporcionados
        for field, value in course_data.items():
            if hasattr(course, field):
                setattr(course, field, value)
        
        self.db.commit()
        self.db.refresh(course)
        return course

    def get_user_progress_in_course(self, user_id: str, course_id: str) -> float:
        """Obtener progreso del usuario en un curso"""
        relation = (
            self.db.query(CourseUserRole)
            .filter(
                CourseUserRole.user_id == user_id,
                CourseUserRole.course_id == course_id
            )
            .first()
        )
        return float(relation.progress) if relation and relation.progress else 0.0