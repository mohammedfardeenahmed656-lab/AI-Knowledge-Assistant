"""
RAG Pipeline Component: Document Loader & Validator
===================================================

Educational Overview:
---------------------
Why is a Document Loader needed in RAG?
Before an AI can search documents, raw bytes on disk must be parsed into clean,
structured text. Different file formats store text in radically different structures:
  - TXT / Markdown: Plain UTF-8 characters with simple formatting syntax.
  - PDF (Portable Document Format): A visual layout specification designed for printing.
    Text in a PDF is positioned with XY coordinates on pages rather than a continuous stream.
    Parsing requires extracting page boundaries and reconstructing reading order.
  - DOCX (Microsoft Word): A zipped archive of XML files. Text is distributed across
    paragraphs, runs, and table cells.

Step 1: File Validation:
  - Validates file extensions (.pdf, .txt, .docx, .md).
  - Enforces maximum file size limit to prevent memory exhaustion / DoS attacks.
  - Detects and rejects empty or corrupt 0-byte uploads.

Step 2: Common Document Representation:
  Regardless of the source format, the loader yields standardized page-level dictionaries:
  {
      "text": "Extracted text content...",
      "source": "quarterly_report.pdf",
      "page": 1,
      "metadata": {
          "filename": "quarterly_report.pdf",
          "file_type": ".pdf",
          "file_size_bytes": 102400,
          "page_number": 1,
          "total_pages": 12
      }
  }
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.config import settings

class DocumentValidationError(Exception):
    """Raised when an uploaded document fails security or format validation."""
    pass

class DocumentExtractionError(Exception):
    """Raised when text extraction fails on a corrupt or unreadable file."""
    pass

class DocumentLoader:
    """
    Standardized multi-format document loader and validator.
    Extracts text from PDF, DOCX, TXT, and Markdown files while preserving
    page numbers and structural metadata.
    """
    
    @staticmethod
    def validate_file(file_path: Path, filename: str) -> Tuple[str, int]:
        """
        Validate file extension, existence, and size constraints.
        Returns (clean_extension, file_size_bytes).
        """
        if not file_path.exists():
            raise DocumentValidationError(f"File not found on server: {filename}")
            
        file_size = file_path.stat().st_size
        if file_size == 0:
            raise DocumentValidationError(f"Uploaded file '{filename}' is empty (0 bytes).")
            
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise DocumentValidationError(
                f"File size ({file_size / (1024 * 1024):.1f} MB) exceeds maximum allowed limit of {max_mb} MB."
            )
            
        extension = Path(filename).suffix.lower()
        if extension not in settings.ALLOWED_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise DocumentValidationError(
                f"Unsupported file type '{extension}'. Supported formats are: {allowed}"
            )
            
        return extension, file_size

    @classmethod
    def load_document(cls, file_path: Path, filename: str) -> List[Dict[str, Any]]:
        """
        Main entry point: validates file and extracts text into common representation list.
        """
        extension, file_size = cls.validate_file(file_path, filename)
        
        try:
            if extension == ".pdf":
                pages = cls._load_pdf(file_path, filename, file_size)
            elif extension == ".docx":
                pages = cls._load_docx(file_path, filename, file_size)
            elif extension in [".txt", ".md"]:
                pages = cls._load_text_or_markdown(file_path, filename, file_size, extension)
            else:
                raise DocumentValidationError(f"Handler missing for format: {extension}")
                
            # Filter out pages that ended up completely blank
            valid_pages = [p for p in pages if p["text"].strip()]
            if not valid_pages:
                raise DocumentExtractionError(
                    f"No extractable text found in '{filename}'. "
                    "If this is a scanned PDF, optical character recognition (OCR) is required."
                )
                
            return valid_pages
            
        except (DocumentValidationError, DocumentExtractionError):
            raise
        except Exception as exc:
            raise DocumentExtractionError(f"Failed to parse document '{filename}': {str(exc)}") from exc

    @staticmethod
    def _load_pdf(file_path: Path, filename: str, file_size: int) -> List[Dict[str, Any]]:
        """Extract text from PDF pages using pypdf."""
        try:
            from pypdf import PdfReader
        except ImportError:
            raise DocumentExtractionError("pypdf is required to extract PDF documents. Run: pip install pypdf")
            
        pages: List[Dict[str, Any]] = []
        reader = PdfReader(str(file_path))
        total_pages = len(reader.pages)
        
        for idx, page in enumerate(reader.pages):
            page_number = idx + 1
            extracted_text = page.extract_text() or ""
            pages.append({
                "text": extracted_text,
                "source": filename,
                "page": page_number,
                "metadata": {
                    "filename": filename,
                    "file_type": ".pdf",
                    "file_size_bytes": file_size,
                    "page_number": page_number,
                    "total_pages": total_pages
                }
            })
        return pages

    @staticmethod
    def _load_docx(file_path: Path, filename: str, file_size: int) -> List[Dict[str, Any]]:
        """Extract text and table content from Microsoft Word .docx files."""
        try:
            import docx
        except ImportError:
            raise DocumentExtractionError("python-docx is required to extract DOCX files. Run: pip install python-docx")
            
        doc = docx.Document(str(file_path))
        full_text_blocks: List[str] = []
        
        # Extract standard paragraphs
        for para in doc.paragraphs:
            if para.text.strip():
                full_text_blocks.append(para.text.strip())
                
        # Extract tables if present
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    full_text_blocks.append(" | ".join(row_cells))
                    
        combined_text = "\n\n".join(full_text_blocks)
        return [{
            "text": combined_text,
            "source": filename,
            "page": 1,
            "metadata": {
                "filename": filename,
                "file_type": ".docx",
                "file_size_bytes": file_size,
                "page_number": 1,
                "total_pages": 1
            }
        }]

    @staticmethod
    def _load_text_or_markdown(file_path: Path, filename: str, file_size: int, extension: str) -> List[Dict[str, Any]]:
        """Extract plain text and Markdown files with encoding fallback."""
        text_content = ""
        # Try UTF-8 first, fallback to Latin-1
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text_content = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1") as f:
                text_content = f.read()
                
        return [{
            "text": text_content,
            "source": filename,
            "page": 1,
            "metadata": {
                "filename": filename,
                "file_type": extension,
                "file_size_bytes": file_size,
                "page_number": 1,
                "total_pages": 1
            }
        }]
