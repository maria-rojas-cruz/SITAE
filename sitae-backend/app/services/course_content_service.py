# app/services/course_content_service.py
from sqlalchemy.orm import Session
from app.repositories.course_content_repository import CourseContentRepository
from fastapi import HTTPException, status
from typing import Dict, Any, List


class CourseContentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CourseContentRepository(db)

    def get_course_full_content(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """
        obtener curso y datos vinculados completos para vista
        """
        course = self.repo.get_course_full_structure(course_id)
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        user_role = self._get_user_role(course, user_id)
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )
        
        return self._build_simple_response(course, user_role, user_id)

    def get_course_edit_data(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """
        obtener cursos y datos vinculados para edicion
        """
        course = self.repo.get_course_full_structure(course_id)
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        user_role = self._get_user_role(course, user_id)
        if user_role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden editar el curso"
            )
        
        return self._build_edit_response(course, user_role)

    def _get_user_role(self, course, user_id: str) -> str | None:
        """Determinar el rol del usuario en el curso"""
        for role in course.course_user_roles:
            if str(role.user_id) == str(user_id):
                role_mapping = {1: "student", 2: "teacher", 3: "admin"}
                return role_mapping.get(role.role_id, "student")
        return None

    def _build_simple_response(self, course, user_role: str, user_id: str) -> Dict[str, Any]:
        """
        construir respuesta SIMPLE para /content
        """
        teachers = [
            {
                "id": str(role.user.id),
                "full_name": f"{role.user.person.name} {role.user.person.first_last_name} {role.user.person.second_last_name}".strip(),
                "email": role.user.person.email,
            }
            for role in course.course_user_roles
            if role.role_id == 2
        ]
        
        learning_outcomes = [
            {
                "id": str(lo.id),
                "code": lo.code,
                "description": lo.description,
                "bloom_level": lo.bloom_level,
                "order": lo.order,
            }
            for lo in sorted(course.learning_outcomes, key=lambda x: x.order)
        ]
        
        # collect all active quiz IDs
        all_quiz_ids = []
        for module in course.modules:
            for topic in module.topics:
                for quiz in topic.quizzes:
                    if quiz.is_active:
                        all_quiz_ids.append(str(quiz.id))
        
        # ONE query to get all user attempts
        user_attempts = self.repo.get_user_quiz_attempts(user_id, all_quiz_ids)
        
        modules = []
        for module in sorted(course.modules, key=lambda x: x.order):
            module_data = {
                "id": str(module.id),
                "title": module.title,
                "description": module.description,
                "order": module.order,
                "objectives": [
                    {
                        "id": str(obj.id),
                        "description": obj.description,
                        "code": obj.code,
                    }
                    for obj in sorted(
                        module.module_objectives, 
                        key=lambda x: x.order if x.order else 999
                    )
                ],
                "topics": []
            }
            
            for topic in sorted(module.topics, key=lambda x: x.order):
                topic_data = {
                    "id": str(topic.id),
                    "title": topic.title,
                    "description": topic.description,
                    "order": topic.order,
                    "objectives": [
                        {
                            "id": str(obj.id),
                            "description": obj.description,
                            "code": obj.code,
                        }
                        for obj in sorted(
                            topic.topic_objectives,
                            key=lambda x: x.order if x.order else 999
                        )
                    ],
                    "resources": [
                        {
                            "id": str(res.id),
                            "type": res.type,
                            "title": res.title,
                            "url": res.url,
                            "duration_minutes": res.duration_minutes,
                            "is_mandatory": res.is_mandatory,
                            "order": res.order,
                            "topic_objective_id": str(res.topic_objective_id),
                            "topic_objective_code": next(
                                (obj.code for obj in topic.topic_objectives 
                                if str(obj.id) == str(res.topic_objective_id)),
                                None
                            ),
                        }
                        for res in sorted(topic.resources, key=lambda x: x.order)
                    ],
                    "quizzes": [
                        {
                            "id": str(quiz.id),
                            "type": "quiz",
                            "title": quiz.title,
                            "description": quiz.description,
                            "time_minutes": quiz.time_minutes,
                            "is_active": quiz.is_active,
                            "order": 999,
                            # add attempt info
                            "completed": str(quiz.id) in user_attempts,
                            "last_attempt_id": user_attempts.get(str(quiz.id), {}).get("attempt_id"),
                            "last_attempt_percent": user_attempts.get(str(quiz.id), {}).get("percent"),
                        }
                        for quiz in topic.quizzes
                        if quiz.is_active
                    ],
                }
                module_data["topics"].append(topic_data)
            
            modules.append(module_data)
        
        return {
            "id": str(course.id),
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "is_active": course.is_active,
            "role": user_role,
            "teachers": teachers,
            "learning_outcomes": learning_outcomes,
            "modules": modules,
            "evaluations": [],
        }

    def _build_edit_response(self, course, user_role: str) -> Dict[str, Any]:
   
        # Teachers
        teachers = [
            {
                "id": str(role.user.id),
                "full_name": f"{role.user.person.name} {role.user.person.first_last_name} {role.user.person.second_last_name}".strip(),
                "email": role.user.person.email,
            }
            for role in course.course_user_roles
            if role.role_id == 2
        ]
        
        # Learning Outcomes
        learning_outcomes = [
            {
                "id": str(lo.id),
                "code": lo.code,
                "description": lo.description,
                "bloom_level": lo.bloom_level,
                "order": lo.order,
            }
            for lo in sorted(course.learning_outcomes, key=lambda x: x.order)
        ]
        
        # 🚀 PRE-ORDENAR MÓDULOS (evitar sorted() repetido)
        sorted_modules = sorted(course.modules, key=lambda x: x.order)
        
        modules = []
        for module in sorted_modules:
            # 🚀 PRE-ORDENAR objectives del módulo
            sorted_module_objs = sorted(
                module.module_objectives, 
                key=lambda x: x.order if x.order else 999
            )
            
            # Module objectives con linked_learning_outcome_ids
            module_objectives = [
                {
                    "id": str(obj.id),
                    "description": obj.description,
                    "code": obj.code,
                    "order": obj.order if obj.order else 999,
                    "linked_learning_outcome_ids": [
                        str(lo.id) for lo in obj.linked_learning_outcomes
                    ]
                }
                for obj in sorted_module_objs
            ]
            
            # 🚀 Cache: available_module_objectives (se reutiliza por cada topic)
            available_module_objs = [
                {"id": str(obj.id), "code": obj.code, "description": obj.description}
                for obj in sorted_module_objs
            ]
            
            # 🚀 PRE-ORDENAR topics
            sorted_topics = sorted(module.topics, key=lambda x: x.order)
            
            topics_data = []
            for topic in sorted_topics:
                # 🚀 PRE-ORDENAR topic objectives
                sorted_topic_objs = sorted(
                    topic.topic_objectives, 
                    key=lambda x: x.order if x.order else 999
                )
                
                # 🚀 Cache: Dict para búsqueda rápida de codes O(1)
                topic_obj_codes = {
                    str(obj.id): obj.code 
                    for obj in sorted_topic_objs
                }
                
                # Topic objectives con linked_module_objective_ids
                topic_objectives = [
                    {
                        "id": str(obj.id),
                        "description": obj.description,
                        "code": obj.code,
                        "order": obj.order if obj.order else 999,
                        "linked_module_objective_ids": [
                            str(mo.id) for mo in obj.linked_module_objectives
                        ]
                    }
                    for obj in sorted_topic_objs
                ]
                
                # 🚀 Cache: available_topic_objectives (se reutiliza por cada quiz)
                available_topic_objs = [
                    {"id": str(obj.id), "code": obj.code, "description": obj.description}
                    for obj in sorted_topic_objs
                ]
                
                # Resources (usando cache de códigos)
                resources = [
                    {
                        "id": str(res.id),
                        "type": res.type,
                        "title": res.title,
                        "url": res.url,
                        "duration_minutes": res.duration_minutes,
                        "is_mandatory": res.is_mandatory,
                        "order": res.order,
                        "topic_objective_id": str(res.topic_objective_id),
                        "topic_objective_code": topic_obj_codes.get(str(res.topic_objective_id)),
                    }
                    for res in sorted(topic.resources, key=lambda x: x.order)
                ]
                
                # Quizzes con available_topic_objectives (reutilizando cache)
                quizzes = [
                    {
                        "id": str(quiz.id),
                        "title": quiz.title,
                        "description": quiz.description,
                        "time_minutes": quiz.time_minutes,
                        "is_active": quiz.is_active,
                        "available_topic_objectives": available_topic_objs  # 🚀 Cache reutilizado
                    }
                    for quiz in topic.quizzes
                ]
                
                topics_data.append({
                    "id": str(topic.id),
                    "title": topic.title,
                    "description": topic.description,
                    "order": topic.order,
                    "objectives": topic_objectives,
                    "resources": resources,
                    "quizzes": quizzes,
                    "available_module_objectives": available_module_objs  # 🚀 Cache reutilizado
                })
            
            modules.append({
                "id": str(module.id),
                "title": module.title,
                "description": module.description,
                "order": module.order,
                "objectives": module_objectives,
                "topics": topics_data
            })
        
        return {
            "id": str(course.id),
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "is_active": course.is_active,
            "role": user_role,
            "teachers": teachers,
            "learning_outcomes": learning_outcomes,
            "modules": modules,
            "evaluations": [],
        }