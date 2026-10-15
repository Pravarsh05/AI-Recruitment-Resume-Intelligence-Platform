import io
import os
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from apps.candidates.models import CandidateProfile
from apps.jobs.models import Job, JobSkill
from apps.skills.models import Skill, CandidateSkill
from apps.resumes.models import Resume
from apps.resumes.services import process_resume
from apps.matching.services import get_or_calculate_match
from ai.nlp.skill_matcher import SkillMatcher

User = get_user_model()

class RecruitmentPipelineTestCase(TestCase):
    def setUp(self):
        # Create users
        self.recruiter = User.objects.create_user(
            email='recruiter_test@example.com',
            password='Password123!',
            role=User.Role.RECRUITER
        )
        self.candidate_user = User.objects.create_user(
            email='candidate_test@example.com',
            password='Password123!',
            role=User.Role.CANDIDATE
        )
        self.candidate_profile = CandidateProfile.objects.create(
            user=self.candidate_user,
            full_name='Jordan Lee',
            headline='Software Engineer'
        )

        # Seed skills
        self.skill_python = Skill.objects.create(name='Python', category='language')
        self.skill_react = Skill.objects.create(name='React', category='framework')
        self.skill_docker = Skill.objects.create(name='Docker', category='cloud')
        self.skill_k8s = Skill.objects.create(name='Kubernetes', category='cloud')

        # Create job
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Full Stack Developer',
            company_name='TechCorp',
            description='Looking for a Full Stack Engineer with Python, React, and Docker experience.',
            min_experience_years=2.0,
            education_required='Bachelor'
        )
        JobSkill.objects.create(job=self.job, skill=self.skill_python, requirement='required', weight=2.0, is_mandatory=True)
        JobSkill.objects.create(job=self.job, skill=self.skill_react, requirement='required', weight=2.0)
        JobSkill.objects.create(job=self.job, skill=self.skill_docker, requirement='preferred', weight=1.0)

    def test_skill_extraction_and_matching(self):
        sample_resume_text = """
        Jordan Lee
        Email: jordan.lee@example.com | Phone: +1 555-019-2834
        LinkedIn: linkedin.com/in/jordanlee | GitHub: github.com/jordanlee

        PROFESSIONAL SUMMARY
        Full Stack Developer with 4 years of experience building modern web applications.

        TECHNICAL SKILLS
        Languages: Python, JavaScript, TypeScript, SQL
        Frameworks: React, Django, Node.js
        DevOps & Tools: Docker, Git, Linux, AWS

        WORK EXPERIENCE
        Software Engineer at WebInnovate (Jan 2020 - Present)
        • Architected microservices with Python and Django.
        • Developed frontend single-page apps using React and TypeScript.
        • Deployed containerized applications using Docker on AWS.

        EDUCATION
        Bachelor of Science in Computer Science, University of Technology (2016 - 2020)
        """

        matcher = SkillMatcher()
        extracted = matcher.extract_skills(sample_resume_text)
        extracted_names = {s['name'] for s in extracted}

        self.assertIn('Python', extracted_names)
        self.assertIn('React', extracted_names)
        self.assertIn('Docker', extracted_names)

        # Populate candidate skills
        for s in extracted:
            sk, _ = Skill.objects.get_or_create(name=s['name'])
            CandidateSkill.objects.create(
                candidate=self.candidate_profile,
                skill=sk,
                confidence=s['confidence'],
                evidence=s.get('evidence', '')
            )
        self.candidate_profile.total_experience_years = 4.0
        self.candidate_profile.highest_education = 'Bachelor'
        self.candidate_profile.save()

        # Create dummy embedded resume
        resume = Resume.objects.create(
            candidate=self.candidate_profile,
            original_filename='jordan_resume.pdf',
            status=Resume.Status.EMBEDDED,
            clean_text=sample_resume_text
        )
        self.candidate_profile.primary_resume = resume
        self.candidate_profile.save()

        # Score matching
        match_result = get_or_calculate_match(resume, self.job)
        self.assertGreater(match_result.score, 70.0)
        self.assertEqual(len(match_result.missing_required), 0)
        self.assertTrue(len(match_result.matched_skills) >= 2)
        self.assertIn("Full Stack Developer", match_result.explanation)
