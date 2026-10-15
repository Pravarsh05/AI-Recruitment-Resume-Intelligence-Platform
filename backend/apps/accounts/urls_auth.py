from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth_password_reset_confirm'),
]
