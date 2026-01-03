# app/routers/dev_llm.py
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from app.services.llm_reranker import rerank_with_llm, StudentProfileDTO

router = APIRouter(prefix="/dev/llm", tags=["dev-llm"])

# ===== Schemas de entrada/salida =====
class ProfileIn(BaseModel):
    estilo_aprendizaje: Optional[str] = Field(None, examples=["visual","auditivo","lectura_escritura","kinestesico"])
    tiempo_sesion_min: Optional[int] = 20
    idioma_preferido: Optional[str] = "es"
    dificultad_objetivo: Optional[str] = Field(None, examples=["principiante","intermedio","avanzado"])
    preferencias_tipo: Optional[Dict[str, float]] = Field(
        default={"Video":1.1, "Lectura":1.0, "Ejercicio":1.2, "Interactivo":1.2}
    )

class CandidateIn(BaseModel):
    id: str
    titulo: str
    tipo: str                # "Video"|"Lectura"|"Ejercicio"|"Interactivo"
    url: str
    duracion_min: Optional[int] = None
    obligatorio: Optional[bool] = False
    dificultad: Optional[str] = None  # si la guardas en recurso

class RerankRequest(BaseModel):
    ot_codigo: str
    profile: ProfileIn
    candidates: List[CandidateIn]

class CandidateOut(CandidateIn):
    score: Optional[float] = None
    motivo: Optional[str] = None

class RerankResponse(BaseModel):
    items: List[CandidateOut]

@router.post("/rerank", response_model=RerankResponse)
def rerank_endpoint(
    body: RerankRequest,
    topk: int = Query(3, ge=1, le=10),
    use_llm: bool = Query(True, description="False = usa heurística local (sin LLM)")
):
    prof = body.profile
    dto = StudentProfileDTO(
        estilo_aprendizaje=prof.estilo_aprendizaje,
        tiempo_sesion_min=prof.tiempo_sesion_min,
        idioma_preferido=prof.idioma_preferido,
        dificultad_objetivo=prof.dificultad_objetivo,
        preferencias_tipo=prof.preferencias_tipo,
    )
    ranked = rerank_with_llm(
        ot_codigo=body.ot_codigo,
        profile=dto,
        candidates=[c.model_dump() for c in body.candidates],
        topk=topk,
        use_llm=use_llm,
    )
    return RerankResponse(items=[CandidateOut(**r) for r in ranked])
