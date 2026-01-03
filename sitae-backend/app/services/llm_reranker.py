# app/services/llm_reranker.py
import os, json, logging
from dataclasses import dataclass
from typing import Dict, Any, List
from app.core.config import settings

if not settings.OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY no está definido. Revisa tu .env")

logger = logging.getLogger(__name__)

# LLM opcional
try:
    from openai import OpenAI
    _HAS_OPENAI = True
except Exception:
    _HAS_OPENAI = False

@dataclass
class StudentProfileDTO:
    estilo_aprendizaje: str | None
    tiempo_sesion_min: int | None
    idioma_preferido: str | None
    dificultad_objetivo: str | None
    preferencias_tipo: Dict[str, float] | None  # p.ej. {"Video":1.2,"Lectura":1.0,"Ejercicio":1.3,"Interactivo":1.4}

def _base_heuristic_score(res: Dict[str, Any], prof: StudentProfileDTO) -> float:
    score = 1.0
    if res.get("obligatorio"):
        score *= 1.2
    if prof.tiempo_sesion_min and res.get("duracion_min"):
        score *= 1.15 if res["duracion_min"] <= prof.tiempo_sesion_min else 0.9
    if prof.preferencias_tipo and res.get("tipo") in prof.preferencias_tipo:
        score *= float(prof.preferencias_tipo[res["tipo"]])
    if prof.dificultad_objetivo and res.get("dificultad"):
        score *= 1.1 if res["dificultad"] == prof.dificultad_objetivo else 0.95
    return score

def _fallback_rerank(candidates: List[Dict[str, Any]], profile: StudentProfileDTO, topk: int) -> List[Dict[str, Any]]:
    scored = []
    for r in candidates:
        s = _base_heuristic_score(r, profile)
        scored.append({**r, "score": round(float(s), 4), "motivo": "Ordenado por heurística (duración/tipo/obligatorio)."})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:topk]

def rerank_with_llm(
    ot_codigo: str,
    profile: StudentProfileDTO,
    candidates: List[Dict[str, Any]],
    topk: int = 3,
    model: str = "gpt-4o-mini",
    temperature: float = 0.2,
    use_llm: bool = True,
) -> List[Dict[str, Any]]:
    if not candidates:
        return []
    if not use_llm or not _HAS_OPENAI:
        return _fallback_rerank(candidates, profile, topk)

    api_key = settings.OPENAI_API_KEY
    if not api_key:
        logger.warning("OPENAI_API_KEY no configurado. Usando heurística.")
        return _fallback_rerank(candidates, profile, topk)

    # Prompt pidiendo JSON estricto
    system_msg = (
        "Eres un recomendador educativo. Reordena recursos para estudiar, "
        "considerando el perfil del estudiante y las restricciones de tiempo. "
        "Responde SOLO JSON con {'items':[{'id':..., 'score':0..1, 'reason':'...'}]}."
    )

    user_payload = {
        "learning_objective_code": ot_codigo,
        "student_profile": {
            "style": profile.estilo_aprendizaje,
            "time_per_session_min": profile.tiempo_sesion_min,
            "preferred_language": profile.idioma_preferido,
            "target_difficulty": profile.dificultad_objetivo,
            "type_preferences": profile.preferencias_tipo,
        },
        "candidates": [
            {
                "id": c["id"],
                "title": c["titulo"],
                "type": c["tipo"],
                "url": c["url"],
                "duration_min": c.get("duracion_min"),
                "required": c.get("obligatorio", False),
                "difficulty": c.get("dificultad"),
            } for c in candidates
        ],
        "max_items": topk,
        "criteria": [
            "Favorecer 'required' si el rendimiento fue bajo",
            "Preferir duration_min <= time_per_session_min (si existe)",
            "Aplicar type_preferences como multiplicador suave",
            "Mantenerse en el mismo objetivo de tema (ya filtrado)",
            "Razones breves (<=160 chars)"
        ]
    }

    try:
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
            ],
            seed=42,
        )
        raw = completion.choices[0].message.content
        data = json.loads(raw)
        by_id = {x["id"]: x for x in data.get("items", []) if x.get("id")}
        merged: List[Dict[str, Any]] = []
        for r in candidates:
            if r["id"] in by_id:
                it = by_id[r["id"]]
                merged.append({**r, "score": float(it.get("score", 0.5)), "motivo": it.get("reason", "")})
        # Si devolvió menos, completa con heurística
        if len(merged) < topk:
            missing = [r for r in candidates if r["id"] not in by_id]
            merged.extend(_fallback_rerank(missing, profile, topk - len(merged)))
        merged.sort(key=lambda x: (x.get("score") or 0.0), reverse=True)
        return merged[:topk]
    except Exception as e:
        logger.exception("LLM ranking error: %s", e)
        return _fallback_rerank(candidates, profile, topk)
