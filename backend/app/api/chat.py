"""
API Router: Conversational RAG & Memory
=======================================
Coordinates multi-turn conversational question-answering, hybrid chunk retrieval,
contextual reranking, LLM answer synthesis, inline citations, and RAG process inspection.
"""

import time
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.schemas import (
    ChatRequest,
    ChatResponse,
    Citation,
    RetrievedChunk,
    RAGProcessDebug,
    ConversationSummary,
    ConversationDetail,
    MessageItem
)
from app.rag.embeddings import embedding_engine
from app.rag.retriever import retriever
from app.rag.reranker import reranker
from app.rag.prompt import build_rag_prompt
from app.rag.generator import answer_generator
from app.database.models import (
    create_conversation_record,
    get_conversation_record,
    list_conversations_records,
    get_conversation_messages_records,
    insert_message_record,
    update_conversation_title_record,
    get_db
)

router = APIRouter(tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Execute full RAG pipeline for user query:
      1. Session verification & conversation history retrieval
      2. Dense query embedding generation
      3. Hybrid retrieval (Dense Vector + Sparse BM25 Keyword)
      4. Contextual reranking
      5. Grounded prompt assembly
      6. LLM answer synthesis
      7. Citation resolution
      8. Session state persistence
    """
    total_start = time.perf_counter()
    question = request.message.strip()
    
    # 1. Manage Conversation Session
    conversation_id = request.conversation_id
    is_new_conversation = False
    if not conversation_id:
        # Auto-create new conversation
        title = question[:35] + ("..." if len(question) > 35 else "")
        conv = create_conversation_record(title=title)
        conversation_id = conv["id"]
        is_new_conversation = True
    else:
        existing = get_conversation_record(conversation_id)
        if not existing:
            title = question[:35] + ("..." if len(question) > 35 else "")
            conv = create_conversation_record(title=title, conv_id=conversation_id)
            conversation_id = conv["id"]
            
    # Fetch prior conversation history
    history = get_conversation_messages_records(conversation_id)
    
    # 2. Query Embedding Generation & Preview
    query_vec = embedding_engine.embed_text(question)
    vec_preview = [round(float(v), 4) for v in query_vec[:8]]
    
    # 3. Retrieval
    ret_start = time.perf_counter()
    raw_chunks = retriever.retrieve(
        query=question,
        top_k=request.top_k,
        similarity_threshold=request.similarity_threshold,
        mode=request.search_mode,
        hybrid_alpha=request.hybrid_alpha,
        document_id=request.document_id
    )
    ret_latency = (time.perf_counter() - ret_start) * 1000.0
    
    # 4. Contextual Reranking
    reranked_chunks = reranker.rerank(
        query=question,
        candidates=raw_chunks,
        top_k=request.top_k
    )
    
    # 5. Build Grounded Prompt
    prompt_text = build_rag_prompt(
        question=question,
        retrieved_chunks=reranked_chunks,
        conversation_history=history
    )
    
    # 6. LLM Generation & Citation Parsing
    answer_text, citations_list, gen_latency = answer_generator.generate_answer(
        question=question,
        retrieved_chunks=reranked_chunks,
        conversation_history=history
    )
    
    total_latency = (time.perf_counter() - total_start) * 1000.0
    
    # 7. Persist messages to database
    # Record user question
    insert_message_record(
        conversation_id=conversation_id,
        role="user",
        content=question
    )
    
    # Record assistant answer with citations and RAG metadata
    rag_debug_dict = {
        "retrieval_mode": request.search_mode,
        "retrieval_latency_ms": round(ret_latency, 2),
        "generation_latency_ms": round(gen_latency, 2),
        "total_latency_ms": round(total_latency, 2),
        "chunks_used": len(reranked_chunks)
    }
    
    assistant_msg = insert_message_record(
        conversation_id=conversation_id,
        role="assistant",
        content=answer_text,
        citations=citations_list,
        rag_metadata=rag_debug_dict
    )
    
    # Update conversation title if first message
    if is_new_conversation:
        auto_title = question[:35] + ("..." if len(question) > 35 else "")
        update_conversation_title_record(conversation_id, auto_title)
        
    # Construct complete RAG process debugging object
    debug_payload = RAGProcessDebug(
        question=question,
        query_embedding_dimension=len(query_vec),
        query_embedding_preview=vec_preview,
        retrieval_mode=request.search_mode,
        retrieved_chunks_count=len(reranked_chunks),
        retrieved_chunks=[RetrievedChunk(**c) for c in reranked_chunks],
        constructed_context="\n\n".join([f"[{c.get('rank', idx+1)}] {c['filename']} (p.{c.get('page', 1)}): {c['text'][:150]}..." for idx, c in enumerate(reranked_chunks)]),
        prompt_template_used=prompt_text,
        llm_provider=answer_generator.provider_name,
        llm_model=answer_generator.model_name,
        retrieval_latency_ms=round(ret_latency, 2),
        generation_latency_ms=round(gen_latency, 2),
        total_latency_ms=round(total_latency, 2),
        citations=[Citation(**cit) for cit in citations_list]
    )
    
    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_msg["id"],
        answer=answer_text,
        citations=[Citation(**cit) for cit in citations_list],
        retrieved_chunks=[RetrievedChunk(**c) for c in reranked_chunks],
        rag_process=debug_payload,
        conversation_history_length=len(history) + 2
    )

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations():
    """Retrieve all conversations with message counts ordered by latest activity."""
    convs = list_conversations_records()
    return [ConversationSummary(**c) for c in convs]

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str):
    """Retrieve complete message history for a conversation."""
    conv = get_conversation_record(conversation_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    messages = get_conversation_messages_records(conversation_id)
    return ConversationDetail(
        id=conv["id"],
        title=conv["title"],
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
        messages=[MessageItem(**m) for m in messages]
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(conversation_id: str):
    """Delete a conversation session and all its messages."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return {"message": "Conversation deleted successfully."}