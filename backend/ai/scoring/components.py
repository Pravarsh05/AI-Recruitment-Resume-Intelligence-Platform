import math
from typing import List, Dict, Any, Optional, Tuple, Callable
from .weights import ScoringWeights, DEFAULT_WEIGHTS

def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two unit or raw vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0

    cos = dot / (norm_a * norm_b)
    return max(-1.0, min(1.0, cos))


def compute_semantic_score(
    resume_embedding: Optional[List[float]],
    job_embedding: Optional[List[float]],
    weights: ScoringWeights = DEFAULT_WEIGHTS
) -> float:
    """
    Computes semantic score (0.0 to 1.0) based on cosine similarity,
    calibrated and rescaled between [weights.semantic_min_cos, weights.semantic_max_cos].
    """
    if not resume_embedding or not job_embedding:
        return 0.5  # Neutral default if either vector is absent

    raw_cos = compute_cosine_similarity(resume_embedding, job_embedding)

    # Rescale raw cosine to [0.0, 1.0]
    span = weights.semantic_max_cos - weights.semantic_min_cos
    if span <= 0:
        return max(0.0, min(1.0, raw_cos))

    rescaled = (raw_cos - weights.semantic_min_cos) / span
    return max(0.0, min(1.0, rescaled))


def compute_skill_score(
    candidate_skills: List[Dict[str, Any]],
    job_skills: List[Dict[str, Any]],
    skill_embeddings_map: Optional[Dict[str, List[float]]] = None,
    weights: ScoringWeights = DEFAULT_WEIGHTS
) -> Tuple[float, List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], bool]:
    """
    Evaluates skill fit:
    - Exact match gets 2.0 (required) or 1.0 (preferred)
    - Semantically related match gets partial credit (0.50x)
    - Flags missing mandatory skills (knockout check)
    
    Returns:
    (skill_score [0.0..1.0], matched_skills, missing_required, missing_preferred, related_skills, knockout_triggered)
    """
    if not job_skills:
        return 1.0, [], [], [], [], False

    # Index candidate skills by lowercased name
    cand_skill_names = {s['name'].lower(): s for s in candidate_skills if 'name' in s}

    total_possible_weight = 0.0
    earned_weight = 0.0

    matched_skills = []
    missing_required = []
    missing_preferred = []
    related_skills = []
    knockout_triggered = False

    for js in job_skills:
        skill_name = js['name']
        skill_name_lower = skill_name.lower()
        is_required = js.get('requirement', 'required') == 'required'
        is_mandatory = js.get('is_mandatory', False)
        base_weight = js.get('weight', 1.0)

        multiplier = weights.required_multiplier if is_required else weights.preferred_multiplier
        target_weight = base_weight * multiplier
        total_possible_weight += target_weight

        # 1. Exact match check
        if skill_name_lower in cand_skill_names:
            c_skill = cand_skill_names[skill_name_lower]
            earned_weight += target_weight
            matched_skills.append({
                'name': skill_name,
                'requirement': 'required' if is_required else 'preferred',
                'confidence': c_skill.get('confidence', 1.0),
                'evidence': c_skill.get('evidence', ''),
                'match_type': 'exact'
            })
            continue

        # 2. Related skill check via embedding similarity
        found_related = False
        if skill_embeddings_map and skill_name in skill_embeddings_map:
            job_vec = skill_embeddings_map[skill_name]
            best_rel_name = None
            best_rel_sim = 0.0

            for cand_s_name, c_skill in cand_skill_names.items():
                orig_name = c_skill['name']
                if orig_name in skill_embeddings_map:
                    cand_vec = skill_embeddings_map[orig_name]
                    sim = compute_cosine_similarity(job_vec, cand_vec)
                    if sim >= weights.related_skill_threshold and sim > best_rel_sim:
                        best_rel_sim = sim
                        best_rel_name = orig_name

            if best_rel_name:
                found_related = True
                partial_earned = target_weight * weights.related_skill_credit
                earned_weight += partial_earned
                rel_info = {
                    'job_skill': skill_name,
                    'candidate_skill': best_rel_name,
                    'similarity': round(best_rel_sim, 2),
                    'credit': weights.related_skill_credit
                }
                related_skills.append(rel_info)
                matched_skills.append({
                    'name': skill_name,
                    'requirement': 'required' if is_required else 'preferred',
                    'match_type': 'related',
                    'related_to': best_rel_name,
                    'similarity': round(best_rel_sim, 2)
                })

        # 3. Missing skill handling
        if not found_related:
            missing_info = {
                'name': skill_name,
                'weight': base_weight,
                'is_mandatory': is_mandatory
            }
            if is_required:
                missing_required.append(missing_info)
                if is_mandatory:
                    knockout_triggered = True
            else:
                missing_preferred.append(missing_info)

    score = (earned_weight / total_possible_weight) if total_possible_weight > 0 else 1.0
    return max(0.0, min(1.0, score)), matched_skills, missing_required, missing_preferred, related_skills, knockout_triggered


def compute_experience_fit(
    candidate_years: float,
    min_years: Optional[float] = 0.0,
    max_years: Optional[float] = None
) -> float:
    """
    Computes experience fit score (0.0 to 1.0):
    - 1.0 if within [min_years, max_years] or if no requirement
    - Linear decay below min: candidate_years / min_years
    - Gentle decay if overqualified: max(0.70, 1.0 - 0.05 * excess_years)
    """
    min_y = min_years or 0.0
    if min_y == 0.0 and (max_years is None or max_years == 0.0):
        return 1.0

    if candidate_years < min_y:
        return max(0.0, min(1.0, candidate_years / min_y))

    if max_years is not None and candidate_years > max_years:
        excess = candidate_years - max_years
        return max(0.70, 1.0 - (0.05 * excess))

    return 1.0


def compute_education_fit(
    candidate_level: int,
    required_level: int = 0
) -> float:
    """
    Computes education fit score (0.0 to 1.0):
    - 1.0 if candidate level >= required level or none required
    - 0.5 if one level below
    - 0.0 otherwise
    """
    if required_level <= 0:
        return 1.0

    diff = candidate_level - required_level
    if diff >= 0:
        return 1.0
    elif diff == -1:
        return 0.5
    else:
        return 0.0
