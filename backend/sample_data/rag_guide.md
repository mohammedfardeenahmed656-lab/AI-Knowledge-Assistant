# Comprehensive Guide to Retrieval-Augmented Generation (RAG)

## 1. What is RAG?
Retrieval-Augmented Generation (RAG) is an architectural framework in artificial intelligence that enhances the capabilities of Large Language Models (LLMs) by coupling them with an external knowledge retrieval mechanism. Instead of relying solely on the static, pre-trained weights of the model, RAG dynamically retrieves factual context from a proprietary document repository whenever a question is posed.

## 2. Why Use RAG Instead of Fine-Tuning?
Standard LLMs suffer from two major deficiencies:
- Knowledge Cutoffs: They do not know about internal company wikis, recent news, or private contracts.
- Hallucinations: When uncertain, they generate plausible-sounding falsehoods with high confidence.

While Fine-Tuning adjusts the model weights on domain text, it is expensive, slow to update, and does not reliably guarantee factual citations. RAG, by contrast:
1. Provides real-time dynamic updates: Adding new knowledge merely requires uploading a document into the vector database.
2. Guarantees provenance: Every generated statement is paired with an exact document and page citation.
3. Cost efficiency: RAG eliminates the need for expensive multi-GPU retraining runs.

## 3. The Core RAG Pipeline Stages
A production-grade RAG pipeline consists of 8 sequential steps:
1. Document Ingestion & Validation: Checking file extensions, size limits, and sanitizing formats.
2. Text Extraction: Converting PDF, Word (DOCX), and Markdown files into raw strings while tracking page numbers.
3. Text Cleaning: Stripping soft hyphens and null bytes without destroying markdown headings and tables.
4. Recursive Chunking: Dividing long text into manageable segments (typically 500 characters with 100 characters overlap) so each segment focuses on a coherent thought.
5. Embedding Generation: Passing each chunk through an encoder model to produce a 384-dimensional dense vector representing its semantic meaning.
6. Vector Database Indexing: Storing chunk vectors in ChromaDB using Hierarchical Navigable Small World (HNSW) graphs.
7. Hybrid Retrieval: Combining dense vector cosine similarity with BM25 sparse keyword matching.
8. Grounded Generation: Passing retrieved chunks into an LLM with strict instructions to answer only using the provided facts and insert bracketed citations.

## 4. Understanding Vector Embeddings and Cosine Similarity
An embedding vector represents words as coordinates in high-dimensional geometric space. When two sentences share similar semantic meanings, their vectors point in nearly identical directions.
We calculate alignment using Cosine Similarity:
Cosine Similarity = (Vector A · Vector B) / (||Vector A|| * ||Vector B||)
A score of 1.0 indicates perfect semantic alignment, 0.0 indicates orthogonal or unrelated topics, and negative values indicate opposite meanings.

## 5. RAG Evaluation Metrics
To measure the reliability of a RAG pipeline, 4 primary metrics are monitored:
- Precision@K: The fraction of the top-K retrieved chunks that are genuinely relevant to the query.
- Recall@K: The fraction of all relevant facts in the repository successfully captured in the top-K.
- Faithfulness (Groundedness): The percentage of claims in the generated answer directly supported by the context.
- Answer Relevance: How directly the answer addresses the original query.

