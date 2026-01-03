from openai import OpenAI
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.models.chat import Conversation
from app.models.user import User
from app.models.course import Course
from app.schemas.chat import ChatMessageResponse, SourceReference
from typing import List, Dict, Optional
import logging
import tiktoken
import asyncio
from app.services.profile_service import ProfileService
from typing import Dict, List
from collections import defaultdict
from sqlalchemy import text


logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_service = EmbeddingService()
        self.chat_model = settings.CHAT_MODEL
        
        # Para contar tokens
        self.encoding = tiktoken.encoding_for_model("gpt-4")
        
    # app/services/chat_service.py

from app.services.profile_service import ProfileService
from sqlalchemy import text

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_service = EmbeddingService()
        self.chat_model = settings.CHAT_MODEL
        self.profile_service = ProfileService(db)
        
        # Para contar tokens
        self.encoding = tiktoken.encoding_for_model("gpt-4")
    
    def _get_student_context(self, user_id: str, course_id: str) -> str:
        """
        Obtiene contexto del estudiante desde su perfil real.
        """
        try:
            # Obtener perfil completo
            profile_data = self.profile_service.get_complete_profile_for_agent(
                user_id, course_id
            )
            
            learning_profile = profile_data.get("learning_profile") or {}
            course_profile = profile_data.get("course_profile") or {}
            
            # Si no hay perfil, retornar contexto mínimo
            if not learning_profile and not course_profile:
                return "Perfil del estudiante: No disponible (aún no ha completado su perfil)."
            
            # Construir contexto textual
            context_parts = ["Perfil del estudiante:"]
            
            # Del perfil de aprendizaje general
            if learning_profile.get("career"):
                context_parts.append(f"- Carrera: {learning_profile['career']}")
            
            if learning_profile.get("job_role"):
                context_parts.append(f"- Ocupación actual: {learning_profile['job_role']}")
            
            if learning_profile.get("preferred_modalities"):
                modalities_map = {
                    "video": "videos",
                    "lectura": "lecturas",
                    "ejercicio": "ejercicios prácticos",
                    "interactivo": "contenido interactivo"
                }
                modalities_text = ", ".join([
                    modalities_map.get(m, m) 
                    for m in learning_profile["preferred_modalities"]
                ])
                context_parts.append(f"- Prefiere aprender con: {modalities_text}")
            
            if learning_profile.get("devices"):
                devices_map = {
                    "laptop_pc": "laptop/PC",
                    "movil": "dispositivo móvil",
                    "tablet": "tablet"
                }
                devices_text = ", ".join([
                    devices_map.get(d, d) 
                    for d in learning_profile["devices"]
                ])
                context_parts.append(f"- Estudia desde: {devices_text}")
            
            # Del perfil del curso
            if course_profile.get("prereq_level"):
                level_map = {
                    "bajo": "principiante/básico",
                    "medio": "intermedio",
                    "avanzado": "avanzado"
                }
                level_text = level_map.get(course_profile["prereq_level"], course_profile["prereq_level"])
                context_parts.append(f"- Nivel en el curso: {level_text}")
            
            if course_profile.get("weekly_time"):
                time_map = {
                    "h1_3": "1-3 horas semanales (tiempo limitado)",
                    "h3_6": "3-6 horas semanales (tiempo moderado)",
                    "h6_10": "6-10 horas semanales (buen tiempo disponible)",
                    "h10_plus": "más de 10 horas semanales (dedicación alta)"
                }
                time_text = time_map.get(course_profile["weekly_time"], course_profile["weekly_time"])
                context_parts.append(f"- Tiempo de dedicación: {time_text}")
            
            if course_profile.get("goals"):
                goals_map = {
                    "aprobar": "aprobar el curso",
                    "mejorar_nota": "mejorar su nota",
                    "dominar": "dominar los conceptos a profundidad",
                    "aplicar_trabajo": "aplicar los conocimientos en su trabajo"
                }
                goals_text = ", ".join([
                    goals_map.get(g, g) 
                    for g in course_profile["goals"]
                ])
                context_parts.append(f"- Objetivos: {goals_text}")
            
            return "\n".join(context_parts)
        
        except Exception as e:
            logger.error(f"Error obteniendo contexto del estudiante: {e}")
            return "Perfil del estudiante: No disponible."
    
    def _get_weak_areas(self, user_id: str, course_id: str) -> str:
        """
        Obtiene áreas débiles del estudiante basado en sus quizzes fallidos.
        Analiza los últimos intentos para identificar objetivos temáticos problemáticos.
        """
        try:
            # Query corregida (quitar DISTINCT o agregar date_start al SELECT)
            rows = self.db.execute(text("""
                WITH recent_attempts AS (
                    -- Últimos 5 intentos del estudiante en este curso
                    SELECT aq.id
                    FROM attempt_quiz aq
                    JOIN quiz q ON q.id = aq.quiz_id
                    JOIN topic t ON t.id = q.topic_id
                    JOIN module m ON m.id = t.module_id
                    WHERE aq.user_id = :user_id
                    AND m.course_id = :course_id
                    AND aq.state = 'CALIFICADO'
                    ORDER BY aq.date_start DESC
                    LIMIT 5
                ),
                failed_questions AS (
                    -- Preguntas falladas en esos intentos
                    SELECT 
                        qr.question_id,
                        q.topic_objective_id
                    FROM question_response qr
                    JOIN question q ON q.id = qr.question_id
                    WHERE qr.attempt_quiz_id IN (SELECT id FROM recent_attempts)
                    AND qr.is_correct = FALSE
                )
                -- Agrupar por objetivo temático y contar fallos
                SELECT 
                    ot.code,
                    ot.description,
                    COUNT(*) as fail_count
                FROM failed_questions fq
                JOIN topic_objective ot ON ot.id = fq.topic_objective_id
                GROUP BY ot.id, ot.code, ot.description
                HAVING COUNT(*) >= 2  -- Al menos 2 fallos en ese objetivo
                ORDER BY fail_count DESC
                LIMIT 5  -- Top 5 áreas débiles
            """), {"user_id": user_id, "course_id": course_id}).fetchall()
            
            if not rows:
                return "Áreas de oportunidad: No se han detectado dificultades recurrentes (aún no ha realizado suficientes quizzes o ha tenido buen desempeño)."
            
            # Construir texto de áreas débiles
            weak_areas_parts = ["Objetivos de aprendizaje donde ha tenido dificultades:"]
            
            for row in rows:
                code = row.code if row.code else ""
                description = row.description
                fail_count = row.fail_count
                
                # Formato: "- [CÓDIGO] Descripción (X fallos)"
                if code:
                    weak_areas_parts.append(
                        f"- [{code}] {description} ({fail_count} {'fallo' if fail_count == 1 else 'fallos'})"
                    )
                else:
                    weak_areas_parts.append(
                        f"- {description} ({fail_count} {'fallo' if fail_count == 1 else 'fallos'})"
                    )
            
            return "\n".join(weak_areas_parts)
        
        except Exception as e:
            logger.error(f"Error obteniendo áreas débiles: {e}")
            # IMPORTANTE: Hacer rollback si hay error en el query
            self.db.rollback()
            return "Áreas de oportunidad: No disponible."

    def _build_system_prompt(
        self, 
        course_name: str,
        student_context: str,
        weak_areas: str,
        relevant_content: List[str]
    ) -> str:
        """Construye el prompt del sistema con todo el contexto"""
        
        content_context = ""
        if relevant_content:
            content_context = "\n\nMaterial de referencia del curso:\n"
            for i, content in enumerate(relevant_content, 1):
                content_context += f"\n[Fuente {i}]\n{content}\n"
        
        return f"""Eres un asistente pedagógico experto para el curso "{course_name}".

    Tu objetivo es ayudar al estudiante a comprender conceptos, resolver dudas y superar sus dificultades académicas.

    {student_context}

    {weak_areas}

    {content_context}

    INSTRUCCIONES IMPORTANTES:
    1. Adapta tus explicaciones al nivel del estudiante (básico/intermedio/avanzado)
    2. Si el estudiante tiene tiempo limitado, sé conciso y directo
    3. Si prefiere ejercicios prácticos, incluye ejemplos de código
    4. Si pregunta sobre un tema donde ha tenido dificultades, presta especial atención y ofrece múltiples ejemplos
    5. Si usas información del material de referencia, indica la fuente (ej: "Según la Fuente 1...")
    6. Si no tienes información suficiente, indícalo claramente
    7. Fomenta el pensamiento crítico con preguntas guía cuando sea apropiado
    8. Mantén un tono amigable y motivador según sus objetivos
    9. Si detectas conceptos erróneos, corrígelos gentilmente

    Recuerda: Tu rol es ser un tutor personalizado que guía el aprendizaje según las necesidades individuales del estudiante."""

        return prompt

    def _get_conversation_history(
        self, 
        user_id: str, 
        course_id: str, 
        limit: int = 5
    ) -> List[Dict[str, str]]:
        """Obtiene historial reciente de conversaciones"""
        conversations = (
            self.db.query(Conversation)
            .filter(
                Conversation.user_id == user_id,
                Conversation.course_id == course_id
            )
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .all()
        )
        
        # Invertir para orden cronológico
        history = []
        for conv in reversed(conversations):
            history.extend([
                {"role": "user", "content": conv.message},
                {"role": "assistant", "content": conv.response}
            ])
        
        return history
    
    def _count_tokens(self, messages: List[Dict]) -> int:
        """Cuenta tokens aproximados de los mensajes"""
        total = 0
        for msg in messages:
            total += len(self.encoding.encode(msg["content"]))
        return total
    
    async def process_message(
        self,
        user_id: str,
        course_id: str,
        message: str,
        include_history: bool = True
    ) -> ChatMessageResponse:
        """
        Procesa un mensaje del estudiante y genera respuesta del asistente.
        """
        try:
            # 1. Validar acceso al curso
            course = self.db.query(Course).filter(Course.id == course_id).first()
            if not course:
                raise ValueError("Curso no encontrado")
            
            # 2. Buscar contenido relevante (RAG)
            search_results = self.embedding_service.search_similar_content(
                course_id=course_id,
                query=message,
                n_results=3  # Top 3 chunks más relevantes
            )
            
            # 3. Obtener contexto del estudiante
            student_context = self._get_student_context(user_id, course_id)
            weak_areas = self._get_weak_areas(user_id, course_id)
            
            # 4. Construir prompt del sistema
            system_prompt = self._build_system_prompt(
                course_name=course.name,
                student_context=student_context,
                weak_areas=weak_areas,
                relevant_content=search_results["documents"]
            )
            
            # 5. Construir mensajes para el LLM
            messages = [{"role": "system", "content": system_prompt}]
            
            # Agregar historial si se solicita
            if include_history:
                history = self._get_conversation_history(user_id, course_id, limit=3)
                messages.extend(history)
            
            # Agregar mensaje actual
            messages.append({"role": "user", "content": message})

            #imprimir mensajes
            print("=== Mensajes para LLM ===")
            for m in messages:
                print(m)
            print("=========================")
            
            # 6. Llamar al LLM
            logger.info(f"Enviando {len(messages)} mensajes a {self.chat_model}")
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.chat_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            assistant_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # 7. Preparar referencias a fuentes
            sources = []
            for i, (doc, meta, distance) in enumerate(zip(
                search_results["documents"],
                search_results["metadatas"],
                search_results["distances"]
            )):
                # Convertir distancia a score de similitud (1 - distance normalizada)
                relevance_score = max(0, 1 - (distance / 2))
                
                sources.append(SourceReference(
                    document_id=meta["document_id"],
                    document_title=meta["document_title"],
                    document_type=meta["document_type"],
                    chunk_text=doc[:200] + "..." if len(doc) > 200 else doc,
                    relevance_score=round(relevance_score, 2)
                ))
            
            # 8. Guardar conversación en BD
            conversation = Conversation(
                user_id=user_id,
                course_id=course_id,
                message=message,
                response=assistant_response,
                sources=[s.dict() for s in sources] if sources else None
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            
            logger.info(f"✅ Conversación guardada: {conversation.id}")
            
            return ChatMessageResponse(
                conversation_id=conversation.id,
                message=message,
                response=assistant_response,
                sources=sources,
                created_at=conversation.created_at,
                tokens_used=tokens_used
            )
            
        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}", exc_info=True)
            self.db.rollback() 
            raise
    
    def get_conversation_history(
        self, 
        user_id: str, 
        course_id: str,
        limit: int = 20
    ) -> List[Conversation]:
        """Obtiene historial de conversaciones del estudiante en el curso"""
        return (
            self.db.query(Conversation)
            .filter(
                Conversation.user_id == user_id,
                Conversation.course_id == course_id
            )
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .all()
        )