from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# Request schemas
class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    include_history: bool = Field(default=True, description="Incluir conversaciones previas como contexto")

class DocumentUploadRequest(BaseModel):
    title: str
    source_url: str
    document_type: str = Field(..., description="Tipo: 'pdf', 'code', 'video', 'syllabus', 'exercise', 'reading'")

# Response schemas
class SourceReference(BaseModel):
    """Referencia a un documento fuente usado en la respuesta"""
    document_id: str
    document_title: str
    document_type: str
    chunk_text: str = Field(..., description="Fragmento relevante del documento")
    relevance_score: float = Field(..., description="Score de similitud (0-1)")

class ChatMessageResponse(BaseModel):
    conversation_id: str
    message: str
    response: str
    sources: List[SourceReference] = []
    created_at: datetime
    tokens_used: int = Field(default=0, description="Tokens consumidos en esta respuesta")

class ConversationHistoryItem(BaseModel):
    id: str
    message: str
    response: str
    created_at: datetime
    sources: List[SourceReference] = []

class ConversationHistoryResponse(BaseModel):
    course_id: str
    conversations: List[ConversationHistoryItem]
    total: int

class DocumentProcessStatus(BaseModel):
    document_id: str
    title: str
    status: str = Field(..., description="'processing', 'completed', 'failed'")
    chunk_count: int = 0
    processed_at: Optional[datetime] = None
    error: Optional[str] = None