# app/schemas/module_objective.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ModuleObjectiveBase(BaseModel):
    description: str = Field(..., min_length=1)
    code: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)

class ModuleObjectiveCreate(ModuleObjectiveBase):
    pass

class ModuleObjectiveUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1)
    code: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)

class ModuleObjectiveResponse(ModuleObjectiveBase):
    id: str
    module_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModuleObjectiveListResponse(BaseModel):
    objectives: list[ModuleObjectiveResponse]
    total: int


class LinkLearningOutcomeRequest(BaseModel):
    learning_outcome_id: str
    is_primary: bool = False

class LinkedLearningOutcome(BaseModel):
    id: str
    code: str
    description: str
    is_primary: bool