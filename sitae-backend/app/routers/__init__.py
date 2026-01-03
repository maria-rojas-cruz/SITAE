from .auth import router as auth_router
from .users import router as users_router
from .courses import router as courses_router
from .learning_outcomes import router as learning_outcomes_router
from .module_objectives import router as module_objectives_router
from .topics import router as topic_router
from .topic_objectives import router as topic_objectives_router
from .course_overview import router as course_overview_router
from .resources import router as resource_router
from .quizzes import router as quizzes_router
from .questions import router as questions_router
from .options import router as options_router
from .attempt_quizzes import router as attempt_quizzes_router
from .question_responses import router as quiestion_responses_router
from .course_content import router as course_content_router
from .statistics import router as statistics_router
from .profile import router as profile_router
__all__ = [
    "auth_router", 
    "users_router",
    "courses_router",
    "learning_outcomes_router",
    "module_objectives_router",
    "topic_router",
    "topic_objectives_router",
    "course_overview_router",
    "resource_router",
    "quizzes_router",
    "options_router",
    "attempt_quizzes_router",
    "quiestion_responses_router",
    "questions_router",
    "course_content_router",
    "statistics_router"
    "profile_router"
]