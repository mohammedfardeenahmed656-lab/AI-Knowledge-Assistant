"""
Unit Tests: Embeddings Engine & Cosine Similarity
"""

import math
import numpy as np
from app.rag.embeddings import EmbeddingEngine

def test_embedding_normalization_and_dimension():
    engine = EmbeddingEngine()
    vec = engine.embed_text("What is vector search?")
    
    # Check dimension
    assert len(vec) == 384
    
    # Check L2 norm is 1.0 (unit vector)
    norm = np.linalg.norm(vec)
    assert math.isclose(norm, 1.0, rel_tol=1e-3)

def test_semantic_similarity_relative_ordering():
    engine = EmbeddingEngine()
    
    vec_query = engine.embed_text("machine learning and neural networks")
    vec_similar = engine.embed_text("deep learning artificial intelligence models")
    vec_unrelated = engine.embed_text("recipe for baking chocolate chip cookies")
    
    sim_close = engine.compute_cosine_similarity(vec_query, vec_similar)
    sim_far = engine.compute_cosine_similarity(vec_query, vec_unrelated)
    
    # Related topic should have strictly higher similarity than baking cookies
    assert sim_close > sim_far
