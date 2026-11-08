import React, { useEffect, useState } from 'react';
import {
  Files,
  Layers,
  MessageSquare,
  HelpCircle,
  Clock,
  Zap,
  ArrowUpRight,
  Database,
  Cpu,
  CheckCircle2,
  PlusCircle,
  Search,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 p-8 text-white shadow-xl shadow-sky-500/15">
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
            <Zap className="w-3.5 h-3.5 text-sky-200" />
            <span>AI Knowledge Assistant Platform</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Production-Grade Retrieval-Augmented Generation
          </h1>
          <p className="text-sky-100 text-sm sm:text-base leading-relaxed">
            Ingest your documents, generate high-dimensional embeddings, execute hybrid vector-keyword retrieval, and inspect the entire RAG pipeline end-to-end.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('chat')}
              className="px-5 py-2.5 rounded-xl bg-white text-sky-700 font-bold text-sm shadow-md hover:bg-sky-50 transition flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Assistant</span>
            </button>
            <button
              onClick={() => onNavigate('documents')}
              className="px-5 py-2.5 rounded-xl bg-sky-700/60 border border-white/25 text-white font-semibold text-sm hover:bg-sky-700 transition flex items-center space-x-2"
            >
              <Files className="w-4 h-4" />
              <span>Upload Documents</span>
            </button>
            <button
              onClick={() => onNavigate('learning')}
              className="px-5 py-2.5 rounded-xl bg-indigo-800/50 border border-white/25 text-white font-semibold text-sm hover:bg-indigo-800 transition flex items-center space-x-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Interactive RAG Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Section 15 Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Documents</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Files className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {loading ? '...' : stats?.total_documents ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Indexed in knowledge base</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Chunks</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {loading ? '...' : (stats?.total_chunks ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            384-dimensional vector embeddings
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversations</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {loading ? '...' : stats?.total_conversations ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Multi-turn persistent chat threads
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Questions Answered</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {loading ? '...' : stats?.total_questions_answered ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Grounded with citations & verification
          </p>
        </div>

      </div>

      {/* Latency & Hardware Engine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Avg Retrieval Latency</span>
            <p className="text-xl font-bold text-slate-800">
              {stats?.avg_retrieval_time_ms ?? 14.2} <span className="text-xs font-normal text-slate-400">ms</span>
            </p>
            <p className="text-[11px] text-slate-400">Dense Vector + BM25</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Vector Storage Engine</span>
            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
              {stats?.vector_store_type ?? 'ChromaDB (HNSW)'}
            </p>
            <p className="text-[11px] text-slate-400">Cosine Distance Space</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Active LLM Provider</span>
            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
              {stats?.active_llm_provider ?? 'Grounded Heuristic Synthesizer'}
            </p>
            <p className="text-[11px] text-slate-400">Zero API Key Barrier</p>
          </div>
        </div>

      </div>

      {/* Two-Column Detail Section: Recent Docs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Ingested Documents */}
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Files className="w-4 h-4 text-sky-600" />
              <span>Recent Ingested Documents</span>
            </h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              stats.recent_documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-100">
                      {doc.file_type.replace('.', '')}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{doc.filename}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(doc.upload_date).toLocaleDateString()} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    {doc.chunk_count} chunks
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No documents uploaded yet. Click "Upload Documents" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Recent Conversations</span>
            </h3>
            <button
              onClick={() => onNavigate('chat')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
            >
              <span>Open Chat</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recent_conversations && stats.recent_conversations.length > 0 ? (
              stats.recent_conversations.map((conv) => (
                <div key={conv.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{conv.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700">
                    {conv.message_count} messages
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No conversations recorded yet. Start a new chat!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
