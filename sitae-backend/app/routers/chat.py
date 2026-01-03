from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.chat_service import ChatService
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationHistoryResponse,
    ConversationHistoryItem,
    SourceReference
)
from app.models.course import CourseUserRole
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def verify_course_access(course_id: str, user_id: str, db: Session) -> bool:
    """Verifica que el usuario tenga acceso al curso"""
    enrollment = (
        db.query(CourseUserRole)
        .filter(
            CourseUserRole.course_id == course_id,
            CourseUserRole.user_id == user_id
        )
        .first()
    )
    return enrollment is not None


@router.post("/{course_id}/message", response_model=ChatMessageResponse)
async def send_chat_message(
    course_id: str = Path(..., description="ID del curso"),
    request: ChatMessageRequest = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Envía un mensaje al asistente del curso.
    
    El asistente usará:
    - Material del curso (RAG)
    - Perfil del estudiante
    - Áreas débiles detectadas en quizzes
    - Historial de conversación (opcional)
    """
    # Verificar acceso al curso
    if not verify_course_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este curso"
        )
    
    # Procesar mensaje
    chat_service = ChatService(db)
    
    try:
        response = await chat_service.process_message(
            user_id=current_user["id"],
            course_id=course_id,
            message=request.message,
            include_history=request.include_history
        )
        return response
        
    except Exception as e:
        logger.error(f"Error procesando mensaje de chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando el mensaje. Intenta nuevamente."
        )


@router.get("/{course_id}/history", response_model=ConversationHistoryResponse)
async def get_chat_history(
    course_id: str = Path(..., description="ID del curso"),
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial de conversaciones del estudiante en el curso.
    """
    # Verificar acceso
    if not verify_course_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este curso"
        )
    
    chat_service = ChatService(db)
    conversations = chat_service.get_conversation_history(
        user_id=current_user["id"],
        course_id=course_id,
        limit=limit
    )
    
    # Formatear respuesta
    history_items = []
    for conv in conversations:
        sources = []
        if conv.sources:
            for source_data in conv.sources:
                sources.append(SourceReference(**source_data))
        
        history_items.append(ConversationHistoryItem(
            id=conv.id,
            message=conv.message,
            response=conv.response,
            created_at=conv.created_at,
            sources=sources
        ))
    
    return ConversationHistoryResponse(
        course_id=course_id,
        conversations=history_items,
        total=len(history_items)
    )


@router.delete("/{course_id}/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Borra el historial de conversaciones del estudiante en el curso.
    """
    # Verificar acceso
    if not verify_course_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este curso"
        )
    
    from app.models.chat import Conversation
    
    # Borrar conversaciones
    deleted = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == current_user["id"],
            Conversation.course_id == course_id
        )
        .delete()
    )
    
    db.commit()
    logger.info(f"Borradas {deleted} conversaciones del usuario {current_user['id']} en curso {course_id}")
    
    return None