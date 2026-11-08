"""
Pydantic Schemas for AI Knowledge Assistant
============================================
Data validation contracts for API request bodies and response payloads.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ---------------------------------------------------------
# Document Models
# ---------------------------------------------------------
class ChunkMetadata(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    page: int = 1
    chunk_index: int
    char_count: int
    char_start: int = 0
    char_end: int = 0

class ChunkInfo(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    page: int
    chunk_index: int
    text: str
    char_count: int

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    status: str
    upload_date: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentDetail(DocumentResponse):
    chunks: List[ChunkInfo] = Field(default_factory=list)

class DocumentUploadResponse(BaseModel):
    success: bool
    document: DocumentResponse
    message: str
    processing_time_ms: float

# ---------------------------------------------------------
# Retrieval & Search Models
# ---------------------------------------------------------
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query string")
    top_k: int = Field(default=4, ge=1, le=20)
    similarity_threshold: float = Field(default=0.0, ge=0.0, le=1.0)
    mode: str = Field(default="hybrid", description="'vector', 'keyword', or 'hybrid'")
    hybrid_alpha: float = Field(default=0.7, ge=0.0, le=1.0)
    document_id: Optional[str] = None

class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    page: int
    chunk_index: int
    text: str
    similarity_score: float
    rank: int
    match_source: str = "vector"  # "vector", "keyword", or "hybrid"

class SearchResponse(BaseModel):
    query: str
    mode: str
    total_results: int
    chunks: List[RetrievedChunk]
    retrieval_latency_ms: float
    debug_explanation: Optional[str] = None

# ---------------------------------------------------------
# Citation & RAG Debugging Models
# ---------------------------------------------------------
class Citation(BaseModel):
    index: int
    document_id: str
    filename: str
    page: int
    chunk_id: str
    preview_text: str

class RAGProcessDebug(BaseModel):
    question: str
    query_embedding_dimension: int
    query_embedding_preview: List[float]
    retrieval_mode: str
    retrieved_chunks_count: int
    retrieved_chunks: List[RetrievedChunk]
    constructed_context: str
    prompt_template_used: str
    llm_provider: str
    llm_model: str
    generation_latency_ms: float
    retrieval_latency_ms: float
    total_latency_ms: float
    citations: List[Citation]

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    top_k: int = Field(default=4, ge=1, le=20)
    similarity_threshold: float = Field(default=0.20, ge=0.0, le=1.0)
    search_mode: str = Field(default="hybrid", description="'vector', 'keyword', or 'hybrid'")
    hybrid_alpha: float = Field(default=0.7, ge=0.0, le=1.0)
    document_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    citations: List[Citation]
    retrieved_chunks: List[RetrievedChunk]
    rag_process: RAGProcessDebug
    conversation_history_length: int

# ---------------------------------------------------------
# Conversation Management Models
# ---------------------------------------------------------
class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    citations: List[Citation] = Field(default_factory=list)
    rag_metadata: Optional[Dict[str, Any]] = None
    created_at: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageItem]

# ---------------------------------------------------------
# Evaluation & Benchmark Models
# ---------------------------------------------------------
class EvaluationItem(BaseModel):
    id: Optional[str] = None
    question: str
    expected_answer: str
    relevant_document: str
    relevant_page: int

class EvaluationRunRequest(BaseModel):
    top_k: int = Field(default=4, ge=1, le=10)
    similarity_threshold: float = Field(default=0.20, ge=0.0, le=1.0)
    mode: str = Field(default="hybrid")
    hybrid_alpha: float = Field(default=0.7)

class SingleEvaluationResult(BaseModel):
    question: str
    expected_answer: str
    generated_answer: str
    relevant_document: str
    relevant_page: int
    retrieved_documents: List[str]
    retrieved_pages: List[int]
    precision_at_k: float
    recall_at_k: float
    faithfulness_score: float
    answer_relevance_score: float
    retrieval_latency_ms: float
    generation_latency_ms: float
    total_latency_ms: float

class EvaluationSuiteResponse(BaseModel):
    run_timestamp: str
    total_test_cases: int
    mean_precision_at_k: float
    mean_recall_at_k: float
    mean_faithfulness_score: float
    mean_answer_relevance_score: float
    avg_retrieval_latency_ms: float
    avg_generation_latency_ms: float
    avg_total_latency_ms: float
    results: List[SingleEvaluationResult]

# ---------------------------------------------------------
# Dashboard Statistics Models
# ---------------------------------------------------------
class DashboardStats(BaseModel):
    total_documents: int
    total_chunks: int
    total_conversations: int
    total_questions_answered: int
    avg_retrieval_time_ms: float
    avg_response_time_ms: float
    active_llm_provider: str
    active_embedding_model: str
    vector_store_type: str
    recent_documents: List[DocumentResponse]
    recent_conversations: List[ConversationSummary]

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    database: str
    vector_store: str
    embedding_provider: str
    llm_provider: str
    timestamp: str
