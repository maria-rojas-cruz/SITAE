# app/repositories/statistics_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct, case, desc, Float
from app.models import (
    Course, CourseUserRole, User, Person,
    Quiz, Question, AttemptQuiz, QuestionResponse,
    Topic, Module, LearningOutcome, ModuleObjective,
    TopicObjective, Option, ModuleObjectiveLO, TopicModuleObjective
)
from datetime import datetime, timedelta
from typing import List, Dict, Any

class StatisticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_course_statistics(self, course_id: str) -> Dict[str, Any]:
        """Estadísticas generales del curso"""
        # Total estudiantes
        total_students = self.db.query(func.count(CourseUserRole.user_id))\
            .filter(
                CourseUserRole.course_id == course_id,
                CourseUserRole.role_id == 1  # Students
            ).scalar() or 0
        
        # Total quizzes activos
        total_quizzes = self.db.query(func.count(Quiz.id))\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                Quiz.is_active == True
            ).scalar() or 0
        
        # Promedio de puntajes en quizzes CALIFICADOS
        avg_score = self.db.query(func.avg(AttemptQuiz.percent))\
            .join(Quiz, AttemptQuiz.quiz_id == Quiz.id)\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                AttemptQuiz.state == "CALIFICADO"
            ).scalar() or 0.0
        
        # Intentos CALIFICADOS vs pendientes
        completed_count = self.db.query(func.count(AttemptQuiz.id))\
            .join(Quiz, AttemptQuiz.quiz_id == Quiz.id)\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                AttemptQuiz.state == "CALIFICADO"
            ).scalar() or 0
        
        pending_count = (total_students * total_quizzes) - completed_count
        
        # Estudiantes activos última semana
        one_week_ago = datetime.now() - timedelta(days=7)
        active_students = self.db.query(func.count(distinct(AttemptQuiz.user_id)))\
            .join(Quiz, AttemptQuiz.quiz_id == Quiz.id)\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                AttemptQuiz.date_start >= one_week_ago
            ).scalar() or 0
        
        # NUEVO: Tasa de participación en quizzes (estudiantes que han completado al menos 1 quiz)
        students_with_quizzes = self.db.query(func.count(distinct(AttemptQuiz.user_id)))\
            .join(Quiz, AttemptQuiz.quiz_id == Quiz.id)\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                AttemptQuiz.state == "CALIFICADO"
            ).scalar() or 0
        
        quiz_participation_rate = (students_with_quizzes / total_students * 100) if total_students > 0 else 0
        
        # NUEVO: Promedio de logro de objetivos (basado en % de estudiantes sobre 70%)
        # Calculamos el promedio de achievement rate de todos los learning outcomes
        lo_achievements = self.get_all_learning_outcomes_performance(course_id)
        if lo_achievements:
            total_achievement = sum(
                (lo['students_above_70_percent'] / 
                 (lo['students_above_70_percent'] + lo['students_below_70_percent']) * 100)
                if (lo['students_above_70_percent'] + lo['students_below_70_percent']) > 0 else 0
                for lo in lo_achievements
            )
            average_objectives_achievement = total_achievement / len(lo_achievements)
        else:
            average_objectives_achievement = 0.0
        
        return {
            "total_students": total_students,
            "total_quizzes": total_quizzes,
            "avg_quiz_score": round(float(avg_score), 2),
            "quizzes_completed_count": completed_count,
            "quizzes_pending_count": pending_count,
            "active_students_last_week": active_students,
            "quiz_participation_rate": round(quiz_participation_rate, 2),
            "average_objectives_achievement": round(average_objectives_achievement, 2)
        }

    def get_students_performance(self, course_id: str) -> List[Dict[str, Any]]:
        """Desempeño de estudiantes"""
        results = self.db.query(
            User.id,
            Person.name,
            Person.first_last_name,
            Person.second_last_name,
            Person.email,
            func.count(distinct(case(
                (AttemptQuiz.state == "CALIFICADO", AttemptQuiz.id),
                else_=None
            ))).label('quizzes_completed'),
            func.avg(case(
                (AttemptQuiz.state == "CALIFICADO", AttemptQuiz.percent),
                else_=None
            )).label('avg_score'),
            func.max(AttemptQuiz.date_start).label('last_activity')
        ).join(
            CourseUserRole, User.id == CourseUserRole.user_id
        ).join(
            Person, User.person_id == Person.id
        ).outerjoin(
            AttemptQuiz, User.id == AttemptQuiz.user_id
        ).outerjoin(
            Quiz, AttemptQuiz.quiz_id == Quiz.id
        ).outerjoin(
            Topic, Quiz.topic_id == Topic.id
        ).outerjoin(
            Module, Topic.module_id == Module.id
        ).filter(
            CourseUserRole.course_id == course_id,
            CourseUserRole.role_id == 1  # Students
        ).group_by(
            User.id,
            Person.name,
            Person.first_last_name,
            Person.second_last_name,
            Person.email
        ).all()
        
        # Total de quizzes del curso
        total_quizzes = self.db.query(func.count(Quiz.id))\
            .join(Topic, Quiz.topic_id == Topic.id)\
            .join(Module, Topic.module_id == Module.id)\
            .filter(
                Module.course_id == course_id,
                Quiz.is_active == True
            ).scalar() or 0
        
        return [
            {
                "user_id": str(r.id),
                "full_name": f"{r.name} {r.first_last_name} {r.second_last_name}",
                "email": str(r.email),
                "quizzes_completed": r.quizzes_completed,
                "quizzes_total": total_quizzes,
                "avg_score": round(float(r.avg_score), 2) if r.avg_score else None,
                "last_activity": r.last_activity
            }
            for r in results
        ]

    def get_quiz_results(self, quiz_id: str) -> Dict[str, Any]:
        """Resultados detallados de un quiz"""
        # Info básica del quiz
        quiz_info = self.db.query(
            Quiz.id,
            Quiz.title,
            Topic.title.label('topic_name')
        ).join(
            Topic, Quiz.topic_id == Topic.id
        ).filter(Quiz.id == quiz_id).first()
        
        if not quiz_info:
            return None
        
        # Intentos CALIFICADOS
        attempts = self.db.query(
            AttemptQuiz.id,
            AttemptQuiz.user_id,
            AttemptQuiz.score_total,
            AttemptQuiz.percent,
            AttemptQuiz.date_start,
            AttemptQuiz.date_end,
            Person.name,
            Person.first_last_name,
            Person.second_last_name
        ).join(
            User, AttemptQuiz.user_id == User.id
        ).join(
            Person, User.person_id == Person.id
        ).filter(
            AttemptQuiz.quiz_id == quiz_id,
            AttemptQuiz.state == "CALIFICADO"
        ).all()
        
        # Análisis por pregunta
        question_stats = self.db.query(
            Question.id,
            Question.text,
            func.count(QuestionResponse.id).label('total_responses'),
            func.sum(case(
                (QuestionResponse.is_correct == True, 1),
                else_=0
            )).label('correct_count'),
            func.avg(QuestionResponse.time_seconds).label('avg_time')
        ).outerjoin(
            QuestionResponse, Question.id == QuestionResponse.question_id
        ).filter(
            Question.quiz_id == quiz_id
        ).group_by(
            Question.id,
            Question.text
        ).all()
        
        return {
            "quiz_id": str(quiz_info.id),
            "quiz_title": quiz_info.title,
            "topic_name": quiz_info.topic_name,
            "total_attempts": len(attempts),
            "completed_attempts": len(attempts),
            "avg_score": sum(a.score_total for a in attempts) / len(attempts) if attempts else 0,
            "avg_percent": sum(a.percent for a in attempts) / len(attempts) if attempts else 0,
            "question_analysis": [
                {
                    "question_id": str(q.id),
                    "question_text": q.text,
                    "correct_rate": float(q.correct_count / q.total_responses * 100) if q.total_responses else 0,
                    "total_responses": q.total_responses,
                    "avg_time_seconds": float(q.avg_time) if q.avg_time else None
                }
                for q in question_stats
            ],
            "student_results": [
                {
                    "user_id": str(a.user_id),
                    "full_name": f"{a.name} {a.first_last_name} {a.second_last_name}",
                    "attempt_id": str(a.id),
                    "score": float(a.score_total),
                    "percent": float(a.percent),
                    "date_completed": a.date_end,
                    "time_taken_minutes": (
                        int((a.date_end - a.date_start).total_seconds() / 60) 
                        if a.date_end and a.date_start and a.date_end > a.date_start 
                        else None  # Si el tiempo es inválido, retornar None
                    )
                }
                for a in attempts
            ]
        }

    def get_all_learning_outcomes_performance(
        self, 
        course_id: str,
        student_id: str | None = None
    ) -> List[Dict[str, Any]]:
        """Obtener performance de todos los learning outcomes del curso"""
        
        # obtain students from course once
        student_ids_query = self.db.query(CourseUserRole.user_id)\
            .filter(
                CourseUserRole.course_id == course_id,
                CourseUserRole.role_id == 1
            )
        
        if student_id:
            student_ids_query = student_ids_query.filter(
                CourseUserRole.user_id == student_id
            )
        
        student_ids = [str(s[0]) for s in student_ids_query.all()]
        
        if not student_ids:
            return []
        
        # OPTIMIZATION: get all LOs with their related quizzes
        # use separate query to avoid None in array_agg
        learning_outcomes = self.db.query(LearningOutcome).filter(
            LearningOutcome.course_id == course_id
        ).order_by(LearningOutcome.order).all()
        
        if not learning_outcomes:
            return []
        
        lo_ids = [str(lo.id) for lo in learning_outcomes]
        
        # get quiz relationships for all LOs in one query
        quiz_relationships = self.db.query(
            ModuleObjectiveLO.learning_outcomes_id,
            Quiz.id.label('quiz_id')
        ).join(
            ModuleObjective, ModuleObjectiveLO.module_objective_id == ModuleObjective.id
        ).join(
            TopicModuleObjective, ModuleObjective.id == TopicModuleObjective.module_objective_id
        ).join(
            TopicObjective, TopicModuleObjective.topic_objective_id == TopicObjective.id
        ).join(
            Question, TopicObjective.id == Question.topic_objective_id
        ).join(
            Quiz, Question.quiz_id == Quiz.id
        ).filter(
            ModuleObjectiveLO.learning_outcomes_id.in_(lo_ids)
        ).distinct().all()
        
        # organize quiz IDs by LO
        lo_quiz_map = {}
        all_quiz_ids = set()
        
        for rel in quiz_relationships:
            lo_id = str(rel.learning_outcomes_id)
            quiz_id = str(rel.quiz_id)
            
            if lo_id not in lo_quiz_map:
                lo_quiz_map[lo_id] = []
            
            lo_quiz_map[lo_id].append(quiz_id)
            all_quiz_ids.add(quiz_id)
        
        # get all attempts data in one query (only if there are quizzes)
        attempts_data = {}
        if all_quiz_ids:
            attempts = self.db.query(
                AttemptQuiz.quiz_id,
                AttemptQuiz.user_id,
                AttemptQuiz.percent
            ).filter(
                AttemptQuiz.quiz_id.in_(list(all_quiz_ids)),  # convert set to list
                AttemptQuiz.user_id.in_(student_ids),
                AttemptQuiz.state == "CALIFICADO"
            ).all()
            
            # organize attempts by quiz_id for faster lookup
            for attempt in attempts:
                quiz_id = str(attempt.quiz_id)
                if quiz_id not in attempts_data:
                    attempts_data[quiz_id] = []
                attempts_data[quiz_id].append({
                    'user_id': str(attempt.user_id),
                    'percent': float(attempt.percent)
                })
        
        # process results
        results = []
        
        for lo in learning_outcomes:
            lo_id = str(lo.id)
            quiz_ids = lo_quiz_map.get(lo_id, [])
            
            if not quiz_ids:
                results.append({
                    "learning_outcome_id": lo_id,
                    "learning_outcome_code": lo.code,
                    "learning_outcome_description": lo.description,
                    "related_quizzes_count": 0,
                    "avg_score_across_quizzes": 0.0,
                    "students_above_70_percent": 0,
                    "students_below_70_percent": 0 if student_id else len(student_ids),
                    "topic": None
                })
                continue
            
            # calculate metrics from cached attempts data
            all_percents = []
            students_with_attempts = set()
            
            for qid in quiz_ids:
                if qid in attempts_data:
                    for attempt in attempts_data[qid]:
                        all_percents.append(attempt['percent'])
                        students_with_attempts.add(attempt['user_id'])
            
            avg_score = sum(all_percents) / len(all_percents) if all_percents else 0.0
            
            # calculate student performance
            student_avgs = {}
            for qid in quiz_ids:
                if qid in attempts_data:
                    for attempt in attempts_data[qid]:
                        uid = attempt['user_id']
                        if uid not in student_avgs:
                            student_avgs[uid] = []
                        student_avgs[uid].append(attempt['percent'])
            
            # average per student across quizzes
            above_70 = 0
            below_70 = 0
            
            for uid in student_ids:
                if uid in student_avgs:
                    student_avg = sum(student_avgs[uid]) / len(student_avgs[uid])
                    if student_avg >= 70:
                        above_70 += 1
                    else:
                        below_70 += 1
                else:
                    below_70 += 1  # students without attempts count as below 70%
            
            results.append({
                "learning_outcome_id": lo_id,
                "learning_outcome_code": lo.code,
                "learning_outcome_description": lo.description,
                "related_quizzes_count": len(quiz_ids),
                "avg_score_across_quizzes": round(avg_score, 2),
                "students_above_70_percent": above_70,
                "students_below_70_percent": below_70,
                "topic": None
            })
        
        return results

    def get_error_analysis(self, course_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Análisis de preguntas con mayor % de error"""
        
        # OPTIMIZATION: single optimized query with calculated error_rate
        error_stats = self.db.query(
            Question.id.label('question_id'),
            Question.text.label('question_text'),
            Quiz.title.label('quiz_title'),
            Topic.title.label('topic_name'),
            TopicObjective.code.label('lo_code'),
            TopicObjective.description.label('lo_description'),
            func.count(QuestionResponse.id).label('total_responses'),
            func.sum(case(
                (QuestionResponse.is_correct == False, 1),
                else_=0
            )).label('incorrect_count')
        ).join(
            Quiz, Question.quiz_id == Quiz.id
        ).join(
            Topic, Quiz.topic_id == Topic.id
        ).join(
            Module, Topic.module_id == Module.id
        ).outerjoin(
            TopicObjective, Question.topic_objective_id == TopicObjective.id
        ).join(
            QuestionResponse, Question.id == QuestionResponse.question_id
        ).join(
            AttemptQuiz, QuestionResponse.attempt_quiz_id == AttemptQuiz.id
        ).filter(
            Module.course_id == course_id,
            Quiz.is_active == True,
            AttemptQuiz.state == "CALIFICADO",
            # filter students in same query
            AttemptQuiz.user_id.in_(
                self.db.query(CourseUserRole.user_id)
                .filter(
                    CourseUserRole.course_id == course_id,
                    CourseUserRole.role_id == 1
                )
            )
        ).group_by(
            Question.id,
            Question.text,
            Quiz.title,
            Topic.title,
            TopicObjective.code,
            TopicObjective.description
        ).having(
            func.count(QuestionResponse.id) > 0
        ).all()
        
        # calculate error_rate in Python instead of SQL
        results = []
        for stat in error_stats:
            if stat.total_responses == 0:
                continue
            
            error_rate = (stat.incorrect_count / stat.total_responses * 100)
            question_preview = stat.question_text[:100] + "..." if len(stat.question_text) > 100 else stat.question_text
            
            results.append({
                "question_id": str(stat.question_id),
                "question_text": question_preview,
                "full_question_text": stat.question_text,
                "error_rate": round(error_rate, 2),
                "learning_objective_code": stat.lo_code or "Sin objetivo",
                "learning_objective_description": stat.lo_description or "Sin descripción",
                "quiz_title": stat.quiz_title,
                "topic_name": stat.topic_name
            })
        
        # sort by error_rate descending and limit
        results.sort(key=lambda x: x['error_rate'], reverse=True)
        return results[:limit]