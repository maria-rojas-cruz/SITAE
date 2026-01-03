# app/schemas/topic.py
from pydantic import BaseModel, Field
from typing import Optional

class TopicBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order: int = Field(default=1, ge=1)

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)

class TopicResponse(TopicBase):
    id: str
    module_id: str
    
    class Config:
        from_attributes = True

class TopicListResponse(BaseModel):
    topics: list[TopicResponse]
    total: int