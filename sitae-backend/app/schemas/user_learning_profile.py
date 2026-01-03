from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
import json

class UserLearningProfileBase(BaseModel):
    career: Optional[str] = Field(None, max_length=255)
    job_role: Optional[str] = Field(None, max_length=255)
    preferred_modalities: Optional[List[str]] = Field(None, description="Ej: ['video', 'lectura', 'práctica']")
    interests: Optional[List[str]] = Field(None, description="Ej: ['IA', 'web', 'móvil']")
    interest_other: Optional[str] = Field(None, max_length=500)
    devices: Optional[List[str]] = Field(None, description="Ej: ['laptop', 'tablet', 'móvil']")

    #   FORMA CORRECTA - Pydantic V2
    @field_validator('preferred_modalities', 'interests', 'devices', mode='before')
    @classmethod
    def parse_postgres_array(cls, v: any) -> Optional[List[str]]:
        """
        Convierte arrays de PostgreSQL al formato correcto de Python
        """
        if v is None:
            return None
        
        # Caso 1: Ya es una lista válida
        if isinstance(v, list) and v and not all(len(item) == 1 for item in v if isinstance(item, str)):
            return v
        
        # Caso 2: Lista de caracteres individuales ['{','v','i','d','e','o',...]
        if isinstance(v, list) and all(isinstance(item, str) for item in v):
            reconstructed = ''.join(v)
            if reconstructed.startswith('{') and reconstructed.endswith('}'):
                return cls._parse_postgres_format(reconstructed)
        
        # Caso 3: String con formato PostgreSQL
        if isinstance(v, str) and v.startswith('{') and v.endswith('}'):
            return cls._parse_postgres_format(v)
        
        # Caso 4: String con formato JSON
        if isinstance(v, str) and v.startswith('[') and v.endswith(']'):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v]
        
        # Caso 5: Otros tipos (dejamos que Pydantic maneje la validación)
        return v

    @classmethod
    def _parse_postgres_format(cls, postgres_str: str) -> List[str]:
        """Parsea el formato {item1,item2,item3} de PostgreSQL"""
        clean_str = postgres_str[1:-1]  # Remover llaves
        if not clean_str.strip():
            return []
        
        # Dividir por comas y limpiar cada elemento
        items = []
        for item in clean_str.split(','):
            cleaned_item = item.strip().strip('"').strip("'")
            if cleaned_item:  # Solo agregar si no está vacío
                items.append(cleaned_item)
        
        return items

class CreateUserLearningProfileRequest(UserLearningProfileBase):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "career": "Ingeniería de Software",
            "job_role": "Desarrollador Full Stack",
            "preferred_modalities": ["video", "práctica"],
            "interests": ["IA", "web"],
            "interest_other": "Machine Learning aplicado",
            "devices": ["laptop", "móvil"]
        }
    })

class UpdateUserLearningProfileRequest(UserLearningProfileBase):
    pass

class UserLearningProfileResponse(UserLearningProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    created_at: datetime
    updated_at: datetime