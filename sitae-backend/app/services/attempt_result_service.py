# app/services/attempt_result_service.py
from typing import Dict, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.attempt_quiz import AttemptState
from app.repositories.attempt_quiz_repository import AttemptQuizRepository
from app.schemas.attempt_quiz import (
    SubmitQuizOut, AttemptSummaryOut, QuestionResultOut,
    TopicObjectiveOut, OptionOut, ResourceOut
)
from app.schemas.attempt_quiz import (
    AttemptRecommendationsOut, QuestionRecommendationsOut
)

class AttemptResultService:
    def __init__(self, db: Session):
        self.db = db
        self.attempt_repo = AttemptQuizRepository(db)

    # ---------- Public ----------
    def get_attempt_result(
        self,
        attempt_id: str,
        user_id: str,
        #max_resources_per_question: int = 10
    ) -> SubmitQuizOut:
        """Load attempt summary + per-question review from persisted data."""
        attempt = self._get_owned_finished_attempt(attempt_id, user_id)

        # 1) Cargar metadatos por pregunta (texto, score, OT, opción correcta)
        qmeta = self._load_qmeta_for_quiz(attempt.quiz_id)

        # 2) Cargar respuestas del intento (opción marcada, correcta?, puntaje)
        resp = self._load_responses(attempt_id)

        # 3) Construir resultados por pregunta
        results: List[QuestionResultOut] = []
        for qid, meta in qmeta.items():
            r = resp.get(qid)  # puede ser None si no respondió
            selected_opt = None
            is_correct = False
            if r:
                if r["option_id"]:
                    selected_opt = OptionOut(id=r["option_id"], text=r["option_text"] or "")
                is_correct = bool(r["is_correct"])

            results.append(QuestionResultOut(
                question_id=qid,
                text=meta["text"],
                correct=is_correct,
                selected_option=selected_opt,
                correct_option=OptionOut(id=meta["ok_id"], text=meta["ok_text"]),
                topic_objective=TopicObjectiveOut(
                    id=meta["ot_id"], code=meta["ot_code"], description=meta["ot_desc"]
                ),
                correct_explanation=meta["explanation"],
                comment=r["comment"] if r else None,
                recommendations=[]
            ))

        # 4) Adjuntar recomendaciones persistidas por pregunta
        recs_map = self._load_persisted_recommendations(
            attempt_id #limit_per_question=max_resources_per_question
        )
        for item in results:
            if item.question_id in recs_map:
                item.recommendations = recs_map[item.question_id]

        return SubmitQuizOut(
            attempt=AttemptSummaryOut(
                attempt_id=attempt_id,
                percent=attempt.percent or 0.0,
                total_score=attempt.score_total or 0.0
            ),
            questions=results
        )

    # ---------- Helpers ----------
    def _get_owned_finished_attempt(self, attempt_id: str, user_id: str):
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your attempt")
        if attempt.state not in (AttemptState.CALIFICADO, AttemptState.CALIFICADO):  # según tu enum
            raise HTTPException(status_code=400, detail="Attempt is not finished")
        return attempt

    def _load_qmeta_for_quiz(self, quiz_id: str) -> Dict[str, Dict]:
        rows = self.db.execute(text("""
            SELECT
              q.id            AS question_id,
              q.text          AS q_text,
              q.score         AS q_score,
                                    q.correct_explanation AS q_explanation,
              q.topic_objective_id AS ot_id,
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
        """), {"qid": quiz_id}).fetchall()

        qmeta: Dict[str, Dict] = {}
        for r in rows:
            qmeta[str(r.question_id)] = {
                "text": r.q_text,
                "score": float(r.q_score),
                "explanation": r.q_explanation,
                "ot_id": str(r.ot_id),
                "ot_code": r.ot_code,
                "ot_desc": r.ot_desc,
                "ok_id": str(r.ok_opt_id),
                "ok_text": r.ok_opt_text,
            }
        return qmeta

    def _load_responses(self, attempt_id: str) -> Dict[str, Dict]:
        rows = self.db.execute(text("""
            SELECT
              qr.question_id,
              qr.is_correct,
              qr.score,
              qr.option_id,
              qr.comment,
              o.text AS option_text
            FROM public.question_response qr
            LEFT JOIN public."option" o ON o.id = qr.option_id
            WHERE qr.attempt_quiz_id = :aid
        """), {"aid": attempt_id}).fetchall()

        out: Dict[str, Dict] = {}
        for r in rows:
            out[str(r.question_id)] = {
                "is_correct": bool(r.is_correct) if r.is_correct is not None else False,
                "score": float(r.score) if r.score is not None else 0.0,
                "option_id": str(r.option_id) if r.option_id else None,
                "option_text": r.option_text if r.option_id else None,
                "comment": r.comment if r.comment else None
            }
        return out

    def _load_persisted_recommendations(
        self,
        attempt_id: str,
        #limit_per_question: int
    ) -> Dict[str, List[ResourceOut]]:
        rows = self.db.execute(text("""
            SELECT
              qr.question_id,
              r.id, r.title, r.type, r.url, r.duration_minutes, r.is_mandatory,
              qr.rank_position,
              qr.why_text                      
            FROM public.question_recommendation qr
            JOIN public.resource r ON r.id = qr.resource_id
            WHERE qr.attempt_quiz_id = :aid
            ORDER BY qr.question_id, qr.rank_position
        """), {"aid": attempt_id}).fetchall()

        recs: Dict[str, List[ResourceOut]] = {}
        for r in rows:
            qid = str(r.question_id)
            recs.setdefault(qid, [])
            #if len(recs[qid]) < limit_per_question:
            recs[qid].append(ResourceOut(
                id=str(r.id),
                title=r.title,
                type=r.type,
                url=r.url,
                duration_min=r.duration_minutes,
                mandatory=bool(r.is_mandatory),
                why_text=r.why_text
            ))
        return recs
