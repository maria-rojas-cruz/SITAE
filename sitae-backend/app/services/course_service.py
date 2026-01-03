#sevices/course_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories import CourseRepository
from app.schemas import CourseListResponse, UpdateCourseRequest, CourseWithRoleResponse, CreateCourseRequest, UserRole

class CourseService:
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)

    def get_my_courses(self, user_id: str) -> CourseListResponse:
        """
         Obtener cursos con roles
        """
        results = self.course_repo.get_user_courses_with_roles(user_id)
        
        course_responses = [
            CourseWithRoleResponse(
                id=course.id,
                name=course.name,
                code=course.code,
                description=course.description,
                role=self._map_role_id_to_enum(role_id),
                progress=float(progress) if progress else 0.0
            )
            for course, role_id, progress in results
        ]
        
        return CourseListResponse(
            courses=course_responses,
            total=len(course_responses)
        )

    def get_course_details(self, course_id: str, user_id: str) -> CourseWithRoleResponse:
        """Obtener detalles de un curso específico"""
        course = self.course_repo.get_course_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )

        # Verificar que el usuario tiene acceso al curso
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

        role_name = self._map_role_id_to_enum(role_id)
        
        return CourseWithRoleResponse(
            id=course.id,
            name=course.name,
            code=course.code,
            description=course.description,
            role=role_name,
            progress=getattr(course, 'progress', 0.0)
        )

    def create_course(self, course_data: CreateCourseRequest, user_id: str) -> CourseWithRoleResponse:
        """Crear nuevo curso y auto-matricular como teacher"""
        db_course = self.course_repo.create_course(course_data.dict())
        
        # role teacher default - new course
        self.course_repo.enroll_user_in_course(user_id, db_course.id, 2)  # 2 = teacher
        
        return CourseWithRoleResponse(
            id=db_course.id,
            name=db_course.name,
            code=db_course.code,
            description=db_course.description,
            role=UserRole.TEACHER, 
            progress=0.0
        )

    def _map_role_id_to_enum(self, role_id: int) -> UserRole:
        """Convertir ID de rol a nombre legible"""
        role_mapping = {
            1: UserRole.STUDENT,    # 1 → "student"
            2: UserRole.TEACHER,    # 2 → "teacher"
            3: UserRole.ADMIN       # 3 → "admin"
        }
        return role_mapping.get(role_id, UserRole.STUDENT)
    

    def update_course(
            self, 
            course_id: str, 
            course_data: UpdateCourseRequest, 
            user_id: str
        ) -> CourseWithRoleResponse:
            """
            Actualizar información básica del curso.
            Solo profesores pueden actualizar.
            """
            # 1. Verificar que el curso existe
            course = self.course_repo.get_course_by_id(course_id)
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Curso no encontrado"
                )

            # 2. Verificar que el usuario es profesor del curso
            role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
            if not role_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes acceso a este curso"
                )
            
            if role_id != 2:  # 2 = teacher
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo los profesores pueden actualizar el curso"
                )

            # 3. Preparar datos para actualizar (solo campos no nulos)
            update_data = course_data.model_dump(exclude_unset=True)
            
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se proporcionaron datos para actualizar"
                )

            # 4. Actualizar curso
            updated_course = self.course_repo.update_course(course_id, update_data)
            
            if not updated_course:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al actualizar el curso"
                )

            # 5. Obtener progreso del usuario
            progress = self.course_repo.get_user_progress_in_course(user_id, course_id)

            # 6. Retornar respuesta
            return CourseWithRoleResponse(
                id=updated_course.id,
                name=updated_course.name,
                code=updated_course.code,
                description=updated_course.description,
                role=UserRole.TEACHER,
                progress=progress
            )