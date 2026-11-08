"""
RAG Pipeline Component: Hybrid Document Retriever
=================================================

Educational Deep-Dive:
----------------------
1. How Retrieval Works:
   When a user submits a query:
     User Question ──> Embeddings Model ──> Query Vector [0.12, -0.44, ...]
                                                  │
                                                  ▼
     Vector Database ANN Search (Cosine Similarity vs all Chunk Vectors)
                                                  │
                                                  ▼
     Top-K Most Relevant Context Chunks (sorted by descending similarity score)

2. Why Vector Search Alone Isn't Always Enough (The Need for Hybrid Search):
   - Dense Vector Search (Semantic):
     * Strengths: Understands synonyms, conceptual queries, intent, paraphrased language.
       Query: "Canines barking outdoors" ──> Matches: "Dogs making loud noises in the yard".
     * Weaknesses: Struggles with exact product codes, acronyms, variable names, serial numbers.
       Query: "Error ERR-9421 in auth.py" ──> May retrieve generic auth discussions rather
       than the specific error code line!
       
   - Sparse Keyword Search (BM25 / TF-IDF):
     * Strengths: Exact token matching, rare identifiers, specific nomenclature, acronyms.
     * Weaknesses: Zero synonym comprehension, fails if query and document use different words.

3. Hybrid Search: The Best of Both Worlds:
   We combine Dense Semantic Vectors and Sparse BM25 Keywords using:
     Final_Score = (alpha * Dense_Score) + ((1 - alpha) * Sparse_Score)
   - When alpha = 0.7: Strong semantic prioritization with strict keyword anchor boosting.
   - Reciprocal Rank Fusion (RRF) also re-ranks items by their reciprocal ranks across both lists:
     RRF(d) = 1 / (k + rank_dense) + 1 / (k + rank_sparse)
"""

import math
import re
from typing import List, Dict, Any, Optional
from app.rag.embeddings import embedding_engine
from app.rag.vector_store import vector_store
from app.database.models import get_all_chunks
from app.config import settings

class BM25KeywordSearcher:
    """
    Lightweight, fast in-memory BM25 Okapi searcher for sparse keyword retrieval.
    Computes Term Frequency - Inverse Document Frequency (TF-IDF) with document length normalization.
    """
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_chunks: List[Dict[str, Any]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_len: float = 0.0
        self.doc_freqs: Dict[str, int] = {}
        self.total_docs: int = 0
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-zA-Z0-9_\-\.]{2,}\b', text.lower())

    def _build_index(self) -> None:
        """Fetch all chunks from database and compute BM25 vocabulary statistics."""
        chunks = get_all_chunks()
        self.corpus_chunks = chunks
        self.total_docs = len(chunks)
        if self.total_docs == 0:
            self.avg_doc_len = 0.0
            return
            
        total_len = 0
        self.doc_freqs.clear()
        self.doc_lengths.clear()
        
        for c in chunks:
            tokens = self._tokenize(c["text"])
            doc_len = len(tokens)
            self.doc_lengths.append(doc_len)
            total_len += doc_len
            
            seen_tokens = set(tokens)
            for t in seen_tokens:
                self.doc_freqs[t] = self.doc_freqs.get(t, 0) + 1
                
        self.avg_doc_len = total_len / float(self.total_docs) if self.total_docs > 0 else 1.0

    def search(self, query: str, top_k: int = 4, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Compute BM25 score for all chunks matching the query string."""
        if not self.corpus_chunks:
            self._build_index()
            
        if self.total_docs == 0:
            return []
            
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
            
        scores = []
        for idx, chunk in enumerate(self.corpus_chunks):
            if document_id and chunk["document_id"] != document_id:
                continue
                
            chunk_tokens = self._tokenize(chunk["text"])
            doc_len = self.doc_lengths[idx]
            
            # Count term frequencies in this chunk
            tf_map: Dict[str, int] = {}
            for t in chunk_tokens:
                tf_map[t] = tf_map.get(t, 0) + 1
                
            chunk_score = 0.0
            for qt in query_tokens:
                if qt not in tf_map:
                    continue
                tf = tf_map[qt]
                df = self.doc_freqs.get(qt, 0)
                # BM25 IDF formulation
                idf = math.log((self.total_docs - df + 0.5) / (df + 0.5) + 1.0)
                # BM25 term weighting with length normalization
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / (self.avg_doc_len or 1.0)))
                chunk_score += idf * (numerator / denominator)
                
            if chunk_score > 0.0:
                scores.append((chunk, chunk_score))
                
        # Sort descending by BM25 score
        scores.sort(key=lambda x: x[1], reverse=True)
        top_matches = scores[:top_k]
        
        # Normalize top score to 0.0 - 1.0 range for seamless combination with vector similarity
        max_score = top_matches[0][1] if top_matches else 1.0
        results = []
        for rank, (chunk, score) in enumerate(top_matches):
            normalized_score = min(1.0, score / (max_score + 1e-6))
            results.append({
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "filename": chunk["filename"],
                "page": chunk["page"],
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "similarity_score": round(float(normalized_score), 4),
                "rank": rank + 1,
                "match_source": "keyword"
            })
        return results

class HybridRetriever:
    """
    Coordinates semantic vector retrieval, BM25 keyword matching,
    similarity thresholds, and Reciprocal Rank Fusion (RRF).
    """
    
    def __init__(self):
        self.bm25_searcher = BM25KeywordSearcher()

    def refresh_keyword_index(self) -> None:
        """Re-index BM25 searcher after document additions or deletions."""
        self.bm25_searcher._build_index()

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        similarity_threshold: float = 0.20,
        mode: str = "hybrid",
        hybrid_alpha: float = 0.7,
        document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Main retrieval method.
        Supported modes:
          - 'vector': Pure dense cosine similarity search
          - 'keyword': Pure sparse BM25 keyword search
          - 'hybrid': Weighted fusion of vector + keyword results
        """
        if not query.strip():
            return []
            
        # 1. Generate query embedding vector
        query_embedding = embedding_engine.embed_text(query)
        
        # 2. Dense Vector Retrieval
        vector_candidates: List[Dict[str, Any]] = []
        if mode in ["vector", "hybrid"]:
            vector_candidates = vector_store.search_similar(
                query_embedding=query_embedding,
                top_k=top_k * 2,  # Fetch slightly wider candidate pool for re-ranking
                document_id=document_id
            )
            
        if mode == "vector":
            filtered = [c for c in vector_candidates if c["similarity_score"] >= similarity_threshold]
            return filtered[:top_k]
            
        # 3. Sparse Keyword Retrieval
        keyword_candidates: List[Dict[str, Any]] = []
        if mode in ["keyword", "hybrid"]:
            keyword_candidates = self.bm25_searcher.search(
                query=query,
                top_k=top_k * 2,
                document_id=document_id
            )
            
        if mode == "keyword":
            filtered = [c for c in keyword_candidates if c["similarity_score"] >= similarity_threshold]
            return filtered[:top_k]
            
        # 4. Hybrid Search Fusion (Dense + Sparse)
        # Use a map to combine scores
        candidate_map: Dict[str, Dict[str, Any]] = {}
        
        for c in vector_candidates:
            cid = c["chunk_id"]
            candidate_map[cid] = {
                "chunk": c,
                "dense_score": c["similarity_score"],
                "sparse_score": 0.0
            }
            
        for c in keyword_candidates:
            cid = c["chunk_id"]
            if cid in candidate_map:
                candidate_map[cid]["sparse_score"] = c["similarity_score"]
            else:
                candidate_map[cid] = {
                    "chunk": c,
                    "dense_score": 0.0,
                    "sparse_score": c["similarity_score"]
                }
                
        # Calculate combined hybrid score
        hybrid_results: List[Dict[str, Any]] = []
        for cid, entry in candidate_map.items():
            dense_s = entry["dense_score"]
            sparse_s = entry["sparse_score"]
            
            # Weighted interpolation
            combined_score = (hybrid_alpha * dense_s) + ((1.0 - hybrid_alpha) * sparse_s)
            
            chunk_obj = dict(entry["chunk"])
            chunk_obj["similarity_score"] = round(float(combined_score), 4)
            chunk_obj["match_source"] = "hybrid" if (dense_s > 0 and sparse_s > 0) else ("vector" if dense_s > 0 else "keyword")
            hybrid_results.append(chunk_obj)
            
        # Sort by combined score descending
        hybrid_results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Filter by threshold
        final_list = [c for c in hybrid_results if c["similarity_score"] >= similarity_threshold][:top_k]
        for rank, c in enumerate(final_list):
            c["rank"] = rank + 1
            
        return final_list

# Singleton retriever instance
retriever = HybridRetriever()
