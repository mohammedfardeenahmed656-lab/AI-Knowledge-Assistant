"""
Main FastAPI Application Entrypoint
====================================
Configures middleware, API routers, lifecycle events, and automatic sample ingestion.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database.database import init_db
from app.database.models import list_all_documents
from app.api import documents, chat, search, evaluation, stats, health
from app.rag.loader import DocumentLoader
from app.rag.cleaner import TextCleaner
from app.rag.chunker import RecursiveCharacterChunker
from app.rag.embeddings import embedding_engine
from app.rag.vector_store import vector_store
from app.rag.retriever import retriever
from app.database.models import create_document_record, insert_chunks_records
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager:
      - Initializes SQLite schema
      - Checks if database has documents; if empty, ingests sample documents automatically!
    """
    init_db()
    
    # Auto-seed sample documents if no documents are present
    existing_docs = list_all_documents()
    if len(existing_docs) == 0:
        sample_dir = settings.BASE_DIR / "sample_data"
        if sample_dir.exists():
            print("[Startup] Seeding initial sample documents into knowledge base...")
            sample_files = list(sample_dir.glob("*.*"))
            for s_file in sample_files:
                if s_file.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                    try:
                        raw_pages = DocumentLoader.load_document(s_file, s_file.name)
                        cleaned = TextCleaner.clean_pages(raw_pages)
                        chunker = RecursiveCharacterChunker(
                            chunk_size=settings.DEFAULT_CHUNK_SIZE,
                            chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP
                        )
                        doc_id = str(uuid.uuid4())
                        chunks = chunker.chunk_document(cleaned, doc_id, s_file.name)
                        
                        create_document_record(
                            filename=s_file.name,
                            file_type=s_file.suffix.lower(),
                            file_size_bytes=s_file.stat().st_size,
                            chunk_count=len(chunks),
                            doc_id=doc_id
                        )
                        embeddings = embedding_engine.embed_batch([c["text"] for c in chunks])
                        vector_store.add_chunks(chunks, embeddings)
                        insert_chunks_records(chunks)
                        print(f"  ✓ Indexed '{s_file.name}' ({len(chunks)} chunks)")
                    except Exception as err:
                        print(f"  ✗ Failed to index sample file '{s_file.name}': {err}")
            retriever.refresh_keyword_index()
            print("[Startup] Sample data indexing complete.")
            
    yield
    print("[Shutdown] Cleaning up application resources.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade, educational Retrieval-Augmented Generation (RAG) platform with full pipeline inspectability.",
    lifespan=lifespan
)

# Enable Cross-Origin Resource Sharing (CORS) for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to return clean JSON error payloads
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Error] Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": request.url.path
        }
    )

# Mount API Routers
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(chat.router, prefix=settings.API_PREFIX)
app.include_router(search.router, prefix=settings.API_PREFIX)
app.include_router(evaluation.router, prefix=settings.API_PREFIX)
app.include_router(stats.router, prefix=settings.API_PREFIX)
app.include_router(health.router, prefix=settings.API_PREFIX)

# Serve compiled React frontend if present
from fastapi.staticfiles import StaticFiles
frontend_dist = settings.BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "documentation": "/docs",
            "health": "/api/health"
        }
