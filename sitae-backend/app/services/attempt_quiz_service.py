# app/services/attempt_quiz_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Tuple
from fastapi import HTTPException, status
from sqlalchemy import text
from app.repositories.attempt_quiz_repository import AttemptQuizRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.question_response_repository import QuestionResponseRepository
from app.repositories.option_repository import OptionRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.question_recommendation_repository import QuestionRecommendationRepository
from app.models.attempt_quiz import AttemptState
from app.schemas.attempt_quiz import (
    AttemptQuizCreate,
    AttemptQuizResponse,
    AttemptQuizListResponse,
    FinishAnswerIn,
    SubmitQuizOut,    AttemptSummaryOut,
    QuestionResultOut,
    OptionOut,
    TopicObjectiveOut,
    ResourceOut
)
from datetime import datetime
from app.services.profile_service import ProfileService
from app.services.personalized_recommendation_service import PersonalizedRecommendationService
import logging

logger = logging.getLogger(__name__)

class AttemptQuizService:
    def __init__(self, db: Session):
        self.db = db
        self.attempt_repo = AttemptQuizRepository(db)
        self.quiz_repo = QuizRepository(db)
        self.question_repo = QuestionRepository(db)
        self.question_response_repo = QuestionResponseRepository(db)
        self.option_repo = OptionRepository(db)
        self.topic_repo = TopicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.course_repo = CourseRepository(db)
        self.qrec_repo = QuestionRecommendationRepository(db)

    def _get_course_id_from_quiz(self, quiz_id: str) -> str:
        """Obtener course_id desde quiz_id"""
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        topic = self.topic_repo.get_by_id(quiz.topic_id)
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Topic no encontrado"
            )
        
        module = self.module_repo.get_by_id(topic.module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Módulo no encontrado"
            )
        
        return module.course_id

    def _verify_student_access(self, quiz_id: str, user_id: str):
        """Verificar que el usuario tiene acceso al curso"""
        course_id = self._get_course_id_from_quiz(quiz_id)
        role_id = self.course_repo.get_user_role_in_course(user_id, course_id)
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este curso"
            )

    def get_user_attempts(self, quiz_id: str, user_id: str) -> AttemptQuizListResponse:
        """Obtener intentos de un usuario en un quiz"""
        self._verify_student_access(quiz_id, user_id)
        
        attempts = self.attempt_repo.get_by_user_and_quiz(user_id, quiz_id)
        
        return AttemptQuizListResponse(
            attempts=[AttemptQuizResponse.model_validate(a) for a in attempts],
            total=len(attempts)
        )

    def start_attempt(self, quiz_id: str, user_id: str) -> AttemptQuizResponse:
        """Iniciar nuevo intento de quiz"""
        self._verify_student_access(quiz_id, user_id)
        
        # Verificar que el quiz existe y está activo
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz no encontrado"
            )
        
        if not quiz.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este quiz no está activo"
            )
        
        # Verificar que no hay un intento en progreso
        active_attempt = self.attempt_repo.get_active_attempt(user_id, quiz_id)
        if active_attempt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya tienes un intento en progreso. Finalízalo antes de iniciar otro."
            )
        
        # Verificar límite de intentos
        if quiz.attempt_max:
            attempt_count = self.attempt_repo.count_attempts(user_id, quiz_id)
            if attempt_count >= quiz.attempt_max:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Has alcanzado el límite de {quiz.attempt_max} intentos"
                )
        
        # Crear intento
        db_attempt = self.attempt_repo.create(user_id, quiz_id)
        
        return AttemptQuizResponse.model_validate(db_attempt)

    def finish_attempt_with_answers(
        self,
        attempt_id: str,
        user_id: str,
        answers: List[FinishAnswerIn],
        #max_resources_per_ot: int = 3,
        #max_duration_min: Optional[int] = 12,
        #rec_source: str = "rule-based"
    ) -> SubmitQuizOut:
        """
        1) Valida intento (dueño y estado).
        2) Guarda respuestas recibidas (delete+insert por pregunta).
        3) Califica.
        4) Genera y persiste recomendaciones para incorrectas.
        5) Devuelve review detallado.
        """
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your attempt")
        if attempt.state != AttemptState.EN_PROGRESO:
            raise HTTPException(status_code=400, detail="Attempt already finished")

        # Traer preguntas del quiz con opción correcta y OT
        rows = self.db.execute(text("""
            SELECT
              q.id            AS question_id,
              q.text          AS q_text,
              q.score         AS q_score,
              q.topic_objective_id AS ot_id,
            q.correct_explanation AS q_explanation,
              ot.code         AS ot_code,
              ot.description  AS ot_desc,
              ok.id           AS ok_opt_id,
              ok.text         AS ok_opt_text
            FROM public.question q
            JOIN public.topic_objective ot ON ot.id = q.topic_objective_id
            JOIN LATERAL (
              SELECT o2.id, o2.text
              FROM public.option o2
              WHERE o2.question_id = q.id AND o2.is_correct = TRUE
              LIMIT 1
            ) ok ON TRUE
            WHERE q.quiz_id = :qid
            ORDER BY q.text
        """), {"qid": attempt.quiz_id}).fetchall()

        # Map para validación rápida
        qmeta: Dict[str, Dict] = {}
        for r in rows:
            qmeta[str(r.question_id)] = {
                "text": r.q_text,
                "score": float(r.q_score),
                "ot_id": str(r.ot_id),
                "ot_code": r.ot_code,
                "ot_desc": r.ot_desc,
                "ok_id": str(r.ok_opt_id),
                "ok_text": r.ok_opt_text,
                "explanation": r.q_explanation,
            }

        # Indexar respuestas recibidas (última gana si viniera duplicada)
        resp_map: Dict[str, Tuple[Optional[str], Optional[int]]] = {}
        for a in answers:
            qid = a.question_id
            if qid not in qmeta:
                raise HTTPException(status_code=422, detail=f"Question {qid} does not belong to this quiz")
            opt = (a.option_id or None)
            tsec = a.time_seconds
            resp_map[qid] = (opt, tsec)

        # Guardar respuestas (delete+insert) y calcular
        total_max = 0.0
        total_earned = 0.0
        incorrect_qids: list[str] = []
        results: List[QuestionResultOut] = []

        for qid, meta in qmeta.items():
            total_max += meta["score"]
            marked_id, tsec = resp_map.get(qid, (None, None))
            is_correct = (marked_id is not None and marked_id == meta["ok_id"])
            earned = meta["score"] if is_correct else 0.0
            total_earned += earned
            if not is_correct:
                incorrect_qids.append(qid)

            # DELETE previas de ese attempt+question (si existieran)
            self.db.execute(
                text("""DELETE FROM public.question_response
                        WHERE attempt_quiz_id = :aid AND question_id = :qid"""),
                {"aid": attempt_id, "qid": qid}
            )
            # INSERT actual
            self.db.execute(
                text("""
                    INSERT INTO public.question_response
                      (attempt_quiz_id, question_id, is_correct, score, option_id, time_seconds)
                    VALUES
                      (:aid, :qid, :ok, :score, :oid, :tsec)
                """),
                {
                    "aid": attempt_id,
                    "qid": qid,
                    "ok": is_correct,
                    "score": earned,
                    "oid": marked_id,
                    "tsec": tsec
                }
            )

            # Armar objeto de salida (completar texto seleccionado si lo tenemos)
            selected_opt: Optional[OptionOut] = None
            if marked_id:
                # traer texto de la opción marcada
                opt_row = self.db.execute(
                    text("SELECT text FROM public.option WHERE id = :oid"),
                    {"oid": marked_id}
                ).fetchone()
                selected_opt = OptionOut(id=marked_id, text=opt_row.text if opt_row else "")

            item = QuestionResultOut(
                question_id=qid,
                text=meta["text"],
                correct=is_correct,
                selected_option=selected_opt,
                correct_option=OptionOut(id=meta["ok_id"], text=meta["ok_text"]),
                topic_objective=TopicObjectiveOut(
                    id=meta["ot_id"], code=meta["ot_code"], description=meta["ot_desc"]
                ),
                correct_explanation=meta["explanation"],
                recommendations=[]
            )
            results.append(item)

        percent = (total_earned * 100.0 / total_max) if total_max else 0.0

        # Generar y persistir recomendaciones por cada incorrecta
        for item in results:
            if item.correct:
                continue
            rec_rows = self.db.execute(
                text("""
                    SELECT r.id, r.title, r.type, r.url, r.duration_minutes, r.is_mandatory
                    FROM public.resource r
                    WHERE r.topic_objective_id = :ot
                    ORDER BY r.is_mandatory DESC, r."order" ASC, r.duration_minutes NULLS LAST
                """),
                {"ot": item.topic_objective.id}
            ).fetchall()

            mapped: List[ResourceOut] = []
            for idx, rr in enumerate(rec_rows, start=1):
                mapped.append(ResourceOut(
                    id=str(rr.id),
                    title=rr.title,
                    type=rr.type,
                    url=rr.url,
                    duration_min=rr.duration_minutes,
                    mandatory=bool(rr.is_mandatory)
                ))
                # Persistir en question_recommendation
                self.db.execute(
                    text("""
                        INSERT INTO public.question_recommendation
                          (attempt_quiz_id, question_id, resource_id, rank_position, why_text, source)
                        VALUES (:aid, :qid, :rid, :rank, :why, :src)
                        ON CONFLICT (question_id, attempt_quiz_id, resource_id) DO NOTHING
                    """),
                    {
                        "aid": attempt_id,
                        "qid": item.question_id,
                        "rid": str(rr.id),
                        "rank": idx,
                        "why": None,
                        "src": "filtered",   # valor fijo/por defecto   # e.g., "rule-based" / "embedding" / "llm"
                    }
                )
            item.recommendations = mapped

        # Cerrar intento
        self.attempt_repo.update(attempt_id, {
            "date_end": datetime.now(),
            "state": AttemptState.CALIFICADO,
            "score_total": float(total_earned),
            "percent": round(percent, 2)
        })

        self.db.commit()

        return SubmitQuizOut(
            attempt=AttemptSummaryOut(
                attempt_id=attempt_id,
                percent=round(percent, 2),
                total_score=float(total_earned)
            ),
            questions=results
        )
   
    async def finish_attempt_with_personalization(
        self,
        attempt_id: str,
        user_id: str,
        answers: List[FinishAnswerIn]
    ) -> SubmitQuizOut:
        """
        Finaliza intento con personalización completa:
        1. Guarda respuestas y califica
        2. Genera análisis de error por pregunta (LLM)
        3. Filtra y ordena recursos según perfil
        4. Genera why_text por recurso (LLM)
        5. Persiste todo y retorna
        """
        
        # ========== 1. VALIDACIÓN ==========
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your attempt")
        if attempt.state != AttemptState.EN_PROGRESO:
            raise HTTPException(status_code=400, detail="Attempt already finished")
        
        # ========== 2. OBTENER METADATA DE PREGUNTAS ==========
        rows = self.db.execute(text("""
            SELECT
            q.id, q.text, q.score, q.topic_objective_id,
            q.correct_explanation,
            ot.code AS ot_code, ot.description AS ot_desc,
            ok.id AS ok_opt_id, ok.text AS ok_opt_text
            FROM public.question q
            JOIN public.topic_objective ot ON ot.id = q.topic_objective_id
            JOIN LATERAL (
            SELECT o2.id, o2.text
            FROM public.option o2
            WHERE o2.question_id = q.id AND o2.is_correct = TRUE
            LIMIT 1
            ) ok ON TRUE
            WHERE q.quiz_id = :qid
            ORDER BY q.text
        """), {"qid": attempt.quiz_id}).fetchall()
        
        qmeta: Dict[str, Dict] = {}
        for r in rows:
            qmeta[str(r.id)] = {
                "text": r.text,
                "score": float(r.score),
                "ot_id": str(r.topic_objective_id),
                "ot_code": r.ot_code,
                "ot_desc": r.ot_desc,
                "ok_id": str(r.ok_opt_id),
                "ok_text": r.ok_opt_text,
                "explanation": r.correct_explanation
            }
        
        # ========== 3. INDEXAR RESPUESTAS ==========
        resp_map: Dict[str, Tuple[Optional[str], Optional[int]]] = {}
        for a in answers:
            qid = a.question_id
            if qid not in qmeta:
                raise HTTPException(
                    status_code=422, 
                    detail=f"Question {qid} does not belong to this quiz"
                )
            resp_map[qid] = (a.option_id or None, a.time_seconds)
        
        # ========== 4. PROCESAR RESPUESTAS Y CALCULAR PUNTAJE ==========
        total_max = 0.0
        total_earned = 0.0
        results: List[QuestionResultOut] = []
        
        for qid, meta in qmeta.items():
            total_max += meta["score"]
            marked_id, tsec = resp_map.get(qid, (None, None))
            is_correct = (marked_id is not None and marked_id == meta["ok_id"])
            earned = meta["score"] if is_correct else 0.0
            total_earned += earned
            
            # Guardar respuesta en BD
            self.db.execute(
                text("DELETE FROM public.question_response WHERE attempt_quiz_id = :aid AND question_id = :qid"),
                {"aid": attempt_id, "qid": qid}
            )
            self.db.execute(
                text("""
                    INSERT INTO public.question_response
                    (attempt_quiz_id, question_id, is_correct, score, option_id, time_seconds)
                    VALUES (:aid, :qid, :ok, :score, :oid, :tsec)
                """),
                {
                    "aid": attempt_id,
                    "qid": qid,
                    "ok": is_correct,
                    "score": earned,
                    "oid": marked_id,
                    "tsec": tsec
                }
            )
            
            # Obtener texto de la opción seleccionada
            selected_opt: Optional[OptionOut] = None
            if marked_id:
                opt_row = self.db.execute(
                    text("SELECT text FROM public.option WHERE id = :oid"),
                    {"oid": marked_id}
                ).fetchone()
                selected_opt = OptionOut(id=marked_id, text=opt_row.text if opt_row else "")
            
            # Crear objeto resultado
            item = QuestionResultOut(
                question_id=qid,
                text=meta["text"],
                correct=is_correct,
                selected_option=selected_opt,
                correct_option=OptionOut(id=meta["ok_id"], text=meta["ok_text"]),
                topic_objective=TopicObjectiveOut(
                    id=meta["ot_id"],
                    code=meta["ot_code"],
                    description=meta["ot_desc"]
                ),
                correct_explanation=meta["explanation"],  # Por ahora el de BD
                recommendations=[]
            )
            results.append(item)
        
        percent = (total_earned * 100.0 / total_max) if total_max else 0.0
        
        # ========== 5. PERSONALIZACIÓN CON LLM ==========
        
        # Inicializar servicios
        profile_service = ProfileService(self.db)
        rec_service = PersonalizedRecommendationService(self.db)
        
        # Obtener perfil completo del estudiante
        course_id = self._get_course_id_from_quiz(attempt.quiz_id)
        profile_data = profile_service.get_complete_profile_for_agent(user_id, course_id)
        
        user_profile = profile_data.get("learning_profile") or {}
        course_profile = profile_data.get("course_profile") or {}
        
        logger.info(f"Perfil obtenido - user_profile: {bool(user_profile)}, course_profile: {bool(course_profile)}")
        
        # Para cada pregunta INCORRECTA
        for item in results:
            if item.correct:
                continue
            
            try:
                logger.info(f"Procesando pregunta incorrecta: {item.question_id}")
                
                # 5.1 GENERAR ANÁLISIS DEL ERROR (para la pregunta)
                error_analysis = await rec_service.generate_error_analysis(
                    question_text=item.text,
                    topic_objective=item.topic_objective.description,
                    selected_option=item.selected_option.text if item.selected_option else "No respondió",
                    correct_option=item.correct_option.text,
                    user_profile=user_profile,
                    course_profile=course_profile
                )
                
                logger.info(f"Análisis de error generado: {len(error_analysis)} chars")

                # Guarda el análisis del sistema en comment (BD y DTO)
                self.db.execute(
                    text("""
                        UPDATE public.question_response
                        SET comment = :exp
                        WHERE attempt_quiz_id = :aid AND question_id = :qid
                    """),
                    {"exp": error_analysis or "", "aid": attempt_id, "qid": item.question_id}
                )

                cr = self.db.execute(
                    text("""SELECT comment FROM public.question_response
                            WHERE attempt_quiz_id=:aid AND question_id=:qid"""),
                    {"aid": attempt_id, "qid": item.question_id}
                ).fetchone()
                item.comment = cr.comment if cr else error_analysis


                
                # 5.2 OBTENER RECURSOS PERSONALIZADOS
                personalized_recs = await rec_service.get_personalized_recommendations(
                    topic_objective_id=item.topic_objective.id,
                    topic_objective_description=item.topic_objective.description,
                    question_text=item.text,
                    user_profile=user_profile,
                    course_profile=course_profile,
                    max_recommendations=3
                )
                
                logger.info(f"Recursos personalizados obtenidos: {len(personalized_recs)}")
                
                # 5.3 AGREGAR RECURSOS A LA RESPUESTA Y PERSISTIR
                for rec in personalized_recs:
                    # Agregar a la respuesta
                    item.recommendations.append(ResourceOut(
                        id=rec["resource_id"],
                        title=rec["title"],
                        type=rec["type"],
                        url=rec.get("url", ""),
                        duration_min=rec.get("duration_min"),
                        mandatory=bool(rec.get("mandatory", True)),
                        why_text=rec["why_text"]
                    ))
                    
                    # Persistir en BD
                    self.db.execute(text("""
                        INSERT INTO public.question_recommendation
                        (attempt_quiz_id, question_id, resource_id, rank_position, why_text, source)
                        VALUES (:aid, :qid, :rid, :rank, :why, :src)
                        ON CONFLICT (attempt_quiz_id, question_id, resource_id) 
                        DO UPDATE SET 
                            why_text = EXCLUDED.why_text,
                            rank_position = EXCLUDED.rank_position,
                            source = EXCLUDED.source
                    """), {
                        "aid": attempt_id,
                        "qid": item.question_id,
                        "rid": rec["resource_id"],
                        "rank": rec["rank"],
                        "why": rec["why_text"],
                        "src": "llm_personalized"
                    })
                    
                    logger.info(f"Recurso persistido: {rec['title']}")
            
            except Exception as e:
                logger.error(f"Error en personalización para pregunta {item.question_id}: {e}", exc_info=True)
                
                # FALLBACK: usar método básico sin personalización
                fallback_text = f"Revisa el concepto: {item.topic_objective.description}. Practica con los recursos del curso."

                self.db.execute(
                    text("""
                        UPDATE public.question_response
                        SET comment = :exp
                        WHERE attempt_quiz_id = :aid AND question_id = :qid
                    """),
                    {"exp": fallback_text, "aid": attempt_id, "qid": item.question_id}
                )

                cr = self.db.execute(
                    text("""SELECT comment FROM public.question_response
                            WHERE attempt_quiz_id=:aid AND question_id=:qid"""),
                    {"aid": attempt_id, "qid": item.question_id}
                ).fetchone()
                item.comment = cr.comment if cr else fallback_text

                
                # Obtener recursos básicos del curso
                rec_rows = self.db.execute(
                    text("""
                        SELECT r.id, r.title, r.type, r.url, r.duration_minutes, r.is_mandatory
                        FROM public.resource r
                        WHERE r.topic_objective_id = :ot
                        ORDER BY r.is_mandatory DESC, r."order" ASC
                        LIMIT 3
                    """),
                    {"ot": item.topic_objective.id}
                ).fetchall()
                
                for idx, rr in enumerate(rec_rows, start=1):
                    item.recommendations.append(ResourceOut(
                        id=str(rr.id),
                        title=rr.title,
                        type=rr.type,
                        url=rr.url or "",
                        duration_min=rr.duration_minutes,
                        mandatory=bool(rr.is_mandatory),
                        why_text=None  # Sin personalización en fallback
                    ))
                    
                    # Persistir sin why_text
                    self.db.execute(text("""
                        INSERT INTO public.question_recommendation
                        (attempt_quiz_id, question_id, resource_id, rank_position, why_text, source)
                        VALUES (:aid, :qid, :rid, :rank, :why, :src)
                        ON CONFLICT (attempt_quiz_id, question_id, resource_id) DO NOTHING
                    """), {
                        "aid": attempt_id,
                        "qid": item.question_id,
                        "rid": str(rr.id),
                        "rank": idx,
                        "why": None,
                        "src": "fallback_basic"
                    })
        
        # ========== 6. CERRAR INTENTO ==========
        self.attempt_repo.update(attempt_id, {
            "date_end": datetime.now(),
            "state": AttemptState.CALIFICADO,
            "score_total": float(total_earned),
            "percent": round(percent, 2)
        })
        
        logger.info(f"Intento finalizado: {attempt_id}, score: {total_earned}/{total_max}")
        
        # ========== 7. COMMIT Y RETORNAR ==========
        self.db.commit()
        
        return SubmitQuizOut(
            attempt=AttemptSummaryOut(
                attempt_id=attempt_id,
                percent=round(percent, 2),
                total_score=float(total_earned)
            ),
            questions=results
        )
    
    def finish_attempt(self, attempt_id: str, user_id: str) -> AttemptQuizResponse:
        """Finalizar intento y calcular puntaje"""
        db_attempt = self.attempt_repo.get_by_id(attempt_id)
        if not db_attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intento no encontrado"
            )
        
        # Verificar que es el dueño del intento
        if db_attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para finalizar este intento"
            )
        
        # Verificar que está en progreso
        if db_attempt.state != AttemptState.EN_PROGRESO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este intento ya fue finalizado"
            )
        
        # Calcular puntaje
        score_data = self._calculate_score(attempt_id)
        
        # Actualizar intento
        updated = self.attempt_repo.update(attempt_id, {
            "date_end": datetime.now(),
            "state": AttemptState.CALIFICADO,
            "score_total": score_data["score_total"],
            "percent": score_data["percent"]
        })
        
        return AttemptQuizResponse.model_validate(updated)

    def _calculate_score(self, attempt_id: str) -> dict:
        """Calcular puntaje del intento"""
        # Obtener intento
        attempt = self.attempt_repo.get_by_id(attempt_id)
        
        # Obtener todas las preguntas del quiz
        questions = self.question_repo.get_by_quiz(attempt.quiz_id)
        
        # Obtener todas las respuestas del intento
        responses = self.question_response_repo.get_by_attempt(attempt_id)
        
        # Calcular puntaje
        total_score = sum(q.score for q in questions)
        earned_score = sum(r.score for r in responses if r.score)
        
        percent = (earned_score / total_score * 100) if total_score > 0 else 0
        
        return {
            "score_total": earned_score,
            "percent": round(percent, 2)
        }
    
    def abandon_attempt(self, attempt_id: str, user_id: str) -> AttemptQuizResponse:
        """Abandonar intento"""
        db_attempt = self.attempt_repo.get_by_id(attempt_id)
        if not db_attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intento no encontrado"
            )
        
        if db_attempt.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para abandonar este intento"
            )
        
        if db_attempt.state != AttemptState.EN_PROGRESO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este intento ya fue finalizado"
            )
        
        updated = self.attempt_repo.update(attempt_id, {
            "date_end": datetime.now(),
            "state": AttemptState.ABANDONADO
        })
        
        return AttemptQuizResponse.model_validate(updated)