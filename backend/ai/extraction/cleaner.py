import re
import unicodedata
from typing import Dict, Any, Optional

def clean_text(text: str) -> str:
    """
    Cleans raw resume text:
    - Normalizes unicode
    - Resolves hyphenated line wraps (e.g., 'engi-\\nneer' -> 'engineer')
    - Standardizes bullet characters
    - Removes non-printable characters
    - Normalizes multi-newlines and spaces
    """
    if not text:
        return ""

    # Normalize unicode
    text = unicodedata.normalize('NFKC', text)

    # Rejoin hyphenated linebreaks
    text = re.sub(r'(\b\w+)-\s*\n\s*(\w+\b)', r'\1\2', text)

    # Standardize bullet symbols
    bullet_chars = r'[\u2022\u2023\u25E6\u2043\u2219\u25CB\u25CF\u25AA\u25AB\u25B6\u27A4\u2714\u2713\uF0B7]'
    text = re.sub(bullet_chars, '\n• ', text)

    # Strip page numbering like "Page 1 of 3", "Page 2/4"
    text = re.sub(r'(?i)\bpage\s+\d+\s*(?:of|\/)\s*\d+\b', '', text)

    # Normalize carriage returns and tabs
    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\t', ' ')

    # Remove repeated excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Collapse repeated horizontal whitespace
    text = re.sub(r'[ \t]{2,}', ' ', text)

    return text.strip()


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """
    Extracts candidate contact information using regex.
    PII extracted is stored in the candidate profile, not used for scoring.
    """
    result = {
        'email': None,
        'phone': None,
        'linkedin': None,
        'github': None,
        'portfolio': None,
    }

    if not text:
        return result

    # 1. Email
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    email_match = re.search(email_pattern, text)
    if email_match:
        result['email'] = email_match.group(0).lower().rstrip('.')

    # 2. Phone
    # Matches formats like: +1 (555) 123-4567, 555-123-4567, +91 9876543210, etc.
    phone_pattern = r'(?:(?:\+|00)\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    phone_matches = re.finditer(phone_pattern, text)
    for match in phone_matches:
        raw_phone = match.group(0).strip()
        # Ensure it has enough digits to be a legitimate phone number
        digits = re.sub(r'\D', '', raw_phone)
        if 10 <= len(digits) <= 15:
            result['phone'] = raw_phone
            break

    # 3. LinkedIn
    linkedin_pattern = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([a-zA-Z0-9_-]+)'
    linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
    if linkedin_match:
        result['linkedin'] = f"https://www.linkedin.com/in/{linkedin_match.group(1)}"

    # 4. GitHub
    github_pattern = r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)'
    github_match = re.search(github_pattern, text, re.IGNORECASE)
    if github_match:
        result['github'] = f"https://github.com/{github_match.group(1)}"

    # 5. Portfolio / website
    url_pattern = r'https?:\/\/(?!www\.linkedin|www\.github|linkedin|github)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?'
    url_match = re.search(url_pattern, text, re.IGNORECASE)
    if url_match:
        result['portfolio'] = url_match.group(0)

    return result
