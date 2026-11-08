"""
API Router: Dashboard Statistics & System Health
================================================
Aggregates overall knowledge base metrics: total documents, chunks, conversations,
questions answered, and average retrieval/response latencies.
"""

from fastapi import APIRouter
from app.schemas.schemas import DashboardStats, DocumentResponse, ConversationSummary
from app.database.models import get_dashboard_metrics, list_all_documents, list_conversations_records
from app.rag.embeddings import embedding_engine
from app.rag.generator import answer_generator
from app.rag.vector_store import vector_store

router = APIRouter(prefix="/stats", tags=["Dashboard"])

@router.get("", response_model=DashboardStats)
async def get_dashboard_stats():
    """Retrieve comprehensive platform metrics for the SaaS dashboard."""
    metrics = get_dashboard_metrics()
    all_docs = list_all_documents()
    all_convs = list_conversations_records()
    
    return DashboardStats(
        total_documents=metrics["total_documents"],
        total_chunks=metrics["total_chunks"],
        total_conversations=metrics["total_conversations"],
        total_questions_answered=metrics["total_questions_answered"],
        avg_retrieval_time_ms=metrics["avg_retrieval_time_ms"],
        avg_response_time_ms=metrics["avg_response_time_ms"],
        active_llm_provider=f"{answer_generator.provider_name} ({answer_generator.model_name})",
        active_embedding_model=f"{embedding_engine.provider_name} ({embedding_engine.model_name})",
        vector_store_type="ChromaDB Persistent (HNSW)" if vector_store.is_chroma_active else "Resilient Vector Engine",
        recent_documents=[DocumentResponse(**d) for d in all_docs[:5]],
        recent_conversations=[ConversationSummary(**c) for c in all_convs[:5]]
    )