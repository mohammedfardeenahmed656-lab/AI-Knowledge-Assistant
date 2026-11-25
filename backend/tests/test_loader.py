"""
Unit Tests: Document Loader & Validator
"""

import pytest
from pathlib import Path
from app.rag.loader import DocumentLoader, DocumentValidationError

def test_load_markdown_document(tmp_path):
    sample_file = tmp_path / "test_doc.md"
    sample_file.write_text("# Title\n\nThis is a sample markdown file for RAG testing.", encoding="utf-8")
    
    pages = DocumentLoader.load_document(sample_file, "test_doc.md")
    assert len(pages) == 1
    assert pages[0]["source"] == "test_doc.md"
    assert pages[0]["page"] == 1
    assert "sample markdown file" in pages[0]["text"]
    assert pages[0]["metadata"]["file_type"] == ".md"

def test_empty_file_validation_error(tmp_path):
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("", encoding="utf-8")
    
    with pytest.raises(DocumentValidationError):
        DocumentLoader.load_document(empty_file, "empty.txt")

def test_unsupported_file_extension(tmp_path):
    bad_file = tmp_path / "bad.exe"
    bad_file.write_bytes(b"not a valid doc")
    
    with pytest.raises(DocumentValidationError):
        DocumentLoader.load_document(bad_file, "bad.exe")

