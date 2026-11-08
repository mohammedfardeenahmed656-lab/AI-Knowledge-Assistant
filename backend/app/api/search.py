"""
API Router: Direct Retrieval & Search Lab
=========================================
Provides direct vector, keyword, and hybrid search endpoints for experimentation,
allowing users to observe differences between semantic embeddings and keyword matching.
"""

import time
from fastapi import APIRouter
from app.schemas.schemas import SearchRequest, SearchResponse, RetrievedChunk
from app.rag.retriever import retriever

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """
    Search document knowledge base using Vector, Keyword, or Hybrid search.
    Useful for testing retrieval independently of the LLM generation step.
    """
    start_time = time.perf_counter()
    
    results = retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        similarity_threshold=request.similarity_threshold,
        mode=request.mode,
        hybrid_alpha=request.hybrid_alpha,
        document_id=request.document_id
    )
    
    latency = (time.perf_counter() - start_time) * 1000.0
    
    explanation = ""
    if request.mode == "vector":
        explanation = f"Dense Vector Search computed cosine similarity across all indexed chunk embeddings using {retriever.bm25_searcher.total_docs} chunks."
    elif request.mode == "keyword":
        explanation = "Sparse BM25 Okapi search scored term frequencies, inverse document frequencies, and document length normalization."
    else:
        explanation = f"Hybrid search combined dense vector scores (weight: {request.hybrid_alpha}) and sparse BM25 scores (weight: {1.0 - request.hybrid_alpha:.2f})."
        
    return SearchResponse(
        query=request.query,
        mode=request.mode,
        total_results=len(results),
        chunks=[RetrievedChunk(**c) for c in results],
        retrieval_latency_ms=round(latency, 2),
        debug_explanation=explanation
    )