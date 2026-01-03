# app/repositories/course_content_repository.py
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_
from app.models import (
    Course,
    CourseUserRole,
    User,
    Person,
    LearningOutcome,
    Module,
    ModuleObjective,
    Topic,
    TopicObjective,
    Resource,
    Quiz,
    AttemptQuiz
)
from typing import Optional

class CourseContentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_course_full_structure(self, course_id: str) -> Optional[Course]:
       
        return (
            self.db.query(Course)
            .options(
                # Teachers con sus datos de persona
                selectinload(Course.course_user_roles)
                .joinedload(CourseUserRole.user)
                .joinedload(User.person),
                
                # Learning Outcomes
                selectinload(Course.learning_outcomes),
                
                # Módulos con objetivos y s learning outcomes vinculados
                selectinload(Course.modules)
                .selectinload(Module.module_objectives)
                .selectinload(ModuleObjective.linked_learning_outcomes),
                
                # Topics con objetivos y objetivos de modulos vuinculados
                selectinload(Course.modules)
                .selectinload(Module.topics)
                .selectinload(Topic.topic_objectives)
                .selectinload(TopicObjective.linked_module_objectives),
                
                # Resources
                selectinload(Course.modules)
                .selectinload(Module.topics)
                .selectinload(Topic.resources.and_(Resource.is_external == False)),
                
                # Quizzes
                selectinload(Course.modules)
                .selectinload(Module.topics)
                .selectinload(Topic.quizzes),
            )
            .filter(Course.id == course_id)
            .first()
        )

    def get_teachers(self, course_id: str):
        results = (
            self.db.query(
                User.id,
                Person.name,
                Person.first_last_name,
                Person.second_last_name,
                Person.email,
            )
            .join(CourseUserRole, User.id == CourseUserRole.user_id)
            .join(Person, User.person_id == Person.id)
            .filter(
                and_(
                    CourseUserRole.course_id == course_id,
                    CourseUserRole.role_id == 2,
                )
            )
            .all()
        )
        return [
            {
                "id": str(r.id),
                "full_name": f"{r.name} {r.first_last_name} {r.second_last_name}",
                "email": str(r.email),
            }
            for r in results
        ]
    
    def get_user_quiz_attempts(self, user_id: str, quiz_ids: list[str]) -> dict:
        """
        get completed attempts for multiple quizzes in one query
        returns dict: {quiz_id: {attempt_id, percent}}
        """
        if not quiz_ids:
            return {}
        
        attempts = (
            self.db.query(AttemptQuiz)
            .filter(
                AttemptQuiz.user_id == user_id,
                AttemptQuiz.quiz_id.in_(quiz_ids),
                AttemptQuiz.state == "CALIFICADO"
            )
            .order_by(AttemptQuiz.date_end.desc())
            .all()
        )
        
        # keep only the most recent completed attempt per quiz
        attempts_dict = {}
        for attempt in attempts:
            quiz_id = str(attempt.quiz_id)
            if quiz_id not in attempts_dict:
                attempts_dict[quiz_id] = {
                    "attempt_id": str(attempt.id),
                    "percent": float(attempt.percent) if attempt.percent else 0.0,
                }
        
        return attempts_dict