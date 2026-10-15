from django.urls import path
from .views import (
    RecruiterJobListCreateView,
    RecruiterJobDetailView,
    SuggestSkillsFromJobView,
    RecruiterJobApplicantsView
)
from apps.analytics.views import RecruiterDashboardAnalyticsView

urlpatterns = [
    path('dashboard/', RecruiterDashboardAnalyticsView.as_view(), name='recruiter_dashboard'),
    path('jobs/', RecruiterJobListCreateView.as_view(), name='recruiter_jobs_list_create'),
    path('jobs/<uuid:pk>/', RecruiterJobDetailView.as_view(), name='recruiter_job_detail'),
    path('jobs/<uuid:pk>/extract-skills/', SuggestSkillsFromJobView.as_view(), name='recruiter_job_extract_skills'),
    path('jobs/extract-skills/', SuggestSkillsFromJobView.as_view(), name='recruiter_job_suggest_skills_raw'),
    path('jobs/<uuid:pk>/applicants/', RecruiterJobApplicantsView.as_view(), name='recruiter_job_applicants'),
]
