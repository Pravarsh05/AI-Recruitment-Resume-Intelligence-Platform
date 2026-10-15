from django.urls import path
from .views import ResumeListUploadView, ResumeDetailView, ResumeSetPrimaryView

urlpatterns = [
    path('', ResumeListUploadView.as_view(), name='resume_list_upload'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<uuid:pk>/set-primary/', ResumeSetPrimaryView.as_view(), name='resume_set_primary'),
]
