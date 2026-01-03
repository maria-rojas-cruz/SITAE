# app/schemas/resource.py
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal
from datetime import datetime

# Tipos de recursos permitidos
ResourceType = Literal["Ejercicio", "Lectura","Video","video", "pdf", "link", "document", "quiz", "exercise", "reading", "lectura", "codigo", "ejercicio", "documento", "Código", "Link", "Documento", "Codigo"]
DifficultyLevel = Literal["beginner", "intermediate", "advanced", "principiante", "avanzado", "intermedio", "basico"]

class ResourceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    type: ResourceType
    url: str = Field(..., description="URL del recurso")
    duration_minutes: Optional[int] = Field(None, ge=1, description="Duración en minutos")
    difficulty: Optional[DifficultyLevel] = None
    is_mandatory: bool = Field(default=True)
    is_external: bool = Field(default=False)
    order: int = Field(default=1, ge=1)
    topic_objective_id: str = Field(..., description="ID del objetivo del topic relacionado")

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[ResourceType] = None
    url: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=1)
    difficulty: Optional[DifficultyLevel] = None
    is_mandatory: Optional[bool] = None
    order: Optional[int] = Field(None, ge=1)
    topic_objective_id: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: str
    topic_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResourceListResponse(BaseModel):
    resources: list[ResourceResponse]
    total: int