import re
from typing import Optional

TITLE_NORMALIZATION_MAP = {
    r'\b(?:sr\.?|senior)\s+(?:swe|sde|soft(?:ware)?\s+eng(?:ineer)?)\b': 'Senior Software Engineer',
    r'\b(?:jr\.?|junior)\s+(?:swe|sde|soft(?:ware)?\s+eng(?:ineer)?)\b': 'Junior Software Engineer',
    r'\b(?:swe|sde|soft(?:ware)?\s+eng(?:ineer)?)\b': 'Software Engineer',
    r'\b(?:full\s*stack|fs)\s+(?:developer|dev|engineer|eng)\b': 'Full Stack Developer',
    r'\b(?:front\s*end|fe)\s+(?:developer|dev|engineer|eng)\b': 'Frontend Developer',
    r'\b(?:back\s*end|be)\s+(?:developer|dev|engineer|eng)\b': 'Backend Developer',
    r'\b(?:devops|dev\s+ops)\s*(?:engineer)?\b': 'DevOps Engineer',
    r'\b(?:ml|machine\s+learning)\s+(?:engineer|scientist)\b': 'Machine Learning Engineer',
    r'\bdata\s+scientist\b': 'Data Scientist',
    r'\bdata\s+engineer\b': 'Data Engineer',
    r'\bdata\s+analyst\b': 'Data Analyst',
    r'\b(?:cloud|aws|azure)\s+(?:architect|engineer)\b': 'Cloud Architect',
    r'\b(?:site\s+reliability\s+engineer|sre)\b': 'Site Reliability Engineer',
    r'\b(?:tech|technical)\s+lead\b': 'Technical Lead',
    r'\bengineering\s+manager\b': 'Engineering Manager',
    r'\bproduct\s+manager\b': 'Product Manager',
    r'\bqa\s+(?:engineer|lead|analyst)\b': 'QA Engineer',
}

def normalize_job_title(raw_title: str) -> str:
    """
    Normalizes common job title variations and abbreviations into standard industry titles.
    """
    if not raw_title:
        return ""

    raw_clean = raw_title.strip()
    for pattern, canonical in TITLE_NORMALIZATION_MAP.items():
        if re.search(pattern, raw_clean, re.IGNORECASE):
            return canonical

    return raw_clean.title()
