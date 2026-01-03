from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.seed import seed_python_course

router = APIRouter()

@router.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    now = db.execute(text("SELECT now()")).scalar()
    return {"status": "ok", "db_time": str(now)}

@router.post("/seed-python")
def seed_python():
    return seed_python_course()