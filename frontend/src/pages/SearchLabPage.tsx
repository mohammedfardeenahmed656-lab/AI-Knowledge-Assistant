import React, { useState } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  Zap,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { SearchLabResponse, RetrievedChunk } from '../types';

export const SearchLabPage: React.FC = () => {
  const [query, setQuery] = useState('How does RAG compare to Fine-Tuning?');
  const [mode, setMode] = useState<'vector' | 'keyword' | 'hybrid'>('hybrid');
  const [hybridAlpha, setHybridAlpha] = useState(0.70);
  const [topK, setTopK] = useState(4);
  const [threshold, setThreshold] = useState(0.10);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchLabResponse | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.searchDirect(query, topK, threshold, mode, hybridAlpha);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hybrid Search & Retrieval Lab</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Compare Dense Vector Search (semantic similarity) vs Sparse Keyword Search (BM25 token frequency) in real time.
        </p>
      </div>

      {/* Educational Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-sky-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Dense Vector Search (Semantic)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Encodes meaning into 384-dimensional space. Excels at <strong>synonyms, conceptual themes, and paraphrasing</strong>. Even if query and document share zero identical words, semantic proximity retrieves the target.
          </p>
          <div className="p-2.5 rounded-lg bg-sky-50 text-[11px] text-sky-800 font-mono">
            &quot;Automobile engine breakdown&quot; &rarr; Matches &quot;Car failed to start&quot;
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-indigo-800 font-bold text-sm">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Sparse Keyword Search (BM25 Okapi)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates exact token frequencies, inverse document frequencies, and document lengths. Excels at <strong>error codes, acronyms, product IDs, and function names</strong>.
          </p>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-[11px] text-indigo-800 font-mono">
            &quot;ERR-503&quot; or &quot;get_user_by_id()&quot; &rarr; Matches exact identifier
          </div>
        </div>
      </div>

      {/* Search Input & Controls */}
      <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query to test retrieval..."
              className="w-full pl-4 pr-32 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-500 transition shadow-inner font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-5 py-2 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition flex items-center space-x-1.5 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Run Search'}</span>
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'hybrid', label: 'Hybrid Search (Combined)', desc: 'Balanced semantic + exact keywords' },
              { id: 'vector', label: 'Vector Search Only', desc: 'Dense Cosine Similarity' },
              { id: 'keyword', label: 'BM25 Keyword Only', desc: 'Exact token TF-IDF matching' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as any)}
                className={`p-3 rounded-xl border text-left transition ${mode === tab.id
                  ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
              >
                <p className="font-bold text-xs">{tab.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* Hybrid Alpha Slider */}
          {mode === 'hybrid' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Hybrid Alpha Weight (α):</span>
                <span className="font-mono text-sky-700 font-extrabold text-sm">{hybridAlpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={hybridAlpha}
                onChange={(e) => setHybridAlpha(parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0.0 = 100% BM25 Sparse Keyword</span>
                <span>0.7 = Recommended Hybrid Blend</span>
                <span>1.0 = 100% Dense Vector Embedding</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Found <strong>{result.total_results}</strong> candidate chunks in{' '}
              <strong className="text-slate-800">{result.retrieval_latency_ms} ms</strong>
            </span>
            <span className="text-[11px] bg-slate-100 px-2.5 py-1 rounded text-slate-600 font-mono">
              {result.debug_explanation}
            </span>
          </div>

          <div className="space-y-3">
            {result.chunks.map((chunk) => (
              <div
                key={chunk.chunk_id}
                className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-2 hover:border-sky-200 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                      #{chunk.rank}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{chunk.filename}</span>
                    <span className="text-xs text-slate-400">Page {chunk.page} (Chunk {chunk.chunk_index})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Score: {chunk.similarity_score.toFixed(4)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                      {chunk.match_source}
                    </span>
                  </div>
                </div>
                <p className="p-3 rounded-xl bg-slate-50 text-slate-700 text-xs font-mono leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {chunk.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
