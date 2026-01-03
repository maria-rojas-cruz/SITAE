from chromadb import PersistentClient
from functools import lru_cache
from pathlib import Path
import logging
from app.core.config import settings 

logger = logging.getLogger(__name__)

# Ruta donde se guardarán los embeddings
#VECTOR_DB_PATH = Path("/var/lib/tutor_vectordb") #se definió ruta en .env

@lru_cache()
def get_vector_store() -> PersistentClient:
    """
    Singleton de ChromaDB para toda la aplicación.
    Usa la ruta definida en settings.CHROMA_PATH.
    Crea el directorio si no existe.
    """
    vector_path = Path(settings.CHROMA_PATH).expanduser().resolve()

    try:
        vector_path.mkdir(parents=True, exist_ok=True)
        client = PersistentClient(path=str(vector_path))
        logger.info(f"✅ ChromaDB inicializado en: {vector_path}")
        return client
    except Exception as e:
        logger.error(f"❌ Error inicializando ChromaDB: {e}")
        raise


def get_course_collection_name(course_id: str) -> str:
    """Nombre estandarizado de colección por curso"""
    return f"course_{course_id.replace('-', '_')}"


def reset_course_collection(course_id: str):
    """Borra y recrea la colección de un curso (útil para re-procesar)"""
    client = get_vector_store()
    collection_name = get_course_collection_name(course_id)
    
    try:
        client.delete_collection(name=collection_name)
        logger.info(f"Colección {collection_name} eliminada")
    except Exception:
        pass  # No existe, no pasa nada
    
    return client.get_or_create_collection(name=collection_name)