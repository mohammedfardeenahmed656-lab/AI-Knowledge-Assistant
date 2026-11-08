"""
API Router: RAG Evaluation & Benchmarking
=========================================
Runs test cases to measure Precision@K, Recall@K, Faithfulness,
Answer Relevance, and component latencies.
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from app.schemas.schemas import EvaluationRunRequest, EvaluationSuiteResponse
from app.rag.evaluation import RAGEvaluationRunner
from app.database.models import list_evaluations_records

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

@router.post("/run", response_model=EvaluationSuiteResponse)
async def run_evaluation_suite(request: EvaluationRunRequest):
    """
    Execute the automated benchmark test suite against the RAG pipeline.
    Calculates Precision@K, Recall@K, Faithfulness, Relevance, and latencies.
    """
    suite_results = RAGEvaluationRunner.run_suite(
        top_k=request.top_k,
        similarity_threshold=request.similarity_threshold,
        mode=request.mode,
        hybrid_alpha=request.hybrid_alpha
    )
    return EvaluationSuiteResponse(**suite_results)

@router.get("/runs")
async def get_evaluation_history(limit: int = 25):
    """Retrieve historical evaluation run records."""
    return list_evaluations_records(limit=limit)