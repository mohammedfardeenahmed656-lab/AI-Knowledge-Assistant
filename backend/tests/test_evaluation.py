"""
Unit Tests: RAG Evaluation Suite
"""

from app.rag.evaluation import RAGEvaluationRunner

def test_evaluation_test_case_runner():
    test_case = {
        "question": "What is RAG?",
        "expected_answer": "RAG is an AI framework combining document retrieval and LLMs.",
        "relevant_document": "rag_guide.md",
        "relevant_page": 1
    }
    
    result = RAGEvaluationRunner.evaluate_test_case(test_case, top_k=2)
    assert "precision_at_k" in result
    assert "recall_at_k" in result
    assert "faithfulness_score" in result
    assert "retrieval_latency_ms" in result
    assert result["total_latency_ms"] > 0.0

