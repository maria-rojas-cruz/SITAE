# app/services/statistics_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.statistics_repository import StatisticsRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.quiz_repository import QuizRepository
from app.schemas.statistics import (
    CourseStatistics,
    StudentPerformanceList,
    StudentPerformance,
    QuizResultsReport,
    LearningOutcomePerformance,
    LearningOutcomePerformanceList,
    ErrorAnalysisList,
    ErrorAnalysisItem
)
from typing import List

class StatisticsService:
    def __init__(self, db: Session):
        self.db = db
        self.stats_repo = StatisticsRepository(db)
        self.course_repo = CourseRepository(db)
        self.quiz_repo = QuizRepository(db)

    def _verify_teacher_access(self, course_id: str, user_id: str):
        """Verificar que el usuario es docente del curso"""
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if role_id != 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los docentes pueden ver estadísticas"
            )

    def get_course_statistics(
        self, 
        course_id: str, 
        user_id: str
    ) -> CourseStatistics:
        """Estadísticas generales del curso"""
        self._verify_teacher_access(course_id, user_id)
        
        stats_data = self.stats_repo.get_course_statistics(course_id)
        return CourseStatistics(**stats_data)

    def get_students_performance(
        self, 
        course_id: str, 
        user_id: str
    ) -> StudentPerformanceList:
        """Desempeño de estudiantes"""
        self._verify_teacher_access(course_id, user_id)
        
        students_data = self.stats_repo.get_students_performance(course_id)
        
        return StudentPerformanceList(
            students=[StudentPerformance(**s) for s in students_data],
            total=len(students_data)
        )

    def get_quiz_results(
        self, 
        quiz_id: str, 
        user_id: str
    ) -> QuizResultsReport:
        """Resultados detallados de un quiz"""
        # Verificar que el quiz existe
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        # Obtener course_id del quiz (navegar jerarquía)
        from app.repositories.topic_repository import TopicRepository
        from app.repositories.module_repository import ModuleRepository
        
        topic_repo = TopicRepository(self.db)
        module_repo = ModuleRepository(self.db)
        
        topic = topic_repo.get_by_id(quiz.topic_id)
        module = module_repo.get_by_id(topic.module_id)
        course_id = module.course_id
        
        self._verify_teacher_access(course_id, user_id)
        
        results_data = self.stats_repo.get_quiz_results(quiz_id)
        if not results_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontraron resultados"
            )
        
        return QuizResultsReport(**results_data)

    def get_learning_outcome_performance(
        self, 
        course_id: str, 
        learning_outcome_id: str,
        user_id: str
    ) -> LearningOutcomePerformance:
        """Análisis por Learning Outcome específico"""
        self._verify_teacher_access(course_id, user_id)
        
        lo_data = self.stats_repo.get_learning_outcome_performance(
            course_id, 
            learning_outcome_id
        )
        
        if not lo_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning Outcome no encontrado"
            )
        
        return LearningOutcomePerformance(**lo_data)

    def get_all_learning_outcomes_performance(
        self,
        course_id: str,
        user_id: str,
        student_id: str | None = None
    ) -> LearningOutcomePerformanceList:
        """NUEVO: Análisis de todos los Learning Outcomes del curso"""
        self._verify_teacher_access(course_id, user_id)
        
        los_data = self.stats_repo.get_all_learning_outcomes_performance(course_id, student_id)
        
        return LearningOutcomePerformanceList(
            learning_outcomes=[LearningOutcomePerformance(**lo) for lo in los_data],
            total=len(los_data)
        )

    def get_error_analysis(
        self,
        course_id: str,
        user_id: str,
        limit: int = 20
    ) -> ErrorAnalysisList:
        """NUEVO: Análisis de preguntas con mayor % de error"""
        self._verify_teacher_access(course_id, user_id)
        
        errors_data = self.stats_repo.get_error_analysis(course_id, limit)
        
        return ErrorAnalysisList(
            errors=[ErrorAnalysisItem(**error) for error in errors_data],
            total=len(errors_data)
        )