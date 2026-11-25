"""
RAG Pipeline Component: Strict Prompt Engineering & Context Assembly
=====================================================================

Educational Deep-Dive:
----------------------
Why is the Prompt Template critical in RAG?
An LLM (Large Language Model) does not inherently know it is restricted to your documents.
Left unprompted, an LLM will draw upon its vast pre-training data and "hallucinate" plausible-sounding
answers even when your documents contain contradictory or no information at all!

The 4 Essential Anti-Hallucination Guardrails in RAG Prompts:
  1. Grounding Directive: Explicitly state that the retrieved context is the single source of truth.
  2. The Refusal Clause: Explicitly command the LLM: "If the supplied context does NOT contain
     sufficient evidence to answer the question, state clearly: 'Based on the uploaded documents,
     I could not find information regarding...'".
  3. Inline Citation Syntax: Instruct the LLM to mark facts with numerical brackets `[1]`, `[2]`
     matching the enumerated context chunks.
  4. Context Formatting: Format retrieved chunks with clear separation markers, document filenames,
     and page numbers so the model can cite accurately.
"""

from typing import List, Dict, Any, Optional

SYSTEM_PROMPT = """You are an AI Knowledge Assistant powered by a strict Retrieval-Augmented Generation (RAG) pipeline.
Your duty is to answer the user's question accurately, honestly, and concisely, grounded strictly in the provided document context.

OPERATIONAL RULES:
1. TRUTHFULNESS & GROUNDING: Use the provided RETRIEVED CONTEXT as your authoritative source of facts. Do not fabricate facts, statistics, names, or timelines.
2. REFUSAL WHEN UNCERTAIN: If the provided context does not contain the necessary information to answer the question, state clearly and politely:
   "Based on the uploaded documents, I could not find information regarding this question."
   Do NOT attempt to invent an answer from general knowledge when document evidence is absent.
3. INLINE CITATIONS: For every assertion or factual claim you make, append an inline citation referring to the context source using bracket notation, e.g., [1] or [2].
4. MULTI-TURN MEMORY: If conversation history is provided, use it to understand pronouns and context, but ensure factual claims remain supported by the retrieved context.
5. FORMATTING: Structure your response cleanly with bullet points, numbered steps, or bold headers where appropriate for readability.
"""

def format_retrieved_context(retrieved_chunks: List[Dict[str, Any]]) -> str:
    """
    Format retrieved chunks into numbered context blocks for prompt injection.
    Example:
      [1] Source: quarterly_report.pdf (Page 3)
      Chunk Text: The company reported revenue growth...
    """
    if not retrieved_chunks:
        return "No relevant document chunks found."
        
    formatted_blocks = []
    for idx, chunk in enumerate(retrieved_chunks, start=1):
        filename = chunk.get("filename", "Unknown Document")
        page = chunk.get("page", 1)
        text = chunk.get("text", "").strip()
        similarity = chunk.get("similarity_score", 0.0)
        
        block = (
            f"--- [CONTEXT CHUNK {idx}] ---\n"
            f"Source Document: {filename} (Page {page})\n"
            f"Similarity Score: {similarity:.4f}\n"
            f"Content:\n{text}\n"
        )
        formatted_blocks.append(block)
        
    return "\n".join(formatted_blocks)

def format_conversation_history(history: List[Dict[str, Any]], max_turns: int = 4) -> str:
    """
    Format recent conversation history compactly to maintain context without
    exceeding token limits.
    """
    if not history:
        return "None (New conversation)"
        
    # Take the last `max_turns * 2` messages
    recent = history[-(max_turns * 2):]
    formatted = []
    for msg in recent:
        role = msg.get("role", "user").capitalize()
        content = msg.get("content", "").strip()
        formatted.append(f"{role}: {content}")
        
    return "\n".join(formatted)

def build_rag_prompt(
    question: str,
    retrieved_chunks: List[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Construct the complete LLM prompt containing system instructions,
    recent conversation history, retrieved context blocks, and user query.
    """
    context_str = format_retrieved_context(retrieved_chunks)
    history_str = format_conversation_history(conversation_history or [])
    
    prompt = f"""{SYSTEM_PROMPT}

CONVERSATION HISTORY:
{history_str}

RETRIEVED DOCUMENT CONTEXT:
{context_str}

USER QUESTION:
{question}

ASSISTANT GROUNDED ANSWER (with inline citations [1], [2]):"""
    return prompt

