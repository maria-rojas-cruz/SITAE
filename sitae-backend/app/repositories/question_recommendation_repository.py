# app/repositories/question_recommendation_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import text

class QuestionRecommendationRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert(
        self,
        attempt_quiz_id: str,
        question_id: str,
        resource_id: str,
        rank_position: int,
        source: str,
        why_text: str | None = None
    ) -> None:
        self.db.execute(
            text("""
                INSERT INTO public.question_recommendation
                  (attempt_quiz_id, question_id, resource_id, rank_position, why_text, source)
                VALUES
                  (:aid, :qid, :rid, :rank, :why, :src)
                ON CONFLICT (question_id, attempt_quiz_id, resource_id)
                DO NOTHING
            """),
            {
                "aid": attempt_quiz_id,
                "qid": question_id,
                "rid": resource_id,
                "rank": rank_position,
                "why": why_text,
                "src": source
            }
        )
