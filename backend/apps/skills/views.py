from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.core.permissions import IsCandidate, IsAdminUser
from apps.candidates.models import CandidateProfile
from .models import Skill, CandidateSkill
from .serializers import SkillSerializer, CandidateSkillSerializer

class CandidateSkillListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]
    serializer_class = CandidateSkillSerializer

    def get_candidate(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_queryset(self):
        return CandidateSkill.objects.filter(candidate=self.get_candidate()).select_related('skill')

    def perform_create(self, serializer):
        serializer.save(candidate=self.get_candidate())


class CandidateSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsCandidate]
    serializer_class = CandidateSkillSerializer

    def get_queryset(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return CandidateSkill.objects.filter(candidate=profile)


class AdminSkillListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SkillSerializer
    queryset = Skill.objects.all().order_by('name')
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'slug']


class AdminSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SkillSerializer
    queryset = Skill.objects.all()
