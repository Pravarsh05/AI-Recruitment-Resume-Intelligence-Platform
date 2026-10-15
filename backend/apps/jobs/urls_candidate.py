from django.urls import path
from .views import (
    CandidateJobListView,
    CandidateJobDetailView,
    CandidateRecommendedJobsView
)
from apps.matching.views import CandidateJobMatchView
from apps.applications.views import CandidateApplyView

urlpatterns = [
    path('', CandidateJobListView.as_view(), name='candidate_jobs_list'),
    path('recommended/', CandidateRecommendedJobsView.as_view(), name='candidate_recommended_jobs'),
    path('<uuid:pk>/', CandidateJobDetailView.as_view(), name='candidate_job_detail'),
    path('<uuid:pk>/match/', CandidateJobMatchView.as_view(), name='candidate_job_match'),
    path('<uuid:pk>/apply/', CandidateApplyView.as_view(), name='candidate_job_apply'),
]
