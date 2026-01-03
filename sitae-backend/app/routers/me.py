from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from ..deps import get_current_user_id
from .services.courses_repostory import get_me, list_teacher_courses, list_student_courses

router = APIRouter(prefix="/api", tags=["me"])

@router.get("/me")
def me(session: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return get_me(session, user_id["id"])

@router.get("/me/courses")
def my_courses(as_role: str = "all", session: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    as_role = as_role.lower()
    if as_role == "teacher": return list_teacher_courses(session, user_id["id"])
    if as_role == "student": return list_student_courses(session, user_id["id"])
    return {
        "teacher": list_teacher_courses(session, user_id["id"]),
        "student": list_student_courses(session, user_id["id"]),
    }

@router.get("/me/dashboard-target")
def dashboard_target(
    session: Session = Depends(get_db), 
    user_id: str = Depends(get_current_user_id)
):
    if list_teacher_courses(session, user_id["id"]): return {"target": "teacher"}
    if list_student_courses(session, user_id["id"]): return {"target": "student"}
    return {"target": "none"}