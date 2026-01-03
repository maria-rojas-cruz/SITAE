# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definido. Revisa tu .env")

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=3,              # reduced: fewer connections per worker
    max_overflow=5,           # reduced: total max 8 per worker
    pool_timeout=10,          # reduced: fail faster if pool exhausted
    pool_recycle=300,         # reduced: recycle every 5 minutes instead of 30
    pool_pre_ping=True,       # keep this: validates connection health
    echo_pool=False,          # set to True temporarily to debug pool usage
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()