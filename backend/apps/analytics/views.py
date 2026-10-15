from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model
from apps.core.permissions import IsAdminUser, IsRecruiter
from apps.jobs.models import Job, JobSkill
from apps.resumes.models import Resume
from apps.applications.models import Application
from apps.matching.models import MatchResult
from apps.skills.models import Skill, CandidateSkill

User = get_user_model()

class AdminOverviewAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        candidates_count = User.objects.filter(role=User.Role.CANDIDATE).count()
        recruiters_count = User.objects.filter(role=User.Role.RECRUITER).count()
        jobs_count = Job.objects.count()
        open_jobs = Job.objects.filter(status=Job.Status.OPEN).count()
        resumes_count = Resume.objects.count()
        resumes_embedded = Resume.objects.filter(status=Resume.Status.EMBEDDED).count()
        applications_count = Application.objects.count()

        return Response({
            "users": {
                "total": total_users,
                "candidates": candidates_count,
                "recruiters": recruiters_count,
            },
            "jobs": {
                "total": jobs_count,
                "open": open_jobs,
            },
            "resumes": {
                "total": resumes_count,
                "processed": resumes_embedded,
                "success_rate": round((resumes_embedded / max(resumes_count, 1)) * 100, 1),
            },
            "applications": {
                "total": applications_count,
            }
        })


class AdminMatchingAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        matches = MatchResult.objects.all()
        total_matches = matches.count()
        avg_score = matches.aggregate(avg=Avg('score'))['avg'] or 0.0

        # Distribution buckets
        b_0_40 = matches.filter(score__lt=40).count()
        b_40_60 = matches.filter(score__gte=40, score__lt=60).count()
        b_60_75 = matches.filter(score__gte=60, score__lt=75).count()
        b_75_85 = matches.filter(score__gte=75, score__lt=85).count()
        b_85_100 = matches.filter(score__gte=85).count()

        return Response({
            "total_matches_computed": total_matches,
            "average_score": round(avg_score, 1),
            "distribution": [
                {"range": "0-39 (Weak)", "count": b_0_40},
                {"range": "40-59 (Moderate)", "count": b_40_60},
                {"range": "60-74 (Good)", "count": b_60_75},
                {"range": "75-84 (Strong)", "count": b_75_85},
                {"range": "85-100 (Exceptional)", "count": b_85_100},
            ]
        })


class AdminSkillsAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Top demanded skills in jobs
        job_demand = (
            JobSkill.objects.values('skill__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:15]
        )
        demanded = [{'skill': item['skill__name'], 'demand_count': item['count']} for item in job_demand]

        # Top supplied skills in candidates
        cand_supply = (
            CandidateSkill.objects.values('skill__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:15]
        )
        supplied = [{'skill': item['skill__name'], 'supply_count': item['count']} for item in cand_supply]

        # Compute skill gap for top demanded skills
        supply_dict = {item['skill__name']: item['count'] for item in cand_supply}
        skill_gaps = []
        for d in demanded:
            name = d['skill']
            d_count = d['demand_count']
            s_count = supply_dict.get(name, 0)
            gap = d_count - s_count
            skill_gaps.append({
                'skill': name,
                'demand': d_count,
                'supply': s_count,
                'deficit': max(0, gap)
            })

        return Response({
            "demanded_skills": demanded,
            "supplied_skills": supplied,
            "skill_gaps": skill_gaps
        })


class RecruiterDashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get(self, request):
        recruiter = request.user
        jobs = Job.objects.filter(recruiter=recruiter)
        open_jobs_count = jobs.filter(status=Job.Status.OPEN).count()
        total_jobs_count = jobs.count()

        applications = Application.objects.filter(job__recruiter=recruiter)
        total_applicants = applications.count()

        # Pipeline funnel counts
        funnel = []
        for status_code, label in Application.Status.choices:
            cnt = applications.filter(status=status_code).count()
            funnel.append({'status': status_code, 'label': str(label), 'count': cnt})

        # Average match score for recruiter's applicants
        app_resumes = applications.exclude(resume__isnull=True).values_list('resume_id', 'job_id')
        scores = []
        for r_id, j_id in app_resumes:
            m = MatchResult.objects.filter(resume_id=r_id, job_id=j_id).first()
            if m:
                scores.append(m.score)

        avg_score = round(sum(scores) / max(len(scores), 1), 1) if scores else 0.0

        # Recent applications
        recent = (
            applications.select_related('candidate', 'job', 'resume')
            .order_by('-applied_at')[:5]
        )
        recent_data = []
        for app in recent:
            m = MatchResult.objects.filter(resume=app.resume, job=app.job).first() if app.resume else None
            recent_data.append({
                'id': str(app.id),
                'candidate_name': app.candidate.full_name or app.candidate.user.email,
                'job_title': app.job.title,
                'status': app.status,
                'applied_at': app.applied_at,
                'score': m.score if m else None
            })

        return Response({
            "open_jobs": open_jobs_count,
            "total_jobs": total_jobs_count,
            "total_applicants": total_applicants,
            "average_match_score": avg_score,
            "funnel": funnel,
            "recent_applications": recent_data
        })
