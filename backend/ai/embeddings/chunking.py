import re
from typing import List, Dict, Any

def create_resume_chunks(sections: Dict[str, str], max_chunk_chars: int = 500) -> List[Dict[str, Any]]:
    """
    Splits resume sections into coherent chunks suitable for passage retrieval and explanation highlights.
    Returns a list of dicts with:
    {'section': section_name, 'text': chunk_text, 'order': index}
    """
    chunks = []
    order = 0

    for section_name, text in sections.items():
        if not text or not text.strip():
            continue

        # Split on bullets or newlines
        items = re.split(r'\n(?=[•\-\*])|\n{2,}', text)
        buffer = []
        current_len = 0

        for item in items:
            clean_item = item.strip()
            if not clean_item:
                continue

            item_len = len(clean_item)
            if current_len + item_len > max_chunk_chars and buffer:
                chunk_text = " ".join(buffer)
                chunks.append({
                    'section': section_name,
                    'text': chunk_text,
                    'order': order
                })
                order += 1
                buffer = [clean_item]
                current_len = item_len
            else:
                buffer.append(clean_item)
                current_len += item_len

        if buffer:
            chunk_text = " ".join(buffer)
            chunks.append({
                'section': section_name,
                'text': chunk_text,
                'order': order
            })
            order += 1

    return chunks
