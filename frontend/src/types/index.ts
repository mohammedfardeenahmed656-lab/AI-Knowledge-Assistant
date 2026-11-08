// TypeScript Type Definitions for AI Knowledge Assistant

export interface ChunkInfo {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number;
  chunk_index: number;
  text: string;
  char_count: number;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: string;
  upload_date: string;
  metadata?: Record<string, any>;
  chunks?: ChunkInfo[];
}

export interface Citation {
  index: number;
  document_id: string;
  filename: string;
  page: number;
  chunk_id: string;
  preview_text: string;
}

export interface RetrievedChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number;
  chunk_index: number;
  text: string;
  similarity_score: number;
  rank: number;
  match_source: 'vector' | 'keyword' | 'hybrid';
}

export interface RAGProcessDebug {
  question: string;
  query_embedding_dimension: number;
  query_embedding_preview: number[];
  retrieval_mode: string;
  retrieved_chunks_count: number;
  retrieved_chunks: RetrievedChunk[];
  constructed_context: string;
  prompt_template_used: string;
  llm_provider: string;
  llm_model: string;
  generation_latency_ms: number;
  retrieval_latency_ms: number;
  total_latency_ms: number;
  citations: Citation[];
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  rag_metadata?: Record<string, any>;
  rag_process?: RAGProcessDebug;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
}

export interface SingleEvaluationResult {
  question: string;
  expected_answer: string;
  generated_answer: string;
  relevant_document: string;
  relevant_page: number;
  retrieved_documents: string[];
  retrieved_pages: number[];
  precision_at_k: number;
  recall_at_k: number;
  faithfulness_score: number;
  answer_relevance_score: number;
  retrieval_latency_ms: number;
  generation_latency_ms: number;
  total_latency_ms: number;
}

export interface EvaluationSuiteResponse {
  run_timestamp: string;
  total_test_cases: number;
  mean_precision_at_k: number;
  mean_recall_at_k: number;
  mean_faithfulness_score: number;
  mean_answer_relevance_score: number;
  avg_retrieval_latency_ms: number;
  avg_generation_latency_ms: number;
  avg_total_latency_ms: number;
  results: SingleEvaluationResult[];
}

export interface DashboardStats {
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_questions_answered: number;
  avg_retrieval_time_ms: number;
  avg_response_time_ms: number;
  active_llm_provider: string;
  active_embedding_model: string;
  vector_store_type: string;
  recent_documents: DocumentItem[];
  recent_conversations: ConversationSummary[];
}

export interface SearchLabResponse {
  query: string;
  mode: string;
  total_results: number;
  chunks: RetrievedChunk[];
  retrieval_latency_ms: number;
  debug_explanation?: string;
}

export interface RAGSettings {
  top_k: number;
  similarity_threshold: number;
  search_mode: 'vector' | 'keyword' | 'hybrid';
  hybrid_alpha: number;
}
