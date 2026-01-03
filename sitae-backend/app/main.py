from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import courses, ping,  dev_llm, auth, profile, users, learning_outcomes
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import modules, module_objectives, topics, topic_objectives, course_overview, resources, course_content, statistics
from app.routers import (
    quizzes,
    questions,
    options,
    attempt_quizzes,
    question_responses,
    attempt_results
)
from app.routers import chat, documents 
import logging
#logging.basicConfig()
#logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa y libera recursos al iniciar/cerrar la app"""
    from app.core.vector_store import get_vector_store
    logger = logging.getLogger(__name__)

    # --- Al iniciar la app ---
    try:
        vector_store = get_vector_store()
        logger.info("✅ ChromaDB inicializado correctamente")
    except Exception as e:
        logger.error(f"❌ Error inicializando ChromaDB: {e}")

    logger.info("🚀 API iniciada")

    # yield marca el punto donde FastAPI empieza a atender requests
    yield

    # --- Al cerrar la app ---
    logger.info("🛑 API finalizada")



app = FastAPI(
    title="Tutor IA API",
    description="API para plataforma educativa",
    version="1.0.0", 
    lifespan=lifespan
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers públicos
app.include_router(ping.router)
app.include_router(auth.router, prefix="/api")

# Routers  (requieren JWT)

app.include_router(dev_llm.router)
app.include_router(users.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(course_overview.router, prefix="/api")
app.include_router(learning_outcomes.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(module_objectives.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(topic_objectives.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(options.router, prefix="/api")
app.include_router(attempt_quizzes.router, prefix="/api")
app.include_router(question_responses.router, prefix="/api")
app.include_router(course_content.router, prefix="/api")
app.include_router(statistics.router, prefix="/api")
app.include_router(attempt_results.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Tutor IA API - Con autenticación JWT"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}