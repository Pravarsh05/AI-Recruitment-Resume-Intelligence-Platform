from django.urls import path
from .views import CandidateApplicationListView, CandidateWithdrawView

urlpatterns = [
    path('mine/', CandidateApplicationListView.as_view(), name='candidate_applications_mine'),
    path('<uuid:pk>/withdraw/', CandidateWithdrawView.as_view(), name='candidate_application_withdraw'),
]
