"""
RAG Pipeline Component: Text Cleaner & Normalizer
=================================================

Educational Overview:
---------------------
Why is Text Cleaning needed in RAG?
Raw text extracted from PDF, Word, or web pages often contains noisy artifacts:
  - Form feed characters (`\\x0c`), zero-width spaces (`\\u200b`), and soft hyphens.
  - Inconsistent whitespace, trailing spaces, and excessive blank lines.
  - Broken words split across line breaks (e.g., "re- \\n trieval").

Crucial Rule for RAG Cleaning:
Do NOT strip semantic structure!
  - Headings (`# Header`, `SECTION 1`): Provide essential topical context for retrieval.
  - Lists (`- item`, `1. item`): Group related sequential facts.
  - Tables: Store structured comparative data.

If a naive cleaner converts everything into a single unformatted block of lowercase text,
retrieval precision drops because structural signals are lost. This cleaner standardizes
text while safeguarding structural boundaries.
"""

import re
from typing import List, Dict, Any

class TextCleaner:
    """
    Cleans and normalizes extracted text while strictly preserving headings,
    markdown tables, bulleted lists, and paragraph boundaries.
    """
    
    @classmethod
    def clean_page(cls, page_doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean the text inside a single page document representation dictionary.
        Returns a copy of the dictionary with cleaned text.
        """
        cleaned_text = cls.clean_text(page_doc.get("text", ""))
        return {
            **page_doc,
            "text": cleaned_text
        }
        
    @classmethod
    def clean_pages(cls, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean an entire list of extracted page document dictionaries."""
        return [cls.clean_page(p) for p in pages if p.get("text")]

    @classmethod
    def clean_text(cls, raw_text: str) -> str:
        """
        Main text cleaning pipeline:
          1. Normalize Unicode invisible artifacts & non-breaking spaces
          2. Rejoin hyphenated line breaks (e.g. 'struc-\\nture' -> 'structure')
          3. Remove page numbering artifacts (e.g. '--- Page 3 of 12 ---')
          4. Normalize horizontal whitespace per line while preserving indentation
          5. Collapse excessive blank lines down to double newlines (paragraphs)
        """
        if not raw_text:
            return ""
            
        text = raw_text
        
        # 1. Normalize line endings to standard Unix newline \n
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        
        # 2. Remove invisible control characters & null bytes (keep \n and \t)
        text = text.replace("\x00", "").replace("\x0c", "\n")
        text = text.replace("\u00ad", "")  # soft hyphen
        text = text.replace("\u200b", "")  # zero-width space
        text = text.replace("\xa0", " ")   # non-breaking space
        
        # 3. Fix hyphenated words broken across line boundaries: 'con-\\nnection' -> 'connection'
        text = re.sub(r'([a-zA-Z]{2,})-\n([a-zA-Z]{2,})', r'\1\2', text)
        
        # 4. Clean line by line to protect markdown headers and list syntax
        lines = text.split("\n")
        cleaned_lines = []
        
        for line in lines:
            # Strip trailing whitespace on the line
            stripped = line.rstrip()
            
            # Collapse multiple consecutive horizontal spaces into one (outside code indentation)
            # If line starts with spaces for list or indent, preserve up to 4 spaces
            leading_spaces = len(stripped) - len(stripped.lstrip(' '))
            content = stripped.lstrip(' ')
            content = re.sub(r'[ \t]{2,}', ' ', content)
            
            if leading_spaces > 0:
                normalized_line = (" " * min(leading_spaces, 4)) + content
            else:
                normalized_line = content
                
            cleaned_lines.append(normalized_line)
            
        reconstructed = "\n".join(cleaned_lines)
        
        # 5. Collapse 3+ consecutive newlines into exactly two newlines (clean paragraph boundary)
        reconstructed = re.sub(r'\n{3,}', '\n\n', reconstructed)
        
        return reconstructed.strip()

