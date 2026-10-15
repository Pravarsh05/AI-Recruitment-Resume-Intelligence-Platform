import os
import io
import logging
from typing import Tuple, Optional
from .ocr import ocr_pdf

logger = logging.getLogger(__name__)

def is_valid_pdf(file_or_path) -> bool:
    """
    Validates PDF file magic bytes (%PDF-).
    Accepts file path (str), file-like object, or bytes.
    """
    if isinstance(file_or_path, str):
        if not os.path.exists(file_or_path):
            return False
        with open(file_or_path, 'rb') as f:
            header = f.read(5)
            return header.startswith(b'%PDF-')
    elif isinstance(file_or_path, (bytes, bytearray)):
        return file_or_path.startswith(b'%PDF-')
    elif hasattr(file_or_path, 'read'):
        pos = file_or_path.tell()
        header = file_or_path.read(5)
        file_or_path.seek(pos)
        return header.startswith(b'%PDF-')
    return False


def extract_text_from_pdf(file_path: str, min_chars_per_page: int = 150) -> Tuple[str, bool]:
    """
    Extracts text from PDF:
    1. Tries PyMuPDF (fitz) with column & vertical block sorting.
    2. Falls back to pdfplumber if fitz fails or output is low.
    3. Performs quality check: if average chars/page < min_chars_per_page, falls back to OCR.
    
    Returns (extracted_text, is_ocr_used).
    """
    if not is_valid_pdf(file_path):
        raise ValueError("Invalid PDF file format. Missing %PDF- magic bytes header.")

    extracted_pages = []
    num_pages = 0

    # 1. Primary: PyMuPDF (fitz)
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        num_pages = len(doc)
        for page in doc:
            # Extract text blocks: (x0, y0, x1, y1, "text", block_no, block_type)
            # block_type == 0 indicates text
            blocks = page.get_text("blocks")
            # Sort blocks primarily by reading column (x0) and vertical position (y0)
            blocks_sorted = sorted(blocks, key=lambda b: (round(b[0] / 150), b[1]))
            page_text = "\n".join(b[4] for b in blocks_sorted if b[4].strip())
            extracted_pages.append(page_text)
        doc.close()
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s. Falling back to pdfplumber.", str(e))

    # 2. Secondary fallback: pdfplumber
    if not extracted_pages:
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                num_pages = len(pdf.pages)
                for page in pdf.pages:
                    text = page.extract_text(layout=True) or ""
                    extracted_pages.append(text)
        except Exception as e:
            logger.warning("pdfplumber extraction failed: %s", str(e))

    full_text = "\n\n".join(extracted_pages).strip()
    total_chars = len(full_text)
    avg_chars_per_page = total_chars / max(num_pages, 1)

    # 3. Quality check for scanned documents
    if avg_chars_per_page < min_chars_per_page or not full_text:
        logger.info("PDF character density low (avg %d chars/page). Triggering OCR.", avg_chars_per_page)
        ocr_result = ocr_pdf(file_path)
        if ocr_result and len(ocr_result.strip()) > len(full_text):
            return ocr_result.strip(), True

    return full_text, False
