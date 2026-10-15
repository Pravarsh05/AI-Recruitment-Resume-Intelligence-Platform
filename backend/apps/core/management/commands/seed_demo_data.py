from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.candidates.models import CandidateProfile, Experience, Education
from apps.jobs.models import Job, JobSkill
from apps.skills.models import Skill, CandidateSkill

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds demo users (Candidate, Recruiter, Admin) and realistic sample jobs.'

    def handle(self, *args, **options):
        # 1. Admin
        admin, _ = User.objects.get_or_create(
            email='admin@recruitai.com',
            defaults={'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True, 'email_verified': True}
        )
        admin.set_password('password123')
        admin.save()

        # 2. Recruiter
        recruiter, _ = User.objects.get_or_create(
            email='recruiter@recruitai.com',
            defaults={'role': User.Role.RECRUITER, 'email_verified': True}
        )
        recruiter.set_password('password123')
        recruiter.save()

        # 3. Candidate
        cand_user, _ = User.objects.get_or_create(
            email='candidate@recruitai.com',
            defaults={'role': User.Role.CANDIDATE, 'email_verified': True}
        )
        cand_user.set_password('password123')
        cand_user.save()

        cand_profile, _ = CandidateProfile.objects.update_or_create(
            user=cand_user,
            defaults={
                'full_name': 'Alex Morgan',
                'headline': 'Senior Full Stack Engineer & Distributed Systems Enthusiast',
                'phone': '+1 (555) 234-5678',
                'location': 'San Francisco, CA',
                'summary': 'Full stack developer with 5+ years building scalable cloud services, modern web apps with React and Python, and robust PostgreSQL data layers.',
                'total_experience_years': 5.2,
                'highest_education': 'Bachelor',
                'open_to_work': True
            }
        )

        # Candidate skills
        skills_to_add = [
            ('Python', 0.98, 5.0),
            ('React', 0.95, 4.0),
            ('TypeScript', 0.92, 3.5),
            ('PostgreSQL', 0.90, 4.0),
            ('AWS', 0.88, 3.0),
            ('Docker', 0.85, 3.0),
            ('Git', 0.95, 5.0),
            ('REST API', 0.95, 5.0),
        ]
        for s_name, conf, yrs in skills_to_add:
            sk = Skill.objects.filter(name=s_name).first()
            if sk:
                CandidateSkill.objects.update_or_create(
                    candidate=cand_profile,
                    skill=sk,
                    defaults={'confidence': conf, 'years': yrs, 'is_confirmed': True, 'evidence': f'Demonstrated in professional experience for {yrs} years.'}
                )

        # 4. Jobs
        sample_jobs = [
            {
                'title': 'Senior Full Stack Engineer',
                'company_name': 'CloudScale Tech',
                'location': 'San Francisco, CA',
                'work_mode': Job.WorkMode.HYBRID,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'min_experience_years': 4.0,
                'max_experience_years': 8.0,
                'education_required': 'Bachelor',
                'salary_min': 140000,
                'salary_max': 185000,
                'description': 'We are looking for a Senior Full Stack Engineer to lead architecture on our cloud-native workflow platform. You will build responsive user experiences in React/TypeScript, design high-throughput REST APIs in Python/Django, and orchestrate services on AWS and Docker.',
                'skills': [
                    ('Python', 'required', 2.0, True),
                    ('React', 'required', 2.0, False),
                    ('TypeScript', 'required', 1.5, False),
                    ('PostgreSQL', 'required', 1.5, False),
                    ('AWS', 'preferred', 1.0, False),
                    ('Docker', 'preferred', 1.0, False),
                ]
            },
            {
                'title': 'Machine Learning Engineer',
                'company_name': 'Cognitive AI Labs',
                'location': 'New York, NY',
                'work_mode': Job.WorkMode.REMOTE,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'min_experience_years': 3.0,
                'max_experience_years': 6.0,
                'education_required': 'Master',
                'salary_min': 150000,
                'salary_max': 200000,
                'description': 'Build, fine-tune, and deploy state-of-the-art NLP and embedding pipelines. Strong background in PyTorch, Python, Hugging Face, vector databases, and containerized deployment is required.',
                'skills': [
                    ('Python', 'required', 2.0, True),
                    ('PyTorch', 'required', 2.0, True),
                    ('Machine Learning', 'required', 2.0, False),
                    ('Natural Language Processing', 'required', 1.5, False),
                    ('Docker', 'preferred', 1.0, False),
                ]
            },
            {
                'title': 'DevOps / Cloud Infrastructure Engineer',
                'company_name': 'Vanguard Systems',
                'location': 'Austin, TX',
                'work_mode': Job.WorkMode.REMOTE,
                'employment_type': Job.EmploymentType.FULL_TIME,
                'min_experience_years': 3.0,
                'max_experience_years': 7.0,
                'education_required': 'Bachelor',
                'salary_min': 130000,
                'salary_max': 170000,
                'description': 'Help scale our Kubernetes clusters and CI/CD automation pipelines across AWS and multi-cloud environments. You will write Terraform modules and build resilient monitoring dashboards.',
                'skills': [
                    ('AWS', 'required', 2.0, True),
                    ('Kubernetes', 'required', 2.0, True),
                    ('Docker', 'required', 1.5, False),
                    ('Terraform', 'required', 1.5, False),
                    ('CI/CD', 'preferred', 1.0, False),
                    ('Linux', 'preferred', 1.0, False),
                ]
            }
        ]

        from apps.jobs.serializers import JobSerializer
        from ai.embeddings import encode_text

        for jd in sample_jobs:
            skills_cfg = jd.pop('skills')
            job, _ = Job.objects.update_or_create(
                recruiter=recruiter,
                title=jd['title'],
                company_name=jd['company_name'],
                defaults=jd
            )

            job.job_skills.all().delete()
            for s_name, req, w, mand in skills_cfg:
                sk = Skill.objects.filter(name=s_name).first()
                if sk:
                    JobSkill.objects.create(
                        job=job,
                        skill=sk,
                        requirement=req,
                        weight=w,
                        is_mandatory=mand
                    )

            # Compute job embedding
            skills_str = ", ".join([js.skill.name for js in job.job_skills.all()])
            job_summary = f"{job.title} at {job.company_name}.\n{job.description}\nSkills: {skills_str}"
            job.embedding = encode_text(job_summary)
            job.save(update_fields=['embedding'])

        self.stdout.write(self.style.SUCCESS(
            "Demo data seeded successfully!\n"
            "  Candidate: candidate@recruitai.com / password123\n"
            "  Recruiter: recruiter@recruitai.com / password123\n"
            "  Admin:     admin@recruitai.com     / password123"
        ))
