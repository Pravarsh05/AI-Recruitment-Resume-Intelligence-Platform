from dataclasses import dataclass

@dataclass(frozen=True)
class ScoringWeights:
    semantic_weight: float = 0.40
    skill_weight: float = 0.35
    experience_weight: float = 0.15
    education_weight: float = 0.10

    # Skill weighting multipliers
    required_multiplier: float = 2.0
    preferred_multiplier: float = 1.0
    related_skill_credit: float = 0.50

    # Threshold for related skill semantic similarity
    related_skill_threshold: float = 0.70

    # Knockout cap for missing mandatory skill
    knockout_cap: float = 60.0

    # Rescaling parameters for cosine similarity (maps [min_cos, max_cos] to [0.0, 1.0])
    semantic_min_cos: float = 0.20
    semantic_max_cos: float = 0.85

    algorithm_version: str = "v1.0.0"

DEFAULT_WEIGHTS = ScoringWeights()
