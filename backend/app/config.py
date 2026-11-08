"""
Configuration Module for AI Knowledge Assistant (RAG Pipeline)
==============================================================
Manages environment variables, default hyperparameters, storage paths,
and LLM/embedding provider credentials.
"""

import os
from pathlib import Path
from typing import List

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma"
SQLITE_DB_PATH = DATA_DIR / "rag_assistant.db"

# Create persistence directories if they don't exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    """
    Central application settings loaded from environment variables
    with production-grade defaults.
    """
    APP_NAME: str = "AI Knowledge Assistant"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    BASE_DIR: Path = BASE_DIR
    
    # Storage Paths
    UPLOAD_PATH: Path = UPLOAD_DIR
    CHROMA_PERSIST_DIRECTORY: Path = CHROMA_DIR
    DATABASE_PATH: Path = SQLITE_DB_PATH
    
    # Document Ingestion Security & Limits
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".docx", ".md"]
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB limit
    
    # Chunking Hyperparameters
    # chunk_size: number of characters per chunk.
    # chunk_overlap: number of overlapping characters between consecutive chunks.
    DEFAULT_CHUNK_SIZE: int = int(os.getenv("DEFAULT_CHUNK_SIZE", "500"))
    DEFAULT_CHUNK_OVERLAP: int = int(os.getenv("DEFAULT_CHUNK_OVERLAP", "100"))
    
    # Retrieval Hyperparameters
    # top_k: number of nearest neighbor chunks retrieved.
    # similarity_threshold: minimum cosine similarity score to qualify context.
    DEFAULT_TOP_K: int = int(os.getenv("DEFAULT_TOP_K", "4"))
    DEFAULT_SIMILARITY_THRESHOLD: float = float(os.getenv("DEFAULT_SIMILARITY_THRESHOLD", "0.20"))
    
    # Hybrid Search Weighting (Dense Vector vs Sparse BM25 Keyword)
    # alpha = 1.0 -> purely dense vector semantic search
    # alpha = 0.0 -> purely sparse keyword BM25 search
    # alpha = 0.7 -> balanced semantic focus with exact-keyword boosting
    DEFAULT_HYBRID_ALPHA: float = float(os.getenv("DEFAULT_HYBRID_ALPHA", "0.7"))
    
    # AI Providers & Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Preferred Model Configurations
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # Server Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
