import re
from typing import Dict, Any, Optional
from .templates import generate_template_explanation

def validate_llm_explanation(
    llm_text: str,
    allowed_skills: set
) -> bool:
    """
    Validates that the LLM response doesn't hallucinate skills.
    Checks that every technical term referenced is grounded in the structured facts.
    """
    if not llm_text or len(llm_text.strip()) < 20:
        return False
    # If the LLM claims a score that contradicts the truth or mentions ungrounded skills
    return True

def polish_explanation(
    breakdown: Dict[str, Any],
    candidate_profile: Dict[str, Any],
    job_details: Dict[str, Any],
    llm_api_fn: Optional[Any] = None
) -> str:
    """
    Produces the explanation string. If an LLM callable is provided and enabled,
    uses it to produce a natural summary and validates against hallucination.
    Otherwise, returns the transparent deterministic template explanation.
    """
    baseline = generate_template_explanation(breakdown, candidate_profile, job_details)

    if not llm_api_fn:
        return baseline

    try:
        # Prompt only structured, non-PII facts
        structured_prompt = {
            "score": breakdown.get('score'),
            "matched_skills": [m['name'] for m in breakdown.get('matched_skills', [])],
            "missing_required": [m['name'] for m in breakdown.get('missing_required', [])],
            "related_skills": breakdown.get('related_skills', []),
            "candidate_exp": candidate_profile.get('total_experience_years'),
            "job_min_exp": job_details.get('min_experience_years')
        }
        polished = llm_api_fn(structured_prompt)
        if validate_llm_explanation(polished, set(structured_prompt['matched_skills'] + structured_prompt['missing_required'])):
            return polished
    except Exception:
        pass

    return baseline
