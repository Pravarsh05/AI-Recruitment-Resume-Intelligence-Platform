from rest_framework import generics, permissions
from apps.core.permissions import IsCandidate
from .models import CandidateProfile, Education, Experience
from .serializers import EducationSerializer, ExperienceSerializer

class CandidateSubResourceMixin:
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get_candidate_profile(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile


class EducationListCreateView(CandidateSubResourceMixin, generics.ListCreateAPIView):
    serializer_class = EducationSerializer

    def get_queryset(self):
        return Education.objects.filter(candidate=self.get_candidate_profile())

    def perform_create(self, serializer):
        serializer.save(candidate=self.get_candidate_profile())


class EducationDetailView(CandidateSubResourceMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EducationSerializer

    def get_queryset(self):
        return Education.objects.filter(candidate=self.get_candidate_profile())


class ExperienceListCreateView(CandidateSubResourceMixin, generics.ListCreateAPIView):
    serializer_class = ExperienceSerializer

    def get_queryset(self):
        return Experience.objects.filter(candidate=self.get_candidate_profile())

    def perform_create(self, serializer):
        serializer.save(candidate=self.get_candidate_profile())


class ExperienceDetailView(CandidateSubResourceMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExperienceSerializer

    def get_queryset(self):
        return Experience.objects.filter(candidate=self.get_candidate_profile())
