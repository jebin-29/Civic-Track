from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import Notification, NotificationTemplate

User = get_user_model()


class NotificationService:
    """Service class for handling notifications"""
    
    @staticmethod
    def send_notification(recipient, notification_type, title, message, content_object=None, data=None):
        """Send a notification to a user"""
        try:
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                content_object=content_object,
                data=data or {}
            )
            return notification
        except Exception as e:
            print(f"Error sending notification: {e}")
            return None
    
    @staticmethod
    def send_notification_from_template(recipient, notification_type, context, content_object=None):
        """Send notification using a template"""
        try:
            template = NotificationTemplate.objects.get(
                notification_type=notification_type,
                is_active=True
            )
            
            title, message = template.render(context)
            
            return NotificationService.send_notification(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                content_object=content_object,
                data=context
            )
        except NotificationTemplate.DoesNotExist:
            # Fallback to basic notification
            return NotificationService.send_notification(
                recipient=recipient,
                notification_type=notification_type,
                title=f"New {notification_type.replace('_', ' ').title()}",
                message="You have a new notification.",
                content_object=content_object,
                data=context
            )
    
    @staticmethod
    def send_issue_status_change_notification(issue, old_status, new_status, user):
        """Send notification when issue status changes"""
        if issue.reported_by and issue.reported_by != user:
            context = {
                'issue': issue,
                'old_status': old_status,
                'new_status': new_status,
                'user': user
            }
            
            NotificationService.send_notification_from_template(
                recipient=issue.reported_by,
                notification_type='issue_status_change',
                context=context,
                content_object=issue
            )
    
    @staticmethod
    def send_issue_comment_notification(comment, issue):
        """Send notification when someone comments on an issue"""
        # Notify issue reporter (if not the commenter)
        if issue.reported_by and issue.reported_by != comment.user:
            context = {
                'comment': comment,
                'issue': issue,
                'commenter': comment.user
            }
            
            NotificationService.send_notification_from_template(
                recipient=issue.reported_by,
                notification_type='issue_comment',
                context=context,
                content_object=comment
            )
    
    @staticmethod
    def send_issue_assignment_notification(assignment):
        """Send notification when issue is assigned"""
        context = {
            'assignment': assignment,
            'issue': assignment.issue,
            'assigned_by': assignment.assigned_by
        }
        
        NotificationService.send_notification_from_template(
            recipient=assignment.assigned_to,
            notification_type='issue_assigned',
            context=context,
            content_object=assignment
        )
    
    @staticmethod
    def send_issue_resolved_notification(issue):
        """Send notification when issue is resolved"""
        if issue.reported_by:
            context = {
                'issue': issue
            }
            
            NotificationService.send_notification_from_template(
                recipient=issue.reported_by,
                notification_type='issue_resolved',
                context=context,
                content_object=issue
            )
    
    @staticmethod
    def send_welcome_notification(user):
        """Send welcome notification to new user"""
        context = {
            'user': user
        }
        
        NotificationService.send_notification_from_template(
            recipient=user,
            notification_type='welcome',
            context=context
        )
    
    @staticmethod
    def send_system_notification(recipients, title, message, data=None):
        """Send system notification to multiple users"""
        notifications = []
        
        if isinstance(recipients, (list, tuple)):
            user_list = recipients
        else:
            user_list = [recipients]
        
        for user in user_list:
            notification = NotificationService.send_notification(
                recipient=user,
                notification_type='system_message',
                title=title,
                message=message,
                data=data or {}
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def mark_notifications_read(user, notification_ids=None):
        """Mark notifications as read"""
        from django.utils import timezone
        
        queryset = Notification.objects.filter(recipient=user, is_read=False)
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        count = queryset.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return count
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notification count for user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
    
    @staticmethod
    def get_notifications_by_type(user, notification_type, limit=10):
        """Get notifications by type for user"""
        return Notification.objects.filter(
            recipient=user,
            notification_type=notification_type
        ).order_by('-created_at')[:limit] 