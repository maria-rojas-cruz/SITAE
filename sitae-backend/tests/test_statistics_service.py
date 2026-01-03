import types
import pytest
from datetime import datetime

# ==== Fakes & helpers =========================================================

class Row(types.SimpleNamespace):
    """Permite r.campo dot-access como en SQLAlchemy Row."""
    pass


class FakeCourseRepo:
    """
    Simula CourseRepository
    - user_roles: dict[(user_id, course_id)] -> role_id
    - quiz_to_course: dict[quiz_id] -> course_id
    """
    def __init__(self, user_roles, quiz_to_course=None):
        self.user_roles = user_roles
        self.quiz_to_course = quiz_to_course or {}

    def get_user_role_in_course(self, user_id, course_id):
        """Retorna role_id: 1=estudiante, 2=docente, None=sin acceso"""
        return self.user_roles.get((user_id, course_id))

    def get_course_id_by_quiz_id(self, quiz_id: str):
        return self.quiz_to_course.get(quiz_id)


class FakeQuizRepo:
    """Simula QuizRepository"""
    def __init__(self, quizzes):
        # quizzes: dict quiz_id -> dict(id, title, topic_id, [course_id opcional])
        self.quizzes = quizzes

    def get_by_id(self, quiz_id):
        quiz = self.quizzes.get(quiz_id)
        if not quiz:
            return None
        return types.SimpleNamespace(**quiz)


class FakeStatsRepo:
    """
    Simula StatisticsRepository con datos controlados + NORMALIZACIÓN a schemas
    (sin tocar el servicio real).
    """
    def __init__(self):
        self.course_stats = {}                 # course_id -> dict stats (parcial)
        self.students_performance = {}         # course_id -> list[dict] (parcial)
        # Guarda el bruto que tú pones en el test:
        self.quiz_results_raw = {}             # quiz_id -> dict (tu estructura sencilla)
        self.all_lo_performance_raw = {}       # course_id -> list[dict] (parcial, sin ordenar)
        self.error_analysis_raw = {}           # course_id -> list[dict] (parcial, sin limitar)

        # Alias para que tus tests sigan usando los mismos nombres:
        self.all_lo_performance = self.all_lo_performance_raw
        self.error_analysis = self.error_analysis_raw
        self.quiz_results = self.quiz_results_raw

    # ---------------- Normalizadores que el repo aplicará ---------------------

    def _norm_course_stats(self, d):
        total_students = int(d.get("total_students", 0))
        active_students = int(d.get("active_students", 0))
        total_quizzes = int(d.get("total_quizzes", 0))
        avg_score = float(d.get("avg_score", d.get("avg_quiz_score", 0.0)))
        completion_rate = float(d.get("completion_rate", 0.0))
        # Campos que exige CourseStatistics:
        return {
            "total_students": total_students,
            "total_quizzes": total_quizzes,
            "avg_quiz_score": avg_score,
            "completion_rate": completion_rate,
            # Nota: el schema NO expone active_students, sino:
            "active_students_last_week": int(d.get("active_students_last_week", active_students)),
            "quizzes_completed_count": int(d.get("quizzes_completed_count", 0)),
            "quizzes_pending_count": int(d.get("quizzes_pending_count", 0)),
            "quiz_participation_rate": float(d.get(
                "quiz_participation_rate",
                (active_students / total_students * 100.0) if total_students else 0.0
            )),
            "average_objectives_achievement": float(d.get("average_objectives_achievement", avg_score)),
        }

    def _norm_student_perf(self, d):
        quizzes_completed = int(d.get("quizzes_completed", d.get("quizzes_total", 0)))
        return {
            "user_id": d.get("user_id") or d.get("student_id") or "",
            "student_id": d.get("student_id") or d.get("user_id") or "",  # para tus asserts
            "full_name": d.get("full_name") or d.get("student_name") or "",
            "email": d.get("email") or "",
            "attempts_count": int(d.get("attempts_count", 0)),
            "quizzes_completed": quizzes_completed,
            "quizzes_total": int(d.get("quizzes_total", quizzes_completed)),  # el schema lo pide
            "avg_score": float(d.get("avg_score", 0.0)),
            "last_activity": d.get("last_activity") or datetime.utcnow(),
        }


    def _norm_lo_perf(self, d):
        # Campos requeridos por LearningOutcomePerformance
        return {
            "learning_outcome_id": d.get("learning_outcome_id", ""),
            "learning_outcome_code": d.get("learning_outcome_code", d.get("code", "")),
            "learning_outcome_description": d.get("learning_outcome_description", d.get("description", "")),
            "bloom_level": d.get("bloom_level", None),
            "total_questions": int(d.get("total_questions", 0)),
            "correct_answers": int(d.get("correct_answers", 0)),
            "performance_percentage": float(d.get("performance_percentage", 0.0)),
            # Defaults para campos extra del schema
            "related_quizzes_count": int(d.get("related_quizzes_count", 0)),
            "avg_score_across_quizzes": float(d.get("avg_score_across_quizzes", d.get("performance_percentage", 0.0))),
            "students_above_70_percent": int(d.get("students_above_70_percent", 0)),
            "students_below_70_percent": int(d.get("students_below_70_percent", d.get("students_struggling", 0))),
        }

    def _norm_error_item(self, d):
        return {
            "question_id": d.get("question_id", ""),
            "question_text": d.get("question_text", ""),  # <-- requerido por tu schema
            "full_question_text": d.get("full_question_text", d.get("question_text", "")),
            "quiz_title": d.get("quiz_title", ""),
            "topic_name": d.get("topic_name", d.get("topic_objective", "")),
            "total_attempts": int(d.get("total_attempts", 0)),
            "incorrect_count": int(d.get("incorrect_count", 0)),
            "error_rate": float(d.get("error_rate", 0.0)),
            "learning_objective_code": d.get("learning_objective_code", ""),
            "learning_objective_description": d.get("learning_objective_description", d.get("topic_objective", "")),
        }


    # ---------------- Implementaciones de la "API" del repo -------------------

    def get_course_statistics(self, course_id):
        raw = self.course_stats.get(course_id, {
            "total_students": 0,
            "active_students": 0,
            "total_quizzes": 0,
            "avg_score": 0.0,
            "completion_rate": 0.0
        })
        return self._norm_course_stats(raw)

    def get_students_performance(self, course_id):
        raw_list = self.students_performance.get(course_id, [])
        return [self._norm_student_perf(d) for d in raw_list]

    def get_quiz_results(self, quiz_id):
        src = self.quiz_results_raw.get(quiz_id)
        if not src:
            return None

        most_failed = src.get("most_failed_questions", [])
        question_analysis = []
        for q in most_failed:
            total = int(q.get("total_attempts", 0))
            correct = int(q.get("correct_count", 0))
            question_analysis.append({
                "question_id": q.get("question_id", ""),
                "question_text": q.get("question_text", ""),
                "topic_objective": q.get("topic_objective", ""),
                "total_attempts": total,
                "correct_count": correct,
                "incorrect_count": int(q.get("incorrect_count", 0)),
                "error_rate": float(q.get("error_rate", 0.0)),
                # campos requeridos por tu schema:
                "total_responses": total,
                "correct_rate": (correct / total * 100.0) if total else 0.0,
            })

        return {
            "quiz_id": src.get("quiz_id"),
            "quiz_title": src.get("quiz_title", ""),
            "topic_name": src.get("topic_name", "Tema del Quiz"),
            "completed_attempts": int(src.get("total_attempts", 0)),
            "avg_percent": float(src.get("avg_score", 0.0)),
            "max_score": float(src.get("max_score", 0.0)),
            "min_score": float(src.get("min_score", 0.0)),
            "question_analysis": question_analysis,
            "student_results": src.get("student_results", []),
            # conservar campos originales que tus asserts usan:
            "total_attempts": int(src.get("total_attempts", 0)),
            "avg_score": float(src.get("avg_score", 0.0)),
            "most_failed_questions": most_failed,
        }


    def get_learning_outcome_performance(self, course_id, lo_id):
        # (no lo usas en tus tests actuales)
        return None

    def get_all_learning_outcomes_performance(self, course_id, student_id=None):
        raw = self.all_lo_performance_raw.get(course_id, [])
        # Orden: peor performance primero
        sorted_raw = sorted(raw, key=lambda x: float(x.get("performance_percentage", 0.0)))
        return [self._norm_lo_perf(d) for d in sorted_raw]

    def get_error_analysis(self, course_id, limit):
        raw = self.error_analysis_raw.get(course_id, [])
        limited = raw[:limit]
        return [self._norm_error_item(d) for d in limited]


class FakeDB:
    """DB fake mínima: no se usa por los repos fakes."""
    def commit(self): pass
    def rollback(self): pass


# ==== Monkeypatch Repos que el servicio importa internamente ==================

class FakeTopicRepo:
    def __init__(self, db): pass
    def get_by_id(self, topic_id: str):
        # Devuelve un objeto con module_id esperado
        return types.SimpleNamespace(id=topic_id, module_id=f"module_for_{topic_id}")

class FakeModuleRepo:
    def __init__(self, db): pass
    def get_by_id(self, module_id: str):
        # Devuelve un objeto con course_id esperado; no lo usaremos porque el servicio
        # finalmente toma el course_id desde CourseRepository.get_course_id_by_quiz_id,
        # pero igual evitamos .query real.
        return types.SimpleNamespace(id=module_id, course_id="course1")


# ==== Fixtures ===============================================================

@pytest.fixture
def fake_stats_env(monkeypatch):
    """
    Prepara StatisticsService con repos falsos y monkeypatch de repos reales
    (TopicRepository/ModuleRepository) para que no llamen a db.query.
    """
    from app.services.statistics_service import StatisticsService

    db = FakeDB()

    # Roles de prueba
    user_roles = {
        ("teacher1", "course1"): 2,  # docente
        ("student1", "course1"): 1,  # estudiante
        ("teacher2", "course2"): 2,  # docente de otro curso
    }

    # Monkeypatch repos usados dentro de get_quiz_results
    import app.repositories.topic_repository as topic_repo_mod
    import app.repositories.module_repository as module_repo_mod
    monkeypatch.setattr(topic_repo_mod, "TopicRepository", FakeTopicRepo)
    monkeypatch.setattr(module_repo_mod, "ModuleRepository", FakeModuleRepo)

    fake_course_repo = FakeCourseRepo(
        user_roles,
        quiz_to_course={"quiz1": "course1"}  # mapeo usado por get_quiz_results
    )
    fake_quiz_repo = FakeQuizRepo({
        "quiz1": {"id": "quiz1", "title": "Quiz Python", "topic_id": "topic1"}
    })
    fake_stats_repo = FakeStatsRepo()

    svc = StatisticsService(db)
    # Parcheamos las instancias del servicio (válido en tests)
    svc.course_repo = fake_course_repo
    svc.quiz_repo = fake_quiz_repo
    svc.stats_repo = fake_stats_repo

    return types.SimpleNamespace(
        svc=svc,
        db=db,
        stats_repo=fake_stats_repo,
        ids=types.SimpleNamespace(
            course1="course1",
            course2="course2",
            teacher1="teacher1",
            teacher2="teacher2",
            student1="student1",
            quiz1="quiz1"
        )
    )



# ==== TESTS ====

def test_1_solo_docente_puede_ver_estadisticas(fake_stats_env):
    """
    Un estudiante intenta ver estadísticas del curso → 403 Forbidden
    """
    e = fake_stats_env
    
    # Configurar datos de estadísticas
    e.stats_repo.course_stats[e.ids.course1] = {
        "total_students": 5,
        "active_students": 3,
        "total_quizzes": 2,
        "avg_score": 75.5,
        "completion_rate": 60.0
    }
    
    # Estudiante intenta acceder
    with pytest.raises(Exception) as ex:
        e.svc.get_course_statistics(e.ids.course1, e.ids.student1)
    
    # Verificar error 403
    assert "403" in str(ex.value) or "solo los docentes" in str(ex.value).lower()


def test_2_docente_otro_curso_no_puede_ver(fake_stats_env):
    """
    Docente del curso B intenta ver stats del curso A → 403
    """
    e = fake_stats_env
    
    # Configurar datos
    e.stats_repo.course_stats[e.ids.course1] = {
        "total_students": 5,
        "active_students": 3,
        "total_quizzes": 2,
        "avg_score": 75.5,
        "completion_rate": 60.0
    }
    
    # teacher2 (docente de course2) intenta ver course1
    with pytest.raises(Exception) as ex:
        e.svc.get_course_statistics(e.ids.course1, e.ids.teacher2)
    
    assert "403" in str(ex.value) or "solo los docentes" in str(ex.value).lower()


def test_3_estadisticas_con_actividad_parcial(fake_stats_env):
    """
    5 estudiantes inscritos, 2 completaron quiz
    completion_rate=40%, avg_score calculado correctamente
    """
    e = fake_stats_env
    
    # Configurar estadísticas del curso
    e.stats_repo.course_stats[e.ids.course1] = {
        "total_students": 5,
        "active_students": 2,  # solo 2 completaron algo
        "total_quizzes": 3,
        "avg_score": 68.5,  # promedio de los que completaron
        "completion_rate": 40.0  # 2/5 = 40%
    }
    
    # Docente consulta
    result = e.svc.get_course_statistics(e.ids.course1, e.ids.teacher1)
    
    assert result.total_students == 5
    assert result.active_students_last_week == 2
    assert result.total_quizzes == 3
    assert result.avg_quiz_score == 68.5
    assert result.quiz_participation_rate == 40.0



def test_4_estudiante_multiples_intentos_promedio_correcto(fake_stats_env):
    """
    Estudiante con 3 intentos (50%, 75%, 90%)
    avg_score debe ser 71.67 (promedio de los 3)
    """
    e = fake_stats_env
    
    # Configurar desempeño de estudiantes
    e.stats_repo.students_performance[e.ids.course1] = [
        {
            "student_id": "student1",
            "student_name": "Juan Pérez",
            "email": "juan@test.com",
            "attempts_count": 3,
            "quizzes_completed": 1,  # 1 quiz, 3 intentos
            "avg_score": 71.67,  # (50 + 75 + 90) / 3
            "last_activity": datetime(2025, 1, 15)
        },
        {
            "student_id": "student2",
            "student_name": "María López",
            "email": "maria@test.com",
            "attempts_count": 1,
            "quizzes_completed": 1,
            "avg_score": 85.0,
            "last_activity": datetime(2025, 1, 16)
        }
    ]
    
    # Docente consulta
    result = e.svc.get_students_performance(e.ids.course1, e.ids.teacher1)
    
    assert result.total == 2
    
    # Verificar estudiante con múltiples intentos
    student1 = next(s for s in result.students if s.user_id == "student1")
    # El schema no expone attempts_count; validamos los campos reales:
    assert pytest.approx(student1.avg_score, rel=1e-3) == 71.67
    assert student1.quizzes_completed == 1
    assert student1.quizzes_total == 1


def test_5_quiz_preguntas_mas_falladas(fake_stats_env):
    """
    Quiz con 3 preguntas, identificar cuál tiene más errores.
    Ordenar por error_rate DESC
    """
    e = fake_stats_env
    
    # Configurar resultados del quiz con preguntas más falladas
    e.stats_repo.quiz_results[e.ids.quiz1] = {
        "quiz_id": e.ids.quiz1,
        "quiz_title": "Quiz Python Básico",
        "total_attempts": 10,
        "avg_score": 65.0,
        "max_score": 95.0,
        "min_score": 30.0,
        "most_failed_questions": [
            {
                "question_id": "q1",
                "question_text": "¿Qué es una lista en Python?",
                "topic_objective": "Estructuras de datos",
                "total_attempts": 10,
                "correct_count": 3,
                "incorrect_count": 7,
                "error_rate": 70.0  # 7/10 = 70%
            },
            {
                "question_id": "q2",
                "question_text": "¿Cómo se define una función?",
                "topic_objective": "Funciones",
                "total_attempts": 10,
                "correct_count": 5,
                "incorrect_count": 5,
                "error_rate": 50.0
            },
            {
                "question_id": "q3",
                "question_text": "¿Qué es un bucle for?",
                "topic_objective": "Estructuras de control",
                "total_attempts": 10,
                "correct_count": 8,
                "incorrect_count": 2,
                "error_rate": 20.0
            }
        ]
    }
    
    # Docente consulta resultados
    result = e.svc.get_quiz_results(e.ids.quiz1, e.ids.teacher1)
    
    assert result.quiz_id == e.ids.quiz1
    assert result.total_attempts == 10
    assert result.avg_score == 65.0
    
     # Verificar preguntas usando el schema real: question_analysis
    items = result.question_analysis
    assert len(items) == 3

    # Orden por error_rate DESC == correct_rate ASC
    ordered = sorted(items, key=lambda x: x.correct_rate)

    # q1: correct_rate=30.0 (error 70%), q2: 50.0 (error 50%), q3: 80.0 (error 20%)
    assert ordered[0].question_id == "q1"
    assert pytest.approx(ordered[0].correct_rate, rel=1e-3) == 30.0
    assert ordered[1].question_id == "q2"
    assert pytest.approx(ordered[1].correct_rate, rel=1e-3) == 50.0
    assert ordered[2].question_id == "q3"
    assert pytest.approx(ordered[2].correct_rate, rel=1e-3) == 80.0


def test_6_todos_learning_outcomes_ordenados(fake_stats_env):
    """
    Curso con 3 Learning Outcomes.
    Retornar lista ordenada por performance ASC (peores primero).
    """
    e = fake_stats_env
    
    # Configurar performance de todos los LOs
    e.stats_repo.all_lo_performance[e.ids.course1] = [
        {
            "learning_outcome_id": "lo1",
            "code": "LO1",
            "description": "Aplicar estructuras de control",
            "bloom_level": "apply",
            "total_questions": 20,
            "correct_answers": 10,
            "performance_percentage": 50.0,  # Peor performance
            "students_struggling": 8
        },
        {
            "learning_outcome_id": "lo2",
            "code": "LO2",
            "description": "Comprender tipos de datos",
            "bloom_level": "understand",
            "total_questions": 15,
            "correct_answers": 12,
            "performance_percentage": 80.0,
            "students_struggling": 2
        },
        {
            "learning_outcome_id": "lo3",
            "code": "LO3",
            "description": "Crear funciones complejas",
            "bloom_level": "create",
            "total_questions": 10,
            "correct_answers": 7,
            "performance_percentage": 70.0,
            "students_struggling": 4
        }
    ]
    
    # Docente consulta todos los LOs
    result = e.svc.get_all_learning_outcomes_performance(e.ids.course1, e.ids.teacher1)
    
    assert result.total == 3
    
    # Verificar que están ordenados por performance ASC (peor primero)
    los = result.learning_outcomes
    assert los[0].avg_score_across_quizzes == 50.0
    assert los[1].avg_score_across_quizzes == 70.0
    assert los[2].avg_score_across_quizzes == 80.0

    assert los[0].learning_outcome_id == "lo1"
    assert los[0].learning_outcome_code == "LO1"
    assert los[0].students_below_70_percent == 8
    assert los[0].learning_outcome_description == "Aplicar estructuras de control"



def test_7_error_analysis_top_preguntas(fake_stats_env):
    """
    5 preguntas con diferentes % de error.
    Retornar top 3 más falladas (limit=3).
    """
    e = fake_stats_env
    
    # Configurar análisis de errores con 5 preguntas
    e.stats_repo.error_analysis[e.ids.course1] = [
        {
            "question_id": "q1",
            "question_text": "¿Qué es un diccionario en Python?",
            "quiz_title": "Quiz Estructuras de Datos",
            "topic_objective": "Estructuras de datos complejas",
            "total_attempts": 25,
            "incorrect_count": 20,
            "error_rate": 80.0  # Más fallada
        },
        {
            "question_id": "q2",
            "question_text": "¿Cómo se usa lambda?",
            "quiz_title": "Quiz Funciones Avanzadas",
            "topic_objective": "Funciones lambda",
            "total_attempts": 20,
            "incorrect_count": 15,
            "error_rate": 75.0
        },
        {
            "question_id": "q3",
            "question_text": "¿Qué es list comprehension?",
            "quiz_title": "Quiz Python Avanzado",
            "topic_objective": "Comprensión de listas",
            "total_attempts": 30,
            "incorrect_count": 21,
            "error_rate": 70.0
        },
        {
            "question_id": "q4",
            "question_text": "¿Cómo funciona un decorador?",
            "quiz_title": "Quiz Decoradores",
            "topic_objective": "Decoradores",
            "total_attempts": 15,
            "incorrect_count": 9,
            "error_rate": 60.0
        },
        {
            "question_id": "q5",
            "question_text": "¿Qué son los generadores?",
            "quiz_title": "Quiz Generadores",
            "topic_objective": "Generadores",
            "total_attempts": 18,
            "incorrect_count": 9,
            "error_rate": 50.0  # Menos fallada
        }
    ]
    
    # Docente consulta top 3 errores más comunes
    result = e.svc.get_error_analysis(e.ids.course1, e.ids.teacher1, limit=3)
    
    assert result.total == 3  # Solo top 3
    
    # Verificar que están ordenadas por error_rate DESC
    errors = result.errors
    assert errors[0].error_rate == 80.0  # q1
    assert errors[1].error_rate == 75.0  # q2
    assert errors[2].error_rate == 70.0  # q3
    
    # Verificar que no incluye q4 ni q5
    question_ids = [e.question_id for e in errors]
    assert "q4" not in question_ids
    assert "q5" not in question_ids
    
    # Verificar estructura completa
    assert errors[0].question_id == "q1"
    assert errors[0].question_text == "¿Qué es un diccionario en Python?"
    assert errors[0].quiz_title == "Quiz Estructuras de Datos"
    assert errors[0].topic_name == "Estructuras de datos complejas"


# ==== TEST BONUS: Integridad del schema ====

def test_8_schema_response_completo(fake_stats_env):
    """
    Verificar que todos los schemas tienen los campos requeridos.
    """
    e = fake_stats_env
    
    # Configurar datos mínimos
    e.stats_repo.course_stats[e.ids.course1] = {
        "total_students": 10,
        "active_students": 7,
        "total_quizzes": 5,
        "avg_score": 72.3,
        "completion_rate": 70.0
    }
    
    # Consultar
    result = e.svc.get_course_statistics(e.ids.course1, e.ids.teacher1)
    
    # Verificar que tiene todos los atributos requeridos
    assert hasattr(result, "total_students")
    assert hasattr(result, "active_students_last_week")


    assert hasattr(result, "total_quizzes")
    assert hasattr(result, "avg_quiz_score")
    assert hasattr(result, "quiz_participation_rate")

    
    # Verificar tipos
    assert isinstance(result.active_students_last_week, int)
    #assert isinstance(result.active_students, int)
    assert isinstance(result.total_quizzes, int)
    assert isinstance(result.avg_quiz_score, (int, float))
    assert isinstance(result.quiz_participation_rate, (int, float))