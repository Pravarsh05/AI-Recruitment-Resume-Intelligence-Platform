import re
from typing import List, Dict, Any, Optional

DEGREE_LEVEL_MAP = {
    # Doctorate (Level 4)
    4: [
        r'\bph\.?d\b', r'\bdoctorate\b', r'\bpostdoc\b', r'\bdoctor of philosophy\b',
        r'\bd\.?phil\b', r'\bm\.?d\b'
    ],
    # Master (Level 3)
    3: [
        r'\bmaster(?:\'s)?\b', r'\bm\.?tech\b', r'\bm\.?s\.?\b', r'\bm\.?sc\b',
        r'\bmba\b', r'\bm\.?eng\b', r'\bmca\b', r'\bpostgraduate\b', r'\bpg diploma\b'
    ],
    # Bachelor (Level 2)
    2: [
        r'\bbachelor(?:\'s)?\b', r'\bb\.?tech\b', r'\bb\.?e\.?\b', r'\bb\.?s\.?\b',
        r'\bb\.?sc\b', r'\bbca\b', r'\bbba\b', r'\bundergraduate\b', r'\bdegree\b'
    ],
    # Diploma / Associate (Level 1)
    1: [
        r'\bdiploma\b', r'\bassociate(?:\'s)?\b', r'\ba\.?s\.?\b', r'\ba\.?a\.?\b'
    ]
}

DEGREE_LEVEL_NAMES = {
    0: 'None',
    1: 'Diploma / Associate',
    2: 'Bachelor',
    3: 'Master',
    4: 'Doctorate'
}

FIELD_PATTERNS = [
    r'computer science',
    r'software engineering',
    r'information technology',
    r'data science',
    r'artificial intelligence',
    r'machine learning',
    r'electrical engineering',
    r'mechanical engineering',
    r'electronics',
    r'business administration',
    r'mathematics',
    r'physics',
    r'finance',
    r'economics'
]

def parse_education(text: str) -> Dict[str, Any]:
    """
    Parses education text to extract:
    - highest_degree_level: int (0 to 4)
    - highest_degree_name: str
    - detected_degrees: list of strings
    - detected_fields: list of strings
    """
    if not text:
        return {
            'highest_degree_level': 0,
            'highest_degree_name': 'None',
            'detected_degrees': [],
            'detected_fields': []
        }

    detected_degrees = []
    highest_level = 0

    # Search from highest level down
    for level in (4, 3, 2, 1):
        patterns = DEGREE_LEVEL_MAP[level]
        for pat in patterns:
            matches = re.findall(pat, text, re.IGNORECASE)
            if matches:
                detected_degrees.extend([m.strip() for m in matches])
                if level > highest_level:
                    highest_level = level

    # Search for field of study
    detected_fields = []
    for field_pat in FIELD_PATTERNS:
        if re.search(r'\b' + field_pat + r'\b', text, re.IGNORECASE):
            detected_fields.append(field_pat.title())

    return {
        'highest_degree_level': highest_level,
        'highest_degree_name': DEGREE_LEVEL_NAMES.get(highest_level, 'None'),
        'detected_degrees': list(set(detected_degrees)),
        'detected_fields': list(set(detected_fields))
    }
