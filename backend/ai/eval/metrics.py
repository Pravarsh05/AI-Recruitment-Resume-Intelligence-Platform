import math
from typing import List, Dict, Any, Set

def compute_extraction_metrics(predicted_skills: Set[str], ground_truth_skills: Set[str]) -> Dict[str, float]:
    """
    Computes Precision, Recall, and F1 score for skill extraction.
    """
    pred_lower = {s.lower() for s in predicted_skills}
    truth_lower = {s.lower() for s in ground_truth_skills}

    if not pred_lower and not truth_lower:
        return {'precision': 1.0, 'recall': 1.0, 'f1': 1.0}

    true_positives = len(pred_lower.intersection(truth_lower))
    precision = true_positives / len(pred_lower) if pred_lower else 0.0
    recall = true_positives / len(truth_lower) if truth_lower else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1': round(f1, 4)
    }

def compute_dcg(relevances: List[float], k: int = 10) -> float:
    """Computes Discounted Cumulative Gain at rank k."""
    dcg = 0.0
    for i, rel in enumerate(relevances[:k]):
        rank = i + 1
        dcg += (2.0 ** rel - 1.0) / math.log2(rank + 1.0)
    return dcg

def compute_ndcg_at_k(predicted_scores: List[float], ground_truth_relevance: List[float], k: int = 10) -> float:
    """
    Computes Normalized Discounted Cumulative Gain (NDCG@K) to evaluate ranking quality.
    """
    if not predicted_scores or not ground_truth_relevance:
        return 0.0

    # Sort items by predicted score descending
    paired = sorted(zip(predicted_scores, ground_truth_relevance), key=lambda x: x[0], reverse=True)
    sorted_rels = [p[1] for p in paired]

    actual_dcg = compute_dcg(sorted_rels, k)

    # Ideal ranking is ground truth sorted descending
    ideal_rels = sorted(ground_truth_relevance, reverse=True)
    ideal_dcg = compute_dcg(ideal_rels, k)

    if ideal_dcg == 0.0:
        return 1.0

    return round(actual_dcg / ideal_dcg, 4)
