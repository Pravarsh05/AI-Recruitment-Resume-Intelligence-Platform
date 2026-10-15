import re
from typing import Dict

# Canonical section names mapped to regex patterns
SECTION_PATTERNS = {
    'summary': r'^(?:executive\s+)?(?:summary|professional\s+summary|profile|about\s+me|career\s+objective|objective|biography)\b',
    'experience': r'^(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history|career\s+history|internships?)\b',
    'skills': r'^(?:technical\s+skills|skills\s*(?:&|and)\s*abilities|core\s+competencies|technologies|technical\s+proficiencies|key\s+skills|skills)\b',
    'education': r'^(?:education(?:\s*(?:&|and)\s*qualifications)?|academic\s+background|academic\s+qualifications|degrees?|educational\s+history)\b',
    'projects': r'^(?:projects|technical\s+projects|academic\s+projects|personal\s+projects|key\s+projects)\b',
    'certifications': r'^(?:certifications?|licenses?(?:\s*(?:&|and)\s*certifications)?|courses|professional\s+training)\b',
    'awards': r'^(?:awards?|honors?|achievements?|accomplishments?|recognition)\b',
    'publications': r'^(?:publications?|research|patents?|papers?)\b',
}

def segment_into_sections(text: str) -> Dict[str, str]:
    """
    Segments resume text into distinct logical sections.
    Detects section headings based on regex, casing, and line positioning.
    Returns a dictionary mapping section names to text contents.
    """
    if not text:
        return {}

    lines = text.split('\n')
    sections: Dict[str, list] = {'header': []}
    current_section = 'header'

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_section in sections:
                sections[current_section].append('')
            continue

        # Look for section header candidacy:
        # 1. Short line (typically < 45 chars)
        # 2. Not starting with a bullet
        # 3. Matches one of our known section patterns
        matched_section = None
        if len(stripped) < 45 and not stripped.startswith(('•', '-', '*', '◦')):
            clean_heading = re.sub(r'[^a-zA-Z\s&/]', '', stripped).strip().lower()
            for sec_name, pattern in SECTION_PATTERNS.items():
                if re.match(pattern, clean_heading, re.IGNORECASE):
                    matched_section = sec_name
                    break

        if matched_section:
            current_section = matched_section
            if current_section not in sections:
                sections[current_section] = []
        else:
            sections[current_section].append(line)

    # Join and trim each section
    result: Dict[str, str] = {}
    for sec_name, sec_lines in sections.items():
        joined = '\n'.join(sec_lines).strip()
        if joined:
            result[sec_name] = joined

    return result
