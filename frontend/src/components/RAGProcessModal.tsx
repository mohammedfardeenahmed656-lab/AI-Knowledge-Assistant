import React, { useState } from 'react';
import {
  X,
  Binary,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Brain,
  Quote,
  Zap,
  HelpCircle
} from 'lucide-react';
import { RAGProcessDebug } from '../types';

interface RAGProcessModalProps {
  debugData: RAGProcessDebug | null;
  onClose: () => void;
}

export const RAGProcessModal: React.FC<RAGProcessModalProps> = ({ debugData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'chunks' | 'prompt' | 'metrics'>('flow');

  if (!debugData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">RAG Pipeline Inspector & Debugger</h3>
              <p className="text-xs text-slate-500">
                Inspect every step: Query → Vector Embedding → Top-K Retrieval → Prompt Injection → LLM Synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 space-x-6 text-sm font-semibold text-slate-500 bg-white">
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'flow' ? 'border-sky-600 text-sky-700' : 'border-transparent hover:text-slate-800'
            }`}
          >
            1. 8-Step Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'chunks' ? 'border-sky-600 text-sky-700' : 'border-transparent hover:text-slate-800'
            }`}
          >
            2. Retrieved Chunks ({debugData.retrieved_chunks.length})
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'prompt' ? 'border-sky-600 text-sky-700' : 'border-transparent hover:text-slate-800'
            }`}
          >
            3. Grounded LLM Prompt
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'metrics' ? 'border-sky-600 text-sky-700' : 'border-transparent hover:text-slate-800'
            }`}
          >
            4. Execution Latencies
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-slate-50/50">
          
          {/* TAB 1: 8-Step Pipeline Flow */}
          {activeTab === 'flow' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-800 flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Educational Walkthrough</p>
                  <p className="text-sky-700 mt-0.5">
                    This step-by-step trace exposes how your raw natural language query is translated into a 384-dimensional vector coordinate, compared against indexed document chunks, and used to formulate a grounded response.
                  </p>
                </div>
              </div>

              {/* Step 1: User Question */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wide mb-1">
                  <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">1</span>
                  <span>User Question</span>
                </div>
                <p className="text-slate-800 font-medium text-base ml-7">"{debugData.question}"</p>
              </div>

              {/* Step 2: Query Embedding Vector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">2</span>
                    <span>Query Embedding Vector ({debugData.query_embedding_dimension} Dimensions)</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">L2 Norm: 1.0</span>
                </div>
                <p className="text-xs text-slate-500 ml-7 mb-2">
                  First 8 coordinates (numbers represent the semantic position of the question in vector space):
                </p>
                <div className="ml-7 p-2 rounded-lg bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto">
                  [{debugData.query_embedding_preview.join(', ')}, ...]
                </div>
              </div>

              {/* Step 3 & 4: Top Chunks & Similarity */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">3 & 4</span>
                  <span>Top Retrieved Chunks & Cosine Similarity Scores</span>
                </div>
                <div className="ml-7 space-y-2">
                  {debugData.retrieved_chunks.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-600">#{c.rank}</span>
                        <span className="font-semibold text-slate-800">{c.filename}</span>
                        <span className="text-slate-500">(Page {c.page})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          Similarity: {c.similarity_score.toFixed(4)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-200 text-slate-700">
                          {c.match_source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: Final Constructed Context */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">5</span>
                  <span>Final Context Assembly</span>
                </div>
                <p className="text-xs text-slate-600 ml-7">
                  {debugData.retrieved_chunks.length} chunks synthesized and formatted with bracketed source labels [1], [2] for LLM citation.
                </p>
              </div>

              {/* Step 6: LLM Execution */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">6 & 7</span>
                    <span>LLM Synthesis ({debugData.llm_provider})</span>
                  </div>
                  <span className="text-xs font-mono text-purple-700 font-semibold">{debugData.llm_model}</span>
                </div>
                <p className="text-xs text-slate-600 ml-7">
                  Generation Latency: <strong className="text-slate-800">{debugData.generation_latency_ms} ms</strong> | Retrieval Latency: <strong className="text-slate-800">{debugData.retrieval_latency_ms} ms</strong>
                </p>
              </div>

              {/* Step 8: Sources & Citations */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wide mb-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">8</span>
                  <span>Verified Source Citations ({debugData.citations.length})</span>
                </div>
                <div className="ml-7 flex flex-wrap gap-2">
                  {debugData.citations.map((cit, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200">
                      [{cit.index}] {cit.filename} — Page {cit.page}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Retrieved Chunks */}
          {activeTab === 'chunks' && (
            <div className="space-y-4">
              {debugData.retrieved_chunks.map((chunk, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                        #{chunk.rank}
                      </span>
                      <span className="font-bold text-slate-900">{chunk.filename}</span>
                      <span className="text-xs text-slate-500 font-medium">Page {chunk.page} (Chunk index {chunk.chunk_index})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Score: {chunk.similarity_score.toFixed(4)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                        {chunk.match_source}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                    {chunk.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Grounded Prompt */}
          {activeTab === 'prompt' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Exact Prompt Injected into LLM:</span>
                <span className="font-mono">{debugData.prompt_template_used.length} characters</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                {debugData.prompt_template_used}
              </pre>
            </div>
          )}

          {/* TAB 4: Execution Latencies */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Retrieval Latency</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{debugData.retrieval_latency_ms} <span className="text-sm font-normal text-slate-500">ms</span></p>
                  <p className="text-xs text-slate-400 mt-1">Vector DB + BM25 Search</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Generation Latency</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{debugData.generation_latency_ms} <span className="text-sm font-normal text-slate-500">ms</span></p>
                  <p className="text-xs text-slate-400 mt-1">Prompt Inference & Citations</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Roundtrip</span>
                  <p className="text-2xl font-extrabold text-sky-600 mt-1">{debugData.total_latency_ms} <span className="text-sm font-normal text-slate-500">ms</span></p>
                  <p className="text-xs text-slate-400 mt-1">Complete API Transaction</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Component Breakdown</h4>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    style={{ width: `${Math.max(5, (debugData.retrieval_latency_ms / (debugData.total_latency_ms || 1)) * 100)}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Retrieval: ${debugData.retrieval_latency_ms} ms`}
                  ></div>
                  <div
                    style={{ width: `${Math.max(5, (debugData.generation_latency_ms / (debugData.total_latency_ms || 1)) * 100)}%` }}
                    className="bg-sky-500 h-full"
                    title={`Generation: ${debugData.generation_latency_ms} ms`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Retrieval ({((debugData.retrieval_latency_ms / (debugData.total_latency_ms || 1)) * 100).toFixed(1)}%)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                    <span>Generation ({((debugData.generation_latency_ms / (debugData.total_latency_ms || 1)) * 100).toFixed(1)}%)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};

