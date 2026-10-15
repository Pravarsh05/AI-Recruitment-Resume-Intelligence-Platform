from django.urls import path
from .views import (
    AdminOverviewAnalyticsView,
    AdminMatchingAnalyticsView,
    AdminSkillsAnalyticsView
)

urlpatterns = [
    path('overview/', AdminOverviewAnalyticsView.as_view(), name='admin_analytics_overview'),
    path('matching/', AdminMatchingAnalyticsView.as_view(), name='admin_analytics_matching'),
    path('skills/', AdminSkillsAnalyticsView.as_view(), name='admin_analytics_skills'),
]
