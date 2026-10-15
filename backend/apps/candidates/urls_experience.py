from django.urls import path
from .views import ExperienceListCreateView, ExperienceDetailView

urlpatterns = [
    path('', ExperienceListCreateView.as_view(), name='experience_list_create'),
    path('<uuid:pk>/', ExperienceDetailView.as_view(), name='experience_detail'),
]
