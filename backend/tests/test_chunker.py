"""
Unit Tests: Recursive Character Chunker
"""

import pytest
from app.rag.chunker import RecursiveCharacterChunker

def test_chunking_with_overlap():
    chunker = RecursiveCharacterChunker(chunk_size=100, chunk_overlap=20)
    
    sample_text = (
        "Retrieval-Augmented Generation improves LLMs by retrieving relevant context. "
        "Chunking breaks large documents into semantically coherent parts. "
        "Embeddings translate text chunks into high-dimensional vectors for similarity search."
    )
    pages = [{"text": sample_text, "page": 1}]
    
    chunks = chunker.chunk_document(pages, document_id="doc_123", filename="test.txt")
    
    assert len(chunks) > 1
    for c in chunks:
        assert c["document_id"] == "doc_123"
        assert c["filename"] == "test.txt"
        assert c["page"] == 1
        assert "chunk_id" in c
        assert len(c["text"]) > 0

def test_chunker_overlap_validation():
    with pytest.raises(ValueError):
        # chunk_overlap cannot be >= chunk_size
        RecursiveCharacterChunker(chunk_size=100, chunk_overlap=120)
