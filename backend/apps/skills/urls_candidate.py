from django.urls import path
from .views import CandidateSkillListView, CandidateSkillDetailView

urlpatterns = [
    path('', CandidateSkillListView.as_view(), name='candidate_skills_list_create'),
    path('<uuid:pk>/', CandidateSkillDetailView.as_view(), name='candidate_skills_detail'),
]
