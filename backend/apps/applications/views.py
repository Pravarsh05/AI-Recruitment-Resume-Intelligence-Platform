from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.permissions import IsCandidate, IsRecruiter
from apps.candidates.models import CandidateProfile
from apps.jobs.models import Job
from apps.matching.services import get_or_calculate_match
from .models import Application, StatusHistory
from .serializers import (
    ApplicationSerializer,
    ApplicationDetailSerializer,
    StatusUpdateSerializer
)

class CandidateApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk, status=Job.Status.OPEN)
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)

        if not profile.primary_resume:
            return Response(
                {"error": {"code": "NoResume", "message": "Please upload a resume before submitting applications."}},
                status=status.HTTP_400_BAD_REQUEST
            )

        resume = profile.primary_resume
        cover_note = request.data.get('cover_note', '')

        # Check existing application (idempotency per section 6)
        existing = Application.objects.filter(job=job, candidate=profile).first()
        if existing:
            return Response({
                "message": "You have already applied for this job.",
                "application": ApplicationSerializer(existing).data
            }, status=status.HTTP_200_OK)

        # Create application snapshotting primary resume
        application = Application.objects.create(
            job=job,
            candidate=profile,
            resume=resume,
            status=Application.Status.APPLIED,
            cover_note=cover_note
        )

        # Record initial status in history
        StatusHistory.objects.create(
            application=application,
            from_status="none",
            to_status=Application.Status.APPLIED,
            changed_by=request.user,
            note="Application submitted by candidate."
        )

        # Calculate or warm match cache
        get_or_calculate_match(resume, job)

        return Response({
            "message": "Application submitted successfully.",
            "application": ApplicationSerializer(application).data
        }, status=status.HTTP_201_CREATED)


class CandidateApplicationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return Application.objects.filter(candidate=profile).select_related('job', 'resume').prefetch_related('history').order_by('-applied_at')


class CandidateWithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        application = generics.get_object_or_404(Application, pk=pk, candidate=profile)

        if application.status == Application.Status.WITHDRAWN:
            return Response({"message": "Application is already withdrawn."})

        prev_status = application.status
        application.status = Application.Status.WITHDRAWN
        application.save(update_fields=['status'])

        StatusHistory.objects.create(
            application=application,
            from_status=prev_status,
            to_status=Application.Status.WITHDRAWN,
            changed_by=request.user,
            note=request.data.get('note', 'Candidate withdrew application.')
        )

        return Response({"message": "Application withdrawn successfully."})


# RECRUITER APPLICATION VIEWS

class RecruiterApplicationDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    serializer_class = ApplicationDetailSerializer

    def get_queryset(self):
        return Application.objects.filter(job__recruiter=self.request.user).select_related('job', 'candidate', 'resume', 'candidate__user').prefetch_related('history')


class RecruiterApplicationStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def patch(self, request, pk):
        application = generics.get_object_or_404(
            Application.objects.select_related('job'),
            pk=pk,
            job__recruiter=request.user
        )

        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        if new_status == application.status:
            return Response({"message": "Status unchanged.", "application": ApplicationDetailSerializer(application).data})

        prev_status = application.status
        application.status = new_status
        application.save(update_fields=['status'])

        # Write history record
        StatusHistory.objects.create(
            application=application,
            from_status=prev_status,
            to_status=new_status,
            changed_by=request.user,
            note=note
        )

        return Response({
            "message": f"Application status moved to {new_status}.",
            "application": ApplicationDetailSerializer(application).data
        })
