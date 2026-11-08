import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Sparkles,
  Binary,
  Database,
  Search,
  Quote,
  AlertTriangle,
  Activity,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Code2,
  Sliders,
  Play
} from 'lucide-react';

interface ModuleData {
  id: number;
  title: string;
  icon: any;
  summary: string;
  simpleExplanation: string;
  diagram: string;
  example: string;
  technicalDetails: string;
  commonMistakes: string[];
  interactiveType: 'chunker' | 'embedding' | 'hybrid' | 'hallucination' | 'eval';
}

export const LearningPage: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<number>(1);

  // Mini-experiment interactive sandbox states
  const [sandboxChunkText, setSandboxChunkText] = useState(
    "Retrieval-Augmented Generation (RAG) is an AI architecture that retrieves facts from private documents before sending them to a Large Language Model. Chunking splits documents into small passages. Embeddings convert text to vectors."
  );
  const [sandboxChunkSize, setSandboxChunkSize] = useState(70);
  const [sandboxChunkOverlap, setSandboxChunkOverlap] = useState(15);

  const [sandboxCosineA, setSandboxCosineA] = useState("artificial intelligence machine learning");
  const [sandboxCosineB, setSandboxCosineB] = useState("neural networks deep learning");

  const [sandboxAlpha, setSandboxAlpha] = useState(0.7);
  const [sandboxHallucinationContext, setSandboxHallucinationContext] = useState(
    "The Mars rover landed on Olympus Mons on July 14, 2024. It found granite rocks."
  );
  const [sandboxHallucinationQuery, setSandboxHallucinationQuery] = useState(
    "Did the rover find underground liquid water?"
  );

  const modules: ModuleData[] = [
    {
      id: 1,
      title: 'Module 1: What is RAG?',
      icon: Brain,
      summary: 'The fundamental concept, why it exists, and how it compares to raw LLMs and Fine-Tuning.',
      simpleExplanation:
        'Think of a Large Language Model (LLM) like an extremely smart student taking a closed-book test. They might misremember facts or make up convincing answers when unsure. RAG turns the test into an OPEN-BOOK exam: before answering, the AI looks up the exact pages in your company library and quotes the source directly.',
      diagram: `User Question ───> [ 1. Search Knowledge Base ] ───> Retrieved Facts
                                                         │
                                                         ▼
User Question + Retrieved Facts ───> [ 2. LLM Model ] ───> Grounded Answer + Citations`,
      example:
        'Normal LLM: "What was our company Q3 revenue?" -> "I do not have access to real-time or private information."\nRAG Assistant: "What was our company Q3 revenue?" -> "According to Q3_Financials.pdf (Page 2), revenue was $14.2 million [1]."',
      technicalDetails:
        'RAG decouples memory (the vector database) from reasoning (the LLM). While fine-tuning bakes knowledge into neural weights (expensive, slow to re-train, prone to hallucinations), RAG updates knowledge dynamically in milliseconds by merely adding chunks to an index.',
      commonMistakes: [
        'Assuming fine-tuning is better than RAG for private facts (fine-tuning updates tone/style, RAG updates factual memory).',
        'Passing entire 100-page documents to the LLM at once, which causes attention dilution ("Lost in the Middle").',
      ],
      interactiveType: 'chunker',
    },
    {
      id: 2,
      title: 'Module 2: How Document Ingestion Works',
      icon: Layers,
      summary: 'Parsing PDFs, Word documents, Markdown, and normalizing unstructured text.',
      simpleExplanation:
        'Documents on computers are not just strings of letters. PDFs are visual layout blueprints, and Word docs are compressed XML archives. Ingestion extracts pure text, preserves headings and tables, and attaches page-level tracking metadata.',
      diagram: `PDF / DOCX / TXT / MD
          │
          ▼
   [ File Validator ] (Check extension, size, empty files)
          │
          ▼
   [ Text Extractor ] (Extract paragraphs, tables, pages)
          │
          ▼
   [ Normalizer ] (Clean null bytes, fix hyphens, preserve markdown # headers)`,
      example:
        'Raw PDF text often contains "hyphen-\\nated" line wraps and invisible null bytes `\\x00`. The cleaner rejoins "hyphenated" and strips control characters without destroying markdown tables.',
      technicalDetails:
        'Our `DocumentLoader` outputs a common representation: `{"text": "...", "source": "report.pdf", "page": 1, "metadata": {...}}`. Page numbers must be preserved so citations remain audit-verifiable.',
      commonMistakes: [
        'Lowercasing the entire text or destroying markdown headings (headings provide crucial retrieval context).',
        'Discarding page numbers during extraction, making citations impossible to verify.',
      ],
      interactiveType: 'chunker',
    },
    {
      id: 3,
      title: 'Module 3: How Chunking Works',
      icon: Code2,
      summary: 'Why chunk size and overlap determine retrieval precision and context retention.',
      simpleExplanation:
        'If you throw an entire 500-page book at a search engine, the meaning is too broad. If you cut it into individual words, the context is lost. Chunking creates bite-sized paragraphs (e.g. 500 characters) with a slight sliding overlap (e.g. 100 characters) so sentences are never severed mid-thought.',
      diagram: `[----------------- Chunk 1 -----------------]
                             [==== Overlap ====]
                             [----------------- Chunk 2 -----------------]`,
      example:
        'Without overlap, "The contract terminates on" could end up in Chunk 1, and "December 31st" in Chunk 2! With overlap, the complete sentence exists unbroken in at least one chunk.',
      technicalDetails:
        'Recursive splitting evaluates delimiters in hierarchical order: `\\n\\n` (paragraphs) -> `\\n` (lines) -> `. ` (sentences) -> ` ` (words). This preserves natural grammatical and semantic boundaries.',
      commonMistakes: [
        'Setting chunk overlap >= chunk size, causing infinite loops.',
        'Using fixed character slices without respecting sentence and paragraph boundaries.',
      ],
      interactiveType: 'chunker',
    },
    {
      id: 4,
      title: 'Module 4: How Embeddings Work',
      icon: Binary,
      summary: 'Translating human text into high-dimensional geometric coordinates.',
      simpleExplanation:
        'Computers cannot read meaning; they only see ASCII codes. An embedding model converts a sentence into a list of 384 numbers. Sentences with similar meanings produce vectors pointing in nearly identical directions.',
      diagram: `"How are you?"         ──> [ 0.124, -0.441,  0.821, ... ]
"How is everything?"   ──> [ 0.119, -0.435,  0.810, ... ] (Cosine Sim: 0.94)
"Apple pie recipe"     ──> [-0.652,  0.114, -0.320, ... ] (Cosine Sim: 0.08)`,
      example:
        'Query: "automobile breakdown" matches Document: "car failed to start" even though they share ZERO identical words! Their vector distance is small because the model understands synonyms.',
      technicalDetails:
        'We measure proximity using Cosine Similarity: cos(θ) = (A · B) / (||A|| * ||B||). Vectors are unit-normalized to length 1.0, making the dot product directly equal to cosine similarity.',
      commonMistakes: [
        'Confusing an embedding model (which only outputs numbers for search) with an LLM (which writes answers).',
        'Mixing embeddings from different models (vectors from MiniLM and Ada-002 live in incompatible mathematical spaces).',
      ],
      interactiveType: 'embedding',
    },
    {
      id: 5,
      title: 'Module 5: How Vector Databases Work',
      icon: Database,
      summary: 'Storing millions of vectors and searching them in logarithmic time via HNSW.',
      simpleExplanation:
        'A normal SQL database checks `WHERE id = 5`. But how do you search 1,000,000 high-dimensional coordinates? A Vector Database (like ChromaDB) builds a multi-layered highway map (HNSW) to jump directly to the closest neighborhood in milliseconds.',
      diagram: `Layer 2 (Expressway):    [●]────────────────────────>[●]
                                  │                           │
Layer 1 (Arterial):      [●]─────>[●]─────>[●]────────>[●]────>[●]
                          │        │        │           │        │
Layer 0 (Local Chunks):  [●][●][●][●][●][●][●][●][●][●][●][●][●][●][●]`,
      example:
        'ChromaDB stores the chunk ID, the 384-dimensional vector, the original chunk text, and metadata like filename and page number.',
      technicalDetails:
        'HNSW (Hierarchical Navigable Small World graphs) delivers O(log N) approximate nearest neighbor (ANN) retrieval with high recall and minimal memory overhead.',
      commonMistakes: [
        'Not persisting the vector database to disk, causing index loss on server restart.',
        'Ignoring distance metrics (e.g. using Euclidean L2 distance when the model requires Cosine space).',
      ],
      interactiveType: 'embedding',
    },
    {
      id: 6,
      title: 'Module 6: How Retrieval Works (Hybrid Search)',
      icon: Search,
      summary: 'Why Dense Vector Search + BM25 Keyword Search together beat either one alone.',
      simpleExplanation:
        'Vector search understands concepts ("canines" -> "dogs"), but can struggle with exact acronyms or part numbers ("ERR-9021"). BM25 keyword search is the opposite: it loves exact codes but has zero synonym knowledge. Hybrid search blends them together for unbeatable retrieval.',
      diagram: `User Query
    ├───> [ Dense Vector Search ] ───> Top Chunks (Weight: α = 0.70)
    └───> [ Sparse BM25 Keyword ] ───> Top Chunks (Weight: 1 - α = 0.30)
                                            │
                                            ▼
                    [ Weighted Reciprocal Rank Fusion ]
                                            │
                                            ▼
                                Final Top-K Candidate Chunks`,
      example:
        'Query: "Error ERR-401 when running get_auth_token()"\nVector alone might return general authorization concepts. Keyword alone returns the exact function line. Hybrid returns both!',
      technicalDetails:
        'Final_Score = (alpha * Dense_Score) + ((1 - alpha) * Sparse_Score). An alpha of 0.7 gives 70% priority to semantic intent while anchoring exact keyword matches.',
      commonMistakes: [
        'Relying purely on vector search for technical codebases or medical databases filled with specialized IDs.',
        'Not tuning the similarity threshold, allowing completely unrelated chunks into context.',
      ],
      interactiveType: 'hybrid',
    },
    {
      id: 7,
      title: 'Module 7: How the LLM Uses Retrieved Context',
      icon: Quote,
      summary: 'Prompt engineering, context formatting, and strict anti-hallucination guardrails.',
      simpleExplanation:
        'The retrieved chunks are pasted into a strict prompt template right above the user question. The LLM is explicitly commanded: "Answer using ONLY this provided context. If the context does not contain the answer, say you do not know."',
      diagram: `+-----------------------------------------------------------+
| SYSTEM: You are a grounded document AI assistant.        |
| RULES: Do not fabricate facts. If answer is not in        |
| context, state that it was not found. Cite [1], [2].      |
|                                                           |
| CONTEXT:                                                  |
| [1] quarterly_report.pdf (Page 3): Revenue was $14.2M...  |
|                                                           |
| QUESTION: What was Q3 revenue?                            |
+-----------------------------------------------------------+`,
      example:
        'By enumerating chunks with `[1]` and `[2]`, the model effortlessly attaches brackets to its answer sentences, which our frontend turns into clickable citation pills.',
      technicalDetails:
        'Low temperature (e.g. 0.2) is configured on the generation model to suppress random sampling and enforce deterministic factual synthesis.',
      commonMistakes: [
        'Forgetting the explicit "Refusal Clause", which leads the LLM to improvise when context is missing.',
        'Not providing structured citation brackets in the prompt instructions.',
      ],
      interactiveType: 'hallucination',
    },
    {
      id: 8,
      title: 'Module 8: Why RAG Can Hallucinate & How to Stop It',
      icon: AlertTriangle,
      summary: 'The failure modes of RAG pipelines and production defense techniques.',
      simpleExplanation:
        'RAG hallucinates when: (1) The retriever fetched the wrong chunks, (2) The prompt did not command the LLM to refuse, or (3) The user asked a trick question not covered in the library.',
      diagram: `Failure Mode 1: Retrieval Miss (Facts not in Top-K) ──> LLM guesses
Failure Mode 2: Weak Prompting (No refusal rule)    ──> LLM hallucinates
Failure Mode 3: Low Threshold (Noisy chunks passed)  ──> LLM gets confused`,
      example:
        'Question: "What is the capital of Mars?"\nWithout Refusal: "The capital of Mars is Olympus City." (Hallucination!)\nWith Grounded Guardrail: "Based on the uploaded documents, I could not find information regarding this question."',
      technicalDetails:
        'Similarity threshold filtering cuts off any chunk scoring below 0.20 cosine similarity. If zero chunks survive, the system immediately returns a truthful refusal without even calling the LLM!',
      commonMistakes: [
        'Blaming the LLM when the real culprit was a poor retrieval step that missed the relevant chunk.',
        'Setting similarity threshold to 0.0, injecting garbage noise into the prompt context.',
      ],
      interactiveType: 'hallucination',
    },
    {
      id: 9,
      title: 'Module 9: How to Evaluate RAG Systems',
      icon: Activity,
      summary: 'Measuring Precision@K, Recall@K, Faithfulness, and Latency.',
      simpleExplanation:
        'You cannot improve what you cannot measure. RAG evaluation splits into two halves: Did retrieval find the right documents (Precision & Recall)? And did generation stay 100% faithful to the facts (Faithfulness)?',
      diagram: `Retrieval Metrics:
  * Precision@K = (Relevant Chunks in Top-K) / K
  * Recall@K    = (Relevant Chunks in Top-K) / (Total Relevant Chunks)

Generation Metrics:
  * Faithfulness (Groundedness) = (Context-Supported Claims) / (Total Claims)
  * Answer Relevance = Query Alignment Score`,
      example:
        'If 3 out of 4 retrieved chunks were about the target topic, Precision@4 = 75%. If the answer asserts 2 facts and both exist in the chunk, Faithfulness = 100%.',
      technicalDetails:
        'Automated benchmarks run curated question-answer pairs against the pipeline and record retrieval latency vs generation latency in SQLite.',
      commonMistakes: [
        'Only evaluating the final answer and ignoring retrieval quality (leading to blind debugging).',
        'Not including negative test cases (questions that documents CANNOT answer).',
      ],
      interactiveType: 'eval',
    },
    {
      id: 10,
      title: 'Module 10: Advanced RAG Techniques',
      icon: Zap,
      summary: 'Cross-encoder reranking, HyDE, parent-document retrieval, and multi-query expansion.',
      simpleExplanation:
        'Basic RAG is just the beginning. Advanced RAG uses two-stage retrieval: a fast bi-encoder fetches 20 candidates, and an intelligent Cross-Encoder Reranker examines the question and chunks together to sort the single best fact to the top.',
      diagram: `Stage 1: Fast Vector Search ──> 20 Candidates
                                     │
                                     ▼
Stage 2: Cross-Encoder Reranker ──> Top-4 Most Relevant Chunks
                                     │
                                     ▼
Stage 3: LLM Answer Synthesis`,
      example:
        'HyDE (Hypothetical Document Embeddings): The LLM generates a fake hypothetical answer first, and you embed THAT answer to search for real chunks with matching technical structure!',
      technicalDetails:
        'Cross-encoders take `[CLS] Query [SEP] Chunk [SEP]` allowing full cross-attention across all tokens, outperforming single-vector dot products.',
      commonMistakes: [
        'Applying heavy cross-encoders to 10,000 chunks instead of using them only on the Top-20 retrieved candidates.',
        'Overcomplicating simple document search with unnecessary agentic loops before mastering basic hybrid retrieval.',
      ],
      interactiveType: 'hybrid',
    },
  ];

  const currentModule = modules.find((m) => m.id === activeModuleId) || modules[0];

  // Helper for live interactive chunker
  const computeLiveChunks = () => {
    const text = sandboxChunkText;
    const size = sandboxChunkSize;
    const overlap = Math.min(sandboxChunkOverlap, size - 5);
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + size));
      start += (size - overlap);
    }
    return chunks;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interactive RAG Learning Academy</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Master every stage of the Retrieval-Augmented Generation pipeline through 10 interactive modules and live sandboxes.
        </p>
      </div>

      {/* Main Learning Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Module Selector Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">
            Curriculum (10 Modules)
          </span>
          <div className="space-y-1.5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleId(mod.id)}
                  className={`w-full p-3.5 rounded-2xl text-left transition flex items-center space-x-3 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                      : 'bg-white hover:bg-sky-50/60 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {mod.title}
                    </p>
                    <p className={`text-[11px] truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                      {mod.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Module Lesson View */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wide">
              <span>Knowledge Assistant Academy</span>
              <span className="text-slate-300">•</span>
              <span>Step {currentModule.id} of 10</span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">{currentModule.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {currentModule.simpleExplanation}
            </p>
          </div>

          {/* Architecture Visual Diagram */}
          <div className="p-6 rounded-3xl bg-slate-900 text-sky-300 font-mono text-xs shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <span>Architecture Pipeline Visual</span>
              <span>ASCII Flowchart</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre leading-relaxed py-2 text-sky-200">
              {currentModule.diagram}
            </pre>
          </div>

          {/* Concrete Real-World Example */}
          <div className="p-6 rounded-3xl bg-sky-50/70 border border-sky-200 space-y-2">
            <h4 className="font-bold text-sky-900 text-sm">Concrete Example:</h4>
            <pre className="text-xs text-sky-800 whitespace-pre-wrap font-sans leading-relaxed">
              {currentModule.example}
            </pre>
          </div>

          {/* Technical Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Under the Hood (Engineering Perspective):</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentModule.technicalDetails}
            </p>
          </div>

          {/* Common Mistakes & Pitfalls */}
          <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Common Developer Mistakes to Avoid:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-800 list-disc list-inside">
              {currentModule.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="leading-relaxed">{mistake}</li>
              ))}
            </ul>
          </div>

          {/* INTERACTIVE MINI-EXPERIMENT SANDBOX */}
          <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-md space-y-5">
            <div className="flex items-center space-x-2 text-sky-900 font-bold text-sm">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>Interactive Mini-Experiment: Live Sandbox</span>
            </div>

            {/* Experiment 1: Live Interactive Chunker */}
            {currentModule.interactiveType === 'chunker' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Adjust chunk size and overlap sliders to see how text is split into segments in real time:
                </p>
                <textarea
                  value={sandboxChunkText}
                  onChange={(e) => setSandboxChunkText(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-sky-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Chunk Size:</span>
                      <span className="font-mono text-sky-700">{sandboxChunkSize} chars</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      value={sandboxChunkSize}
                      onChange={(e) => setSandboxChunkSize(parseInt(e.target.value))}
                      className="w-full accent-sky-600 mt-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Chunk Overlap:</span>
                      <span className="font-mono text-sky-700">{sandboxChunkOverlap} chars</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={sandboxChunkOverlap}
                      onChange={(e) => setSandboxChunkOverlap(parseInt(e.target.value))}
                      className="w-full accent-sky-600 mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-600">
                    Generated Chunks ({computeLiveChunks().length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {computeLiveChunks().map((chunk, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono text-sky-900 max-w-xs shadow-2xs"
                      >
                        <span className="font-bold text-[10px] text-sky-600 block mb-1">Chunk #{idx + 1} ({chunk.length} chars)</span>
                        "{chunk}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experiment 2: Live Cosine Similarity */}
            {currentModule.interactiveType === 'embedding' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Compare two sentences to observe high-dimensional semantic alignment:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sentence A:</label>
                    <input
                      type="text"
                      value={sandboxCosineA}
                      onChange={(e) => setSandboxCosineA(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sentence B:</label>
                    <input
                      type="text"
                      value={sandboxCosineB}
                      onChange={(e) => setSandboxCosineB(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-700"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-semibold">Simulated Semantic Alignment Score:</span>
                  <span className="text-lg font-extrabold font-mono text-emerald-700">
                    ~0.884 (Strong Semantic Match)
                  </span>
                </div>
              </div>
            )}

            {/* Experiment 3: Live Hallucination & Refusal Sandbox */}
            {currentModule.interactiveType === 'hallucination' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Test the anti-hallucination guardrail: Ask a question whose answer is NOT present in the context!
                </p>
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700">Supplied Context:</label>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    {sandboxHallucinationContext}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700">Unanswered Question:</label>
                  <input
                    type="text"
                    value={sandboxHallucinationQuery}
                    onChange={(e) => setSandboxHallucinationQuery(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs space-y-1">
                  <span className="font-bold text-sky-900">Grounded Refusal Behavior:</span>
                  <p className="text-sky-800 italic">
                    "Based on the uploaded documents, I could not find information regarding underground liquid water. The documents only discuss the landing on Olympus Mons and granite rocks."
                  </p>
                </div>
              </div>
            )}

            {/* Experiment 4: Evaluation Benchmark Calculator */}
            {currentModule.interactiveType === 'eval' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Precision@K Formula: If K = 4 chunks retrieved, and 3 are relevant:
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono">
                  Precision@4 = 3 / 4 = 75.0%
                </div>
              </div>
            )}

            {/* Experiment 5: Hybrid Alpha */}
            {currentModule.interactiveType === 'hybrid' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Hybrid Alpha Weight (α):</span>
                  <span className="font-mono text-sky-700">{sandboxAlpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={sandboxAlpha}
                  onChange={(e) => setSandboxAlpha(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Pure Keyword: {(1 - sandboxAlpha).toFixed(2)}</span>
                  <span>Pure Semantic Vector: {sandboxAlpha.toFixed(2)}</span>
                </div>
              </div>
            )}

          </div>

          {/* Curriculum Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveModuleId(Math.max(1, activeModuleId - 1))}
              disabled={activeModuleId === 1}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Module</span>
            </button>
            <span className="text-xs text-slate-400 font-medium">
              {activeModuleId} of 10 Modules
            </span>
            <button
              onClick={() => setActiveModuleId(Math.min(10, activeModuleId + 1))}
              disabled={activeModuleId === 10}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 disabled:opacity-40 flex items-center space-x-1 shadow-sm"
            >
              <span>Next Module</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
