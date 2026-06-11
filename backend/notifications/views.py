from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Notification, NotificationPreference, NotificationTemplate
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer,
    NotificationTemplateSerializer, MarkNotificationReadSerializer
)


class NotificationListView(generics.ListAPIView):
    """List user notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationDetailView(generics.RetrieveAPIView):
    """Get notification detail and mark as read"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)


class UnreadNotificationListView(generics.ListAPIView):
    """List unread notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            is_read=False
        )


class MarkNotificationReadView(APIView):
    """Mark notifications as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MarkNotificationReadSerializer(data=request.data)
        if serializer.is_valid():
            notification_ids = serializer.validated_data['notification_ids']
            
            # Mark notifications as read
            notifications = Notification.objects.filter(
                id__in=notification_ids,
                recipient=request.user
            )
            
            count = 0
            for notification in notifications:
                notification.mark_as_read()
                count += 1
            
            return Response({
                'message': f'{count} notifications marked as read',
                'marked_count': count
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkAllNotificationsReadView(APIView):
    """Mark all user notifications as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        from django.utils import timezone
        
        # Mark all unread notifications as read
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{count} notifications marked as read',
            'marked_count': count
        })


class NotificationPreferenceView(APIView):
    """Get and update notification preferences"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            preferences = request.user.notification_preferences
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = NotificationPreferenceSerializer(preferences)
        return Response(serializer.data)
    
    def put(self, request):
        try:
            preferences = request.user.notification_preferences
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        serializer = NotificationPreferenceSerializer(preferences, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationCountView(APIView):
    """Get notification counts"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        total_notifications = Notification.objects.filter(recipient=request.user).count()
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        # Count by type
        notifications_by_type = {}
        for notification_type, _ in Notification.NOTIFICATION_TYPES:
            count = Notification.objects.filter(
                recipient=request.user,
                notification_type=notification_type,
                is_read=False
            ).count()
            if count > 0:
                notifications_by_type[notification_type] = count
        
        return Response({
            'total': total_notifications,
            'unread': unread_notifications,
            'by_type': notifications_by_type
        })


# Admin views
class AdminNotificationListView(generics.ListAPIView):
    """Admin view to list all notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = Notification.objects.all()
        
        # Filter by recipient
        recipient_id = self.request.query_params.get('recipient', None)
        if recipient_id:
            queryset = queryset.filter(recipient_id=recipient_id)
        
        # Filter by type
        notification_type = self.request.query_params.get('type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        return queryset


class AdminNotificationTemplateListView(generics.ListCreateAPIView):
    """Admin view to manage notification templates"""
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationTemplate.objects.all()


class AdminNotificationTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view to manage individual notification templates"""
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationTemplate.objects.all()






@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def send_system_notification(request):
    """Send system notification to users"""
    User = get_user_model()
    title = request.data.get('title')
    message = request.data.get('message')
    user_ids = request.data.get('user_ids', [])
    send_to_all = request.data.get('send_to_all', False)
    
    if not title or not message:
        return Response(
            {'error': 'Title and message are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if send_to_all:
        users = User.objects.filter(is_active=True)
    elif user_ids:
        users = User.objects.filter(id__in=user_ids, is_active=True)
    else:
        return Response(
            {'error': 'Either user_ids or send_to_all must be provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    notifications_created = []
    for user in users:
        notification = Notification.objects.create(
            recipient=user,
            notification_type='system_message',
            title=title,
            message=message
        )
        notifications_created.append(notification)
    
    return Response({
        'message': f'System notification sent to {len(notifications_created)} users',
        'notifications_created': len(notifications_created)
    }) 