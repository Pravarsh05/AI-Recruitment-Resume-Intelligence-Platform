from django.urls import path
from .views import AdminUserListView, AdminUserDetailView

urlpatterns = [
    path('', AdminUserListView.as_view(), name='admin_users_list'),
    path('<uuid:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]
