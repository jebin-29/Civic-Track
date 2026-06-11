from django.urls import path
from . import views

urlpatterns = [
    # User notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('notifications/unread/', views.UnreadNotificationListView.as_view(), name='unread-notifications'),
    path('notifications/mark-read/', views.MarkNotificationReadView.as_view(), name='mark-notifications-read'),
    path('notifications/mark-all-read/', views.MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
    path('notifications/count/', views.NotificationCountView.as_view(), name='notification-count'),
    path('notifications/preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    
    # Admin views
    path('admin/notifications/', views.AdminNotificationListView.as_view(), name='admin-notifications'),
    path('admin/notifications/templates/', views.AdminNotificationTemplateListView.as_view(), name='admin-notification-templates'),
    path('admin/notifications/templates/<int:pk>/', views.AdminNotificationTemplateDetailView.as_view(), name='admin-notification-template-detail'),
    path('admin/notifications/send-system/', views.send_system_notification, name='send-system-notification')
] 