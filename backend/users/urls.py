from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/delete-account/', views.delete_account, name='delete-account'),
    
    # User profile and settings
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/update/', views.UserUpdateView.as_view(), name='update-profile'),
    path('profile/location/', views.UpdateLocationView.as_view(), name='update-location'),
    path('current-user/', views.current_user, name='current-user'),
    
    # Admin views
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    # path('admin/users/', views.admin_users_list, name='admin-users'),
    # path('admin/users/<int:user_id>/ban/', views.ban_user, name='ban-user'),
    # path('admin/users/<int:user_id>/unban/', views.unban_user, name='unban-user'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle-user-status'),
    path('admin/users/<int:user_id>/verify/', views.verify_user, name='verify-user'),
    path('admin/dashboard-stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),
] 