import hashlib
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.permissions import IsCandidate, IsResumeOwner
from apps.candidates.models import CandidateProfile
from .models import Resume
from .serializers import ResumeUploadSerializer, ResumeSerializer, ResumeDetailSerializer
from .tasks import process_resume_pipeline

class ResumeListUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get_candidate(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request):
        candidate = self.get_candidate()
        resumes = Resume.objects.filter(candidate=candidate).order_by('-created_at')
        serializer = ResumeSerializer(resumes, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        candidate = self.get_candidate()
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']

        # Compute SHA-256 for deduplication
        sha256 = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            sha256.update(chunk)
        file_hash = sha256.hexdigest()

        # Check deduplication
        existing = Resume.objects.filter(candidate=candidate, sha256=file_hash).first()
        if existing:
            # If failed, allow retry
            if existing.status == Resume.Status.FAILED:
                existing.status = Resume.Status.UPLOADED
                existing.failure_reason = ""
                existing.save()
                process_resume_pipeline.delay(str(existing.id))
            return Response({
                "message": "Resume already exists.",
                "resume_id": str(existing.id),
                "status": existing.status
            }, status=status.HTTP_200_OK)

        # Create new resume record
        resume = Resume.objects.create(
            candidate=candidate,
            file=uploaded_file,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            sha256=file_hash,
            status=Resume.Status.UPLOADED
        )

        # Dispatch async background Celery task
        process_resume_pipeline.delay(str(resume.id))

        # Return 202 Accepted immediately per Plan design principles
        return Response({
            "message": "Resume uploaded successfully. Analysis in progress.",
            "resume_id": str(resume.id),
            "status": resume.status
        }, status=status.HTTP_202_ACCEPTED)


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate, IsResumeOwner]
    serializer_class = ResumeDetailSerializer

    def get_queryset(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return Resume.objects.filter(candidate=profile)

    def perform_destroy(self, instance):
        # Section 10: Candidate delete purges file, text, chunks, vectors
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()


class ResumeSetPrimaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        try:
            resume = Resume.objects.get(pk=pk, candidate=profile)
            profile.primary_resume = resume
            profile.save(update_fields=['primary_resume'])
            return Response({"message": "Primary resume updated successfully.", "primary_resume_id": str(resume.id)})
        except Resume.DoesNotExist:
            return Response({"error": {"code": "NotFound", "message": "Resume not found."}}, status=status.HTTP_404_NOT_FOUND)
