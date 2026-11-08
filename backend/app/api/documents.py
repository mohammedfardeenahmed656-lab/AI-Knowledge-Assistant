"""
API Router: Document Management & Ingestion Pipeline
====================================================
Handles multi-format document uploads, validation, text extraction,
cleaning, recursive chunking, embedding generation, and vector indexing.
"""

import time
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List
from app.config import settings
from app.schemas.schemas import DocumentResponse, DocumentDetail, DocumentUploadResponse, ChunkInfo
from app.rag.loader import DocumentLoader, DocumentValidationError, DocumentExtractionError
from app.rag.cleaner import TextCleaner
from app.rag.chunker import RecursiveCharacterChunker
from app.rag.embeddings import embedding_engine
from app.rag.vector_store import vector_store
from app.rag.retriever import retriever
from app.database.models import (
    create_document_record,
    get_document,
    list_all_documents,
    delete_document_record,
    insert_chunks_records,
    get_chunks_for_document
)

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Ingest a new document through the 6-step RAG pipeline:
      1. Validation (type, size, empty file checks)
      2. Text extraction (PDF, DOCX, TXT, MD)
      3. Text normalization (preserving headings, tables, and lists)
      4. Recursive character chunking
      5. Embedding generation
      6. Vector database indexing (ChromaDB + SQLite)
    """
    start_time = time.perf_counter()
    filename = file.filename or "unknown_file.txt"
    extension = Path(filename).suffix.lower()
    
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{extension}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    # Save file to disk
    save_path = settings.UPLOAD_PATH / filename
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(exc)}"
        )
        
    try:
        # Step 1 & 2: Load and validate document
        raw_pages = DocumentLoader.load_document(save_path, filename)
        
        # Step 3: Clean and normalize text
        cleaned_pages = TextCleaner.clean_pages(raw_pages)
        
        # Step 4: Recursive chunking
        chunker = RecursiveCharacterChunker(
            chunk_size=settings.DEFAULT_CHUNK_SIZE,
            chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP
        )
        
        # We need a document ID to associate chunks
        import uuid
        document_id = str(uuid.uuid4())
        chunks = chunker.chunk_document(cleaned_pages, document_id, filename)
        
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No valid text chunks could be extracted from '{filename}'."
            )
            
        # Step 5: Generate vector embeddings for every chunk
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedding_engine.embed_batch(chunk_texts)
        
        # Create parent document record first (to satisfy SQLite foreign keys)
        file_size = save_path.stat().st_size
        doc_record = create_document_record(
            filename=filename,
            file_type=extension,
            file_size_bytes=file_size,
            chunk_count=len(chunks),
            metadata={"pages": len(cleaned_pages), "chunk_size": settings.DEFAULT_CHUNK_SIZE},
            doc_id=document_id
        )

        # Step 6: Store in Vector DB (ChromaDB) and SQLite relational store
        vector_store.add_chunks(chunks, embeddings)
        insert_chunks_records(chunks)
        
        # Refresh BM25 keyword index so new chunks are immediately searchable
        retriever.refresh_keyword_index()
        
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        return DocumentUploadResponse(
            success=True,
            document=DocumentResponse(**doc_record),
            message=f"Successfully processed and indexed '{filename}' into {len(chunks)} chunks.",
            processing_time_ms=round(duration_ms, 2)
        )
        
    except DocumentValidationError as err:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except DocumentExtractionError as err:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(err))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion pipeline failure: {str(exc)}"
        )

@router.get("", response_model=List[DocumentResponse])
async def list_documents():
    """Retrieve all ingested documents."""
    docs = list_all_documents()
    return [DocumentResponse(**d) for d in docs]

@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document_details(document_id: str):
    """Retrieve metadata and chunk excerpts for a specific document."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    chunks = get_chunks_for_document(document_id)
    return DocumentDetail(
        **doc,
        chunks=[ChunkInfo(**c) for c in chunks]
    )

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str):
    """Delete a document, its chunks from SQLite, and its vectors from ChromaDB."""
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    # Remove vectors from ChromaDB
    vector_store.delete_document_chunks(document_id)
    
    # Remove record from SQLite
    delete_document_record(document_id)
    
    # Remove local file on disk if exists
    file_on_disk = settings.UPLOAD_PATH / doc["filename"]
    if file_on_disk.exists():
        try:
            file_on_disk.unlink()
        except Exception:
            pass
            
    # Refresh BM25 keyword index
    retriever.refresh_keyword_index()
    
    return {"message": f"Document '{doc['filename']}' and its vector embeddings deleted successfully."}