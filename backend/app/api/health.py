"""
API Router: Health Check & System Diagnostics
=============================================
Provides health status, active embedding engine, LLM provider, and vector store details.
"""

from datetime import datetime
from fastapi import APIRouter
from app.config import settings
from app.schemas.schemas import HealthResponse
from app.rag.embeddings import embedding_engine
from app.rag.generator import answer_generator
from app.rag.vector_store import vector_store

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check endpoint."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        database="SQLite (WAL Mode)",
        vector_store="ChromaDB" if vector_store.is_chroma_active else "Resilient SQLite Vector",
        embedding_provider=embedding_engine.provider_name,
        llm_provider=answer_generator.provider_name,
        timestamp=datetime.utcnow().isoformat()
    )