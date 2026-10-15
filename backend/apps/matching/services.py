import logging
from django.conf import settings
from ai.scoring import calculate_match_score
from ai.scoring.components import compute_cosine_similarity
from ai.explain import generate_template_explanation
from apps.skills.models import Skill
from .models import MatchResult

logger = logging.getLogger(__name__)

def get_or_calculate_match(resume, job, force_recompute=False) -> MatchResult:
    """
    Retrieves cached MatchResult or runs the complete hybrid scoring and explainability calculation.
    """
    algo_version = getattr(settings, 'ALGORITHM_VERSION', 'v1.0.0')

    if not force_recompute:
        existing = MatchResult.objects.filter(
            resume=resume,
            job=job,
            algorithm_version=algo_version
        ).first()
        if existing:
            return existing

    # Prepare candidate skills data
    cand_skills = []
    for cs in resume.candidate.candidate_skills.select_related('skill').all():
        cand_skills.append({
            'name': cs.skill.name,
            'confidence': cs.confidence,
            'evidence': cs.evidence
        })

    # Education level mapping (0: None, 1: Diploma, 2: Bachelor, 3: Master, 4: Doctorate)
    edu_name = (resume.candidate.highest_education or "").lower()
    cand_edu_level = 0
    if 'phd' in edu_name or 'doctorate' in edu_name:
        cand_edu_level = 4
    elif 'master' in edu_name or 'mba' in edu_name or 'm.s' in edu_name or 'msc' in edu_name:
        cand_edu_level = 3
    elif 'bachelor' in edu_name or 'b.tech' in edu_name or 'b.e' in edu_name or 'b.s' in edu_name or 'bsc' in edu_name:
        cand_edu_level = 2
    elif 'diploma' in edu_name or 'associate' in edu_name:
        cand_edu_level = 1

    job_req_edu = (job.education_required or "").lower()
    job_edu_level = 0
    if 'phd' in job_req_edu or 'doctorate' in job_req_edu:
        job_edu_level = 4
    elif 'master' in job_req_edu:
        job_edu_level = 3
    elif 'bachelor' in job_req_edu or 'degree' in job_req_edu:
        job_edu_level = 2

    # Prepare job skills data
    job_skills_data = []
    for js in job.job_skills.select_related('skill').all():
        job_skills_data.append({
            'name': js.skill.name,
            'requirement': js.requirement,
            'weight': js.weight,
            'is_mandatory': js.is_mandatory
        })

    resume_data = {
        'skills': cand_skills,
        'total_experience_years': resume.candidate.total_experience_years,
        'education_level': cand_edu_level,
        'embedding': resume.embedding
    }

    job_data = {
        'skills': job_skills_data,
        'min_experience_years': job.min_experience_years,
        'max_experience_years': job.max_experience_years,
        'education_level': job_edu_level,
        'embedding': job.embedding
    }

    # Execute hybrid score calculation
    breakdown = calculate_match_score(resume_data, job_data)

    # Passage retrieval: Top 3 resume chunks most similar to job description
    top_passages = []
    if job.embedding:
        chunks = list(resume.chunks.all())
        scored_chunks = []
        for ch in chunks:
            if ch.embedding:
                sim = compute_cosine_similarity(job.embedding, ch.embedding)
                scored_chunks.append((sim, ch))
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_passages = [
            {'section': ch.section, 'text': ch.text[:300], 'similarity': round(sim, 2)}
            for sim, ch in scored_chunks[:3]
        ]

    # Generate transparent explanation
    cand_profile_dict = {
        'full_name': resume.candidate.full_name,
        'total_experience_years': resume.candidate.total_experience_years,
        'highest_education': resume.candidate.highest_education
    }
    job_details_dict = {
        'title': job.title,
        'company_name': job.company_name,
        'min_experience_years': job.min_experience_years
    }
    explanation = generate_template_explanation(breakdown, cand_profile_dict, job_details_dict)

    # Save and return MatchResult
    match_result, _ = MatchResult.objects.update_or_create(
        resume=resume,
        job=job,
        algorithm_version=algo_version,
        defaults={
            'score': breakdown['score'],
            'semantic_score': breakdown['semantic_score'],
            'skill_score': breakdown['skill_score'],
            'experience_score': breakdown['experience_score'],
            'education_score': breakdown['education_score'],
            'matched_skills': breakdown['matched_skills'],
            'missing_required': breakdown['missing_required'],
            'missing_preferred': breakdown['missing_preferred'],
            'related_skills': breakdown['related_skills'],
            'top_passages': top_passages,
            'explanation': explanation
        }
    )
    return match_result
