import re
from datetime import datetime, date
from typing import List, Tuple, Dict, Any, Optional

MONTH_MAP = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
}

def _parse_month_year(text: str) -> Optional[Tuple[int, int]]:
    """Helper to parse strings like 'Jan 2021', '03/2020', '2019' into (year, month)."""
    text = text.strip()
    # Check for 'present', 'current', 'now'
    if re.search(r'\b(?:present|current|now|ongoing)\b', text, re.IGNORECASE):
        today = date.today()
        return (today.year, today.month)

    # 1. 'Month Year' e.g., 'Jan 2021', 'March 2020'
    m1 = re.search(r'\b([A-Za-z]+)\s+([12]\d{3})\b', text)
    if m1:
        mon_str = m1.group(1).lower()
        if mon_str in MONTH_MAP:
            return (int(m1.group(2)), MONTH_MAP[mon_str])

    # 2. 'MM/YYYY' or 'MM-YYYY' e.g., '03/2020', '11-2019'
    m2 = re.search(r'\b(0?[1-9]|1[0-2])[\/\-]([12]\d{3})\b', text)
    if m2:
        return (int(m2.group(2)), int(m2.group(1)))

    # 3. Just 'YYYY' e.g., '2021'
    m3 = re.search(r'\b([12]\d{3})\b', text)
    if m3:
        return (int(m3.group(1)), 1)

    return None


def parse_experience_dates(text: str) -> List[Tuple[date, date]]:
    """
    Extracts date intervals from work experience text.
    Handles ranges like:
    'Jan 2020 - Mar 2023', '2018 - Present', '04/2019 to 11/2021'
    """
    if not text:
        return []

    # Regex matching two date-like expressions separated by hyphen, en-dash, em-dash, or 'to'
    range_pattern = re.compile(
        r'(\b(?:[A-Za-z]+\s+[12]\d{3}|[01]?\d[\/\-][12]\d{3}|[12]\d{3})\b)\s*(?:-|–|—|to)\s*(\b(?:present|current|now|[A-Za-z]+\s+[12]\d{3}|[01]?\d[\/\-][12]\d{3}|[12]\d{3})\b)',
        re.IGNORECASE
    )

    intervals = []
    for match in range_pattern.finditer(text):
        start_part = match.group(1)
        end_part = match.group(2)

        start_ym = _parse_month_year(start_part)
        end_ym = _parse_month_year(end_part)

        if start_ym and end_ym:
            start_date = date(start_ym[0], start_ym[1], 1)
            end_date = date(end_ym[0], end_ym[1], 28)
            # Ensure valid chronological range
            if start_date <= end_date and start_date.year >= 1970:
                intervals.append((start_date, end_date))

    return intervals


def calculate_total_experience_years(intervals: List[Tuple[date, date]]) -> float:
    """
    Merges overlapping date intervals and computes total work experience in years.
    Prevents double-counting concurrent roles or overlapping projects.
    """
    if not intervals:
        return 0.0

    # Sort intervals by start date
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged: List[Tuple[date, date]] = []

    for start, end in sorted_intervals:
        if not merged:
            merged.append((start, end))
        else:
            prev_start, prev_end = merged[-1]
            if start <= prev_end:
                # Overlap or contiguous: merge
                merged[-1] = (prev_start, max(prev_end, end))
            else:
                merged.append((start, end))

    total_days = sum((end - start).days for start, end in merged)
    years = total_days / 365.25
    return round(max(0.0, years), 1)
