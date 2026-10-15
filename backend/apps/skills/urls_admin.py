from django.urls import path
from .views import AdminSkillListCreateView, AdminSkillDetailView

urlpatterns = [
    path('', AdminSkillListCreateView.as_view(), name='admin_skills_list_create'),
    path('<uuid:pk>/', AdminSkillDetailView.as_view(), name='admin_skills_detail'),
]
