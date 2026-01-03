# app/schemas/module.py
from pydantic import BaseModel, Field
from typing import Optional

class ModuleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order: int = Field(default=1, ge=1)

class ModuleCreate(ModuleBase):
    pass

class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)

class ModuleResponse(ModuleBase):
    id: str
    course_id: str
    
    class Config:
        from_attributes = True

class ModuleListResponse(BaseModel):
    modules: list[ModuleResponse]
    total: int