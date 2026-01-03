from sqlalchemy.orm import Session
from app.models import UserCourseProfile, CourseUserRole
from typing import Optional, List

class UserCourseProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_course(self, user_id: str, course_id: str) -> Optional[UserCourseProfile]:
        """Obtener perfil específico de curso"""
        return (
            self.db.query(UserCourseProfile)
            .filter(
                UserCourseProfile.user_id == user_id,
                UserCourseProfile.course_id == course_id
            )
            .first()
        )

    def get_all_by_user(self, user_id: str) -> List[UserCourseProfile]:
        """Obtener todos los perfiles de curso del usuario"""
        return (
            self.db.query(UserCourseProfile)
            .filter(UserCourseProfile.user_id == user_id)
            .all()
        )

    def create(self, user_id: str, course_id: str, profile_data: dict) -> UserCourseProfile:
        """Crear perfil de curso"""
        db_profile = UserCourseProfile(
            user_id=user_id,
            course_id=course_id,
            **profile_data
        )
        self.db.add(db_profile)
        self.db.commit()
        self.db.refresh(db_profile)
        return db_profile

    def update(self, user_id: str, course_id: str, profile_data: dict) -> Optional[UserCourseProfile]:
        """Actualizar perfil de curso"""
        profile = self.get_by_user_and_course(user_id, course_id)
        if not profile:
            return None
        
        for field, value in profile_data.items():
            if hasattr(profile, field):
                setattr(profile, field, value)
        
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def user_is_enrolled(self, user_id: str, course_id: str) -> bool:
        """Verificar si el usuario está inscrito en el curso"""
        return self.db.query(
            self.db.query(CourseUserRole)
            .filter(
                CourseUserRole.user_id == user_id,
                CourseUserRole.course_id == course_id
            )
            .exists()
        ).scalar()

    def exists(self, user_id: str, course_id: str) -> bool:
        """Verificar si existe perfil para el usuario en el curso"""
        return self.db.query(
            self.db.query(UserCourseProfile)
            .filter(
                UserCourseProfile.user_id == user_id,
                UserCourseProfile.course_id == course_id
            )
            .exists()
        ).scalar()