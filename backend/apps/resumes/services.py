import os
import hashlib
import logging
from datetime import datetime, timezone
from django.utils import timezone as django_timezone
from django.db import transaction

from ai.extraction import extract_text_from_pdf, clean_text, segment_into_sections, extract_contact_info
from ai.nlp import SkillMatcher, calculate_total_experience_years, parse_experience_dates, parse_education
from ai.embeddings import encode_text, encode_batch, create_resume_chunks
from apps.skills.models import Skill, CandidateSkill
from .models import Resume, ResumeChunk

logger = logging.getLogger(__name__)

def process_resume(resume_id: str) -> Resume:
    """
    Executes the multi-stage resume ingestion and intelligence pipeline:
    1. Text extraction (with OCR fallback)
    2. Cleaning, sanitization, and sectioning
    3. Contact extraction and profile enrichment
    4. Skill extraction and CandidateSkill entity creation
    5. Experience and education parsing
    6. Passage chunking and vector embedding
    """
    try:
        resume = Resume.objects.select_related('candidate', 'candidate__user').get(id=resume_id)
    except Resume.DoesNotExist:
        logger.error("Resume %s not found for processing.", resume_id)
        return None

    try:
        # Stage 1: Extraction
        resume.status = Resume.Status.EXTRACTING
        resume.save(update_fields=['status'])

        file_path = resume.file.path if resume.file else None
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at {file_path}")

        raw_text, is_ocr = extract_text_from_pdf(file_path)
        if not raw_text.strip():
            raise ValueError("Unable to extract legible text from this PDF.")

        resume.raw_text = raw_text
        resume.status = Resume.Status.EXTRACTED
        resume.save(update_fields=['raw_text', 'status'])

        # Stage 2: Cleaning & Sectioning
        cleaned = clean_text(raw_text)
        resume.clean_text = cleaned
        sections = segment_into_sections(cleaned)
        resume.sections = sections

        # Stage 3: Contact Info extraction
        contacts = extract_contact_info(cleaned)
        candidate = resume.candidate
        if not candidate.phone and contacts.get('phone'):
            candidate.phone = contacts['phone']
        candidate.save()

        # Stage 4: Entity & Skill Extraction
        resume.status = Resume.Status.PARSING
        resume.save(update_fields=['status'])

        matcher = SkillMatcher()
        extracted_skills = matcher.extract_skills(cleaned, sections)

        # Stage 5: Experience & Education parsing
        exp_text = sections.get('experience', cleaned)
        date_intervals = parse_experience_dates(exp_text)
        total_exp_years = calculate_total_experience_years(date_intervals)

        edu_text = sections.get('education', cleaned)
        edu_info = parse_education(edu_text)

        # Update candidate profile with parsed info if not already manually set
        if total_exp_years > 0 and candidate.total_experience_years == 0:
            candidate.total_experience_years = total_exp_years
        if edu_info.get('highest_degree_name') != 'None' and not candidate.highest_education:
            candidate.highest_education = edu_info['highest_degree_name']
        if not candidate.primary_resume:
            candidate.primary_resume = resume
        candidate.save()

        # Persist extracted candidate skills
        with transaction.atomic():
            for item in extracted_skills:
                skill_obj = Skill.objects.filter(name__iexact=item['name']).first()
                if not skill_obj:
                    skill_obj, _ = Skill.objects.get_or_create(
                        name=item['name'],
                        defaults={'category': item.get('category', Skill.Category.TOOL)}
                    )
                CandidateSkill.objects.update_or_create(
                    candidate=candidate,
                    skill=skill_obj,
                    defaults={
                        'source_resume': resume,
                        'confidence': item['confidence'],
                        'evidence': item.get('evidence', '')[:500],
                        'is_confirmed': False
                    }
                )

        parsed_data = {
            'skills': extracted_skills,
            'total_experience_years': total_exp_years,
            'education': edu_info,
            'contact_info': contacts,
            'is_ocr': is_ocr
        }
        resume.parsed_data = parsed_data

        # Stage 6: Embeddings & Chunks
        # Overall resume representation for semantic vector matching
        summary_parts = []
        if candidate.headline:
            summary_parts.append(candidate.headline)
        if 'summary' in sections:
            summary_parts.append(sections['summary'])
        top_skill_names = [s['name'] for s in extracted_skills[:15]]
        if top_skill_names:
            summary_parts.append("Skills: " + ", ".join(top_skill_names))
        if 'experience' in sections:
            summary_parts.append(sections['experience'][:1500])

        summary_for_embedding = "\n".join(summary_parts) if summary_parts else cleaned[:2000]
        resume.embedding = encode_text(summary_for_embedding)

        # Create passage chunks for UI highlights
        chunks_data = create_resume_chunks(sections)
        ResumeChunk.objects.filter(resume=resume).delete()
        chunk_objs = []
        for c in chunks_data:
            c_vec = encode_text(c['text'])
            chunk_objs.append(ResumeChunk(
                resume=resume,
                section=c['section'],
                text=c['text'],
                embedding=c_vec,
                order=c['order']
            ))
        if chunk_objs:
            ResumeChunk.objects.bulk_create(chunk_objs)

        resume.status = Resume.Status.EMBEDDED
        resume.processed_at = django_timezone.now()
        resume.save()

        logger.info("Successfully ingested, parsed, and embedded Resume %s", resume.id)
        return resume

    except Exception as e:
        logger.exception("Resume %s processing failed: %s", resume_id, str(e))
        resume.status = Resume.Status.FAILED
        resume.failure_reason = str(e)
        resume.save(update_fields=['status', 'failure_reason'])
        return resume
