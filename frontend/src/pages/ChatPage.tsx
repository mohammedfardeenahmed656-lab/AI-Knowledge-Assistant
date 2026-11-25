import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileText,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';
import {
  MessageItem,
  ConversationSummary,
  DocumentItem,
  RAGSettings,
  Citation,
  RAGProcessDebug
} from '../types';
import { RAGProcessModal } from '../components/RAGProcessModal';
import { CitationModal } from '../components/CitationModal';

interface ChatPageProps {
  settings: RAGSettings;
  onOpenSettings: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ settings, onOpenSettings }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);

  // Modals state
  const [activeDebugData, setActiveDebugData] = useState<RAGProcessDebug | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [expandedChunksMessageId, setExpandedChunksMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversationMessages = async (id: string) => {
    try {
      const detail = await api.getConversation(id);
      setMessages(detail.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversationId === id) {
        handleStartNewConversation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || loading) return;

    // Optimistic user message append
    const tempUserMsg: MessageItem = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(trimmed, currentConversationId, settings, selectedDocId);

      if (!currentConversationId) {
        setCurrentConversationId(res.conversation_id);
        loadConversations();
      }

      const assistantMsg: MessageItem = {
        id: res.message_id,
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        rag_process: res.rag_process,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to generate response'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-2xl bg-white border border-sky-100 shadow-sm overflow-hidden animate-fade-in">

      {/* Sidebar: Conversation History & Filters */}
      <aside className="w-80 border-r border-slate-100 bg-slate-50/60 flex flex-col shrink-0">

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={handleStartNewConversation}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 text-white font-semibold text-sm shadow-sm hover:bg-sky-700 transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Filter Document Selector */}
        <div className="px-4 py-2 border-b border-slate-100">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Filter Context Document
          </label>
          <select
            value={selectedDocId || ''}
            onChange={(e) => setSelectedDocId(e.target.value || undefined)}
            className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-700 font-medium focus:outline-sky-500"
          >
            <option value="">All Uploaded Documents ({documents.length})</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename} ({d.chunk_count} chunks)
              </option>
            ))}
          </select>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recent Chats
          </div>
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const isActive = currentConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setCurrentConversationId(conv.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${isActive
                    ? 'bg-sky-100 text-sky-900 font-bold border border-sky-200'
                    : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                >
                  <span className="truncate pr-2">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 p-3 text-center">No previous conversations.</p>
          )}
        </div>

        {/* Hyperparameter Quick-Footer */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700">Top-K:</span>
            <span className="font-mono">{settings.top_k}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Mode:</span>
            <span className="capitalize">{settings.search_mode}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 hover:text-sky-600 rounded"
            title="Configure RAG settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* Main Chat Stream Container */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Chat Area Header */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <h2 className="font-bold text-slate-800 text-sm">
              {currentConversationId
                ? conversations.find(c => c.id === currentConversationId)?.title || 'Active Conversation'
                : 'New Ingestion Session'}
            </h2>
            {selectedDocId && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                Filtered: {documents.find(d => d.id === selectedDocId)?.filename}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Strictly Grounded Anti-Hallucination Mode</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">How can I help you explore your documents?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ask questions about your uploaded PDFs, DOCX files, or text notes. Every assertion will include clickable source citations.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                {[
                  "What is Retrieval-Augmented Generation?",
                  "Why is document chunking necessary before embedding?",
                  "How does Cosine Similarity compare vectors?",
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInputMessage(sample); }}
                    className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 text-sky-800 text-xs text-left font-medium transition"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${isUser
                      ? 'bg-sky-600 text-white shadow-sm font-medium'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs'
                      }`}
                  >
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Citations Chips for Assistant Messages */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                          <Bookmark className="w-3 h-3 text-sky-600" />
                          <span>Sources:</span>
                        </span>
                        {msg.citations.map((cit) => (
                          <button
                            key={cit.index}
                            onClick={() => setActiveCitation(cit)}
                            className="px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-50 hover:border-sky-300 transition shadow-2xs"
                          >
                            [{cit.index}] {cit.filename} (p.{cit.page})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assistant Footer Actions: "Show RAG Process" & Retrieved Chunks */}
                  {!isUser && msg.rag_process && (
                    <div className="flex items-center space-x-3 text-xs text-slate-400 pl-1">
                      {/* Show RAG Process Debugger Button (Section 9) */}
                      <button
                        onClick={() => setActiveDebugData(msg.rag_process || null)}
                        className="flex items-center space-x-1 font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 transition"
                      >
                        <Zap className="w-3.5 h-3.5 text-sky-500" />
                        <span>Show RAG Process</span>
                      </button>

                      {/* Expand Chunks Toggle */}
                      <button
                        onClick={() => setExpandedChunksMessageId(expandedChunksMessageId === msg.id ? null : msg.id)}
                        className="flex items-center space-x-1 hover:text-slate-600 font-medium"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{msg.rag_process.retrieved_chunks.length} Chunks Used</span>
                        {expandedChunksMessageId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {msg.rag_process.total_latency_ms} ms
                      </span>
                    </div>
                  )}

                  {/* Collapsible Retrieved Chunks Drawer */}
                  {!isUser && expandedChunksMessageId === msg.id && msg.rag_process && (
                    <div className="max-w-2xl w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-2 mt-1">
                      <span className="font-bold text-slate-700 block">Retrieved Context Chunks:</span>
                      {msg.rag_process.retrieved_chunks.map((chunk, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 space-y-1">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>#{chunk.rank} {chunk.filename} (Page {chunk.page})</span>
                            <span className="text-emerald-700">Sim: {chunk.similarity_score.toFixed(4)}</span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-600 line-clamp-3">{chunk.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}

          {/* Loading Animation Bubble */}
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce delay-200"></span>
                <span className="text-xs font-semibold text-slate-600 ml-1">
                  Retrieving context & synthesizing grounded response...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your uploaded documents..."
              disabled={loading}
              className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-sky-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="absolute right-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 disabled:opacity-40 disabled:hover:bg-sky-600 transition flex items-center space-x-1 shadow-sm"
            >
              <span>Send</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press Enter to send • Responses strictly grounded with citations</span>
            <span>All-MiniLM-L6-v2 Embeddings • ChromaDB Vector Store</span>
          </div>
        </div>

      </div>

      {/* RAG Process Inspector Modal */}
      <RAGProcessModal
        debugData={activeDebugData}
        onClose={() => setActiveDebugData(null)}
      />

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
};

