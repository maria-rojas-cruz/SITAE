from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
import json

class UserCourseProfileBase(BaseModel):
    goals: Optional[List[str]] = Field(None, description="Ej: ['mejorar_nota', 'dominar', 'aplicar_trabajo']")
    prereq_level: Optional[str] = Field(None, description="Ej: 'basico', 'intermedio', 'avanzado'")
    weekly_time: Optional[str] = Field(None, description="Ej: 'llt3h', 'h3_6', 'gt6h'")

    #   Validación de arrays - igual que en UserLearningProfile
    @field_validator('goals', mode='before')
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
        
        # Caso 5: Otros tipos
        return v

    @classmethod
    def _parse_postgres_format(cls, postgres_str: str) -> List[str]:
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

class CreateUserCourseProfileRequest(UserCourseProfileBase):
    course_id: str
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "course_id": "123e4567-e89b-12d3-a456-426614174000",
            "goals": [
                "mejorar_nota"
                        ],
            "prereq_level": "intermedio",
            "weekly_time": "null",
                    
                    }
        }
    )

class UpdateUserCourseProfileRequest(UserCourseProfileBase):
    pass

class UserCourseProfileResponse(UserCourseProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    course_id: str
    created_at: datetime
    updated_at: datetime

class UserCourseProfileListResponse(BaseModel):
    profiles: List[UserCourseProfileResponse]
    total: int