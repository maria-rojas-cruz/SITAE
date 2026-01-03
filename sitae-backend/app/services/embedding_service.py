from openai import OpenAI
from app.core.config import settings
from app.core.vector_store import get_vector_store, get_course_collection_name
from PyPDF2 import PdfReader
import logging
import uuid
from typing import List, Dict
import tiktoken

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.vector_store = get_vector_store()
        self.embedding_model = settings.EMBEDDING_MODEL
        
        # Para contar tokens
        self.encoding = tiktoken.encoding_for_model("gpt-4")
        
    def _chunk_text(self, text: str, max_tokens: int = 500, overlap: int = 50) -> List[str]:
        """
        Divide texto en chunks con overlap para no perder contexto.
        """
        words = text.split()
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for word in words:
            word_tokens = len(self.encoding.encode(word))
            
            if current_tokens + word_tokens > max_tokens and current_chunk:
                # Guardar chunk actual
                chunks.append(" ".join(current_chunk))
                
                # Empezar nuevo chunk con overlap
                overlap_words = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_words + [word]
                current_tokens = sum(len(self.encoding.encode(w)) for w in current_chunk)
            else:
                current_chunk.append(word)
                current_tokens += word_tokens
        
        # Último chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extrae texto de un PDF"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extrayendo texto de PDF {file_path}: {e}")
            raise
    
    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Genera embeddings para una lista de textos"""
        try:
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"Error generando embeddings: {e}")
            raise
    
    def process_document(
        self, 
        course_id: str, 
        document_id: str,
        file_path: str,
        document_type: str,
        title: str
    ) -> int:
        """
        Procesa un documento y guarda sus embeddings en ChromaDB.
        
        Returns:
            int: Número de chunks generados
        """
        try:
            # 1. Extraer texto según tipo
            if document_type == "pdf":
                text = self._extract_text_from_pdf(file_path)
            elif document_type == "code":
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                logger.warning(f"Tipo de documento {document_type} no soportado para embeddings")
                return 0
            
            # 2. Dividir en chunks
            chunks = self._chunk_text(text)
            logger.info(f"Documento {title} dividido en {len(chunks)} chunks")
            
            if not chunks:
                return 0
            
            # 3. Generar embeddings
            embeddings = self._generate_embeddings(chunks)
            
            # 4. Guardar en ChromaDB
            collection_name = get_course_collection_name(course_id)
            collection = self.vector_store.get_or_create_collection(name=collection_name)
            
            # IDs únicos para cada chunk
            chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Metadatos para cada chunk
            metadatas = [
                {
                    "document_id": document_id,
                    "document_title": title,
                    "document_type": document_type,
                    "chunk_index": i,
                    "course_id": course_id
                }
                for i in range(len(chunks))
            ]
            
            collection.add(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas
            )
            
            logger.info(f"✅ {len(chunks)} chunks guardados para documento {title}")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error procesando documento {title}: {e}")
            raise
    
    def search_similar_content(
        self, 
        course_id: str, 
        query: str, 
        n_results: int = 5
    ) -> Dict:
        """
        Busca contenido similar a la query en el curso.
        
        Returns:
            Dict con documents, metadatas y distances
        """
        try:
            # Generar embedding de la query
            query_embedding = self._generate_embeddings([query])[0]
            
            # Buscar en la colección del curso
            collection_name = get_course_collection_name(course_id)
            collection = self.vector_store.get_collection(name=collection_name)
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            return {
                "documents": results["documents"][0] if results["documents"] else [],
                "metadatas": results["metadatas"][0] if results["metadatas"] else [],
                "distances": results["distances"][0] if results["distances"] else []
            }
            
        except Exception as e:
            logger.error(f"Error buscando contenido similar: {e}")
            # Si no existe la colección, retornar vacío
            return {"documents": [], "metadatas": [], "distances": []}