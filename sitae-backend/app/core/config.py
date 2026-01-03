from functools import lru_cache
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str
    OPENAI_API_KEY: str | None = None
    EMBEDDING_MODEL: str | None = "text-embedding-3-small"
    CHAT_MODEL: str | None = "gpt-4o-mini"

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 360000

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Environment
    ENVIRONMENT: str = "development"

    # ChromaDB
    CHROMA_PATH: str = str((Path(__file__).resolve().parents[2] / "chroma_data"))
    DOCUMENTS_PATH: str = str((Path(__file__).resolve().parents[2] / "documents_data"))

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()