from rest_framework import serializers
from .models import Notification, NotificationPreference, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display', 'title', 'message',
            'is_read', 'read_at', 'created_at', 'data'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_notifications', 'email_issue_updates', 'email_comments',
            'email_assignments', 'email_system_messages', 'push_notifications',
            'push_issue_updates', 'push_comments', 'push_assignments',
            'notification_frequency', 'quiet_hours_start', 'quiet_hours_end',
            'quiet_hours_enabled'
        ]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model"""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'title_template',
            'message_template', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MarkNotificationReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of notification IDs to mark as read"
    ) 