# app/schemas/question_response.py
from pydantic import BaseModel, Field
from typing import Optional

class QuestionResponseBase(BaseModel):
    question_id: str
    option_id: str
    time_seconds: Optional[int] = Field(None, ge=0)

class QuestionResponseCreate(QuestionResponseBase):
    pass

class QuestionResponseDetail(BaseModel):
    id: str
    attempt_quiz_id: str
    question_id: str
    option_id: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    comment: Optional[str] = None
    time_seconds: Optional[int] = None
    
    class Config:
        from_attributes = True

class QuestionResponseListResponse(BaseModel):
    responses: list[QuestionResponseDetail]
    total: int