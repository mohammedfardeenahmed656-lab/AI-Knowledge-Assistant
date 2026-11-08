"""
RAG Pipeline Component: Evaluation & Benchmarking Suite
======================================================

Educational Deep-Dive:
----------------------
Why is RAG Evaluation necessary?
"You cannot improve what you cannot measure."
A RAG system can fail in two completely different ways:
  1. Retrieval Failure: The retriever failed to fetch the chunks containing the answer.
     (Even the smartest LLM in the world cannot answer if the facts aren't in its prompt).
  2. Generation Failure: The retriever fetched the correct chunks, but the LLM either
     ignored them, misread them, or hallucinated facts not present in the context.

The Core Evaluation Metrics:
----------------------------
1. Precision@K:
   Out of the top K chunks retrieved, what percentage are genuinely relevant?
   Precision@K = (Relevant Chunks retrieved in Top K) / K
   * High Precision = Low noise, clean context.

2. Recall@K:
   Did the retriever capture all the necessary facts required to answer the question?
   Recall@K = (Relevant Chunks retrieved in Top K) / (Total Relevant Chunks in Dataset)
   * High Recall = No missing puzzle pieces.

3. Faithfulness / Groundedness:
   Can every factual sentence in the generated answer be directly inferred from the context?
   Faithfulness = (Context-Supported Claims in Answer) / (Total Claims in Answer)
   * 1.0 = 100% grounded, zero hallucination.

4. Answer Relevance:
   Does the generated answer directly address the user's specific query, or is it evasive?
"""

import time
import re
from typing import List, Dict, Any, Tuple, Optional
from app.rag.retriever import retriever
from app.rag.generator import answer_generator
from app.database.models import insert_evaluation_record, list_evaluations_records

# Built-in educational test dataset
DEFAULT_TEST_DATASET = [
    {
        "question": "What is Retrieval-Augmented Generation (RAG)?",
        "expected_answer": "RAG is an AI framework that retrieves relevant facts from external documents and supplies them to a language model to generate grounded answers.",
        "relevant_document": "rag_guide.md",
        "relevant_page": 1
    },
    {
        "question": "Why is document chunking necessary before embedding?",
        "expected_answer": "Chunking is needed because LLMs have context limits and embedding granular paragraphs yields far more precise semantic representations than entire books.",
        "relevant_document": "rag_guide.md",
        "relevant_page": 1
    },
    {
        "question": "How does Cosine Similarity compare vectors?",
        "expected_answer": "Cosine similarity measures the angle between two multi-dimensional vectors, returning 1.0 for identical directions and 0.0 for unrelated vectors.",
        "relevant_document": "rag_guide.md",
        "relevant_page": 1
    },
    {
        "question": "What is the capital city of Mars?",
        "expected_answer": "Based on the uploaded documents, I could not find information regarding this question.",
        "relevant_document": "NONE",
        "relevant_page": 0
    }
]

class RAGEvaluationRunner:
    """
    Executes benchmark suites against the RAG pipeline and computes
    precision, recall, faithfulness, relevance, and latency metrics.
    """
    
    @classmethod
    def evaluate_test_case(
        cls,
        test_case: Dict[str, Any],
        top_k: int = 4,
        similarity_threshold: float = 0.20,
        mode: str = "hybrid",
        hybrid_alpha: float = 0.7
    ) -> Dict[str, Any]:
        """Run a single test case through the entire RAG pipeline and compute metrics."""
        question = test_case["question"]
        expected = test_case["expected_answer"]
        target_doc = test_case.get("relevant_document", "").lower()
        target_page = test_case.get("relevant_page", 1)
        
        # 1. Measure Retrieval
        ret_start = time.perf_counter()
        retrieved_chunks = retriever.retrieve(
            query=question,
            top_k=top_k,
            similarity_threshold=similarity_threshold,
            mode=mode,
            hybrid_alpha=hybrid_alpha
        )
        ret_latency = (time.perf_counter() - ret_start) * 1000.0
        
        # 2. Measure Generation
        gen_start = time.perf_counter()
        answer, citations, gen_latency = answer_generator.generate_answer(
            question=question,
            retrieved_chunks=retrieved_chunks
        )
        total_latency = ret_latency + gen_latency
        
        # 3. Compute Retrieval Metrics (Precision@K & Recall@K)
        retrieved_docs = [c["filename"].lower() for c in retrieved_chunks]
        retrieved_pages = [c.get("page", 1) for c in retrieved_chunks]
        
        if target_doc == "none":
            # For negative tests, if no chunks retrieved or answer refuses, precision is 1.0
            precision_at_k = 1.0 if ("not find" in answer.lower() or not retrieved_chunks) else 0.0
            recall_at_k = 1.0
        else:
            relevant_retrieved = sum(1 for d in retrieved_docs if target_doc in d)
            precision_at_k = (relevant_retrieved / top_k) if top_k > 0 else 0.0
            recall_at_k = 1.0 if relevant_retrieved > 0 else 0.0
            
        # 4. Compute Faithfulness (Groundedness)
        faithfulness = cls._calculate_faithfulness(answer, retrieved_chunks)
        
        # 5. Compute Answer Relevance
        relevance = cls._calculate_answer_relevance(question, answer, expected)
        
        result_record = {
            "question": question,
            "expected_answer": expected,
            "generated_answer": answer,
            "relevant_document": test_case.get("relevant_document", ""),
            "relevant_page": target_page,
            "retrieved_documents": retrieved_docs,
            "retrieved_pages": retrieved_pages,
            "precision_at_k": round(precision_at_k, 3),
            "recall_at_k": round(recall_at_k, 3),
            "faithfulness_score": round(faithfulness, 3),
            "answer_relevance_score": round(relevance, 3),
            "retrieval_latency_ms": round(ret_latency, 2),
            "generation_latency_ms": round(gen_latency, 2),
            "total_latency_ms": round(total_latency, 2)
        }
        
        # Persist to database
        insert_evaluation_record(result_record)
        return result_record

    @classmethod
    def run_suite(
        cls,
        test_dataset: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 4,
        similarity_threshold: float = 0.20,
        mode: str = "hybrid",
        hybrid_alpha: float = 0.7
    ) -> Dict[str, Any]:
        """Execute full benchmark evaluation across all test cases."""
        dataset = test_dataset or DEFAULT_TEST_DATASET
        results = []
        
        for item in dataset:
            res = cls.evaluate_test_case(
                test_case=item,
                top_k=top_k,
                similarity_threshold=similarity_threshold,
                mode=mode,
                hybrid_alpha=hybrid_alpha
            )
            results.append(res)
            
        n = len(results) or 1
        return {
            "run_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_test_cases": len(results),
            "mean_precision_at_k": round(sum(r["precision_at_k"] for r in results) / n, 3),
            "mean_recall_at_k": round(sum(r["recall_at_k"] for r in results) / n, 3),
            "mean_faithfulness_score": round(sum(r["faithfulness_score"] for r in results) / n, 3),
            "mean_answer_relevance_score": round(sum(r["answer_relevance_score"] for r in results) / n, 3),
            "avg_retrieval_latency_ms": round(sum(r["retrieval_latency_ms"] for r in results) / n, 2),
            "avg_generation_latency_ms": round(sum(r["generation_latency_ms"] for r in results) / n, 2),
            "avg_total_latency_ms": round(sum(r["total_latency_ms"] for r in results) / n, 2),
            "results": results
        }

    @staticmethod
    def _calculate_faithfulness(answer: str, context_chunks: List[Dict[str, Any]]) -> float:
        """
        Check whether factual statements in the answer correspond to retrieved context.
        """
        if "not find" in answer.lower():
            return 1.0  # Proper honest refusal is 100% faithful
        if not context_chunks:
            return 0.0
            
        combined_context = " ".join([c["text"].lower() for c in context_chunks])
        sentences = [s.strip() for s in re.split(r'[.!?]', answer) if len(s.strip()) > 10]
        if not sentences:
            return 1.0
            
        supported_count = 0
        for sent in sentences:
            words = set(re.findall(r'\b[a-zA-Z0-9_]{3,}\b', sent.lower()))
            overlap = sum(1 for w in words if w in combined_context)
            ratio = (overlap / len(words)) if words else 0.0
            if ratio >= 0.5:
                supported_count += 1
                
        return min(1.0, max(0.0, supported_count / len(sentences)))

    @staticmethod
    def _calculate_answer_relevance(question: str, answer: str, expected: str) -> float:
        """
        Compute lexical and semantic similarity between generated answer and expected answer.
        """
        if "not find" in expected.lower() and "not find" in answer.lower():
            return 1.0
            
        ans_words = set(re.findall(r'\b[a-zA-Z0-9_]{3,}\b', answer.lower()))
        exp_words = set(re.findall(r'\b[a-zA-Z0-9_]{3,}\b', expected.lower()))
        
        if not exp_words:
            return 1.0
            
        overlap = len(ans_words.intersection(exp_words))
        return min(1.0, max(0.0, overlap / len(exp_words)))
