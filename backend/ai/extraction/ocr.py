import logging
from typing import Optional

logger = logging.getLogger(__name__)

def ocr_pdf(file_path: str) -> Optional[str]:
    """
    OCR fallback for scanned PDFs using pdf2image and pytesseract.
    Returns extracted text or None if OCR tools are not installed.
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract

        images = convert_from_path(file_path, dpi=300)
        pages_text = []
        for img in images:
            text = pytesseract.image_to_string(img)
            pages_text.append(text)
        return "\n\n".join(pages_text)
    except Exception as e:
        logger.warning("OCR processing unavailable or failed: %s", str(e))
        return None
