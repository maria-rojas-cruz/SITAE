# app/schemas/topic_objective.py
from pydantic import BaseModel, Field
from typing import Optional

class TopicObjectiveBase(BaseModel):
    description: str = Field(..., min_length=1)
    code: Optional[str] = None
    order: int = Field(default=1, ge=1)

class TopicObjectiveCreate(TopicObjectiveBase):
    pass

class TopicObjectiveUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1)
    code: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)

class TopicObjectiveResponse(TopicObjectiveBase):
    id: str
    topic_id: str
    
    class Config:
        from_attributes = True

class TopicObjectiveListResponse(BaseModel):
    objectives: list[TopicObjectiveResponse]
    total: int

class LinkModuleObjectiveRequest(BaseModel):
    module_objective_id: str
    is_primary: bool = False

class LinkedModuleObjective(BaseModel):
    id: str
    code: Optional[str]
    description: str
    is_primary: bool

class TopicObjectiveInfo(BaseModel):
    """Schema simple para mostrar en selectores"""
    id: str
    description: str
    code: Optional[str] = None