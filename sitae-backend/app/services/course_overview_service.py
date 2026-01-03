from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.course_repository import CourseRepository
from app.repositories.learning_outcome_repository import LearningOutcomeRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.module_objective_repository import ModuleObjectiveRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.topic_objective_repository import TopicObjectiveRepository
# from app.repositories.resource_repository import ResourceRepository  # <- pendiente
# from app.repositories.quiz_repository import QuizRepository          # <- pendiente

class CourseOverviewService:
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.learning_repo = LearningOutcomeRepository(db)
        self.module_repo = ModuleRepository(db)
        self.module_obj_repo = ModuleObjectiveRepository(db)
        self.topic_repo = TopicRepository(db)
        self.topic_obj_repo = TopicObjectiveRepository(db)
        # self.resource_repo = ResourceRepository(db)
        # self.quiz_repo = QuizRepository(db)

    def get_course_overview(self, course_id: str, user_id: str):
        """Devuelve toda la información jerárquica del curso para vista general"""
        course = self.course_repo.get_course_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Curso no encontrado")

        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(status_code=403, detail="No tienes acceso a este curso")

        # Aprendizajes esperados
        outcomes = self.learning_repo.get_by_course(course_id)

        # Módulos + objetivos + topics
        modules = self.module_repo.get_by_course(course_id)
        module_data = []
        for module in modules:
            module_objectives = self.module_obj_repo.get_by_module(module.id)
            topics = self.topic_repo.get_by_module(module.id)

            topic_data = []
            for topic in topics:
                topic_objectives = self.topic_obj_repo.get_by_topic(topic.id)
                # resources = self.resource_repo.get_by_topic(topic.id)
                topic_data.append({
                    "id": topic.id,
                    "title": topic.title,
                    "description": topic.description,
                    "objectives": [obj.description for obj in topic_objectives],
                    "resources": []  # resources luego
                })

            module_data.append({
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "objectives": [obj.description for obj in module_objectives],
                "topics": topic_data
            })

        # quizzes = self.quiz_repo.get_by_course(course_id)
        quizzes = []  # luego se conectan

        return {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "role_id": role_id,
            "learning_outcomes": [
                {"code": o.code, "description": o.description, "bloom_level": o.bloom_level}
                for o in outcomes
            ],
            "modules": module_data,
            "evaluations": quizzes
        }
