from django.urls import path, include
from .views import MeView

urlpatterns = [
    path('me/', MeView.as_view(), name='me_profile'),
    path('me/skills/', include('apps.skills.urls_candidate')),
    path('me/education/', include('apps.candidates.urls_education')),
    path('me/experience/', include('apps.candidates.urls_experience')),
]
