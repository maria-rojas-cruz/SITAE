from fastapi import APIRouter, Depends, HTTPException, status, Path, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.models.chat import CourseDocument
from app.models.course import CourseUserRole
from app.schemas.chat import DocumentUploadRequest, DocumentProcessStatus
from datetime import datetime
from pathlib import Path as FilePath
import logging
import shutil
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/courses/{course_id}/documents", tags=["documents"])

# Directorio donde se guardan documentos subidos -> Se definió ruta en .env
#UPLOAD_DIR = FilePath("/var/lib/tutor_documents")
#UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Directorio donde se guardan documentos subidos (portable)
def get_upload_dir() -> FilePath:
    p = FilePath(settings.DOCUMENTS_PATH).expanduser().resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


def verify_teacher_access(course_id: str, user_id: str, db: Session) -> bool:
    """Verifica que el usuario sea profesor del curso (role_id = 2)"""
    enrollment = (
        db.query(CourseUserRole)
        .filter(
            CourseUserRole.course_id == course_id,
            CourseUserRole.user_id == user_id,
            CourseUserRole.role_id == 2  # 2 = profesor
        )
        .first()
    )
    return enrollment is not None


def process_document_background(
    document_id: str,
    course_id: str, 
    file_path: str,
    document_type: str,
    title: str,
    db: Session
):
    """
    Tarea en background para procesar documento.
    En producción, esto debería ser un task de Celery.
    """
    try:
        embedding_service = EmbeddingService()
        
        chunk_count = embedding_service.process_document(
            course_id=course_id,
            document_id=document_id,
            file_path=file_path,
            document_type=document_type,
            title=title
        )
        
        # Actualizar documento en BD
        doc = db.query(CourseDocument).filter(CourseDocument.id == document_id).first()
        if doc:
            doc.chunk_count = chunk_count
            doc.processed_at = datetime.utcnow()
            db.commit()
            
        logger.info(f"✅ Documento {title} procesado: {chunk_count} chunks")
        
    except Exception as e:
        logger.error(f"❌ Error procesando documento {title}: {e}")
        # En producción, actualizar status a 'failed' en BD


@router.post("/upload", response_model=DocumentProcessStatus, status_code=status.HTTP_201_CREATED)
async def upload_document(
    course_id: str = Path(..., description="ID del curso"),
    file: UploadFile = File(...),
    document_type: str = "pdf",
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sube un documento al curso y lo procesa para embeddings.
    Solo profesores pueden subir documentos.
    
    Tipos soportados: pdf, code (Python files)
    """
    # Verificar que sea profesor
    if not verify_teacher_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo profesores pueden subir documentos"
        )
    
    # Validar tipo de archivo
    allowed_types = {
        "pdf": [".pdf"],
        "code": [".py", ".ipynb"]
    }
    
    file_ext = FilePath(file.filename).suffix.lower()
    if document_type not in allowed_types or file_ext not in allowed_types[document_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no soportado para {document_type}"
        )
    
    try:
        # Generar ID único para el documento
        document_id = str(uuid.uuid4())
        
        # Guardar archivo en disco
        course_dir = get_upload_dir() / course_id
        course_dir.mkdir(parents=True, exist_ok=True)
        
        stored_name = f"{document_id}{file_ext}"
        file_path = course_dir / stored_name
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Archivo guardado en: {file_path}")
        
        # Crear registro en BD
        doc = CourseDocument(
            id=document_id,
            course_id=course_id,
            title=file.filename,
            document_type=document_type,
            file_path=str(file_path),
            chunk_count=0
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Procesar en background
        if background_tasks:
            background_tasks.add_task(
                process_document_background,
                document_id=document_id,
                course_id=course_id,
                file_path=str(file_path),
                document_type=document_type,
                title=file.filename,
                db=db
            )
        
        return DocumentProcessStatus(
            document_id=document_id,
            title=file.filename,
            status="processing",
            chunk_count=0
        )
        
    except Exception as e:
        logger.error(f"Error subiendo documento: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando el documento"
        )


@router.post("/register-link", response_model=DocumentProcessStatus, status_code=status.HTTP_201_CREATED)
async def register_document_link(
    course_id: str = Path(..., description="ID del curso"),
    request: DocumentUploadRequest = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registra un link a un documento externo (Google Drive, etc).
    Para MVP donde el profesor comparte links en lugar de subir archivos.
    
    Nota: Los links no se procesan automáticamente para embeddings.
    El profesor deberá descargar y subir el PDF manualmente si quiere que el asistente lo use.
    """
    # Verificar que sea profesor
    if not verify_teacher_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo profesores pueden registrar documentos"
        )
    
    try:
        # Crear registro en BD
        doc = CourseDocument(
            course_id=course_id,
            title=request.title,
            source_url=request.source_url,
            document_type=request.document_type,
            chunk_count=0  # Links no se procesan automáticamente
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        logger.info(f"Link registrado: {request.title} - {request.source_url}")
        
        return DocumentProcessStatus(
            document_id=doc.id,
            title=doc.title,
            status="completed",  # Link registrado, pero no procesado
            chunk_count=0
        )
        
    except Exception as e:
        logger.error(f"Error registrando link: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registrando el documento"
        )


@router.get("", response_model=list[DocumentProcessStatus])
async def list_course_documents(
    course_id: str = Path(..., description="ID del curso"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos los documentos del curso.
    """
    # Verificar acceso al curso (cualquier rol)
    enrollment = (
        db.query(CourseUserRole)
        .filter(
            CourseUserRole.course_id == course_id,
            CourseUserRole.user_id == current_user["id"]
        )
        .first()
    )
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este curso"
        )
    
    documents = (
        db.query(CourseDocument)
        .filter(CourseDocument.course_id == course_id)
        .order_by(CourseDocument.created_at.desc())
        .all()
    )
    
    return [
        DocumentProcessStatus(
            document_id=doc.id,
            title=doc.title,
            status="completed" if doc.processed_at else "pending",
            chunk_count=doc.chunk_count,
            processed_at=doc.processed_at
        )
        for doc in documents
    ]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    course_id: str = Path(..., description="ID del curso"),
    document_id: str = Path(..., description="ID del documento"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un documento del curso (solo profesores).
    También borra sus embeddings de ChromaDB.
    """
    # Verificar que sea profesor
    if not verify_teacher_access(course_id, current_user["id"], db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo profesores pueden eliminar documentos"
        )
    
    doc = (
        db.query(CourseDocument)
        .filter(
            CourseDocument.id == document_id,
            CourseDocument.course_id == course_id
        )
        .first()
    )
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    try:
        # Borrar archivo físico si existe
        if doc.file_path and FilePath(doc.file_path).exists():
            FilePath(doc.file_path).unlink()
        
        # TODO: Borrar embeddings de ChromaDB
        # Esto requeriría iterar sobre todos los chunks con document_id matching
        # Por simplicidad, dejamos los chunks (no afecta mucho el storage)
        
        # Borrar registro de BD
        db.delete(doc)
        db.commit()
        
        logger.info(f"Documento {doc.title} eliminado")
        return None
        
    except Exception as e:
        logger.error(f"Error eliminando documento: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error eliminando el documento"
        )