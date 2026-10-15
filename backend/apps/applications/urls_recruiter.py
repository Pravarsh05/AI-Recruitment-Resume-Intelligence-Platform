from django.urls import path
from .views import RecruiterApplicationDetailView, RecruiterApplicationStatusUpdateView

urlpatterns = [
    path('applications/<uuid:pk>/', RecruiterApplicationDetailView.as_view(), name='recruiter_application_detail'),
    path('applications/<uuid:pk>/status/', RecruiterApplicationStatusUpdateView.as_view(), name='recruiter_application_status_update'),
]
