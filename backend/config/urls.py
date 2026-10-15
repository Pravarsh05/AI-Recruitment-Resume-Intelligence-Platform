from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "recruit-ai-api", "version": "1.0.0"})

api_v1_patterns = [
    path('auth/', include('apps.accounts.urls_auth')),
    path('', include('apps.accounts.urls_me')),
    path('resumes/', include('apps.resumes.urls')),
    path('jobs/', include('apps.jobs.urls_candidate')),
    path('applications/', include('apps.applications.urls_candidate')),
    path('recruiter/', include('apps.jobs.urls_recruiter')),
    path('recruiter/', include('apps.applications.urls_recruiter')),
    path('admin/analytics/', include('apps.analytics.urls')),
    path('admin/skills/', include('apps.skills.urls_admin')),
    path('admin/users/', include('apps.accounts.urls_admin')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    
    # API v1
    path('api/v1/', include((api_v1_patterns, 'api_v1'))),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
