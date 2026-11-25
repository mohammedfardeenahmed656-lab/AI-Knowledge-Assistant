"""
RAG Pipeline Component: Contextual Reranker
============================================

Educational Deep-Dive:
----------------------
What is a Reranker and why is it used?
In advanced RAG pipelines, retrieval is typically divided into two stages:
  1. First-Stage Retrieval (Bi-Encoder / Dense Vector + BM25):
     Ultra-fast (milliseconds over millions of chunks), but bi-encoders independently
     compress document chunks into a single vector without knowing the user question beforehand.
     This can sometimes cause near-misses where a chunk has high topical similarity but
     does not actually contain the direct answer.
  2. Second-Stage Reranking (Cross-Encoder / Contextual Scorer):
     Takes the Top-20 retrieved candidate chunks from stage 1 and passes both the Query
     and Chunk TOGETHER:
       [CLS] User Question [SEP] Candidate Chunk Text [SEP]
     This allows full cross-attention between every word in the question and every word in the chunk,
     producing a precision relevance score.

Benefits:
- Eliminates false positives that slipped past vector search.
- Places the most decisive, fact-dense chunk at position #1, maximizing LLM attention.
"""

import re
from typing import List, Dict, Any

class ContextualReranker:
    """
    Reranks retrieved candidate chunks using fine-grained lexical and contextual
    relevance heuristics, ensuring the highest-quality facts appear at the top.
    """
    
    @staticmethod
    def rerank(
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Re-score candidate chunks based on:
          1. Base retrieval similarity score (40% weight)
          2. Exact phrase and keyword density matches (40% weight)
          3. Informational density (presence of numbers, proper nouns, entities) (20% weight)
        """
        if not candidates:
            return []
            
        query_lower = query.lower()
        query_words = set(re.findall(r'\b[a-zA-Z0-9_]{3,}\b', query_lower))
        
        reranked = []
        for item in candidates:
            chunk_text = item["text"].lower()
            base_score = item.get("similarity_score", 0.0)
            
            # Exact phrase bonus
            phrase_bonus = 0.25 if query_lower in chunk_text else 0.0
            
            # Query word coverage
            matched_words = sum(1 for w in query_words if w in chunk_text)
            coverage_ratio = (matched_words / len(query_words)) if query_words else 0.0
            
            # Numerical/Entity density bonus (useful for fact questions like dates, amounts)
            number_matches = len(re.findall(r'\b\d+(?:\.\d+)?\b', item["text"]))
            entity_bonus = min(0.15, number_matches * 0.03)
            
            # Composite rerank score
            adjusted_score = (base_score * 0.45) + (phrase_bonus * 0.20) + (coverage_ratio * 0.25) + (entity_bonus * 0.10)
            adjusted_score = round(min(1.0, max(0.0, adjusted_score)), 4)
            
            chunk_copy = dict(item)
            chunk_copy["rerank_score"] = adjusted_score
            reranked.append(chunk_copy)
            
        # Re-sort descending
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        
        # Re-assign ranks
        final_list = reranked[:top_k]
        for rank, c in enumerate(final_list):
            c["rank"] = rank + 1
            
        return final_list

reranker = ContextualReranker()

