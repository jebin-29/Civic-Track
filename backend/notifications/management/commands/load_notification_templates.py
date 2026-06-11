from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate


class Command(BaseCommand):
    help = 'Load default notification templates'

    def handle(self, *args, **options):
        self.stdout.write('Loading notification templates...')
        
        templates_data = [
            {
                'name': 'Issue Status Change',
                'notification_type': 'issue_status_change',
                'title_template': 'Issue Status Updated: {{ issue.title }}',
                'message_template': 'The status of your reported issue "{{ issue.title }}" has been changed to {{ issue.get_status_display }}.'
            },
            {
                'name': 'Issue Comment',
                'notification_type': 'issue_comment',
                'title_template': 'New Comment on: {{ issue.title }}',
                'message_template': '{{ comment.user.username }} commented on the issue "{{ issue.title }}": "{{ comment.content|truncatewords:20 }}"'
            },
            {
                'name': 'Issue Assigned',
                'notification_type': 'issue_assigned',
                'title_template': 'Issue Assigned: {{ issue.title }}',
                'message_template': 'You have been assigned to work on the issue "{{ issue.title }}".'
            },
            {
                'name': 'Issue Resolved',
                'notification_type': 'issue_resolved',
                'title_template': 'Issue Resolved: {{ issue.title }}',
                'message_template': 'Great news! The issue "{{ issue.title }}" has been resolved.'
            },
            {
                'name': 'Welcome Message',
                'notification_type': 'welcome',
                'title_template': 'Welcome to Civic Zone Connect!',
                'message_template': 'Thank you for joining Civic Zone Connect! Start reporting issues in your community to make a difference.'
            },
            {
                'name': 'System Message',
                'notification_type': 'system_message',
                'title_template': '{{ title }}',
                'message_template': '{{ message }}'
            }
        ]
        
        for template_data in templates_data:
            template, created = NotificationTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Notification templates loading completed successfully!')
        ) 