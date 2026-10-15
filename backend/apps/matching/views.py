from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, generics
from apps.core.permissions import IsCandidate
from apps.jobs.models import Job
from .services import get_or_calculate_match
from .serializers import MatchResultSerializer

class CandidateJobMatchView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk)
        profile = getattr(request.user, 'candidate_profile', None)

        if not profile or not profile.primary_resume:
            return Response(
                {"error": {"code": "NoPrimaryResume", "message": "Please upload a primary resume to generate match intelligence."}},
                status=status.HTTP_400_BAD_REQUEST
            )

        match_result = get_or_calculate_match(profile.primary_resume, job)
        serializer = MatchResultSerializer(match_result)
        return Response(serializer.data)
