# AI Knowledge Assistant: Production-Grade Educational RAG Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-orange.svg?style=flat)](https://www.trychroma.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-14%2F14_Passed-brightgreen.svg?style=flat)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete, production-style **Retrieval-Augmented Generation (RAG)** application engineered from first principles. It enables users to upload heterogeneous documents (PDF, DOCX, TXT, Markdown) and receive truthful, grounded answers with interactive, clickable source citations.

Designed not as a black-box wrapper, but as a modular, inspectable educational reference architecture demonstrating every step of the modern RAG pipeline.

---

## 🌟 Architecture Overview

```text
                                  ┌──────────────────────────┐
                                  │   Uploaded Documents     │
                                  │  (PDF, DOCX, TXT, MD)    │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 1: Validation      │
                                  │  (Size, Types, Security) │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 2: Text Extraction │
                                  │  (Page & Structure Aware)│
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 3: Text Cleaner    │
                                  │ (Preserves # & Tables)   │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 4: Chunking        │
                                  │ (Recursive Character)    │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 5: Dense Embedding │
                                  │ (384-Dim Normalized L2)  │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Step 6: Vector Storage  │
                                  │ (ChromaDB HNSW + SQLite) │
                                  └─────────────┬────────────┘
                                                │
┌───────────────────────────────────────────────┴───────────────────────────────────────────────┐
│                                     RETRIEVAL PIPELINE                                        │
└───────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                │
                      User Question ────────────┤
                                                ▼
                                  ┌──────────────────────────┐
                                  │  Query Vector Embedding  │
                                  └─────────────┬────────────┘
                                                │
                         ┌──────────────────────┴──────────────────────┐
                         ▼                                             ▼
            ┌──────────────────────────┐                  ┌──────────────────────────┐
            │   Dense Vector Search    │                  │   Sparse BM25 Keyword    │
            │   (Cosine Proximity)     │                  │   (Exact Token TF-IDF)   │
            └────────────┬─────────────┘                  └────────────┬─────────────┘
                         │                                             │
                         └──────────────────────┬──────────────────────┘
                                                ▼
                                  ┌──────────────────────────┐
                                  │ Hybrid Fusion Score (α)  │
                                  │ α · Dense + (1-α) · BM25 │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │   Contextual Reranker    │
                                  │ (Cross-Attention Scorer) │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │ Strict Grounded Prompt   │
                                  │ (Anti-Hallucination Gate)│
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │      LLM Synthesis       │
                                  │  (Gemini / OpenAI / Mock)│
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │ Answer + Clickable Cites │
                                  │ [1] quarterly_report.pdf │
                                  └──────────────────────────┘
```

---

## 📖 Deep-Dive: What is RAG and Why Use It?

### What is RAG?
Large Language Models (LLMs) are trained on vast public datasets, but their knowledge is:
1. **Frozen in time** (knowledge cutoffs).
2. **Ignorant of private corporate data** (internal SOPs, patient records, legal contracts, private repos).
3. **Prone to hallucinations** when uncertain.

**RAG (Retrieval-Augmented Generation)** converts a "closed-book" test into an **"open-book exam"**. Whenever a user asks a question, the system searches your document library, extracts the top-K relevant passages, pastes them into the prompt, and commands the LLM to answer using only those verified facts.

### Architectural Comparison

| Dimension | Standard Pre-Trained LLM | Fine-Tuning | Retrieval-Augmented Generation (RAG) |
| :--- | :--- | :--- | :--- |
| **Data Recency** | Static (Cutoff Date) | Static until retraining | **Dynamic (Immediate on upload)** |
| **Private Data Access** | None | Bakes data into weights | **Direct vector index search** |
| **Hallucination Risk** | High | Moderate | **Lowest (Strict Grounding)** |
| **Auditability & Citations**| None (Black box) | None | **Clickable exact source citations** |
| **Update Cost** | Billions of dollars | Thousands of dollars | **Zero retraining cost (O(ms) vector upsert)** |
| **Setup Complexity** | API call | Complex ML pipelines | **Modular software engineering** |

---

## 🚀 Key Features

- **Multi-Format Ingestion**: Validates, extracts, and parses multi-page PDFs, Microsoft Word (`.docx`), Markdown (`.md`), and plain text (`.txt`).
- **Structure-Preserving Cleaner**: Normalizes noisy Unicode and line breaks while strictly protecting Markdown headers (`#`), bullet lists, and tables.
- **Configurable Recursive Chunker**: Hierarchical splitting (`\n\n` -> `\n` -> `. ` -> ` `) with sliding window overlap preventing boundary loss.
- **Hybrid Retrieval Engine**:
  - Dense Vector Search via **ChromaDB** with Cosine Similarity.
  - Sparse Keyword Search via **BM25 Okapi** with term frequency and document length normalization.
  - Reciprocal Rank Fusion & Adjustable Alpha Weighting ($\alpha \in [0.0, 1.0]$).
- **Interactive "Show RAG Process" Debugger**: 8-step pipeline visualizer exposing Query Embedding preview, Top-K retrieved chunks with similarity scores, constructed context, LLM prompt, and latency breakdown.
- **Strict Anti-Hallucination Guardrails**: Explicit refusal directives when context does not contain the answer, paired with automatic inline citation parsing (`[1]`, `[2]`).
- **Interactive Learning Academy (`/learning`)**: 10 educational modules with live interactive sandboxes (live chunker slider, live cosine simulator, live refusal tester).
- **RAG Evaluation Suite**: Measures **Precision@K**, **Recall@K**, **Faithfulness (Groundedness)**, and Latency against curated benchmark datasets.
- **Zero API Key Barrier**: Works 100% offline out-of-the-box with deterministic 384-dimensional embeddings and grounded local heuristic synthesis, while also seamlessly connecting to **Google Gemini** or **OpenAI** when keys are supplied.
- **Sky-Blue & White Enterprise UI**: Modern SaaS responsive design built with React, TypeScript, Tailwind CSS, and Lucide icons.

---

## 📁 Repository Structure

```text
AI-Knowledge-Assistant/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents.py      # Upload, inspect, list, delete documents
│   │   │   ├── chat.py           # Multi-turn conversation & RAG pipeline
│   │   │   ├── search.py         # Direct hybrid/vector search lab
│   │   │   ├── evaluation.py     # Benchmark suite execution
│   │   │   ├── stats.py          # Dashboard analytics
│   │   │   └── health.py         # System health & diagnostic status
│   │   ├── rag/
│   │   │   ├── loader.py         # PDF, DOCX, TXT, MD extractors
│   │   │   ├── cleaner.py        # Text normalization preserving markdown
│   │   │   ├── chunker.py        # Recursive character chunker with overlap
│   │   │   ├── embeddings.py     # 384-dim normalized embedding engine
│   │   │   ├── vector_store.py   # ChromaDB persistent manager + fallback
│   │   │   ├── retriever.py      # Hybrid retrieval (Chroma + BM25)
│   │   │   ├── reranker.py       # Contextual cross-attention reranker
│   │   │   ├── prompt.py         # Strict anti-hallucination prompt template
│   │   │   └── generator.py      # LLM synthesis & citation parser
│   │   ├── database/
│   │   │   ├── database.py       # SQLite connection & schema initialization
│   │   │   └── models.py         # Data access helpers (Documents, Chunks, Messages)
│   │   ├── schemas/
│   │   │   └── schemas.py        # Pydantic v2 data contracts
│   │   ├── config.py             # Hyperparameters & environment configuration
│   │   └── main.py               # FastAPI entrypoint with CORS & static mounting
│   ├── sample_data/              # Pre-seeded test documents
│   │   ├── rag_guide.md
│   │   ├── cloud_architecture.txt
│   │   └── sample_report.txt
│   ├── tests/                    # 14 Comprehensive Pytest unit tests
│   │   ├── conftest.py
│   │   ├── test_loader.py
│   │   ├── test_chunker.py
│   │   ├── test_embeddings.py
│   │   ├── test_retriever.py
│   │   ├── test_api.py
│   │   └── test_evaluation.py
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── RAGProcessModal.tsx  # 8-step pipeline visualizer
│   │   │   ├── CitationModal.tsx    # Clickable source inspector
│   │   │   ├── DocumentModal.tsx    # Chunk breakdown modal
│   │   │   └── SettingsModal.tsx    # Hyperparameter tuning modal
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Metrics & recent activity
│   │   │   ├── ChatPage.tsx         # Assistant conversation interface
│   │   │   ├── DocumentsPage.tsx    # Ingestion hub & uploader
│   │   │   ├── SearchLabPage.tsx    # Vector vs BM25 hybrid playground
│   │   │   ├── EvaluationPage.tsx   # Precision@K / Faithfulness benchmarks
│   │   │   └── LearningPage.tsx     # 10 interactive educational modules
│   │   ├── services/
│   │   │   └── api.ts               # Type-safe API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚡ Quickstart Guide

### Option 1: Run with Docker Compose (Recommended)

Clone the repository and spin up the complete containerized stack in one command:

```bash
docker compose up --build
```

Access the application at `http://localhost:8000`.

---

### Option 2: Local Development Setup

#### 1. Backend Setup (FastAPI & Python 3.11+)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy environment template and add API keys if desired
cp .env.example .env

# Run FastAPI server
python run.py
```

The backend server starts at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup (React & Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser. (The Vite server proxies `/api` calls directly to `http://127.0.0.1:8000`).

---

## 🧪 Running Automated Tests

The test suite validates document parsing, recursive splitting, vector normalization, hybrid search fusion, API endpoints, and evaluation metrics:

```bash
cd backend
python -m pytest tests -v
```

Output:
```text
tests/test_api.py::test_health_check_endpoint PASSED
tests/test_api.py::test_dashboard_stats_endpoint PASSED
tests/test_api.py::test_chat_endpoint_grounded_answer PASSED
tests/test_api.py::test_search_lab_endpoint PASSED
tests/test_chunker.py::test_chunking_with_overlap PASSED
tests/test_chunker.py::test_chunker_overlap_validation PASSED
tests/test_embeddings.py::test_embedding_normalization_and_dimension PASSED
tests/test_embeddings.py::test_semantic_similarity_relative_ordering PASSED
tests/test_evaluation.py::test_evaluation_test_case_runner PASSED
tests/test_loader.py::test_load_markdown_document PASSED
tests/test_loader.py::test_empty_file_validation_error PASSED
tests/test_loader.py::test_unsupported_file_extension PASSED
tests/test_retriever.py::test_hybrid_retrieval_returns_ranked_results PASSED
tests/test_retriever.py::test_pure_keyword_vs_pure_vector PASSED

============================= 14 passed in 0.53s =============================
```

---

## 📡 Core API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Diagnostic status of vector store, database, and active LLM provider. |
| `GET` | `/api/stats` | Dashboard statistics (total docs, chunks, conversations, latencies). |
| `POST` | `/api/documents/upload` | Multipart file upload (PDF, DOCX, TXT, MD) through 6-step ingestion. |
| `GET` | `/api/documents` | List all ingested documents. |
| `GET` | `/api/documents/{id}` | Retrieve document metadata and extracted chunk excerpts. |
| `DELETE` | `/api/documents/{id}` | Delete document and cascade delete vectors from ChromaDB and SQLite. |
| `POST` | `/api/chat` | Send user question, execute hybrid retrieval, and synthesize grounded answer. |
| `GET` | `/api/conversations` | List conversation sessions. |
| `GET` | `/api/conversations/{id}`| Retrieve full message history with citations and metadata. |
| `POST` | `/api/search` | Direct search playground (Vector, Keyword, or Hybrid mode). |
| `POST` | `/api/evaluation/run` | Execute benchmark evaluation suite and compute Precision@K and Faithfulness. |

---

## 📊 RAG Evaluation Metrics Explained

1. **Precision@K**:
   $$\text{Precision@K} = \frac{|\text{Relevant Chunks in Top-K}|}{K}$$
   Measures how clean the retrieved context is. High precision guarantees the LLM receives minimal distracting noise.

2. **Recall@K**:
   $$\text{Recall@K} = \frac{|\text{Relevant Chunks in Top-K}|}{|\text{Total Known Relevant Chunks}|}$$
   Measures whether any vital fact was omitted during retrieval.

3. **Faithfulness (Groundedness)**:
   $$\text{Faithfulness} = \frac{|\text{Factual Claims Supported by Context}|}{|\text{Total Claims in Generated Answer}|}$$
   A score of 1.0 (100%) indicates zero hallucination.

4. **Answer Relevance**:
   Measures how directly the answer responds to the specific question posed.

---

## 🔧 Configuration Hyperparameters

Configure options via environment variables or the in-app Settings Modal:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DEFAULT_CHUNK_SIZE` | `500` | Target characters per chunk. |
| `DEFAULT_CHUNK_OVERLAP`| `100` | Overlapping characters between consecutive chunks to bridge split boundaries. |
| `DEFAULT_TOP_K` | `4` | Number of context chunks retrieved for LLM prompt injection. |
| `DEFAULT_SIMILARITY_THRESHOLD` | `0.20` | Minimum cosine similarity required to pass chunk into prompt. |
| `DEFAULT_HYBRID_ALPHA` | `0.70` | Weight of dense vector search ($1.0 = \text{Pure Vector}$, $0.0 = \text{Pure BM25}$). |
| `GEMINI_API_KEY` | `""` | Optional Google Gemini API key. |
| `OPENAI_API_KEY` | `""` | Optional OpenAI API key. |

---

## 🎓 10 Interactive Academy Modules

Visit `/learning` in the app to access interactive lessons with live mini-experiments:
1. **Module 1**: What is RAG?
2. **Module 2**: Document Ingestion & Parsing
3. **Module 3**: Chunking Strategies & Overlap Physics
4. **Module 4**: Vector Embeddings & High-Dimensional Semantic Geometry
5. **Module 5**: Vector Databases & Hierarchical Navigable Small World (HNSW)
6. **Module 6**: Hybrid Retrieval (Dense Vector + BM25 Reciprocal Rank Fusion)
7. **Module 7**: Prompt Engineering & Context Grounding
8. **Module 8**: Root Causes of Hallucinations & Defense Guardrails
9. **Module 9**: RAG Evaluation & Benchmarking
10. **Module 10**: Advanced Patterns (Cross-Encoder Reranking, HyDE, Multi-Query)

---

## 🛠️ Troubleshooting

- **Error: `[WinError 10013]` on network**: Standard sandbox blocks internet sockets. Run with appropriate environment permissions or utilize the built-in offline embedding engine.
- **SQLite Foreign Key Violations**: Handled automatically; documents must be registered before chunk insertions.
- **Missing PDF text**: Scanned PDFs with rasterized images require OCR. Ensure PDFs contain selectable text.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
