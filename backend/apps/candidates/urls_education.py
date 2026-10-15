from django.urls import path
from .views import EducationListCreateView, EducationDetailView

urlpatterns = [
    path('', EducationListCreateView.as_view(), name='education_list_create'),
    path('<uuid:pk>/', EducationDetailView.as_view(), name='education_detail'),
]
