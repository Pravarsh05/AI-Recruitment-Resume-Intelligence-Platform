from typing import List, Dict, Any, Optional
from .weights import ScoringWeights, DEFAULT_WEIGHTS
from .components import (
    compute_semantic_score,
    compute_skill_score,
    compute_experience_fit,
    compute_education_fit
)

def calculate_match_score(
    resume_data: Dict[str, Any],
    job_data: Dict[str, Any],
    skill_embeddings_map: Optional[Dict[str, List[float]]] = None,
    weights: ScoringWeights = DEFAULT_WEIGHTS
) -> Dict[str, Any]:
    """
    Computes complete hybrid match score with all component breakdowns and explainability metadata.
    """
    # 1. Semantic score
    semantic_val = compute_semantic_score(
        resume_data.get('embedding'),
        job_data.get('embedding'),
        weights
    )

    # 2. Skill overlap score
    (
        skill_val,
        matched_skills,
        missing_required,
        missing_preferred,
        related_skills,
        knockout_triggered
    ) = compute_skill_score(
        candidate_skills=resume_data.get('skills', []),
        job_skills=job_data.get('skills', []),
        skill_embeddings_map=skill_embeddings_map,
        weights=weights
    )

    # 3. Experience fit score
    cand_years = float(resume_data.get('total_experience_years', 0.0))
    min_years = float(job_data.get('min_experience_years') or 0.0)
    max_years = float(job_data.get('max_experience_years')) if job_data.get('max_experience_years') else None
    exp_val = compute_experience_fit(cand_years, min_years, max_years)

    # 4. Education fit score
    cand_edu_level = int(resume_data.get('education_level', 0))
    job_edu_level = int(job_data.get('education_level', 0))
    edu_val = compute_education_fit(cand_edu_level, job_edu_level)

    # Hybrid combination
    raw_final = 100.0 * (
        weights.semantic_weight * semantic_val +
        weights.skill_weight * skill_val +
        weights.experience_weight * exp_val +
        weights.education_weight * edu_val
    )

    knockout_applied = False
    final_score = raw_final
    if knockout_triggered and raw_final > weights.knockout_cap:
        final_score = weights.knockout_cap
        knockout_applied = True

    return {
        'score': round(final_score, 1),
        'raw_score': round(raw_final, 1),
        'semantic_score': round(semantic_val * 100.0, 1),
        'skill_score': round(skill_val * 100.0, 1),
        'experience_score': round(exp_val * 100.0, 1),
        'education_score': round(edu_val * 100.0, 1),
        'matched_skills': matched_skills,
        'missing_required': missing_required,
        'missing_preferred': missing_preferred,
        'related_skills': related_skills,
        'knockout_applied': knockout_applied,
        'algorithm_version': weights.algorithm_version,
    }
