# app/routers/mis_endpoints.py
from fastapi import APIRouter, Depends
from app.deps import get_current_user

router = APIRouter(prefix="/mis-endpoints", tags=["mis_endpoints"])

@router.get("/protegido")
async def endpoint_protegido(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "Este endpoint está protegido",
        "user": current_user
    }