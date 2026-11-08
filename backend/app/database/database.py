"""
SQLite Database Layer for AI Knowledge Assistant
=================================================
Manages persistent relational metadata for uploaded documents, chunks,
chat conversations, user messages, and RAG evaluation benchmarks.
"""

import sqlite3
import json
from contextlib import contextmanager
from typing import Generator, Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    """
    Establish a thread-safe connection to the SQLite database
    configured with WAL mode and foreign key enforcement.
    """
    conn = sqlite3.connect(str(settings.DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for safely executing transactional queries."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    """
    Initialize SQLite database tables and indexes if they do not already exist.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Documents Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                chunk_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'processed',
                upload_date TEXT NOT NULL,
                metadata_json TEXT DEFAULT '{}'
            );
        """)
        
        # 2. Document Chunks Table (for relational tracking and keyword search)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                page INTEGER DEFAULT 1,
                chunk_index INTEGER NOT NULL,
                text TEXT NOT NULL,
                char_count INTEGER NOT NULL,
                metadata_json TEXT DEFAULT '{}',
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            );
        """)
        
        # 3. Conversations Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        
        # 4. Chat Messages Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations_json TEXT DEFAULT '[]',
                rag_metadata_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
            );
        """)
        
        # 5. RAG Evaluation Metrics Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluations (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                expected_answer TEXT NOT NULL,
                generated_answer TEXT NOT NULL,
                relevant_document TEXT NOT NULL,
                relevant_page INTEGER DEFAULT 1,
                precision_at_k REAL DEFAULT 0.0,
                recall_at_k REAL DEFAULT 0.0,
                faithfulness_score REAL DEFAULT 0.0,
                answer_relevance_score REAL DEFAULT 0.0,
                retrieval_latency_ms REAL DEFAULT 0.0,
                generation_latency_ms REAL DEFAULT 0.0,
                total_latency_ms REAL DEFAULT 0.0,
                created_at TEXT NOT NULL
            );
        """)
        
        # Create helpful indexes for rapid retrieval
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks (document_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages (conversation_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_evals_created ON evaluations (created_at);")

# Initialize tables on import
init_db()
