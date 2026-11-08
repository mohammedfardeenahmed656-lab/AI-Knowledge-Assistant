"""
RAG Pipeline Component: Vector Store Manager (ChromaDB + Resilient Fallback)
=============================================================================

Educational Overview:
---------------------
What is a Vector Database?
A traditional database (like PostgreSQL or SQLite) uses B-Trees to index exact values:
  - `WHERE id = 5` or `WHERE date > '2026-01-01'`
This completely fails for semantic comparison. A Vector Database indexes continuous
geometric vectors using algorithms like HNSW (Hierarchical Navigable Small World graphs).

Why is a Vector Database needed?
In a RAG application with 10,000 document chunks, calculating the exact cosine distance
between a user query vector and all 10,000 chunk vectors one-by-one is computationally
feasible, but as documents scale to millions of chunks, brute-force search becomes too slow.
Vector databases build an Approximate Nearest Neighbor (ANN) index that navigates through
multi-dimensional space in logarithmic time O(log N).

Storage Anatomy in Vector Stores:
---------------------------------
Every vector entry stores 4 distinct components:
  1. ID: Unique chunk identifier (`doc1_c0_abc123`)
  2. Vector / Embedding: [0.124, -0.441, ...] (dense float array)
  3. Document Content: The raw chunk text needed by the LLM
  4. Metadata: Dictionary with `filename`, `page`, `chunk_index`, `document_id`
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from app.config import settings

class VectorStoreManager:
    """
    Manages embedding persistence and approximate nearest neighbor retrieval
    via ChromaDB with transparent fallback to numpy-accelerated SQLite vector indexing.
    """
    
    def __init__(self, collection_name: str = "rag_knowledge_assistant"):
        self.collection_name = collection_name
        self.persist_directory = str(settings.CHROMA_PERSIST_DIRECTORY)
        self.chroma_client = None
        self.collection = None
        self._use_fallback = False
        self._init_chroma()

    def _init_chroma(self) -> None:
        """Attempt to initialize ChromaDB persistent client."""
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            
            self.chroma_client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            print(f"[VectorStore] ChromaDB initialized at '{self.persist_directory}' (Collection: {self.collection_name})")
        except Exception as err:
            print(f"[VectorStore] ChromaDB native init warning ({err}). Operating in Resilient Vector Mode.")
            self._use_fallback = True

    @property
    def is_chroma_active(self) -> bool:
        return not self._use_fallback and self.collection is not None

    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> None:
        """
        Store chunk text, vector embeddings, and metadata into the vector database.
        """
        if not chunks:
            return
            
        ids = [c["chunk_id"] for c in chunks]
        texts = [c["text"] for c in chunks]
        metadatas = [
            {
                "document_id": str(c["document_id"]),
                "filename": str(c["filename"]),
                "page": int(c.get("page", 1)),
                "chunk_index": int(c["chunk_index"])
            }
            for c in chunks
        ]
        
        if self.is_chroma_active:
            try:
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
                return
            except Exception as e:
                print(f"[VectorStore] Chroma upsert error ({e}), storing in resilient table.")
                
        # Resilient SQLite fallback storage for vectors
        self._resilient_upsert(chunks, embeddings)

    def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query vector database for Top-K chunks nearest to query_embedding.
        Returns list of matched chunks with cosine similarity score.
        """
        if self.is_chroma_active:
            try:
                where_filter = {"document_id": document_id} if document_id else None
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=where_filter,
                    include=["documents", "metadatas", "distances"]
                )
                
                matched_chunks: List[Dict[str, Any]] = []
                if results and results.get("ids") and results["ids"][0]:
                    ids = results["ids"][0]
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    distances = results["distances"][0]
                    
                    for idx, chunk_id in enumerate(ids):
                        # Chroma cosine distance = 1.0 - cosine_similarity
                        # So cosine_similarity = 1.0 - distance
                        distance = distances[idx] if distances else 0.0
                        similarity = max(0.0, min(1.0, 1.0 - distance))
                        meta = metas[idx] or {}
                        
                        matched_chunks.append({
                            "chunk_id": chunk_id,
                            "document_id": meta.get("document_id", ""),
                            "filename": meta.get("filename", ""),
                            "page": int(meta.get("page", 1)),
                            "chunk_index": int(meta.get("chunk_index", 0)),
                            "text": docs[idx],
                            "similarity_score": round(float(similarity), 4),
                            "rank": idx + 1,
                            "match_source": "vector"
                        })
                    return matched_chunks
            except Exception as err:
                print(f"[VectorStore] Chroma query error ({err}), falling back to resilient search.")
                
        return self._resilient_search(query_embedding, top_k, document_id)

    def delete_document_chunks(self, document_id: str) -> None:
        """Remove all chunks associated with a specific document."""
        if self.is_chroma_active:
            try:
                self.collection.delete(where={"document_id": document_id})
            except Exception as err:
                print(f"[VectorStore] Chroma delete error: {err}")
                
        # Clean resilient table
        from app.database.database import get_db
        with get_db() as conn:
            conn.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))

    def count(self) -> int:
        """Return total number of vectors indexed in the collection."""
        if self.is_chroma_active:
            try:
                return self.collection.count()
            except Exception:
                pass
        from app.database.database import get_db
        with get_db() as conn:
            cur = conn.execute("SELECT COUNT(*) FROM chunks")
            return cur.fetchone()[0]

    # -----------------------------------------------------------------------
    # Resilient Fallback Engine
    # -----------------------------------------------------------------------
    def _resilient_upsert(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        """Store vectors in SQLite chunk metadata for exact cosine calculation."""
        from app.database.database import get_db
        with get_db() as conn:
            for c, emb in zip(chunks, embeddings):
                meta = c.get("metadata", {})
                meta["_embedding"] = emb
                conn.execute(
                    "UPDATE chunks SET metadata_json = ? WHERE id = ?",
                    (json.dumps(meta), c["chunk_id"])
                )

    def _resilient_search(
        self,
        query_embedding: List[float],
        top_k: int,
        document_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Exact Cosine Similarity search over SQLite chunk records using numpy."""
        from app.database.database import get_db
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm < 1e-9:
            return []
            
        with get_db() as conn:
            if document_id:
                cur = conn.execute("SELECT * FROM chunks WHERE document_id = ?", (document_id,))
            else:
                cur = conn.execute("SELECT * FROM chunks")
            rows = cur.fetchall()
            
        scored_candidates = []
        for r in rows:
            meta = json.loads(r["metadata_json"] or "{}")
            emb = meta.get("_embedding")
            if not emb:
                continue
            c_vec = np.array(emb, dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if c_norm < 1e-9:
                sim = 0.0
            else:
                sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            scored_candidates.append({
                "chunk_id": r["id"],
                "document_id": r["document_id"],
                "filename": r["filename"],
                "page": r["page"],
                "chunk_index": r["chunk_index"],
                "text": r["text"],
                "similarity_score": round(max(0.0, min(1.0, sim)), 4),
                "match_source": "vector"
            })
            
        scored_candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_candidates = scored_candidates[:top_k]
        for idx, item in enumerate(top_candidates):
            item["rank"] = idx + 1
        return top_candidates

# Singleton vector store instance
vector_store = VectorStoreManager()
