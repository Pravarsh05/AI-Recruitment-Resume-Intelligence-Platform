from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from apps.core.permissions import IsCandidate, IsRecruiter, IsJobOwner
from apps.candidates.models import CandidateProfile
from apps.resumes.models import Resume
from apps.matching.models import MatchResult
from apps.matching.services import get_or_calculate_match
from ai.nlp.skill_matcher import SkillMatcher
from .models import Job, JobSkill
from .serializers import JobSerializer, JobSkillSerializer

# CANDIDATE VIEWS

class CandidateJobListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = Job.objects.filter(status=Job.Status.OPEN).prefetch_related('job_skills__skill')

        # Search parameter
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(company_name__icontains=q) |
                Q(description__icontains=q) |
                Q(job_skills__skill__name__icontains=q)
            ).distinct()

        # Filters
        work_mode = self.request.query_params.get('work_mode')
        if work_mode:
            qs = qs.filter(work_mode=work_mode)

        employment_type = self.request.query_params.get('employment_type')
        if employment_type:
            qs = qs.filter(employment_type=employment_type)

        location = self.request.query_params.get('location')
        if location:
            qs = qs.filter(location__icontains=location)

        exp_max = self.request.query_params.get('max_experience')
        if exp_max:
            try:
                qs = qs.filter(min_experience_years__lte=float(exp_max))
            except ValueError:
                pass

        return qs.order_by('-created_at')


class CandidateJobDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobSerializer
    queryset = Job.objects.filter(status=Job.Status.OPEN).prefetch_related('job_skills__skill')


class CandidateRecommendedJobsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get(self, request):
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile or not profile.primary_resume:
            return Response({
                "message": "Upload a resume to receive tailored recommendations.",
                "results": []
            })

        resume = profile.primary_resume
        open_jobs = Job.objects.filter(status=Job.Status.OPEN).prefetch_related('job_skills__skill')[:50]

        scored_jobs = []
        for job in open_jobs:
            match_res = get_or_calculate_match(resume, job)
            job_data = JobSerializer(job, context={'request': request}).data
            job_data['match_score'] = match_res.score
            job_data['matched_skills_count'] = len(match_res.matched_skills)
            job_data['missing_skills_count'] = len(match_res.missing_required)
            job_data['explanation_summary'] = match_res.explanation.split('\n')[0]
            scored_jobs.append(job_data)

        # Sort by match score descending
        scored_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        return Response({"results": scored_jobs[:20]})


# RECRUITER VIEWS

class RecruiterJobListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    serializer_class = JobSerializer

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user).prefetch_related('job_skills__skill').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter, IsJobOwner]
    serializer_class = JobSerializer

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user).prefetch_related('job_skills__skill')


class SuggestSkillsFromJobView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def post(self, request, pk=None):
        description = request.data.get('description', '')
        if pk and not description:
            job = generics.get_object_or_404(Job, pk=pk, recruiter=request.user)
            description = job.description

        if not description:
            return Response(
                {"error": {"code": "InvalidInput", "message": "Description text is required."}},
                status=status.HTTP_400_BAD_REQUEST
            )

        matcher = SkillMatcher()
        suggested = matcher.extract_skills(description)

        # Group into required vs preferred based on confidence
        required = []
        preferred = []
        for s in suggested:
            if s['confidence'] >= 0.80:
                required.append({'name': s['name'], 'category': s['category'], 'confidence': s['confidence']})
            else:
                preferred.append({'name': s['name'], 'category': s['category'], 'confidence': s['confidence']})

        return Response({
            "suggested_skills": suggested,
            "recommended_required": required,
            "recommended_preferred": preferred
        })


class RecruiterJobApplicantsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk, recruiter=request.user)
        applications = job.applications.select_related('candidate', 'resume', 'candidate__user').all()

        min_score = request.query_params.get('min_score')
        status_filter = request.query_params.get('status')

        results = []
        for app in applications:
            if status_filter and app.status != status_filter:
                continue

            match_res = None
            if app.resume:
                match_res = get_or_calculate_match(app.resume, job)

            score_val = match_res.score if match_res else 0.0

            if min_score:
                try:
                    if score_val < float(min_score):
                        continue
                except ValueError:
                    pass

            results.append({
                "application_id": str(app.id),
                "candidate_id": str(app.candidate.id),
                "candidate_name": app.candidate.full_name or app.candidate.user.email,
                "candidate_email": app.candidate.user.email,
                "headline": app.candidate.headline,
                "total_experience_years": app.candidate.total_experience_years,
                "highest_education": app.candidate.highest_education,
                "status": app.status,
                "applied_at": app.applied_at,
                "match_score": score_val,
                "breakdown": {
                    "semantic_score": match_res.semantic_score if match_res else 0,
                    "skill_score": match_res.skill_score if match_res else 0,
                    "experience_score": match_res.experience_score if match_res else 0,
                    "education_score": match_res.education_score if match_res else 0,
                },
                "matched_skills": match_res.matched_skills if match_res else [],
                "missing_required": match_res.missing_required if match_res else [],
                "missing_preferred": match_res.missing_preferred if match_res else [],
                "explanation": match_res.explanation if match_res else "",
                "resume_id": str(app.resume.id) if app.resume else None
            })

        # Rank candidates by match score descending per Section 6
        results.sort(key=lambda x: x['match_score'], reverse=True)
        return Response({"count": len(results), "applicants": results})
