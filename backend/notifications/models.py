from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class Notification(models.Model):
    """Notification model for user notifications"""
    
    NOTIFICATION_TYPES = [
        ('issue_status_change', 'Issue Status Change'),
        ('issue_comment', 'Issue Comment'),
        ('issue_assigned', 'Issue Assigned'),
        ('issue_resolved', 'Issue Resolved'),
        ('system_message', 'System Message'),
        ('welcome', 'Welcome Message'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Generic foreign key to link to any model (issue, comment, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional data
    data = models.JSONField(default=dict, blank=True)
    
    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    @property
    def is_system_message(self):
        """Check if this is a system message"""
        return self.notification_type == 'system_message'


class NotificationPreference(models.Model):
    """User notification preferences"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email notifications
    email_notifications = models.BooleanField(default=True)
    email_issue_updates = models.BooleanField(default=True)
    email_comments = models.BooleanField(default=True)
    email_assignments = models.BooleanField(default=True)
    email_system_messages = models.BooleanField(default=True)
    
    # Push notifications (for future mobile app)
    push_notifications = models.BooleanField(default=True)
    push_issue_updates = models.BooleanField(default=True)
    push_comments = models.BooleanField(default=True)
    push_assignments = models.BooleanField(default=True)
    
    # Frequency
    notification_frequency = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('hourly', 'Hourly'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='immediate'
    )
    
    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    quiet_hours_enabled = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=50, choices=Notification.NOTIFICATION_TYPES)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def render(self, context):
        """Render template with context"""
        from django.template import Template, Context
        title = Template(self.title_template).render(Context(context))
        message = Template(self.message_template).render(Context(context))
        return title, message 