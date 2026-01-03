# app/schemas/learning_outcome.py
from pydantic import BaseModel, Field
from typing import Optional

class LearningOutcomeBase(BaseModel):
    code: str = Field(..., description="Código del resultado (ej: RA1)")
    description: str = Field(..., description="Descripción del resultado")
    bloom_level: Optional[str] = Field(None, description="Nivel Bloom: Recordar, Comprender, Aplicar, etc.")
    order: int = Field(default=1, description="Orden de visualización")

class LearningOutcomeCreate(LearningOutcomeBase):
    pass

class LearningOutcomeUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    bloom_level: Optional[str] = None
    order: Optional[int] = None

class LearningOutcomeResponse(LearningOutcomeBase):
    id: str
    course_id: str
    
    class Config:
        from_attributes = True

class LearningOutcomesListResponse(BaseModel):
    outcomes: list[LearningOutcomeResponse]
    total: int