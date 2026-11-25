"""
RAG Pipeline Component: Recursive Document Chunker
===================================================

Educational Deep-Dive:
----------------------
What is Chunking?
Chunking is the process of breaking long documents into smaller, semantically coherent segments.

Why is Chunking essential in RAG?
1. Context Window Constraints:
   Even modern LLMs with large context windows suffer from the "Lost in the Middle" phenomenon:
   relevant information buried in the middle of a massive prompt is frequently overlooked.
2. Embedding Granularity:
   An embedding vector represents the "average" semantic concept of its input text.
   A vector representing an entire 100-page book is blurry and generalized.
   A vector representing a single 400-word paragraph is sharp, precise, and highly retrievable.
3. Cost & Latency Optimization:
   Retrieving only the 3-5 most pertinent chunks costs a fraction of the tokens and executes
   in milliseconds compared to passing whole books.

The Physics of Chunk Size & Overlap:
------------------------------------
  [----------------- Chunk 1 -----------------]
                               [----- Overlap -----]
                               [----------------- Chunk 2 -----------------]

  * chunk_size:
    - Small chunks (e.g. 100-250 chars): High retrieval precision, but risk losing broader context.
    - Medium chunks (e.g. 500-1000 chars): The industry sweet-spot for most technical & business docs.
    - Large chunks (e.g. 2000+ chars): Good for overarching summaries, but introduces noise and dilution.

  * chunk_overlap:
    - Overlap creates a semantic bridge across split boundaries.
    - If a crucial fact (e.g. "The contract terminates on Dec 31") is split across chunk 1 and chunk 2,
      an overlap ensures the complete sentence exists unbroken in at least one chunk.

Recursive Splitting Hierarchy:
------------------------------
We split recursively on natural linguistic boundaries:
  1. `\\n\\n` (Paragraphs - highest semantic boundary)
  2. `\\n`   (Lines or list items)
  3. `. `   (Sentence boundaries)
  4. ` `    (Word boundaries)
  5. `""`   (Character fallback)
"""

import uuid
from typing import List, Dict, Any, Optional

class RecursiveCharacterChunker:
    """
    Splits text recursively using structural delimiters while enforcing
    configurable chunk sizes, overlaps, and tracking rich chunk metadata.
    """
    
    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 100,
        separators: Optional[List[str]] = None
    ):
        if chunk_overlap >= chunk_size:
            raise ValueError(
                f"chunk_overlap ({chunk_overlap}) must be strictly less than chunk_size ({chunk_size})"
            )
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def chunk_document(
        self,
        pages: List[Dict[str, Any]],
        document_id: str,
        filename: str
    ) -> List[Dict[str, Any]]:
        """
        Split an array of page dictionaries into a flat list of chunk records
        complete with document_id, filename, page, and chunk indices.
        """
        all_chunks: List[Dict[str, Any]] = []
        global_chunk_index = 0
        
        for page_data in pages:
            raw_text = page_data.get("text", "")
            page_number = page_data.get("page", 1)
            
            if not raw_text.strip():
                continue
                
            text_splits = self._split_text(raw_text, self.separators)
            
            for split_text in text_splits:
                cleaned_split = split_text.strip()
                if not cleaned_split:
                    continue
                    
                chunk_id = f"{document_id}_c{global_chunk_index}_{uuid.uuid4().hex[:6]}"
                
                chunk_record = {
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "filename": filename,
                    "page": page_number,
                    "chunk_index": global_chunk_index,
                    "text": cleaned_split,
                    "char_count": len(cleaned_split),
                    "metadata": {
                        "document_id": document_id,
                        "filename": filename,
                        "page": page_number,
                        "chunk_index": global_chunk_index,
                        "char_count": len(cleaned_split),
                        "chunk_size_setting": self.chunk_size,
                        "chunk_overlap_setting": self.chunk_overlap
                    }
                }
                all_chunks.append(chunk_record)
                global_chunk_index += 1
                
        return all_chunks

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursive text splitting engine.
        Finds the highest-priority separator present in text, splits by it,
        and aggregates splits into chunks respecting chunk_size and chunk_overlap.
        """
        final_chunks: List[str] = []
        
        # Pick the first separator found in this text segment
        separator = separators[-1]
        new_separators = []
        
        for i, s in enumerate(separators):
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                new_separators = separators[i + 1:]
                break
                
        # Split text by the selected separator
        if separator:
            splits = text.split(separator)
        else:
            splits = list(text)
            
        good_splits: List[str] = []
        for s in splits:
            if len(s) < self.chunk_size:
                good_splits.append(s)
            else:
                # If a piece is still too large, recursively split it with subsequent separators
                if new_separators:
                    sub_splits = self._split_text(s, new_separators)
                    good_splits.extend(sub_splits)
                else:
                    good_splits.append(s)
                    
        # Now recombine small splits into target chunk sizes with sliding overlap
        accumulated_doc: List[str] = []
        current_len = 0
        
        for piece in good_splits:
            piece_len = len(piece) + (len(separator) if accumulated_doc else 0)
            
            if current_len + piece_len > self.chunk_size:
                if accumulated_doc:
                    combined = separator.join(accumulated_doc)
                    final_chunks.append(combined)
                    
                    # Slide window backward to preserve chunk_overlap
                    while current_len > self.chunk_overlap and accumulated_doc:
                        removed = accumulated_doc.pop(0)
                        current_len -= (len(removed) + len(separator))
                        
                accumulated_doc.append(piece)
                current_len += len(piece)
            else:
                accumulated_doc.append(piece)
                current_len += piece_len
                
        if accumulated_doc:
            final_chunks.append(separator.join(accumulated_doc))
            
        return final_chunks

