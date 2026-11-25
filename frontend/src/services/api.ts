// API Service Layer for AI Knowledge Assistant
import {
  DashboardStats,
  DocumentItem,
  ConversationSummary,
  ConversationDetail,
  EvaluationSuiteResponse,
  SearchLabResponse,
  RAGSettings,
  RAGProcessDebug,
  Citation,
  RetrievedChunk
} from '../types';

const API_BASE = '/api';

export interface ChatResponsePayload {
  conversation_id: string;
  message_id: string;
  answer: string;
  citations: Citation[];
  retrieved_chunks: RetrievedChunk[];
  rag_process: RAGProcessDebug;
  conversation_history_length: number;
}

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to load document details');
    return res.json();
  },

  async uploadDocument(file: File): Promise<{ success: boolean; document: DocumentItem; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Document ingestion failed');
    }
    return res.json();
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  // Chat & Conversation
  async sendChatMessage(
    message: string,
    conversationId: string | null,
    settings: RAGSettings,
    documentId?: string
  ): Promise<ChatResponsePayload> {
    const payload = {
      message,
      conversation_id: conversationId,
      top_k: settings.top_k,
      similarity_threshold: settings.similarity_threshold,
      search_mode: settings.search_mode,
      hybrid_alpha: settings.hybrid_alpha,
      document_id: documentId || null,
    };

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
      throw new Error(err.detail || 'Failed to generate assistant response');
    }
    return res.json();
  },

  async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation history');
    return res.json();
  },

  async deleteConversation(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  // Direct Search Lab
  async searchDirect(
    query: string,
    topK: number,
    threshold: number,
    mode: 'vector' | 'keyword' | 'hybrid',
    hybridAlpha: number,
    documentId?: string
  ): Promise<SearchLabResponse> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        similarity_threshold: threshold,
        mode,
        hybrid_alpha: hybridAlpha,
        document_id: documentId || null,
      }),
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Evaluation Suite
  async runEvaluation(settings: {
    top_k: number;
    similarity_threshold: number;
    mode: string;
    hybrid_alpha: number;
  }): Promise<EvaluationSuiteResponse> {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Evaluation run failed');
    return res.json();
  },
};

