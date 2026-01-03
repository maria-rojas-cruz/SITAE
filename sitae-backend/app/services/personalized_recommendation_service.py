# app/services/personalized_recommendation_service.py

from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.core.config import settings
from typing import List, Dict, Optional
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class PersonalizedRecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.chat_model = settings.CHAT_MODEL
    
    def _get_course_resources(self, topic_objective_id: str) -> list[dict]:
        """
        Devuelve SOLO recursos del curso vinculados al topic_objective_id.
        INCLUYE el campo difficulty para priorización.
        """
        rows = self.db.execute(text("""
            SELECT r.id, r.title, r.type, r.url, r.duration_minutes, r.is_mandatory, r.difficulty
            FROM public.resource r
            WHERE r.topic_objective_id = :ot
            ORDER BY r.is_mandatory DESC, r."order" ASC, r.duration_minutes NULLS LAST
        """), {"ot": topic_objective_id}).fetchall()

        return [
            {
                "id": str(r.id),
                "title": r.title,
                "type": r.type,                     # p.e. 'video', 'lectura', 'pdf', 'interactivo', 'ejercicio'
                "url": r.url or "",
                "duration_min": r.duration_minutes, # puede ser None
                "is_mandatory": bool(r.is_mandatory),
                "difficulty": r.difficulty or "intermedio",  # básico/intermedio/avanzado
                "is_external": False                # SIEMPRE False (solo BD)
            }
            for r in rows
        ]

    def _filter_by_profile(self, resources: list[dict], user_profile: dict, course_profile: dict) -> list[dict]:
        """
        Filtro suave por perfil (no elimina agresivamente; marca flags para scoring).
        """
        if not resources:
            return []

        preferred_modalities = set((user_profile or {}).get("preferred_modalities", []) or [])
        student_level = (course_profile or {}).get("prereq_level", "medio")  # básico/medio/avanzado
        weekly_time = (course_profile or {}).get("weekly_time", "h3_6")

        # Mapeo de nivel del estudiante a dificultad de recurso
        # básico -> busca recursos básicos
        # medio -> busca intermedio
        # avanzado -> busca avanzado
        level_mapping = {
            "básico": "básico",
            "medio": "intermedio",
            "avanzado": "avanzado"
        }
        target_difficulty = level_mapping.get(student_level, "intermedio")

        # Límite sugerido por tiempo disponible (heurístico)
        max_suggested = {
            "h1_3": 20,
            "h3_6": 30,
            "h6_10": 45,
            "h10_plus": 90
        }.get(weekly_time, 30)

        out = []
        for r in resources:
            r = dict(r)
            # Marca flags para el scoring
            r["_difficulty_match"] = (r["difficulty"] == target_difficulty)
            r["_pref_modality_match"] = (r["type"] in preferred_modalities) if preferred_modalities else False
            r["_short_ok"] = (r.get("duration_min") or 0) <= max_suggested
            r["_target_difficulty"] = target_difficulty
            out.append(r)
        return out

    def _calculate_scores(self, resources: list[dict], user_profile: dict, course_profile: dict) -> list[dict]:
        """
        Asigna score para ordenar con PRIORIDADES:
        1. Dificultad del recurso coincide con nivel del estudiante (peso más alto)
        2. Modalidad preferida
        3. Duración alineada
        4. Obligatorio
        5. Tipo práctico
        """
        def score(r: dict) -> float:
            s = 0.0
            
            # PRIORIDAD 1: Dificultad coincide con nivel del estudiante (peso 10)
            if r.get("_difficulty_match"):
                s += 10.0
            
            # PRIORIDAD 2: Modalidad preferida (peso 5)
            if r.get("_pref_modality_match"):
                s += 5.0
            
            # PRIORIDAD 3: Duración alineada (peso 3)
            if r.get("_short_ok"):
                s += 3.0
            
            # PRIORIDAD 4: Recurso obligatorio (peso 2)
            if r.get("is_mandatory"):
                s += 2.0
            
            # PRIORIDAD 5: Tipo práctico (peso 1)
            if r.get("type") in {"ejercicio", "interactivo"}:
                s += 1.0
            
            # Bonus menor si no tiene duración (evita penalizar demasiado)
            if r.get("duration_min") in (None, 0):
                s += 0.3
            
            return s

        out = []
        for r in resources:
            r = dict(r)
            r["score"] = score(r)
            out.append(r)
        
        # Ordenar por score (mayor a menor)
        out.sort(key=lambda x: x["score"], reverse=True)
        return out

    async def generate_error_analysis(
        self,
        question_text: str,
        topic_objective: str,
        selected_option: str,
        correct_option: str,
        user_profile: Dict,
        course_profile: Dict
    ) -> str:
        """
        Genera análisis del error para la pregunta.
        
        Returns:
            str: Texto con análisis completo (qué falló, por qué importa, qué reforzar)
        """
        
        prereq_level = course_profile.get("prereq_level", "medio")
        
        prompt = f"""Genera un análisis breve del error (máximo 80 palabras, 3 frases).

PREGUNTA:
{question_text[:200]}

TEMA:
{topic_objective}

ERROR:
Marcó: {selected_option}
Correcto: {correct_option}

NIVEL: {prereq_level}

ESTRUCTURA (3 frases cortas):
1. Qué concepto/habilidad falló específicamente
2. Por qué es importante ese concepto
3. Qué debe hacer para reforzarlo

TONO: {"Técnico y directo" if prereq_level == "avanzado" else "Claro y educativo"}

Ejemplo (nivel medio):
"Confundiste el orden de evaluación en condicionales anidados. Este concepto es fundamental para escribir lógica compleja en cualquier programa. Practica trazado manual del código paso a paso con diferentes valores de entrada."

Ejemplo (nivel avanzado):
"Error en cortocircuito de operadores lógicos con valores falsy. Crítico para optimización y prevención de errores en producción. Analiza casos edge con and/or y evalúa orden de condiciones."
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un tutor experto que analiza errores de forma pedagógica y concisa."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.6,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generando análisis: {e}")
            return f"Error en el concepto: {topic_objective}. Revisa el material sobre este tema y practica con ejercicios."

    async def get_personalized_recommendations(
        self,
        topic_objective_id: str,
        topic_objective_description: str,
        question_text: str,
        user_profile: Dict,
        course_profile: Dict,
        max_recommendations: int = 3
    ) -> List[Dict]:
        """
        Obtiene recursos personalizados (SOLO de BD, filtrados + ordenados + why_text corto).
        
        PRIORIZACIÓN:
        1. Dificultad del recurso = nivel del estudiante
        2. Modalidad preferida
        3. Duración adecuada
        4. Obligatorio
        5. Tipo práctico
        
        Returns:
            List con: resource_id, title, type, url, duration_min, is_external=False, rank, why_text
        """
        
        # 1. Obtener recursos SOLO de BD (is_external siempre False)
        course_resources = self._get_course_resources(topic_objective_id)
        
        if not course_resources:
            logger.warning(f"No se encontraron recursos para topic_objective_id: {topic_objective_id}")
            return []
        
        logger.info(f"Recursos obtenidos de BD: {len(course_resources)}")
        
        # 2. Filtrar por perfil (marca flags para scoring)
        filtered = self._filter_by_profile(course_resources, user_profile, course_profile)
        
        # 3. Ordenar por score (con nueva priorización)
        scored = self._calculate_scores(filtered, user_profile, course_profile)
        top_resources = scored[:max_recommendations]
        
        logger.info(f"Top {len(top_resources)} recursos después de scoring:")
        for r in top_resources:
            logger.info(f"  - {r['title']} | difficulty: {r['difficulty']} | score: {r['score']:.1f}")
        
        # 4. Generar why_text CORTO para cada recurso
        recommendations = []
        for rank, resource in enumerate(top_resources, start=1):
            why_text = await self._generate_resource_why_text(
                resource=resource,
                topic_description=topic_objective_description,
                user_profile=user_profile,
                course_profile=course_profile
            )

            recommendations.append({
                "resource_id": resource["id"],       # SIEMPRE id de BD
                "title": resource["title"],
                "type": resource["type"],
                "url": resource.get("url", ""),
                "duration_min": resource.get("duration_min"),
                "is_external": False,                # GARANTIZADO: siempre False
                "rank": rank,
                "why_text": why_text
            })

        return recommendations

    async def _generate_resource_why_text(
        self,
        resource: Dict,
        topic_description: str,
        user_profile: Dict,
        course_profile: Dict
    ) -> str:
        """
        SOLO recursos del curso. Máx 40 palabras. Sin emojis.
        Menciona nivel de dificultad si es relevante.
        """
        prereq_level = (course_profile or {}).get("prereq_level", "medio")
        weekly_time = (course_profile or {}).get("weekly_time", "h3_6")
        preferred_modalities = (user_profile or {}).get("preferred_modalities", []) or []

        time_desc = {
            "h1_3": "poco tiempo",
            "h3_6": "tiempo moderado",
            "h6_10": "buen tiempo",
            "h10_plus": "mucho tiempo"
        }.get(weekly_time, "tiempo moderado")

        title = resource.get("title", "")
        rtype = resource.get("type", "")
        dur = resource.get("duration_min")
        dur_txt = f"{dur} min" if dur is not None else "duración variable"
        difficulty = resource.get("difficulty", "intermedio")

        prompt = f"""Escribe una frase (máximo 40 palabras) explicando por qué este recurso del curso ayuda.

Recurso: {title}
Tipo: {rtype}
Duración: {dur_txt}
Dificultad: {difficulty}
Tema: {topic_description}
Nivel estudiante: {prereq_level}
Tiempo disponible: {time_desc}
Prefiere: {", ".join(preferred_modalities) if preferred_modalities else "no especificado"}

Instrucciones: 
- Conecta el recurso con su perfil (nivel, modalidad, tiempo)
- Menciona si el nivel de dificultad es apropiado para el estudiante
- No uses emojis
- Máximo 40 palabras
"""

        try:
            resp = await self.client.chat.completions.create(
                model=self.chat_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=80
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as e:
            logger.error(f"Error generando why_text: {e}", exc_info=True)
            # Fallback sin emojis, menciona dificultad
            if dur is not None and dur <= 25:
                return f"Material {difficulty} y conciso ({dur} min). Se adapta a tu nivel {prereq_level} y tiempo disponible."
            return f"Recurso {difficulty} que refuerza el tema. Diseñado para nivel {prereq_level}."