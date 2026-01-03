# app/schemas/option.py
from pydantic import BaseModel, Field
from typing import Optional

class OptionBase(BaseModel):
    text: str = Field(..., min_length=1)
    is_correct: bool = Field(default=False)
    feedback: Optional[str] = None

class OptionCreate(OptionBase):
    pass

class OptionUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)
    is_correct: Optional[bool] = None
    feedback: Optional[str] = None

class OptionResponse(OptionBase):
    id: str
    question_id: str
    
    class Config:
        from_attributes = True

class OptionListResponse(BaseModel):
    options: list[OptionResponse]
    total: int