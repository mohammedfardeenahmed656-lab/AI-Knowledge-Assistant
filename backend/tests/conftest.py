"""
Pytest Fixtures for AI Knowledge Assistant
===========================================
Ensures SQLite schema is initialized and sample documents are indexed
before test execution.
"""

import pytest
from pathlib import Path
import uuid
from app.config import settings
from app.database.database import init_db
from app.database.models import list_all_documents, create_document_record, insert_chunks_records
from app.rag.loader import DocumentLoader
from app.rag.cleaner import TextCleaner
from app.rag.chunker import RecursiveCharacterChunker
from app.rag.embeddings import embedding_engine
from app.rag.vector_store import vector_store
from app.rag.retriever import retriever

@pytest.fixture(scope="session", autouse=True)
def seed_test_database():
    """Ensure database schema is created and sample documents are indexed."""
    init_db()
    existing = list_all_documents()
    if len(existing) == 0:
        sample_dir = settings.BASE_DIR / "sample_data"
        if sample_dir.exists():
            for s_file in sample_dir.glob("*.*"):
                if s_file.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                    pages = DocumentLoader.load_document(s_file, s_file.name)
                    cleaned = TextCleaner.clean_pages(pages)
                    chunker = RecursiveCharacterChunker(chunk_size=500, chunk_overlap=100)
                    doc_id = str(uuid.uuid4())
                    chunks = chunker.chunk_document(cleaned, doc_id, s_file.name)
                    embeddings = embedding_engine.embed_batch([c["text"] for c in chunks])
                    
                    create_document_record(
                        filename=s_file.name,
                        file_type=s_file.suffix.lower(),
                        file_size_bytes=s_file.stat().st_size,
                        chunk_count=len(chunks),
                        doc_id=doc_id
                    )
                    vector_store.add_chunks(chunks, embeddings)
                    insert_chunks_records(chunks)
            retriever.refresh_keyword_index()
    yield
