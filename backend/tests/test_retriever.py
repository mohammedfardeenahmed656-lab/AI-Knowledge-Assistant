"""
Unit Tests: Hybrid Retriever (Vector + BM25)
"""

from app.rag.retriever import retriever

def test_hybrid_retrieval_returns_ranked_results():
    # Knowledge base is seeded with sample documents
    results = retriever.retrieve(
        query="What is Retrieval-Augmented Generation?",
        top_k=3,
        similarity_threshold=0.0,
        mode="hybrid",
        hybrid_alpha=0.7
    )
    
    assert len(results) > 0
    assert results[0]["rank"] == 1
    assert "similarity_score" in results[0]
    assert "text" in results[0]
    assert results[0]["similarity_score"] > 0.0

def test_pure_keyword_vs_pure_vector():
    vec_results = retriever.retrieve("PostgreSQL replication", top_k=2, mode="vector")
    key_results = retriever.retrieve("PostgreSQL replication", top_k=2, mode="keyword")
    
    assert len(vec_results) > 0
    assert len(key_results) > 0
